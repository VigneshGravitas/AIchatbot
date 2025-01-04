import { Message } from 'ai';
import { ModelConfig } from '../config';

export interface ModelResponse {
  response: Response;
  cleanup?: () => Promise<void>;
}

export abstract class ModelProvider {
  constructor(protected config: ModelConfig) {}

  abstract generateChatCompletion(messages: Message[]): Promise<ModelResponse>;

  protected async handleError(response: Response): Promise<never> {
    const error = await response.text();
    console.error(`${this.config.provider} API error:`, error);
    throw new Error(`${this.config.provider} API error: ${response.status}`);
  }
}
