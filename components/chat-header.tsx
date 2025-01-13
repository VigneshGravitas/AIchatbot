'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { memo } from 'react';
import { Columns2 } from 'lucide-react';

import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { VisibilityType, VisibilitySelector } from './visibility-selector';

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  onModelChange,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  onModelChange?: (modelId: string) => void;
}) {
  const router = useRouter();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle onClick={toggleSidebar} />

      <div className="flex-1 flex items-center justify-end gap-2">
        {!isReadonly && (
          <ModelSelector
            selectedModelId={selectedModelId}
            onModelChange={onModelChange}
          />
        )}

        <VisibilitySelector
          selectedVisibilityType={selectedVisibilityType}
          chatId={chatId}
        />
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader);
