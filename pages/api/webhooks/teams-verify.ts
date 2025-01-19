import { NextApiRequest, NextApiResponse } from 'next';

async function getOnCallInfo(): Promise<string> {
    try {
        console.log('Starting OpsGenie API call...');
        const apiKey = process.env.OPSGENIE_API_KEY;
        if (!apiKey) {
            console.error('No OpsGenie API key found in environment variables');
            throw new Error('OpsGenie API key not configured');
        }

        // Test OpsGenie API connectivity
        const testResponse = await fetch('https://api.opsgenie.com/v2/schedules', {
            method: 'GET',
            headers: {
                'Authorization': `GenieKey ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const responseText = await testResponse.text();
        console.log('OpsGenie test response:', {
            status: testResponse.status,
            statusText: testResponse.statusText,
            headers: Object.fromEntries(testResponse.headers.entries()),
            body: responseText
        });

        if (!testResponse.ok) {
            throw new Error(`OpsGenie API error: ${testResponse.status} ${testResponse.statusText} - ${responseText}`);
        }

        return `OpsGenie API test successful. Status: ${testResponse.status}`;
    } catch (err: any) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Detailed error in getOnCallInfo:', error);
        return `Error checking on-call status: ${error.message}`;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Log every request immediately
        const timestamp = new Date().toISOString();
        console.log(`\n[${timestamp}] === NEW REQUEST ===`);
        console.log('Method:', req.method);
        console.log('URL:', req.url);
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('Query:', JSON.stringify(req.query, null, 2));

        // Enable CORS
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

        // Handle OPTIONS request
        if (req.method === 'OPTIONS') {
            console.log('Handling OPTIONS request');
            return res.status(200).end();
        }

        // Handle Teams validation
        if (req.query?.validationToken) {
            console.log('Handling Teams validation with token:', req.query.validationToken);
            res.setHeader('Content-Type', 'text/plain');
            return res.status(200).send(req.query.validationToken);
        }

        // For POST requests (Teams messages)
        if (req.method === 'POST') {
            console.log('Handling POST request');
            
            // Test if Teams can reach this endpoint
            if (req.body?.text?.toLowerCase().includes('test')) {
                const response = {
                    type: 'message',
                    text: 'I received your test message! The webhook is working.'
                };
                console.log('Sending test response:', response);
                return res.status(200).json(response);
            }

            // Try to extract message text from various possible formats
            const messageText = req.body?.text || 
                              req.body?.data?.text ||
                              req.body?.message?.text ||
                              req.body?.content?.text ||
                              req.body?.value?.text ||
                              (typeof req.body === 'string' ? req.body : null) ||
                              'No message text received';

            console.log('Extracted message text:', messageText);

            let responseText = '';
            if (messageText.toLowerCase().includes('on-call')) {
                console.log('On-call request detected, fetching information...');
                responseText = await getOnCallInfo();
                console.log('Got on-call response:', responseText);

                // Try both response methods
                const teamsResponse = {
                    type: 'message',
                    text: responseText
                };

                // Also try sending through Teams incoming webhook
                try {
                    const webhookUrl = process.env.TEAMS_INCOMING_WEBHOOK_URL;
                    if (webhookUrl) {
                        console.log('Sending via incoming webhook to:', webhookUrl);
                        const webhookResponse = await fetch(webhookUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: responseText })
                        });
                        
                        console.log('Webhook response:', {
                            status: webhookResponse.status,
                            statusText: webhookResponse.statusText,
                            body: await webhookResponse.text()
                        });
                    }
                } catch (err: any) {
                    const error = err instanceof Error ? err : new Error(String(err));
                    console.error('Failed to send via incoming webhook:', error);
                }

                return res.status(200).json(teamsResponse);
            } else {
                responseText = `I received your message: "${messageText}". How can I help you?`;
            }

            console.log('Sending final response:', responseText);
            return res.status(200).json({
                type: 'message',
                text: responseText
            });
        }

        // For GET requests (browser access)
        console.log('Handling GET request');
        return res.status(200).json({
            type: 'message',
            text: `Hello! I received your ${req.method} request at ${timestamp}`
        });
    } catch (err: any) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Error in main handler:', error);
        return res.status(500).json({
            type: 'message',
            text: 'Error processing request: ' + error.message
        });
    }
}
