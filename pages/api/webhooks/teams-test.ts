import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        headers: req.headers,
        body: req.body,
        url: req.url
    };

    // Log to console
    console.log('=== Teams Test Endpoint ===');
    console.log(JSON.stringify(logEntry, null, 2));
    console.log('=========================');

    // Log to file
    try {
        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }
        const logFile = path.join(logDir, 'teams-webhook.log');
        fs.appendFileSync(logFile, JSON.stringify(logEntry, null, 2) + '\n\n');
    } catch (error) {
        console.error('Failed to write to log file:', error);
    }

    // Always respond with success
    res.status(200).json({
        type: 'message',
        text: 'Test endpoint reached successfully at ' + new Date().toISOString()
    });
}
