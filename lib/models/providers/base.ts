import { Message } from 'ai';

export interface ModelConfig {
  apiEndpoint: string;
  modelId: string;
  parameters?: Record<string, any>;
}

export interface ModelResponse {
  response: Response;
}

export interface ChatRequestOptions {
  tools?: Array<{
    type: string;
    function: {
      name: string;
      description: string;
      parameters: Record<string, any>;
    };
  }>;
}

export abstract class ModelProvider {
  constructor(protected config: ModelConfig) {}

  protected async handleError(response: Response): Promise<never> {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  abstract generateChatCompletion(
    messages: Message[],
    options?: ChatRequestOptions
  ): Promise<ModelResponse>;
}
