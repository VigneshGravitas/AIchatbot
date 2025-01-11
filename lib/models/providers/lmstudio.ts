import { Message } from 'ai';
import { ModelProvider, ModelResponse } from './base';

export class LMStudioProvider extends ModelProvider {
  async generateChatCompletion(messages: Message[]): Promise<ModelResponse> {
    try {
      const requestBody = {
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        model: this.config.modelId,
        ...this.config.parameters
      };

      console.log('LMStudio Request:', {
        endpoint: this.config.apiEndpoint,
        modelId: this.config.modelId,
        body: requestBody
      });

      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
