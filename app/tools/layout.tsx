'use client';

import { SidebarProvider } from '@/components/ui/sidebar';

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
