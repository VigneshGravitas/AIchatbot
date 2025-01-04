'use client';

import type { Attachment, Message, CreateMessage, ChatRequestOptions } from 'ai';
import { useState, useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';

import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";

import { Block } from './block';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useBlockSelector } from '@/hooks/use-block';

export function Chat({
  id,
  initialMessages,
  selectedModelId: initialModelId,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentModelId, setCurrentModelId] = useState(initialModelId);
  const isBlockVisible = useBlockSelector((state) => state.isVisible);

  const { data: votes } = useSWR<Array<Vote>>(`/api/vote?chatId=${id}`, fetcher);

  const append = async (
    message: Message | CreateMessage,
    _chatRequestOptions?: ChatRequestOptions
  ): Promise<string | null | undefined> => {
    if (!message.id) {
      message.id = nanoid();
    }
    setMessages(prev => [...prev, message as Message]);
    return message.id;
  };

  const stop = async () => {
    return null;
  };

  const reload = async (
    _chatRequestOptions?: ChatRequestOptions
  ): Promise<string | null | undefined> => {
    return null;
  };

  const handleSubmit = async (
    event?: { preventDefault?: () => void },
    _chatRequestOptions?: ChatRequestOptions
  ) => {
    event?.preventDefault?.();
    if (!input.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const userMessage: Message = {
        id: nanoid(),
        role: 'user',
        content: input,
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          modelId: currentModelId,
          chatId: id
        })
      });

      if (!response.ok) throw new Error(response.statusText);
      
      const responseMessage: Message = {
        id: nanoid(),
        role: 'assistant',
        content: '',
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, responseMessage]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let fullContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          
          try {
            const json = JSON.parse(line.slice(5));
            const content = json.choices?.[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              setMessages(prev => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage.role === 'assistant') {
                  return [
                    ...prev.slice(0, -1),
                    { ...lastMessage, content: fullContent }
                  ];
                }
                return prev;
              });
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={currentModelId}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        <ScrollArea className="flex-1">
          <Messages
            chatId={id}
            isLoading={isLoading}
            votes={votes}
            messages={messages}
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
            isBlockVisible={isBlockVisible}
          />
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
            />
          )}
        </form>
      </div>

      {isBlockVisible && (
        <Block
          chatId={id}
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          stop={stop}
          attachments={attachments}
          setAttachments={setAttachments}
          append={append}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          votes={votes}
          isReadonly={isReadonly}
        />
      )}
    </>
  );
}
