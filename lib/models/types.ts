// LMStudio Types
export interface LMStudioToolCall {
    function: {
        name: string;
        arguments: string;
    };
}

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface Message {
    role: MessageRole;
    content: string;
    id?: string;
    tool_calls?: Array<{
        id: string;
        function: {
            name: string;
            arguments: string;
        };
    }>;
}

export interface LMStudioMessage {
    role: MessageRole;
    content: string;
    tool_calls?: Array<{
        id: string;
        function: {
            name: string;
            arguments: string;
        };
    }>;
}

export interface LMStudioResponse {
    choices: Array<{
        message: LMStudioMessage;
    }>;
}

// Tool Handling Types
export interface ToolResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    toolName: string;
}

export interface ToolCallResult {
    results: ToolResult[];
    summary: string;
}

// OpsGenie Types
export interface OpsGenieParticipant {
    id: string;
    name: string;
    type: string;
    scheduleName: string;
}

export interface OpsGenieResponse {
    status: string;
    onCallParticipants: OpsGenieParticipant[];
    total: number;
}

// Teams Response Types
export interface AdaptiveCardSection {
    header?: string;
    content: string;
    style: 'default' | 'warning' | 'error';
}

export interface AdaptiveCardResponse {
    title: string;
    sections: AdaptiveCardSection[];
}

// Message Generation Types
export interface MessageGenerationOptions {
    tools?: boolean;
    streaming?: boolean;
    temperature?: number;
    maxTokens?: number;
}

export interface MessageContext {
    previousMessages?: Message[];
    systemPrompt?: string;
    options?: MessageGenerationOptions;
}
