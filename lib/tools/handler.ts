import { tools } from './index';
import { LMStudioToolCall, ToolResult, ToolCallResult } from '../models/types';
import { log } from '@/lib/utils/logger';

type ToolFunction = (...args: any[]) => Promise<any>;
type Tools = Record<string, ToolFunction>;

export async function handleToolCall(call: LMStudioToolCall): Promise<ToolResult> {
    log('HANDLING_TOOL_CALL', { call });
    
    try {
        const toolName = call.function.name;
        const args = JSON.parse(call.function.arguments);
        
        log('TOOL_EXECUTION_START', { toolName, args });
        
        const toolsMap = tools as Tools;
        if (toolsMap[toolName]) {
            const data = await toolsMap[toolName](args);
            log('TOOL_EXECUTION_RESULT', { toolName, data });
            
            return {
                success: true,
                data,
                toolName: call.function.name
            };
        } else {
            log('TOOL_NOT_FOUND', { toolName });
            return {
                success: false,
                error: `Tool ${toolName} not found`,
                toolName: call.function.name
            };
        }
    } catch (error: any) {
        log('TOOL_EXECUTION_ERROR', { 
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        return {
            success: false,
            error: error.message || 'Unknown error occurred',
            toolName: call.function.name
        };
    }
}

export async function handleToolCalls(calls: LMStudioToolCall[]): Promise<ToolCallResult> {
    // Execute all tool calls in parallel
    const results = await Promise.all(calls.map(handleToolCall));
    
    // Generate a summary of the results
    const summary = results
        .map(result => {
            if (result.success) {
                return `✅ ${result.toolName}: Successfully executed`;
            } else {
                return `❌ ${result.toolName}: ${result.error}`;
            }
        })
        .join('\n');

    return {
        results,
        summary
    };
}

export function formatToolResults(results: ToolResult[]): string {
    try {
        log('FORMATTING_TOOL_RESULTS', { results });
        return results
            .map(result => {
                if (result.success) {
                    return `### ${result.toolName}\n${JSON.stringify(result.data, null, 2)}`;
                } else {
                    return `### ❌ ${result.toolName}\nError: ${result.error}`;
                }
            })
            .join('\n\n');
    } catch (error) {
        log('FORMAT_RESULTS_ERROR', { 
            error,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
        return 'Error formatting tool results';
    }
}
