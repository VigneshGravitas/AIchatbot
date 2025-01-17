import { NextApiRequest, NextApiResponse } from 'next';

interface TeamsMessage {
    type: string;
    text: string;
    summary?: string;
    sections?: {
        activityTitle?: string;
        activitySubtitle?: string;
        activityText?: string;
    }[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const webhookUrl = process.env.TEAMS_INCOMING_WEBHOOK_URL;
        if (!webhookUrl) {
            throw new Error('Webhook URL not configured');
        }

        const message: TeamsMessage = {
            type: 'message',
            text: req.body.text,
            summary: req.body.summary || req.body.text,
        };

        // Add rich formatting if provided
        if (req.body.title || req.body.subtitle) {
            message.sections = [{
                activityTitle: req.body.title,
                activitySubtitle: req.body.subtitle,
                activityText: req.body.text
            }];
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
        });

        if (!response.ok) {
            throw new Error(`Failed to send message: ${response.statusText}`);
        }

        res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
}
