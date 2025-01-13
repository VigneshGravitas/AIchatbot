import type { ComponentProps } from 'react';
import { Columns2 } from 'lucide-react';

import { useSidebar } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from './ui/button';

interface SidebarToggleProps {
  className?: string;
  onClick?: () => void;
}

export function SidebarToggle({ className, onClick }: SidebarToggleProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick || toggleSidebar}
          variant="outline"
          className={`md:px-3 md:h-fit ${className || ''}`}
        >
          <Columns2 className="h-8 w-8" />
        </Button>
      </TooltipTrigger>
      <TooltipContent align="start">Toggle Sidebar</TooltipContent>
    </Tooltip>
  );
}
