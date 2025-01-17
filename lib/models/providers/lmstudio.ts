import { Message, MessageRole, LMStudioMessage } from '../types';
import { ModelProvider, ModelResponse, ChatRequestOptions, ModelConfig } from './base';
import { log } from '@/lib/utils/logger';

export class LMStudioProvider extends ModelProvider {
  constructor(config: ModelConfig) {
    super(config);
  }

  async generateChatCompletion(messages: Message[], options?: ChatRequestOptions): Promise<ModelResponse> {
    try {
      // Add system message if not present
      const hasSystemMessage = messages.some(m => m.role === 'system');
      const systemMessage: Message = {
        role: 'system' as MessageRole,
        content: 'You are a helpful AI assistant. You must ALWAYS respond in English, regardless of the input language. When users ask about on-call information, use the opsgenie.getOnCall tool to get current on-call details. Always use tools when available instead of making up responses.'
      };

      // Process messages
      const processedMessages = messages.filter(m => m.role !== 'system');
      if (!hasSystemMessage) {
        processedMessages.unshift(systemMessage);
      }

      const formattedMessages = this.formatMessages(processedMessages);
      log('LMSTUDIO_FORMATTED_MESSAGES', { formattedMessages });

      const requestBody = {
        model: this.config.modelId || 'qwen2.5-7b-instruct',
        messages: formattedMessages,
        temperature: this.config.parameters?.temperature || 0.7,
        max_tokens: this.config.parameters?.max_tokens || 2048,
        top_p: this.config.parameters?.top_p || 0.9,
        stream: this.config.parameters?.stream || false,
        tools: options?.tools || [],
        tool_choice: "auto"
      };

      log('LMSTUDIO_REQUEST', requestBody);

      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      log('LMSTUDIO_RESPONSE_STATUS', { 
        status: response.status, 
        statusText: response.statusText,
      });

      if (!response.ok) {
        const errorText = await response.text();
        log('LMSTUDIO_ERROR', { 
          status: response.status, 
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`LMStudio API error: ${response.status} - ${errorText}`);
      }

      return {
        response
      };
    } catch (error) {
      log('LMSTUDIO_ERROR', { 
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined 
      });
      throw error;
    }
  }

  private formatMessages(messages: Message[]): LMStudioMessage[] {
    return messages.map(message => {
      const formattedMessage: LMStudioMessage = {
        role: message.role,
        content: message.content
      };

      // Only add tool_calls if present
      if (message.tool_calls && message.tool_calls.length > 0) {
        formattedMessage.tool_calls = message.tool_calls;
      }

      return formattedMessage;
    });
  }
}
