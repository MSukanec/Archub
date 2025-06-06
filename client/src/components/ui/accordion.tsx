import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { Plus, Minus, LucideIcon } from "lucide-react"

import { cn } from "../../lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("flex flex-col flex-shrink-0 mb-0.5", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

interface AccordionTriggerProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
}

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ className, children, title, subtitle, icon: Icon, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex w-full">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "w-full flex items-center justify-between p-4 bg-surface-views hover:bg-surface-primary transition-colors text-white flex-shrink-0 border-t border-b border-surface-primary [&[data-state=open]_.plus-icon]:hidden [&[data-state=closed]_.minus-icon]:hidden",
        className
      )}
      style={{ borderWidth: '2px' }}
      {...props}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <Icon className="w-3 h-3 text-white" />
          </div>
        )}
        <div className="text-left">
          <div className="font-medium text-white text-sm">{title || children}</div>
          {subtitle && (
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          )}
        </div>
      </div>
      <div className="w-4 h-4 relative flex items-center justify-center">
        <Plus className="plus-icon w-4 h-4 text-muted-foreground absolute" />
        <Minus className="minus-icon w-4 h-4 text-muted-foreground absolute" />
      </div>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("p-4 bg-surface-views", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
