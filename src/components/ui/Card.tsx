import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Card({ 
  children, 
  className, 
  variant = 'default', 
  padding = 'md',
  ...props 
}: CardProps) {
  const variants = {
    default: 'bg-white border border-secondary-200 shadow-soft',
    outlined: 'bg-white border border-secondary-300',
    elevated: 'bg-white border border-secondary-200 shadow-medium',
  };

  const paddings = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-200',
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function CardHeader({ children, title, subtitle, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('mb-6', className)} {...props}>
      {title && (
        <h3 className="text-xl font-semibold text-primary-900 mb-1">
          {title}
        </h3>
      )}
      {subtitle && (
        <p className="text-secondary-600 text-sm">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div className={cn('mt-6 pt-4 border-t border-secondary-200', className)} {...props}>
      {children}
    </div>
  );
} 