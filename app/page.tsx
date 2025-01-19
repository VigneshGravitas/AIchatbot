'use client';

import { useEffect, useState } from 'react';
import { TeamsChatInterface } from '../components/TeamsChatInterface';
import * as microsoftTeams from "@microsoft/teams-js";

export default function Home() {
  const [isTeams, setIsTeams] = useState(false);

  useEffect(() => {
    // Check if we're running in Teams
    const checkTeams = async () => {
      try {
        await microsoftTeams.app.initialize();
        setIsTeams(true);
      } catch (error) {
        console.log('Not running in Teams');
        setIsTeams(false);
      }
    };

    checkTeams();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-2xl mb-4">AI Chatbot Assistant</h1>
        <TeamsChatInterface />
      </div>
    </main>
  );
}
