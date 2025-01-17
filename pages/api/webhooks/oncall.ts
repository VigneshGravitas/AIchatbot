import { NextApiRequest, NextApiResponse } from 'next';

// Function to extract clean text from Teams message
function extractCleanText(text: string): string {
    if (!text) return '';
    return text
        .replace(/<at>.*?<\/at>/g, '')  // Remove mentions
        .replace(/<.*?>/g, '')          // Remove any HTML tags
        .replace(/\\n/g, ' ')           // Replace newlines with spaces
        .replace(/\s+/g, ' ')           // Normalize whitespace
        .trim();                        // Remove leading/trailing whitespace
}

// Function to fetch current on-call from OpsGenie
async function getCurrentOnCall(): Promise<any> {
    try {
        const apiKey = process.env.OPSGENIE_API_KEY;
        if (!apiKey) {
            throw new Error('OpsGenie API key not configured');
        }

        // Get current on-call users
        const response = await fetch('https://api.opsgenie.com/v2/schedules/on-calls', {
            headers: {
                'Authorization': `GenieKey ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`OpsGenie API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('OpsGenie response:', JSON.stringify(data, null, 2));
        return data;
    } catch (error) {
        console.error('Error fetching on-call info:', error);
        throw error;
    }
}

// Function to create an adaptive card for on-call info
function createOnCallCard(onCallData: any) {
    try {
        const schedules = onCallData.data || [];
        const facts = schedules.map((schedule: any) => {
            const participants = schedule.onCallParticipants || [];
            const names = participants.map((p: any) => p.name || 'Unknown').join(', ');
            return {
                title: schedule.scheduleName || 'Unknown Schedule',
                value: names || 'No one on call'
            };
        });

        return {
            type: "message",
            attachments: [
                {
                    contentType: "application/vnd.microsoft.card.adaptive",
                    content: {
                        type: "AdaptiveCard",
                        version: "1.0",
                        body: [
                            {
                                type: "TextBlock",
                                text: "Current On-Call Information",
                                size: "large",
                                weight: "bolder"
                            },
                            {
                                type: "FactSet",
                                facts: facts
                            }
                        ]
                    }
                }
            ]
        };
    } catch (error) {
        console.error('Error creating card:', error);
        throw error;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

        // Handle OPTIONS request for CORS preflight
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        // For POST requests (Teams messages)
        if (req.method === 'POST') {
            console.log('\n=== ONCALL REQUEST ===');
            console.log('Body:', JSON.stringify(req.body, null, 2));
            console.log('=========================\n');

            try {
                // Fetch on-call information
                const onCallData = await getCurrentOnCall();
                
                // Create and return adaptive card
                const card = createOnCallCard(onCallData);
                return res.status(200).json(card);
            } catch (error: any) {
                console.error('Error processing on-call request:', error);
                
                // Return error card
                return res.status(200).json({
                    type: "message",
                    attachments: [
                        {
                            contentType: "application/vnd.microsoft.card.adaptive",
                            content: {
                                type: "AdaptiveCard",
                                version: "1.0",
                                body: [
                                    {
                                        type: "TextBlock",
                                        text: "Error fetching on-call information",
                                        size: "medium",
                                        weight: "bolder",
                                        color: "attention"
                                    },
                                    {
                                        type: "TextBlock",
                                        text: error.message,
                                        wrap: true
                                    }
                                ]
                            }
                        }
                    ]
                });
            }
        }

        // For GET requests
        return res.status(200).json({
            type: "message",
            text: "On-call endpoint is running"
        });

    } catch (err: any) {
        console.error('Error in on-call handler:', err);
        return res.status(500).json({ 
            type: "message",
            text: "Internal server error"
        });
    }
}
