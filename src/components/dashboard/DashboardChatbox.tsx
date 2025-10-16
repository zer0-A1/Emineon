'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export function DashboardChatbox() {
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // Navigate to AI copilot with the message as a query parameter
      router.push(`/ai-copilot?message=${encodeURIComponent(message.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <div className="relative w-5 h-5">
            <Image
              src="https://res.cloudinary.com/emineon/image/upload/v1749926503/Emineon_logo_tree_k8n5vj.png"
              alt="Emineon"
              width={20}
              height={20}
              className="object-contain"
              onError={(e) => {
                e.currentTarget.src = "https://res.cloudinary.com/emineon/image/upload/v1749926503/Emineon_logo_tree_k8n5vj.png";
              }}
            />
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Ask Emineon</h3>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about candidates, jobs, or get insights..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none pr-12"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {[
            'Show me today\'s interviews',
            'Which jobs need attention?',
            'Top candidates this week'
          ].map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setMessage(suggestion)}
              className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 hover:text-gray-800 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
} 