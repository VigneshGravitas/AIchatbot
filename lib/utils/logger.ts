import fs from 'fs';
import path from 'path';

// Configure log directory
const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, `teams-debug-${new Date().toISOString().split('T')[0]}.log`);

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

export function log(step: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [TEAMS-DEBUG] [${step}]${data ? ': ' + JSON.stringify(data, null, 2) : ''}\n`;
    
    // Log to console
    console.log(logMessage);
    
    // Log to file
    fs.appendFileSync(LOG_FILE, logMessage);
}
