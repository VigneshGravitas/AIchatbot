import { ModelConfig } from '../config';
import { ModelProvider } from './base';
import { HyperbolicProvider } from './hyperbolic';
import { LMStudioProvider } from './lmstudio';

export function createModelProvider(config: ModelConfig): ModelProvider {
  switch (config.provider) {
    case 'hyperbolic':
      return new HyperbolicProvider(config);
    case 'lmstudio':
      return new LMStudioProvider(config);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}
