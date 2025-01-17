import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const webhookUrl = process.env.TEAMS_INCOMING_WEBHOOK_URL;
        if (!webhookUrl) {
            return res.status(500).json({ error: 'No webhook URL configured' });
        }

        // Send a simple test message
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: "Test message from webhook endpoint"
            })
        });

        // Log the full response
        const responseText = await response.text();
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        console.log('Response body:', responseText);

        return res.status(200).json({
            success: response.ok,
            status: response.status,
            response: responseText
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: String(error) });
    }
}
