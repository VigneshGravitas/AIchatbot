import { Message } from 'ai';
import { ModelProvider, ModelResponse, ChatRequestOptions } from './base';

interface ChatCompletionResponse {
  response: ModelResponse;
}

export class LMStudioProvider extends ModelProvider {
  async generateChatCompletion(messages: Message[], options?: ChatRequestOptions): Promise<ChatCompletionResponse> {
    try {
      // Add system message if not present
      if (!messages.find(m => m.role === 'system')) {
        messages = [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. When users ask about products or information, use the appropriate tools to help them. Always use tools when available instead of making up responses.'
          },
          ...messages
        ];
      }

      const requestBody = {
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        model: this.config.modelId,
        ...this.config.parameters,
        stream: true,
        ...(options?.tools && {
          tools: options.tools,
          tool_choice: 'auto'
        })
      };

      console.log('LMStudio Request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('LMStudio Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        await this.handleError(response);
      }

      return { response };
    } catch (error) {
      console.error('LMStudio Provider Error:', error);
      throw error;
    }
  }
}
