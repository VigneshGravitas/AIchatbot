import { NextApiRequest, NextApiResponse } from 'next';
import { LMStudioProvider } from '@/lib/models/providers/lmstudio';
import { ModelConfig } from '@/lib/models/config';
import { tools, toolDefinitions } from '@/lib/tools';
import { handleToolCalls, formatToolResults } from '@/lib/tools/handler';
import { Message, MessageRole, AdaptiveCardResponse, AdaptiveCardSection } from '@/lib/models/types';
import { nanoid } from 'nanoid';
import { log } from '@/lib/utils/logger';
import { ConfluenceSpace, ConfluenceSpaceList, ConfluencePage, ConfluencePageList, ToolResponse } from '@/lib/tools/confluence';

// Initialize LMStudio provider with Qwen model for tool use
const config: ModelConfig = {
    id: 'lmstudio-qwen',
    name: 'Qwen 2.5 7B Instruct',
    provider: 'lmstudio',
    apiEndpoint: process.env.LMSTUDIO_API_ENDPOINT || 'http://localhost:1234/v1/chat/completions',
    modelId: 'qwen2.5-7b-instruct',
    parameters: {
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.9,
        stream: false
    }
};

// Check if LMStudio is running
async function checkLMStudioConnection(): Promise<boolean> {
    try {
        const response = await fetch(config.apiEndpoint, {
            method: 'GET'
        });
        return response.ok;
    } catch (error) {
        log('LMSTUDIO_CONNECTION_ERROR', error);
        return false;
    }
}

const lmStudio = new LMStudioProvider(config);

// Function to extract clean text from Teams message
function extractCleanText(text: string): string {
    try {
        log('EXTRACT_TEXT_INPUT', { text });
        
        if (!text) {
            log('EXTRACT_TEXT_EMPTY');
            return '';
        }

        // Remove mentions
        let cleanText = text.replace(/<at>.*?<\/at>/g, '').trim();
        log('EXTRACT_TEXT_AFTER_MENTIONS', { cleanText });

        // Remove extra whitespace
        cleanText = cleanText.replace(/\s+/g, ' ').trim();
        log('EXTRACT_TEXT_AFTER_WHITESPACE', { cleanText });

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

        // Configure available tools
        const availableTools = [
            {
                type: "function",
                function: {
                    name: "opsgenie.getOnCall",
                    description: "Get the current on-call person from OpsGenie",
                    parameters: {
                        type: "object",
                        properties: {
                            scheduleName: {
                                type: "string",
                                description: "Name of the schedule to check (optional)"
                            }
                        },
                        required: []
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "opsgenie.createAlert",
                    description: "Create an alert in OpsGenie",
                    parameters: {
                        type: "object",
                        properties: {
                            message: {
                                type: "string",
                                description: "Alert message/title"
                            },
                            description: {
                                type: "string",
                                description: "Alert description"
                            },
                            priority: {
                                type: "string",
                                enum: ["P1", "P2", "P3", "P4", "P5"],
                                description: "Alert priority (P1 highest, P5 lowest)"
                            }
                        },
                        required: ["message"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "opsgenie.getAlerts",
                    description: "Get list of OpsGenie alerts",
                    parameters: {
                        type: "object",
                        properties: {
                            query: { 
                                type: "string", 
                                description: "Search query to filter alerts (optional)" 
                            },
                            limit: { 
                                type: "number", 
                                description: "Maximum number of alerts to return (default: 20)" 
                            }
                        },
                        required: []
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "opsgenie.getSchedules",
                    description: "Get list of OpsGenie schedules",
                    parameters: {
                        type: "object",
                        properties: {},
                        required: []
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "confluence.getSpaces",
                    description: "Get list of Confluence spaces",
                    parameters: {
                        type: "object",
                        properties: {
                            limit: { 
                                type: "number", 
                                description: "Maximum number of spaces to return (default: 25)" 
                            }
                        },
                        required: []
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "confluence.getPages",
                    description: "Get list of pages in a Confluence space",
                    parameters: {
                        type: "object",
                        properties: {
                            spaceKey: { 
                                type: "string", 
                                description: "Space key to get pages from" 
                            },
                            limit: { 
                                type: "number", 
                                description: "Maximum number of pages to return (default: 25)" 
                            }
                        },
                        required: ["spaceKey"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "confluence.search",
                    description: "Search Confluence content",
                    parameters: {
                        type: "object",
                        properties: {
                            query: { 
                                type: "string", 
                                description: "Search query" 
                            },
                            spaceKey: { 
                                type: "string", 
                                description: "Space key to search in (optional)" 
                            },
                            limit: { 
                                type: "number", 
                                description: "Maximum number of results to return (default: 25)" 
                            }
                        },
                        required: ["query"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "confluence.createPage",
                    description: "Create a new Confluence page",
                    parameters: {
                        type: "object",
                        properties: {
                            title: { 
                                type: "string", 
                                description: "Page title" 
                            },
                            content: { 
                                type: "string", 
                                description: "Page content in storage format" 
                            },
                            spaceKey: { 
                                type: "string", 
                                description: "Space key" 
                            },
                            parentId: { 
                                type: "string", 
                                description: "Parent page ID (optional)" 
                            }
                        },
                        required: ["title", "content", "spaceKey"]
                    }
                }
            }
        ];
        log('TOOLS_CONFIGURED', { availableTools });

        // For all messages, use LLM with tool calling capability
        const messages: Message[] = [{ 
            role: 'user' as MessageRole, 
            content: message
        }];

        // Check LMStudio connection
        const isLMStudioRunning = await checkLMStudioConnection();
        if (!isLMStudioRunning) {
            log('LMSTUDIO_NOT_RUNNING');
            return {
                title: "❌ Error",
                sections: [{
                    content: "LMStudio is not running. Please start LMStudio and try again.",
                    style: 'error'
                }]
            };
        }

        const response = await lmStudio.generateChatCompletion(messages, {
            tools: availableTools
        });
        
        if (!response.response.ok) {
            const errorText = await response.response.text();
            log('LLM_ERROR', { status: response.response.status, error: errorText });
            return {
                title: "❌ Error",
                sections: [{
                    content: `LLM Error: ${errorText}`,
                    style: 'error'
                }]
            };
        }

        const responseData = await response.response.json();
        log('LLM_CHOICE_SELECTED', responseData.choices[0]);
        
        if (!responseData.choices?.[0]?.message) {
            throw new Error('No response from LLM');
        }

        const choice = responseData.choices[0].message;

        // Handle tool calls if present
        if (choice.tool_calls && choice.tool_calls.length > 0) {
            const toolCall = choice.tool_calls[0];
            log('TOOL_CALL', { toolCall });

            const toolName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments);
            log('TOOL_ARGS', { toolName, args });

            if (toolName === 'opsgenie.getOnCall') {
                const result = await tools['opsgenie.getOnCall'](args);
                log('OPSGENIE_RESULT', { result });
                
                if (result.status === 'error') {
                    return {
                        title: "❌ Error",
                        sections: [{
                            content: result.message || 'Failed to fetch on-call information',
                            style: 'error'
                        }]
                    };
                }

                if (!result.onCallParticipants || result.onCallParticipants.length === 0) {
                    return {
                        title: "🔍 On-Call Information",
                        sections: [{
                            content: "No one is currently on call",
                            style: 'warning'
                        }]
                    };
                }

                const onCallInfo = result.onCallParticipants.map((p: { name: string; type: string; scheduleName: string }) => 
                    `${p.name} (${p.type}) - Schedule: ${p.scheduleName}`
                ).join('\n');

                return {
                    title: "🔍 On-Call Information",
                    sections: [{
                        content: onCallInfo,
                        style: 'default'
                    }]
                };
            }

            if (toolName === 'opsgenie.createAlert') {
                const result = await tools['opsgenie.createAlert']({
                    message: args.message,
                    description: args.description,
                    priority: args.priority || "P1"
                });

                log('OPSGENIE_CREATE_ALERT_RESULT', { result });

                if (result.status === 'error') {
                    return {
                        title: "❌ Error Creating Alert",
                        sections: [{
                            content: result.message || 'Failed to create alert',
                            style: 'error'
                        }]
                    };
                }

                return {
                    title: "✅ Alert Created",
                    sections: [{
                        content: `Successfully created alert:\nTitle: ${args.message}\nDescription: ${args.description || 'No description provided'}\nPriority: ${args.priority || 'P1'}`,
                        style: 'default'
                    }]
                };
            }

            if (toolName === 'opsgenie.getAlerts') {
                const result = await tools['opsgenie.getAlerts'](args);
                log('OPSGENIE_GET_ALERTS_RESULT', { result });

                if (result.status === 'error') {
                    return {
                        title: "❌ Error",
                        sections: [{
                            content: result.message || 'Failed to fetch alerts',
                            style: 'error'
                        }]
                    };
                }

                if (!result.alerts || result.alerts.length === 0) {
                    return {
                        title: "🔔 Alerts",
                        sections: [{
                            content: "No alerts found",
                            style: 'warning'
                        }]
                    };
                }

                const alertsInfo = result.alerts.map((a: any) => 
                    `${a.message} (Priority: ${a.priority}) - Status: ${a.status}`
                ).join('\n');

                return {
                    title: "🔔 Alerts",
                    sections: [{
                        content: alertsInfo,
                        style: 'default'
                    }]
                };
            }

            if (toolName === 'opsgenie.getSchedules') {
                const result = await tools['opsgenie.getSchedules'](args);
                log('OPSGENIE_GET_SCHEDULES_RESULT', { result });

                if (result.status === 'error') {
                    return {
                        title: "❌ Error",
                        sections: [{
                            content: result.message || 'Failed to fetch schedules',
                            style: 'error'
                        }]
                    };
                }

                if (!result.schedules || result.schedules.length === 0) {
                    return {
                        title: "📅 Schedules",
                        sections: [{
                            content: "No schedules found",
                            style: 'warning'
                        }]
                    };
                }

                const schedulesInfo = result.schedules.map((s: any) => 
                    `${s.name} (${s.enabled ? 'Enabled' : 'Disabled'})`
                ).join('\n');

                return {
                    title: "📅 Schedules",
                    sections: [{
                        content: schedulesInfo,
                        style: 'default'
                    }]
                };
            }

            if (toolName === 'confluence.getSpaces') {
                const result = await tools['confluence.getSpaces'](args);
                log('CONFLUENCE_GET_SPACES_RESULT', { result });

                if (result.status === 'error') {
                    return {
                        title: "❌ Error",
                        sections: [{
                            content: result.message || 'Failed to fetch Confluence spaces',
                            style: 'error'
                        }]
                    };
                }

                const spaceList = result.data;
                if (!spaceList?.results || spaceList.results.length === 0) {
                    return {
                        title: "📚 Confluence Spaces",
                        sections: [{
                            content: "No spaces found",
                            style: 'warning'
                        }]
                    };
                }

                const spacesInfo = spaceList.results.map((s: any) => 
                    `${s.name} (Key: ${s.key})`
                ).join('\n');

                return {
                    title: "📚 Confluence Spaces",
                    sections: [{
                        content: spacesInfo,
                        style: 'default'
                    }]
                };
            }

            if (toolName === 'confluence.getPages') {
                const result = await tools['confluence.getPages'](args);
                log('CONFLUENCE_GET_PAGES_RESULT', { result });

                if (result.status === 'error') {
                    return {
                        title: "❌ Error",
                        sections: [{
                            content: result.message || 'Failed to fetch Confluence pages',
                            style: 'error'
                        }]
                    };
                }

                const pageList = result.data;
                if (!pageList?.results || pageList.results.length === 0) {
                    return {
                        title: "📄 Confluence Pages",
                        sections: [{
                            content: args.spaceKey ? 
                                `No pages found in space ${args.spaceKey}` : 
                                "No pages found",
                            style: 'warning'
                        }]
                    };
                }

                const pagesInfo = pageList.results.map((p: any) => 
                    `${p.title} (ID: ${p.id})`
                ).join('\n');

                return {
                    title: "📄 Confluence Pages",
                    sections: [{
                        content: pagesInfo,
                        style: 'default'
                    }]
                };
            }

            if (toolName === 'confluence.search') {
                const result = await tools['confluence.search'](args);
                log('CONFLUENCE_SEARCH_RESULT', { result });

                if (result.status === 'error') {
                    return {
                        title: "❌ Error",
                        sections: [{
                            content: result.message || 'Failed to search Confluence',
                            style: 'error'
                        }]
                    };
                }

                const searchResults = result.data;
                if (!searchResults?.results || searchResults.results.length === 0) {
                    return {
                        title: "🔍 Search Results",
                        sections: [{
                            content: `No results found for "${args.query}"${args.spaceKey ? ` in space ${args.spaceKey}` : ''}`,
                            style: 'warning'
                        }]
                    };
                }

                const searchInfo = searchResults.results.map((r: any) => 
                    `${r.title} (Space: ${r.space?.key || 'Unknown'})`
                ).join('\n');

                return {
                    title: "🔍 Search Results",
                    sections: [{
                        content: searchInfo,
                        style: 'default'
                    }]
                };
            }

            if (toolName === 'confluence.createPage') {
                const result = await tools['confluence.createPage'](args.spaceKey, args.title, args.content);
                log('CONFLUENCE_CREATE_PAGE_RESULT', { result });

                if (result.status === 'error') {
                    return {
                        title: "❌ Error",
                        sections: [{
                            content: result.message || 'Failed to create Confluence page',
                            style: 'error'
                        }]
                    };
                }

                return {
                    title: "✅ Page Created",
                    sections: [{
                        content: `Successfully created page "${args.title}" in space ${args.spaceKey}`,
                        style: 'default'
                    }]
                };
            }
        }

        // For regular responses without tool calls
        return {
            title: "🤖 Assistant Response",
            sections: [{
                content: choice.content || 'No content in response',
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
    const requestId = nanoid();
    log('TEAMS_WEBHOOK_REQUEST', { 
        requestId,
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query
    });

    try {
        // Only allow POST requests
        if (req.method !== 'POST') {
            log('REQUEST_ERROR', { requestId, error: 'Method not allowed' });
            res.status(405).json({
                type: 'message',
                text: 'Method not allowed'
            });
            return;
        }

        // Extract and clean message text
        const rawText = req.body.text;
        log('TEAMS_RAW_TEXT', { requestId, rawText });
        
        const messageText = extractCleanText(rawText || '');
        log('TEAMS_CLEANED_TEXT', { requestId, messageText });

        if (!messageText) {
            log('REQUEST_ERROR', { requestId, error: 'No message text provided' });
            res.status(400).json({
                type: 'message',
                text: 'No message provided'
            });
            return;
        }

        // Send immediate acknowledgment
        log('SENDING_ACKNOWLEDGMENT', { requestId });
        res.status(202).json({
            type: 'message',
            text: '🤔 Processing your request...'
        });

        // Process asynchronously
        (async () => {
            try {
                log('STARTING_ASYNC_PROCESSING', { requestId });
                const response = await processMessageWithLLM(messageText);
                log('LLM_PROCESSING_COMPLETE', { requestId, response });

                // Create adaptive card
                const card = createAdaptiveCard(response);
                log('CARD_CREATED', { requestId, card });

                // Prepare webhook response
                const webhookResponse = {
                    type: 'message',
                    attachments: [{
                        contentType: 'application/vnd.microsoft.card.adaptive',
                        content: card
                    }]
                };
                log('WEBHOOK_RESPONSE_PREPARED', { requestId, webhookResponse });

                // Send response via incoming webhook
                log('SENDING_TEAMS_WEBHOOK', { requestId });
                const webhookResult = await fetch('https://x/y', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(webhookResponse)
                });

                const webhookStatus = {
                    ok: webhookResult.ok,
                    status: webhookResult.status,
                    statusText: webhookResult.statusText
                };
                log('TEAMS_WEBHOOK_RESPONSE', { requestId, webhookStatus });

                if (!webhookResult.ok) {
                    const errorText = await webhookResult.text();
                    log('TEAMS_WEBHOOK_ERROR', { requestId, error: errorText, status: webhookStatus });
                } else {
                    const responseText = await webhookResult.text();
                    log('TEAMS_WEBHOOK_SUCCESS', { requestId, response: responseText });
                }

            } catch (error) {
                log('ASYNC_PROCESSING_ERROR', { 
                    requestId,
                    error,
                    message: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined
                });

                // Send error via webhook
                const errorResponse = {
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
                };

                log('SENDING_ERROR_WEBHOOK', { requestId, errorResponse });
                await fetch('https://niceonline.webhook.office.com/webhookb2/48f359ed-d0a2-4633-bb9e-8f9ebafa5a03@7123dabd-0e87-4da9-9cb9-b7ec82011aad/IncomingWebhook/e06a81a328d5451d8ff0f94faab6ff35/f8420357-b17d-42d5-9471-bc596cd447a6/V21pi1kabUERRGL7t9Zwm8g-6bm7zSJuMQZZiaCkVcpVc1', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(errorResponse)
                });
            }
        })();

    } catch (error) {
        log('REQUEST_HANDLER_ERROR', { 
            requestId,
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        
        res.status(500).json({
            type: 'message',
            text: 'An unexpected error occurred'
        });
    }
}
