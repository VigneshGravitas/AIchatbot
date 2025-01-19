import { useEffect } from 'react';
import * as microsoftTeams from "@microsoft/teams-js";

export default function ConfigPage() {
    useEffect(() => {
        const initialize = async () => {
            try {
                await microsoftTeams.app.initialize();
                
                // Register on save handler
                microsoftTeams.pages.config.registerOnSaveHandler((saveEvent) => {
                    microsoftTeams.pages.config.setConfig({
                        suggestedDisplayName: "AI Chatbot",
                        entityId: "chatbot",
                        contentUrl: window.location.origin,
                        websiteUrl: window.location.origin
                    });
                    saveEvent.notifySuccess();
                });

                // Enable the save button
                microsoftTeams.pages.config.setValidityState(true);
            } catch (error) {
                console.error('Failed to initialize config:', error);
            }
        };

        initialize();
    }, []);

    return (
        <div className="config-page">
            <h1>AI Chatbot Configuration</h1>
            <p>Click Save to add the chatbot to your Teams environment.</p>
        </div>
    );
}
