import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const activity = req.body;
        console.log('Received activity:', activity);

        // Handle conversation update
        if (activity.type === 'conversationUpdate' && activity.membersAdded) {
            const response = {
                type: 'message',
                from: {
                    id: 'bot',
                    name: 'AI Assistant'
                },
                text: 'Hello! 👋 I am your AI assistant. I can help you with:\n\n' +
                      '• Finding documentation\n' +
                      '• Checking incident status\n' +
                      '• Getting on-call information\n\n' +
                      'What would you like to know?'
            };
            return res.status(200).json(response);
        }

        // Handle messages
        if (activity.type === 'message' && activity.text) {
            const text = activity.text.toLowerCase();
            let responseText = '';

            // Simple pattern matching for demo
            if (text.includes('documentation') || text.includes('docs')) {
                responseText = 'I can help you find documentation. What topic are you interested in?';
            } else if (text.includes('incident') || text.includes('status')) {
                responseText = 'Let me check the current incidents for you. Would you like to see all incidents or just P1s?';
            } else if (text.includes('on-call') || text.includes('oncall')) {
                responseText = 'I\'ll find out who\'s currently on-call. Which team would you like to check?';
            } else {
                responseText = `I understand you said: "${activity.text}". How can I help you with that?`;
            }

            const response = {
                type: 'message',
                from: {
                    id: 'bot',
                    name: 'AI Assistant'
                },
                text: responseText
            };
            return res.status(200).json(response);
        }

        // Default response for unhandled activity types
        return res.status(200).json({ 
            type: 'message', 
            from: {
                id: 'bot',
                name: 'AI Assistant'
            },
            text: 'I received your message but I\'m not sure how to handle it. Could you try rephrasing?' 
        });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

// Configure API route to handle large payloads
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb',
        },
    },
};
