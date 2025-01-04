import { Message } from 'ai';
import { ModelProvider, ModelResponse } from './base';

export class LMStudioProvider extends ModelProvider {
  async generateChatCompletion(messages: Message[]): Promise<ModelResponse> {
    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        model: this.config.modelId,
        ...this.config.parameters
      })
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    return { response };
  }
}
