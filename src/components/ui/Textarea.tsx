import React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export function Textarea({ 
  label,
  error,
  helperText,
  fullWidth = false,
  resize = 'vertical',
  className,
  id,
  rows = 4,
  ...props 
}: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize',
  };

  return (
    <div className={cn('space-y-1', fullWidth && 'w-full')}>
      {label && (
        <label 
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        id={textareaId}
        rows={rows}
        className={cn(
          'block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200',
          resizeClasses[resize],
          error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
          props.disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
          className
        )}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
} 