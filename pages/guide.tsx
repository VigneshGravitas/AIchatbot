import { useEffect, useState } from 'react';
import * as microsoftTeams from "@microsoft/teams-js";

export default function Guide() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI Chatbot User Guide</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Open Microsoft Teams</li>
          <li>Click on Apps in the left sidebar</li>
          <li>Search for "AI Chatbot"</li>
          <li>Click "Add" to install the bot</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Example Commands</h2>
        
        <div className="mb-6">
          <h3 className="font-semibold mb-2">OpsGenie Queries</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>"Show all open P1 incidents"</li>
            <li>"Who is on-call for WFM team?"</li>
            <li>"List alerts from last 24 hours"</li>
            <li>"Show alerts assigned to me"</li>
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Confluence Queries</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>"Find deployment documentation"</li>
            <li>"Search for database maintenance runbooks"</li>
            <li>"Get latest team meeting notes"</li>
            <li>"Find documentation about API endpoints"</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Tips</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Be specific in your queries for better results</li>
          <li>You can ask follow-up questions about previous responses</li>
          <li>Use natural language - no need for specific commands</li>
          <li>Combine OpsGenie and Confluence queries: "Show alerts related to the systems mentioned in our runbook"</li>
        </ul>
      </section>

      <section className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Need Help?</h2>
        <p>Contact the development team or ask the bot "show me help" for more information.</p>
      </section>
    </div>
  );
}
