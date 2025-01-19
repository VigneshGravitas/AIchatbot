import { BotFrameworkAdapter } from 'botbuilder';

// Create bot adapter
export const adapter = new BotFrameworkAdapter({
    appId: undefined,  // Set to undefined for local testing
    appPassword: undefined  // Set to undefined for local testing
});

// Error handler
adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError] unhandled error: ${error}`);
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${error}`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );
    await context.sendActivity('The bot encountered an error or bug.');
    console.error('Bot Framework Error:', error);
};
