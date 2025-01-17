import { Message } from '../types';

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  apiEndpoint: string;
  modelId: string;
  parameters?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    stream?: boolean;
    [key: string]: any;
  };
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
