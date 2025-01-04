import { models } from './config';
import { createModelProvider } from './providers';

export function getModelProvider(modelId: string) {
  const config = models.find(m => m.id === modelId);
  if (!config) {
    throw new Error(`Model ${modelId} not found`);
  }
  return createModelProvider(config);
}

export function getAvailableModels() {
  return models.map(({ id, name }) => ({ id, name }));
}
