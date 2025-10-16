'use client';

import React, { useState, useRef, useEffect } from 'react';
import { enrichmentPipeline } from '@/lib/ai/enrichment-pipeline';
import { promptModules, PromptModuleKey } from '@/lib/prompts';
import { 
  Sparkles, 
  Loader2, 
  Check, 
  X, 
  RefreshCw, 
  Lightbulb,
  ArrowRight,
  Wand2
} from 'lucide-react';

export interface InlineGPTProps {
  fieldName: string;
  currentValue: string;
  placeholder?: string;
  promptType: PromptModuleKey;
  context?: Record<string, any>;
  onValueChange: (newValue: string) => void;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
}

export interface SuggestionResult {
  enhanced: string;
  original: string;
  tokensUsed: number;
  confidence: number;
  timestamp: Date;
}

export function InlineGPTSuggestions({
  fieldName,
  currentValue,
  placeholder,
  promptType,
  context = {},
  onValueChange,
  disabled = false,
  maxLength,
  className = ''
}: InlineGPTProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestionResult | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState({ totalTokens: 0, requests: 0 });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [currentValue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Generate AI suggestions for the current content
   */
  const generateSuggestion = async () => {
    if (!currentValue.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const result = await enrichmentPipeline.quickEnhance(
        currentValue,
        promptType,
        context
      );

      const newSuggestion: SuggestionResult = {
        enhanced: result.enhanced,
        original: currentValue,
        tokensUsed: result.tokensUsed,
        confidence: calculateConfidence(result.enhanced, currentValue),
        timestamp: new Date()
      };

      setSuggestion(newSuggestion);
      setShowSuggestion(true);
      setUsage(prev => ({
        totalTokens: prev.totalTokens + result.tokensUsed,
        requests: prev.requests + 1
      }));

      // Auto-hide suggestion after 30 seconds
      suggestionTimeoutRef.current = setTimeout(() => {
        setShowSuggestion(false);
      }, 30000);

    } catch (err) {
      console.error('AI suggestion failed:', err);
      setError(err instanceof Error ? err.message : 'Suggestion failed');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Apply the AI suggestion
   */
  const applySuggestion = () => {
    if (suggestion) {
      onValueChange(suggestion.enhanced);
      setShowSuggestion(false);
      setSuggestion(null);
    }
  };

  /**
   * Dismiss the current suggestion
   */
  const dismissSuggestion = () => {
    setShowSuggestion(false);
    setSuggestion(null);
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }
  };

  /**
   * Calculate confidence score based on content changes
   */
  const calculateConfidence = (enhanced: string, original: string): number => {
    if (enhanced === original) return 0;
    
    const lengthDiff = Math.abs(enhanced.length - original.length) / Math.max(enhanced.length, original.length);
    const wordCountDiff = Math.abs(enhanced.split(' ').length - original.split(' ').length);
    
    // Higher confidence for moderate changes, lower for extreme changes
    if (lengthDiff > 0.8 || wordCountDiff > 20) return 0.3;
    if (lengthDiff > 0.5 || wordCountDiff > 10) return 0.6;
    return 0.9;
  };

  /**
   * Get prompt module metadata for display
   */
  const getPromptInfo = () => {
    const module = promptModules[promptType];
    return {
      name: module.name,
      description: module.description
    };
  };

  const promptInfo = getPromptInfo();
  const hasContent = currentValue.trim().length > 10;
  const canSuggest = hasContent && !disabled && !isLoading;

  return (
    <div className={`relative ${className}`}>
      {/* Main Input Field */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={currentValue}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={`w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-all ${
            showSuggestion 
              ? 'border-primary-300 bg-primary-50' 
              : 'border-gray-300'
          } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
          rows={3}
        />
        
        {/* AI Enhance Button */}
        <div className="absolute top-3 right-3 flex items-center space-x-1">
          <button
            onClick={generateSuggestion}
            disabled={!canSuggest}
            className={`p-2 rounded-lg transition-all ${
              canSuggest
                ? 'text-primary-600 hover:bg-primary-100 hover:text-primary-700'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            title={`Enhance with AI: ${promptInfo.name}`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </button>
          
          {/* Usage Indicator */}
          {usage.requests > 0 && (
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {usage.requests}req
            </div>
          )}
        </div>
      </div>

      {/* Character Count */}
      {maxLength && (
        <div className="text-xs text-gray-500 mt-1 text-right">
          {currentValue.length}/{maxLength}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-red-700">
            <X className="h-4 w-4 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* AI Suggestion Panel */}
      {showSuggestion && suggestion && (
        <div className="mt-3 p-4 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-lg shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center text-primary-700">
              <Wand2 className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">
                AI Enhanced with {promptInfo.name}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Confidence Indicator */}
              <div className={`text-xs px-2 py-1 rounded-full ${
                suggestion.confidence > 0.7 
                  ? 'bg-green-100 text-green-700' 
                  : suggestion.confidence > 0.4
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {Math.round(suggestion.confidence * 100)}% confidence
              </div>
              
              <button
                onClick={dismissSuggestion}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Enhanced Content Preview */}
          <div className="mb-3">
            <div className="text-sm text-gray-600 mb-2">Enhanced version:</div>
            <div className="p-3 bg-white border border-gray-200 rounded text-sm leading-relaxed">
              {suggestion.enhanced}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {suggestion.tokensUsed} tokens used • {promptInfo.description}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={generateSuggestion}
                disabled={isLoading}
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-3 w-3 inline mr-1" />
                Regenerate
              </button>
              
              <button
                onClick={applySuggestion}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center"
              >
                <Check className="h-3 w-3 mr-1" />
                Apply
                <ArrowRight className="h-3 w-3 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggestion Hints */}
      {!showSuggestion && hasContent && !isLoading && (
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <Lightbulb className="h-3 w-3 mr-1" />
          <span>Click the sparkle icon to enhance with AI ({promptInfo.name})</span>
        </div>
      )}
    </div>
  );
}

// Specialized components for common use cases

export function SummaryEnhancer(props: Omit<InlineGPTProps, 'promptType'>) {
  return (
    <InlineGPTSuggestions
      {...props}
      promptType="atsFriendlySummaryPrompt"
      placeholder="Enter a professional summary to enhance with ATS-friendly keywords and achievements..."
    />
  );
}

export function SkillsEnhancer(props: Omit<InlineGPTProps, 'promptType'>) {
  return (
    <InlineGPTSuggestions
      {...props}
      promptType="softSkillBoosterPrompt"
      placeholder="Describe your skills and experience to extract soft skills..."
    />
  );
}

export function IndustryOptimizer(props: Omit<InlineGPTProps, 'promptType'>) {
  return (
    <InlineGPTSuggestions
      {...props}
      promptType="industryOptimizationPrompt"
      placeholder="Enter content to optimize for specific industry requirements..."
    />
  );
}

export function ToneAdjuster(props: Omit<InlineGPTProps, 'promptType'>) {
  return (
    <InlineGPTSuggestions
      {...props}
      promptType="toneAdjustmentPrompt"
      placeholder="Enter content to adjust tone for your target audience..."
    />
  );
} 