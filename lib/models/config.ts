export interface ModelConfig {
  id: string;
  name: string;
  provider: 'hyperbolic' | 'lmstudio';
  apiEndpoint: string;
  apiKey?: string;
  modelId: string;
  parameters: {
    temperature: number;
    max_tokens: number;
    top_p: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    stream: boolean;
  };
}

export const models: ModelConfig[] = [
  {
    id: 'hyperbolic-llama-70b',
    name: 'Llama 3.3 70B',
    provider: 'hyperbolic',
    apiEndpoint: process.env.HYPERBOLIC_API_ENDPOINT!,
    apiKey: process.env.HYPERBOLIC_API_KEY,
    modelId: process.env.HYPERBOLIC_MODEL!,
    parameters: {
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.9,
      stream: true
    }
  },
  {
    id: 'lmstudio-llama-3.2-1b',
    name: 'Llama 3.2 1B Instruct',
    provider: 'lmstudio',
    apiEndpoint: 'http://192.168.2.1:1234/v1/chat/completions',
    modelId: 'llama-3.2-1b-instruct',
    parameters: {
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.95,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stream: true
    }
  },
  {
    id: 'lmstudio-phi-4',
    name: 'Phi-4',
    provider: 'lmstudio',
    apiEndpoint: 'http://localhost:1234/v1/chat/completions',
    modelId: 'phi-4',
    parameters: {
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.9,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stream: true
    }
  }
];
