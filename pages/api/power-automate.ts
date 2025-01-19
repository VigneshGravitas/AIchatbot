import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { message, userEmail, teamContext } = req.body;

        // Validate the request is from Power Automate using your organization's email domain
        if (!userEmail?.endsWith('@yourcompany.com')) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Process the message using your existing chat logic
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                tools: ['opsgenie', 'confluence'],
                context: 'teams',
                user: userEmail
            }),
        });

        const data = await response.json();

        // Return the response in a format Power Automate can use
        return res.status(200).json({
            response: data.response,
            success: true,
            metadata: {
                timestamp: new Date().toISOString(),
                user: userEmail,
                context: teamContext
            }
        });

    } catch (error) {
        console.error('Error processing Power Automate request:', error);
        return res.status(500).json({ 
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
