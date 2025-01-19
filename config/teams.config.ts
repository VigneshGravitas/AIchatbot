export const teamsConfig = {
    appId: process.env.TEAMS_APP_ID || '11111111-2222-3333-4444-555555555555',
    baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3001',
    scopes: [
        'User.Read',
        'User.ReadBasic.All',
        'Team.ReadBasic.All',
        'Channel.ReadBasic.All'
    ],
    // Add more Teams-specific configuration here
    validDomains: [
        'localhost:3001'
    ],
    isProduction: process.env.NODE_ENV === 'production'
};

export const getTeamsConfig = () => {
    return {
        ...teamsConfig,
        // Add dynamic configuration here if needed
        contentUrl: `${teamsConfig.baseUrl}/chat`,
        configurationUrl: `${teamsConfig.baseUrl}/config`,
    };
};
