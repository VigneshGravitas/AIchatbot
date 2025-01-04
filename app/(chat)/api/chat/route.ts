import { type Message } from 'ai';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { chat, message, vote } from '@/lib/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { getModelProvider } from '@/lib/models';

// Using Node.js runtime for database compatibility
// export const runtime = 'edge';

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

      // Get the model provider based on the selected model
      const provider = getModelProvider(modelId);
      
      // Generate the completion
      const { response } = await provider.generateChatCompletion(messages);

      // Create a TransformStream to process and save the response
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      let fullResponse = '';
      const transformStream = new TransformStream({
        async transform(chunk, controller) {
          const text = decoder.decode(chunk);
          const lines = text.split('\n');

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

            if (trimmedLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmedLine.slice(6));
                const content = data.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullResponse += content;
                  // Add chatId to the response
                  const responseWithChatId = {
                    ...data,
                    chatId: currentChatId
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(responseWithChatId)}\n\n`));
                }
              } catch (error) {
                console.error('Error parsing chunk:', error);
              }
            } else {
              controller.enqueue(encoder.encode(line + '\n'));
            }
          }
        },
        async flush() {
          // Save the complete assistant response
          if (fullResponse && currentChatId) {
            try {
              await db.insert(message).values({
                chatId: currentChatId,
                content: fullResponse,
                role: 'assistant',
                createdAt: new Date(),
              });
              console.log('Saved assistant response');
            } catch (error) {
              console.error('Error saving assistant response:', error);
            }
          }
        }
      });

      return new Response(response.body?.pipeThrough(transformStream), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });

    } catch (error: any) {
      console.error('Error in chat route:', error);
      return new Response(error.message || 'Error processing chat', { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in chat route:', error);
    return new Response('Error processing request', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    if (!chatId) {
      return new Response('Chat ID is required', { status: 400 });
    }

    // Verify the chat belongs to the user
    const chatResult = await db
      .select()
      .from(chat)
      .where(and(eq(chat.id, chatId), eq(chat.userId, session.user.id)))
      .execute();

    if (!chatResult.length) {
      return new Response('Chat not found or unauthorized', { status: 404 });
    }

    // Delete votes first
    await db.delete(vote).where(eq(vote.chatId, chatId));

    // Delete messages
    await db.delete(message).where(eq(message.chatId, chatId));

    // Delete chat
    await db.delete(chat).where(eq(chat.id, chatId));

    return new Response('OK');
  } catch (error) {
    console.error('Error deleting chat:', error);
    return new Response('Error deleting chat', { status: 500 });
  }
}
