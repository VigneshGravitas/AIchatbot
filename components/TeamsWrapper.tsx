import { useEffect, useState } from 'react';
import * as microsoftTeams from "@microsoft/teams-js";

interface TeamsWrapperProps {
    children: React.ReactNode;
}

export const TeamsWrapper: React.FC<TeamsWrapperProps> = ({ children }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [userInfo, setUserInfo] = useState<{
        displayName?: string;
        userPrincipalName?: string;
        id?: string;
    } | null>(null);

    useEffect(() => {
        const initializeTeams = async () => {
            try {
                await microsoftTeams.app.initialize();
                setIsInitialized(true);

                // Get user context
                const context = await microsoftTeams.app.getContext();
                setUserInfo(context.user ? {
                    displayName: context.user.displayName,
                    userPrincipalName: context.user.userPrincipalName,
                    id: context.user.id
                } : null);

                // Configure theme
                microsoftTeams.app.registerOnThemeChangeHandler((theme) => {
                    document.body.className = theme;
                });
            } catch (error) {
                console.error('Failed to initialize Microsoft Teams:', error);
            }
        };

        initializeTeams();
    }, []);

    if (!isInitialized) {
        return <div>Loading Teams context...</div>;
    }

    return (
        <div className="teams-wrapper">
            {children}
        </div>
    );
};
