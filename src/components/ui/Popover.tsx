import * as React from 'react';
import * as RadixPopover from '@radix-ui/react-popover';

export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;

export const PopoverContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof RadixPopover.Content>>(
  ({ sideOffset = 8, align = 'center', className, children, ...props }, ref) => (
    <RadixPopover.Portal>
      <RadixPopover.Content
        ref={ref}
        sideOffset={sideOffset as number}
        align={align as any}
        className={`rounded-md border bg-white shadow-lg p-3 ${className || ''}`}
        {...props}
      >
        {children}
      </RadixPopover.Content>
    </RadixPopover.Portal>
  )
);
PopoverContent.displayName = 'PopoverContent';
