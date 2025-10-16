import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatSkills(skills: string[]): string {
  if (skills.length === 0) return 'No skills listed';
  if (skills.length <= 3) return skills.join(', ');
  return `${skills.slice(0, 3).join(', ')} +${skills.length - 3} more`;
} 