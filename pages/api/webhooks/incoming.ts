import { NextApiRequest, NextApiResponse } from 'next';
import { getOnCallParticipants } from '@/lib/tools/opsgenie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Log everything about the request
    console.log('========= INCOMING TEAMS REQUEST =========');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Query:', JSON.stringify(req.query, null, 2));
    console.log('=========================================');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Handle Teams message format
        const text = req.body.text || req.body.message || req.body.content;
        const from = req.body.from?.name || req.body.from?.id || 'unknown';
        
        console.log('Processed message:', { text, from });

        // Process the message
        let responseText = '';
        const message = text?.toLowerCase() || '';

        if (message.includes('who is on call') || message.includes('whos on call') || message.includes('oncall')) {
            // Get on-call information from OpsGenie
            try {
                const onCallResponse = await getOnCallParticipants({});
                if (onCallResponse.status === 'success' && onCallResponse.onCallParticipants) {
                    // Group participants by schedule
                    const scheduleMap = new Map<string, string[]>();
                    onCallResponse.onCallParticipants.forEach(p => {
                        const scheduleName = (p as any).scheduleName || 'Unknown Schedule';
                        if (!scheduleMap.has(scheduleName)) {
                            scheduleMap.set(scheduleName, []);
                        }
                        scheduleMap.get(scheduleName)?.push(p.name);
                    });

                    // Format response
                    const scheduleInfo = Array.from(scheduleMap.entries())
                        .map(([schedule, names]) => `${schedule}: ${names.join(', ')}`)
                        .join('\\n');

                    responseText = scheduleInfo || 'No one is currently on-call';
                } else {
                    responseText = onCallResponse.message || 'Failed to get on-call information';
                }
            } catch (error) {
                console.error('OpsGenie error:', error);
                responseText = 'Sorry, I had trouble getting the on-call information. Please try again later.';
            }
        } else if (message.includes('documentation') || message.includes('docs')) {
            responseText = 'I can help you find documentation. What topic are you interested in?';
        } else if (message.includes('incident') || message.includes('status')) {
            responseText = 'Let me check the current incidents for you. Would you like to see all incidents or just P1s?';
        } else {
            responseText = `I understand you said: "${text}". How can I help you with that?`;
        }

        console.log('Sending response:', responseText);

        // Try both response methods
        const response = {
            type: 'message',
            text: responseText
        };

        // Send via incoming webhook
        try {
            await sendTeamsMessage(responseText);
            console.log('Successfully sent via incoming webhook');
        } catch (error) {
            console.error('Failed to send via incoming webhook:', error);
        }

        // Also send direct response
        console.log('Sending direct response:', response);
        return res.status(200).json(response);
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function sendTeamsMessage(text: string) {
    const webhookUrl = process.env.TEAMS_INCOMING_WEBHOOK_URL;
    if (!webhookUrl) {
        console.error('No incoming webhook URL configured');
        return;
    }

    try {
        const message = {
            text: text
        };

        console.log('Sending message to Teams webhook:', {
            url: webhookUrl,
            message: message
        });

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to send message: ${response.statusText}. Response: ${errorText}`);
        }

        console.log('Successfully sent message to Teams');
    } catch (error) {
        console.error('Error sending message to Teams:', error);
        throw error;
    }
}
