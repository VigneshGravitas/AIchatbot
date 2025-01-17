import { ActivityHandler, TurnContext } from 'botbuilder';

export class TeamsBot extends ActivityHandler {
    constructor() {
        super();

        // Handle when a member is added to the conversation
        this.onMembersAdded(async (context, next) => {
            console.log('Members added:', context.activity.membersAdded);
            if (context.activity.membersAdded) {
                for (const member of context.activity.membersAdded) {
                    if (member.id !== context.activity.recipient.id) {
                        await context.sendActivity({
                            type: 'message',
                            text: 'Hello! I am your AI assistant. How can I help you today?'
                        });
                    }
                }
            }
            await next();
        });

        // Handle messages
        this.onMessage(async (context: TurnContext) => {
            try {
                const userMessage = context.activity.text;
                console.log('Received message:', userMessage);
                
                // Get the service URL from the activity
                const serviceUrl = context.activity.serviceUrl || process.env.NEXTAUTH_URL;
                
                // Call your existing API
                const response = await fetch(`${serviceUrl}/api/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: userMessage,
                        tools: ['opsgenie', 'confluence'],
                        source: 'teams',
                        user: context.activity.from.name || context.activity.from.id,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`API responded with status: ${response.status}`);
                }

                const result = await response.json();
                await context.sendActivity({
                    type: 'message',
                    text: result.content || result.message
                });
            } catch (error) {
                console.error('Error processing message:', error);
                await context.sendActivity({
                    type: 'message',
                    text: 'Sorry, I encountered an error processing your message.'
                });
            }
        });

        // Handle conversation update
        this.onConversationUpdate(async (context, next) => {
            console.log('Conversation updated:', {
                type: context.activity.type,
                id: context.activity.id,
                timestamp: context.activity.timestamp
            });
            await next();
        });
    }
}
