import { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle, Info, Lightbulb, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  children: ReactNode;
  content: string;
  type?: 'help' | 'info' | 'tip' | 'feature';
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const tooltipStyles = {
  help: {
    icon: HelpCircle,
    iconClass: 'h-4 w-4 text-blue-500',
    contentClass: 'bg-blue-50 border-blue-200 text-blue-900 max-w-xs',
    title: '💡 Ayuda',
  },
  info: {
    icon: Info,
    iconClass: 'h-4 w-4 text-cyan-500',
    contentClass: 'bg-cyan-50 border-cyan-200 text-cyan-900 max-w-xs',
    title: 'ℹ️ Información',
  },
  tip: {
    icon: Lightbulb,
    iconClass: 'h-4 w-4 text-yellow-500',
    contentClass: 'bg-yellow-50 border-yellow-200 text-yellow-900 max-w-xs',
    title: '💡 Consejo',
  },
  feature: {
    icon: Star,
    iconClass: 'h-4 w-4 text-purple-500',
    contentClass: 'bg-purple-50 border-purple-200 text-purple-900 max-w-xs',
    title: '⭐ Funcionalidad',
  },
};

export function HelpTooltip({ 
  children, 
  content, 
  type = 'help', 
  side = 'top',
  className 
}: HelpTooltipProps) {
  const config = tooltipStyles[type];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center gap-1", className)}>
            {children}
            <Icon className={cn(config.iconClass, "cursor-help hover:scale-110 transition-transform")} />
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className={cn(
            "border-2 shadow-lg rounded-lg p-3",
            config.contentClass
          )}
        >
          <div className="space-y-1">
            <div className="font-medium text-sm">{config.title}</div>
            <div className="text-sm leading-relaxed">{content}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Quick access components for common use cases
export function QuickHelp({ children, content, className }: { children: ReactNode; content: string; className?: string }) {
  return (
    <HelpTooltip type="help" content={content} className={className}>
      {children}
    </HelpTooltip>
  );
}

export function QuickTip({ children, content, className }: { children: ReactNode; content: string; className?: string }) {
  return (
    <HelpTooltip type="tip" content={content} className={className}>
      {children}
    </HelpTooltip>
  );
}

export function QuickInfo({ children, content, className }: { children: ReactNode; content: string; className?: string }) {
  return (
    <HelpTooltip type="info" content={content} className={className}>
      {children}
    </HelpTooltip>
  );
}

export function FeatureHighlight({ children, content, className }: { children: ReactNode; content: string; className?: string }) {
  return (
    <HelpTooltip type="feature" content={content} className={className}>
      {children}
    </HelpTooltip>
  );
}