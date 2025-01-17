import { NextApiRequest, NextApiResponse } from 'next';
import { LMStudioProvider } from '@/lib/models/providers/lmstudio';
import { ModelConfig } from '@/lib/models/config';
import { tools, toolDefinitions } from '@/lib/tools';
import { handleToolCalls } from '@/lib/tools/handler';
import { Message, MessageRole, AdaptiveCardResponse } from '@/lib/models/types';
import { log } from '@/lib/utils/logger';

// Initialize LMStudio provider with Qwen model for tool use
const config: ModelConfig = {
    id: 'lmstudio-qwen',
    name: 'Qwen 2.5 7B Instruct',
    provider: 'lmstudio',
    apiEndpoint: 'http://localhost:1234/v1/chat/completions',
    modelId: 'qwen2.5-7b-instruct',
    parameters: {
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.9,
        stream: false
    }
};
const lmStudio = new LMStudioProvider(config);

// Function to extract clean text from Teams message
function extractCleanText(text: string): string {
    try {
        log('EXTRACT_TEXT_INPUT', { text });
        
        if (!text) {
            log('EXTRACT_TEXT_EMPTY');
            return '';
        }

        // Remove mentions and HTML
        let cleanText = text
            .replace(/<at>.*?<\/at>/g, '')  // Remove mentions
            .replace(/\[.*?\]/g, '')         // Remove square brackets
            .replace(/<.*?>/g, '')           // Remove HTML tags
            .trim();
        log('EXTRACT_TEXT_AFTER_CLEANUP', { cleanText });

        // Remove extra whitespace
        cleanText = cleanText.replace(/\s+/g, ' ').trim();
        log('EXTRACT_TEXT_FINAL', { cleanText });

        return cleanText;
    } catch (error) {
        log('EXTRACT_TEXT_ERROR', { 
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined 
        });
        return '';
    }
}

// Function to create an adaptive card response
function createAdaptiveCard(response: AdaptiveCardResponse) {
    const styleMap = {
        'default': 'good',
        'warning': 'warning',
        'error': 'attention'
    };

    const sections = response.sections.map(section => {
        const items = [];
        if (section.header) {
            items.push({
                type: "TextBlock",
                text: section.header,
                weight: "bolder",
                size: "medium",
                color: styleMap[section.style]
            });
        }
        items.push({
            type: "TextBlock",
            text: section.content,
            wrap: true,
            color: styleMap[section.style]
        });
        return items;
    }).flat();

    return {
        type: "AdaptiveCard",
        version: "1.0",
        body: [
            {
                type: "TextBlock",
                text: response.title,
                weight: "bolder",
                size: "large"
            },
            ...sections
        ]
    };
}

async function processMessageWithLLM(message: string): Promise<AdaptiveCardResponse> {
    try {
        log('PROCESS_MESSAGE_START', { message });

        // Create tools list
        const availableTools = [
            {
                type: 'function',
                function: {
                    name: 'opsgenie.getOnCall',
                    description: 'Get the current on-call person from OpsGenie',
                    parameters: {
                        type: 'object',
                        properties: {
                            scheduleName: {
                                type: 'string',
                                description: 'Name of the schedule to check (optional)'
                            }
                        },
                        required: []
                    }
                }
            }
        ];

        log('TOOLS_CONFIGURED', { availableTools });

        // Get response from LLM
        const messages: Message[] = [{ 
            role: 'user' as MessageRole, 
            content: message
        }];
        log('LLM_REQUEST_START', { messages, tools: availableTools });
        
        const response = await lmStudio.generateChatCompletion(
            messages,
            { tools: availableTools }
        );
        log('LLM_RESPONSE_RECEIVED', response);

        // Parse response to get tool calls
        const responseData = await response.response.json();
        log('LLM_RESPONSE_PARSED', responseData);

        if (!responseData.choices?.[0]) {
            throw new Error('No choices in LLM response');
        }

        const choice = responseData.choices[0];
        log('LLM_CHOICE_SELECTED', choice);

        // Handle tool calls
        if (choice.finish_reason === 'tool_calls' && choice.message?.tool_calls?.length > 0) {
            log('TOOL_CALLS_DETECTED', choice.message.tool_calls);

            // Execute tool calls
            const toolResult = await handleToolCalls(choice.message.tool_calls);
            log('TOOL_RESULTS', toolResult);

            // Add tool results to message history
            if (toolResult.results.length > 0) {
                messages.push({
                    role: 'tool' as MessageRole,
                    content: toolResult.summary
                });
            }

            // Add tool results to messages for the next LLM call
            for (let i = 0; i < choice.message.tool_calls.length; i++) {
                const toolCall = choice.message.tool_calls[i];
                const result = toolResult.results[i];
                messages.push({
                    role: 'tool' as MessageRole,
                    content: JSON.stringify(result.data || { error: result.error }),
                    tool_calls: [toolCall]
                });
            }

            // Get final response from LLM with tool results
            const finalResponse = await lmStudio.generateChatCompletion(messages);
            const finalResponseData = await finalResponse.response.json();
            log('FINAL_RESPONSE', finalResponseData);

            return {
                title: "🤖 Assistant Response",
                sections: [{
                    content: finalResponseData.choices[0].message.content,
                    style: 'default'
                }]
            };
        }

        // Return direct response if no tool calls
        return {
            title: "🤖 Assistant Response",
            sections: [{
                content: choice.message.content,
                style: 'default'
            }]
        };

    } catch (error) {
        log('PROCESS_MESSAGE_ERROR', error);
        return {
            title: "❌ Error",
            sections: [{
                content: error instanceof Error ? error.message : 'An unexpected error occurred',
                style: 'error'
            }]
        };
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Log everything about the request
        console.log('=== TEAMS REQUEST START ===');
        console.log('Method:', req.method);
        console.log('URL:', req.url);
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('Query:', JSON.stringify(req.query, null, 2));
        console.log('=== TEAMS REQUEST END ===');

        log('TEAMS_REQUEST_RECEIVED', {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: JSON.stringify(req.body),
            query: req.query
        });

        // Only allow POST requests
        if (req.method !== 'POST') {
            console.log('Not a POST request:', req.method);
            log('REQUEST_ERROR', { error: 'Method not allowed' });
            return res.status(405).json({
                type: 'message',
                attachments: [{
                    contentType: 'application/vnd.microsoft.card.adaptive',
                    content: createAdaptiveCard({
                        title: "❌ Error",
                        sections: [{
                            content: 'Method not allowed',
                            style: 'error'
                        }]
                    })
                }]
            });
        }

        // Extract and clean message text
        console.log('Raw text:', req.body.text);
        const messageText = extractCleanText(req.body.text || '');
        console.log('Cleaned text:', messageText);

        if (!messageText) {
            log('REQUEST_ERROR', { error: 'No message text provided' });
            return res.status(400).json({
                type: 'message',
                attachments: [{
                    contentType: 'application/vnd.microsoft.card.adaptive',
                    content: createAdaptiveCard({
                        title: "❌ Error",
                        sections: [{
                            content: 'No message text provided',
                            style: 'error'
                        }]
                    })
                }]
            });
        }

        // Process message with LLM
        const response = await processMessageWithLLM(messageText);
        log('LLM_RESPONSE', response);

        // Create adaptive card
        const card = createAdaptiveCard(response);
        log('CARD_CREATED', card);

        // Send response
        const webhookResponse = {
            type: 'message',
            attachments: [{
                contentType: 'application/vnd.microsoft.card.adaptive',
                content: card
            }]
        };
        log('WEBHOOK_RESPONSE', webhookResponse);

        return res.status(200).json(webhookResponse);

    } catch (error) {
        log('REQUEST_ERROR', { 
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined 
        });
        return res.status(500).json({
            type: 'message',
            attachments: [{
                contentType: 'application/vnd.microsoft.card.adaptive',
                content: createAdaptiveCard({
                    title: "❌ Error",
                    sections: [{
                        content: error instanceof Error ? error.message : 'An unexpected error occurred',
                        style: 'error'
                    }]
                })
            }]
        });
    }
}
