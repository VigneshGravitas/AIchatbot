import { NextResponse } from 'next/server';
import { type Message } from 'ai';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { chat, message } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getModelProvider } from '@/lib/models';
import { tools, toolDefinitions } from '@/lib/tools';
import { ChatRequestOptions } from '@/lib/models/providers/base';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.error('No user session found');
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages, chatId, modelId } = await req.json();
    if (!modelId) {
      return new Response('Model ID is required', { status: 400 });
    }

    let currentChatId = chatId;

    try {
      // If chatId provided, verify it exists and belongs to user
      if (currentChatId) {
        const existingChat = await db
          .select()
          .from(chat)
          .where(and(eq(chat.id, currentChatId), eq(chat.userId, session.user.id)))
          .execute();
        
        if (existingChat.length) {
          // Update the existing chat's model ID
          await db
            .update(chat)
            .set({ modelId })
            .where(eq(chat.id, currentChatId));
        } else {
          // Chat doesn't exist or doesn't belong to user, create new one
          currentChatId = null;
        }
      }

      // Create a new chat if needed
      if (!currentChatId) {
        const initialMessage = messages[0]?.content || 'New Chat';
        const result = await db.insert(chat).values({
          userId: session.user.id,
          title: initialMessage.slice(0, 100),
          createdAt: new Date(),
          visibility: 'private',
          modelId
        }).returning();
        
        if (!result?.[0]?.id) {
          throw new Error('Failed to create chat');
        }
        
        currentChatId = result[0].id;
        console.log('Created new chat:', currentChatId);
      }

      // Save the user message to the database
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        try {
          await db.insert(message).values({
            chatId: currentChatId,
            content: lastMessage.content,
            role: lastMessage.role,
            createdAt: new Date(),
          });
          console.log('Saved user message');
        } catch (error: any) {
          if (error.code === '23503') {
            // Foreign key constraint error, chatId does not exist
            return new Response('Chat not found', { status: 404 });
          } else {
            throw error;
          }
        }
      }

      // Get the model provider
      const provider = await getModelProvider(modelId);
      if (!provider) {
        return new Response('Model provider not found', { status: 400 });
      }

      // Get the chat completion stream with tools
      const { response } = await provider.generateChatCompletion(messages, {
        tools: Object.entries(toolDefinitions).map(([name, def]) => ({

          type: 'function',
          function: {
            name,
            description: def.description,
            parameters: def.parameters
          }
        }))
      } as ChatRequestOptions);

      if (!response.body) {
        throw new Error('No response body received');
      }

      interface ToolCall {
        index: number;
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }

      interface CustomTransformer extends Transformer<Uint8Array, Uint8Array> {
        currentToolCall?: ToolCall;
      }

      // Map of tool functions
      const toolFunctions: Record<string, (...args: any[]) => Promise<any>> = {
        'product.search': tools['product.search'],
        'confluence.getSpaces': tools['confluence.getSpaces'],
        'confluence.search': tools['confluence.search'],
        'confluence.createPage': tools['confluence.createPage'],
        'confluence.updatePage': tools['confluence.updatePage'],
        'opsgenie.getAlerts': tools['opsgenie.getAlerts'],
        'opsgenie.createAlert': tools['opsgenie.createAlert'],
        'opsgenie.getSchedules': tools['opsgenie.getSchedules'],
        'opsgenie.getOnCall': tools['opsgenie.getOnCall'],
      };

      // Map of tool definitions
      const toolDefs: Record<string, any> = {
        'product.search': toolDefinitions['product.search'],
        'confluence.getSpaces': toolDefinitions['confluence.getSpaces'],
        'confluence.search': toolDefinitions['confluence.search'],
        'confluence.createPage': toolDefinitions['confluence.createPage'],
        'confluence.updatePage': toolDefinitions['confluence.updatePage'],
        'opsgenie.getAlerts': toolDefinitions['opsgenie.getAlerts'],
        'opsgenie.createAlert': toolDefinitions['opsgenie.createAlert'],
        'opsgenie.getSchedules': toolDefinitions['opsgenie.getSchedules'],
        'opsgenie.getOnCall': toolDefinitions['opsgenie.getOnCall'],
      };

      // Function to format product response
      function formatProductResponse(product: any): string {
        return `${product.name} - $${product.price}\n${product.description}`;
      }

      // Function to format OpsGenie response
      function formatOpsGenieResponse(response: any): string {
        if (response.status === 'error') {
          return `Error: ${response.message}`;
        }

        let result = '';

        // Format alerts
        if (response.alerts && response.alerts.length > 0) {
          result += `Here are the current alerts (Total: ${response.alerts.length}):\n\n`;
          response.alerts.forEach((alert: any, index: number) => {
            result += `${index + 1}. ${alert.message}\n`;
            result += `   - ID: #${alert.tinyId}\n`;
            result += `   - Priority: ${alert.priority}\n`;
            result += `   - Status: ${alert.status}\n`;
            if (alert.tags && alert.tags.length > 0) {
              result += `   - Tags: ${alert.tags.join(', ')}\n`;
            }
            if (alert.description) {
              result += `   - Description: ${alert.description}\n`;
            }
            result += '\n';
          });
        } else if (response.alerts) {
          result += 'No alerts found.\n';
        }

        // Format schedules
        if (response.schedules) {
          result += '\nSchedules:\n';
          response.schedules.forEach((schedule: any) => {
            result += `- ${schedule.name} (${schedule.enabled ? 'Enabled' : 'Disabled'})\n`;
            if (schedule.ownerTeam) {
              result += `  Team: ${schedule.ownerTeam.name}\n`;
            }
          });
        }

        // Format on-call participants
        if (response.onCallParticipants) {
          result += '\nOn-Call Participants:\n';
          response.onCallParticipants.forEach((participant: any) => {
            result += `- ${participant.name}`;
            if (participant.scheduleName) {
              result += ` (Schedule: ${participant.scheduleName})`;
            }
            result += '\n';
          });
        }

        return result.trim() || 'No results found';
      }

      // Function to format Confluence response
      function formatConfluenceResponse(response: any): string {
        console.log('Formatting Confluence response:', response);
        if (typeof response === 'string') {
          return response; // Already formatted by the tool
        }
        return JSON.stringify(response, null, 2);
      }

      // Process tool response
      function processToolResponse(toolName: string, response: any): string {
        console.log('Processing tool response for:', toolName);
        if (toolName.startsWith('product.')) {
          return Array.isArray(response)
            ? response.map(formatProductResponse).join('\n\n')
            : formatProductResponse(response);
        } else if (toolName.startsWith('opsgenie.')) {
          return formatOpsGenieResponse(response);
        } else if (toolName.startsWith('confluence.')) {
          return formatConfluenceResponse(response);
        }
        return JSON.stringify(response, null, 2);
      }

      // Create stream transformer for tool outputs
      const transformer: CustomTransformer = {
        currentToolCall: undefined,
        async transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          try {
            console.log('Received chunk:', text); // Debug log

            const lines = text.split('\n');
            for (const line of lines) {
              if (!line.trim()) continue;

              // Handle [DONE] message
              if (line === 'data: [DONE]') {
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                continue;
              }
              
              let jsonData;
              if (line.startsWith('data: ')) {
                try {
                  const content = line.slice(5).trim();
                  if (content === '[DONE]') continue;
                  jsonData = JSON.parse(content);
                } catch (e) {
                  console.log('Error parsing data line:', line);
                  continue;
                }
              } else {
                try {
                  jsonData = JSON.parse(line);
                } catch {
                  console.log('Error parsing raw line:', line);
                  continue;
                }
              }

              console.log('Parsed JSON:', jsonData); // Debug log

              // Handle tool calls - accumulate arguments if streamed
              if (jsonData.choices?.[0]?.delta?.tool_calls) {
                const toolCall = jsonData.choices[0].delta.tool_calls[0];
                
                // Initialize tool call buffer if needed
                if (!this.currentToolCall || toolCall.index !== this.currentToolCall.index) {
                  this.currentToolCall = {
                    index: toolCall.index,
                    id: toolCall.id,
                    type: toolCall.type,
                    function: {
                      name: toolCall.function?.name || '',
                      arguments: ''
                    }
                  };
                }

                // Accumulate function arguments
                if (toolCall.function?.arguments) {
                  this.currentToolCall.function.arguments += toolCall.function.arguments;
                }

                // If function name is provided, store it
                if (toolCall.function?.name) {
                  this.currentToolCall.function.name = toolCall.function.name;
                }
              }
              // Execute tool when we get a finish reason
              else if (jsonData.choices?.[0]?.finish_reason === 'stop' && this.currentToolCall) {
                const toolCall = this.currentToolCall;
                const tool = toolFunctions[toolCall.function.name];
                
                if (tool) {
                  try {
                    console.log('Executing tool:', toolCall.function.name); // Debug log
                    const args = JSON.parse(toolCall.function.arguments);
                    const result = await tool(args);
                    console.log('Tool result:', result); // Debug log
                    
                    const formattedResponse = processToolResponse(toolCall.function.name, result);
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                      type: 'tool_result',
                      id: toolCall.id,
                      result: formattedResponse
                    })}\n\n`));

                    // Send assistant message about tool result
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({
                          choices: [{
                            delta: {
                              content: `\n${formattedResponse}`
                            }
                          }]
                        })}\n\n`
                      )
                    );
                  } catch (toolError) {
                    console.error('Tool execution error:', toolError); // Debug log
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({
                          type: 'tool_error',
                          id: toolCall.id,
                          error: toolError instanceof Error ? toolError.message : 'Tool execution failed'
                        })}\n\n`
                      )
                    );
                  }
                } else {
                  console.log('Tool not found:', toolCall.function.name);
                }
                
                // Reset current tool call
                this.currentToolCall = undefined;
              }
              // Handle normal content deltas
              else if (jsonData.choices?.[0]?.delta?.content) {
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(jsonData)}\n\n`));
              }
            }
          } catch (e) {
            console.error('Error processing chunk:', e);
          }
        }
      };

      const transformStream = new TransformStream(transformer);

      return new Response(response.body.pipeThrough(transformStream), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } catch (error) {
      console.error('Error in chat route:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred during chat completion' }),
      { status: 500 }
    );
  }
}
