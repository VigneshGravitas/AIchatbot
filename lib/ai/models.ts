// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  {
    id: 'llama-3.3-70b',
    label: 'Llama 3.3 70B',
    apiIdentifier: 'meta-llama/Llama-3.3-70B-Instruct',
    description: 'Advanced large language model for complex tasks',
  }
] as const;

export const DEFAULT_MODEL_NAME: string = 'llama-3.3-70b';
