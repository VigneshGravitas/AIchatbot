import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message, tools, source, user } = body;

        // For now, return a simple response
        // Later we can integrate with actual OpsGenie and Confluence APIs
        const response = {
            content: `I received your message: "${message}"\n\nI can help you with:\n• OpsGenie Alerts\n• Confluence Documentation\n\nWhat would you like to know?`
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error processing chat request:', error);
        return NextResponse.json({ 
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
