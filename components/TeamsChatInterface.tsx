import { useEffect, useState } from 'react';
import * as microsoftTeams from "@microsoft/teams-js";
import { TeamsWrapper } from './TeamsWrapper';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const TeamsChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `👋 Welcome to the AI Chatbot! I can help you with:

• OpsGenie Alerts
  - "Show current P1 incidents"
  - "List all open alerts for WFM team"
  - "Who's on-call right now?"

• Confluence Documentation
  - "Find documentation about deployment process"
  - "Search for runbooks about database maintenance"
  - "Get latest meeting notes"

Try asking me anything about alerts or documentation!`
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (message: string) => {
    try {
      setIsLoading(true);
      
      // Add user message to chat
      setMessages(prev => [...prev, { role: 'user', content: message }]);
      
      // Send message to your API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          tools: ['opsgenie', 'confluence'], // Enable both tools
          context: 'teams' // Add Teams context
        }),
      });

      const data = await response.json();
      
      // Add assistant response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="teams-chat-interface">
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {isLoading && <div className="loading">Processing...</div>}
      </div>
      
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              handleSendMessage(input.trim());
              setInput('');
            }
          }}
          placeholder="Ask about OpsGenie alerts or Confluence pages..."
        />
        <button
          onClick={() => {
            if (input.trim()) {
              handleSendMessage(input.trim());
              setInput('');
            }
          }}
          disabled={isLoading}
        >
          Send
        </button>
      </div>
    </div>
  );
};
