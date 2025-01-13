import { create } from 'zustand';

interface ToolState {
  selectedTool: string | null;
  setSelectedTool: (tool: string) => void;
  toolConfig: Record<string, any>;
  setToolConfig: (tool: string, config: any) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  selectedTool: null,
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  toolConfig: {},
  setToolConfig: (tool, config) => 
    set((state) => ({
      toolConfig: {
        ...state.toolConfig,
        [tool]: config
      }
    }))
}));
