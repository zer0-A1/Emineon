'use client';

import React, { useEffect, useState } from 'react';

interface AnimatedPageTitleProps {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
}

export function AnimatedPageTitle({ title, Icon }: AnimatedPageTitleProps) {
  const [display, setDisplay] = useState('');
  const [phase, setPhase] = useState<'typing' | 'done'>('typing');

  useEffect(() => {
    if (phase !== 'typing') return;
    if (display.length < title.length) {
      const t = setTimeout(() => setDisplay(title.slice(0, display.length + 1)), 45);
      return () => clearTimeout(t);
    }
    setPhase('done');
  }, [display, phase, title]);

  return (
    <h1 className="text-3xl font-normal text-neutral-700 flex items-center gap-2">
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white ring-2 ring-primary-300 shadow-sm shadow-[0_0_24px_rgba(37,99,235,0.35)] animate-pulse">
        <Icon className="w-4 h-4 text-primary-700" />
      </span>
      <span className="flex items-center gap-1">
        <span>{display}</span>
        <span className="ml-0.5 inline-block w-[1px] h-6 bg-neutral-400 align-middle animate-pulse" />
      </span>
    </h1>
  );
}


