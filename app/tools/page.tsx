'use client';

import { useState } from 'react';
import { Chat } from '@/components/chat';
import { models } from '@/lib/models/config';
import { generateUUID } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';

export default function ToolsPage() {
  const id = generateUUID();
  const [selectedModelId, setSelectedModelId] = useState(models[0].id);
  const { state } = useSidebar();

  return (
    <div className="flex flex-col h-full">
      <div className={`flex-1 transition-all duration-200 ${state === 'expanded' ? 'pl-64' : ''}`}>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          selectedModelId={selectedModelId}
          selectedVisibilityType="private"
          isReadonly={false}
          toolMode={true}
          onModelChange={setSelectedModelId}
        />
      </div>
    </div>
  );
}
