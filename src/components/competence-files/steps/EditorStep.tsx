'use client';
// Map of section titles to brand color used in preview headings
const sectionColorMap: Record<string, string> = {
  'HEADER': '#174452',
  'PROFESSIONAL SUMMARY': '#174452',
  'FUNCTIONAL SKILLS': '#174452',
  'TECHNICAL SKILLS': '#174452',
  'LANGUAGES': '#174452',
  'AREAS OF EXPERTISE': '#174452',
  'EDUCATION': '#174452',
  'CERTIFICATIONS': '#174452',
  'PROFESSIONAL EXPERIENCES SUMMARY': '#174452',
};

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { JobDescription as JDType } from '@/types';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Lexical imports
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalEditor } from 'lexical';

// Core Lexical imports  
import { 
  $createParagraphNode, 
  $createTextNode, 
  $getRoot, 
  $getSelection,
  $isRangeSelection,
  RootNode,
  TextNode,
  FORMAT_TEXT_COMMAND,
  TextFormatType
} from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { 
  $isHeadingNode,
  $isQuoteNode,
  $createHeadingNode,
  $createQuoteNode,
  HeadingTagType 
} from '@lexical/rich-text';
import { 
  $isListNode,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND
} from '@lexical/list';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';

// Rich formatting nodes
import { HeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode, $createListNode, $createListItemNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { QuoteNode } from '@lexical/rich-text';
import { CodeNode } from '@lexical/code';

// Markdown transformers for enhanced parsing
import { 
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  UNORDERED_LIST,
  ORDERED_LIST,
  QUOTE,
  HEADING,
  CODE,
  LINK
} from '@lexical/markdown';

// Icons
import { 
  ArrowLeft,
  Edit3,
  Download,
  Loader2,
  X,
  Eye,
  EyeOff,
  Sparkles,
  Plus,
  GripVertical,
  TrendingUp,
  RefreshCw,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Quote,
  Code,
  Strikethrough,
  
} from 'lucide-react';

// Store imports
import { useSegmentStore, Segment } from '@/stores/ai-generation-store';
import { EmineonInlineEditor } from '@/components/competence-files/EmineonInlineEditor';

// Editor Focus Management Plugin
function EditorFocusPlugin({ segmentId }: { segmentId: string }) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    // Store editor reference globally for focus management
    (window as any)[`lexical_editor_${segmentId}`] = editor;
    
    return () => {
      delete (window as any)[`lexical_editor_${segmentId}`];
    };
  }, [editor, segmentId]);
  
  return null;
}

// Keyboard shortcuts plugin
function KeyboardShortcutsPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'b':
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
            break;
          case 'i':
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
            break;
          case 'u':
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
            break;
          case 'k':
            event.preventDefault();
            const url = prompt('Enter URL (e.g. https://example.com):');
            if (url && url.trim()) {
              editor.dispatchCommand(TOGGLE_LINK_COMMAND, url.trim());
            }
            break;
          case 'e':
            if (event.shiftKey) {
              event.preventDefault();
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
            }
            break;
          case 'd':
            if (event.shiftKey) {
              event.preventDefault();
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
            }
            break;
        }
      }
      
      // Handle other keyboard shortcuts
      if (event.altKey || event.metaKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                const node = selection.anchor.getNode();
                const element = node.getKey() === 'root' ? node : node.getTopLevelElementOrThrow();
                const heading = $createHeadingNode('h1');
                element.replace(heading);
                heading.select();
              }
            });
            break;
          case '2':
            event.preventDefault();
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                const node = selection.anchor.getNode();
                const element = node.getKey() === 'root' ? node : node.getTopLevelElementOrThrow();
                const heading = $createHeadingNode('h2');
                element.replace(heading);
                heading.select();
              }
            });
            break;
          case '3':
            event.preventDefault();
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                const node = selection.anchor.getNode();
                const element = node.getKey() === 'root' ? node : node.getTopLevelElementOrThrow();
                const heading = $createHeadingNode('h3');
                element.replace(heading);
                heading.select();
              }
            });
            break;
        }
      }
    };

    const editorElement = editor.getRootElement();
    if (editorElement) {
      editorElement.addEventListener('keydown', handleKeyDown);
      return () => {
        editorElement.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [editor]);

  return null;
}

// Formatting Toolbar Component
function FormattingToolbar() {
  const [editor] = useLexicalComposerContext();
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [blockType, setBlockType] = useState('paragraph');

  // Update active formats based on selection
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const formats = new Set<string>();
          
          // Check text formats
          if (selection.hasFormat('bold')) formats.add('bold');
          if (selection.hasFormat('italic')) formats.add('italic');
          if (selection.hasFormat('underline')) formats.add('underline');
          if (selection.hasFormat('strikethrough')) formats.add('strikethrough');
          if (selection.hasFormat('code')) formats.add('code');
          
          setActiveFormats(formats);

          // Check block type
          const anchorNode = selection.anchor.getNode();
          const element = anchorNode.getKey() === 'root' 
            ? anchorNode 
            : anchorNode.getTopLevelElementOrThrow();
          
          if ($isHeadingNode(element)) {
            setBlockType(element.getTag());
          } else if ($isQuoteNode(element)) {
            setBlockType('quote');
          } else if ($isListNode(element)) {
            setBlockType(element.getListType() === 'bullet' ? 'ul' : 'ol');
          } else {
            setBlockType('paragraph');
          }
        }
      });
    });
  }, [editor]);

  const formatText = (format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatHeading = (headingSize: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const node = selection.anchor.getNode();
        const element = node.getKey() === 'root' 
          ? node 
          : node.getTopLevelElementOrThrow();
        
        if ($isHeadingNode(element) && element.getTag() === headingSize) {
          // Convert back to paragraph
          const paragraph = $createParagraphNode();
          element.replace(paragraph);
          paragraph.select();
        } else {
          // Convert to heading
          const heading = $createHeadingNode(headingSize);
          element.replace(heading);
          heading.select();
        }
      }
    });
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const node = selection.anchor.getNode();
        const element = node.getKey() === 'root' 
          ? node 
          : node.getTopLevelElementOrThrow();
        
        if ($isQuoteNode(element)) {
          // Convert back to paragraph
          const paragraph = $createParagraphNode();
          element.replace(paragraph);
          paragraph.select();
        } else {
          // Convert to quote
          const quote = $createQuoteNode();
          element.replace(quote);
          quote.select();
        }
      }
    });
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }
  };

  const formatList = (listType: 'ul' | 'ol') => {
    if (blockType === listType) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else if (listType === 'ul') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  return (
    <div className="flex items-center flex-wrap gap-1 p-3 border-b bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-md shadow-sm">
      {/* Text Formatting */}
      <div className="flex items-center gap-1 pr-3 border-r border-gray-300">
        <button
          onClick={() => formatText('bold')}
          className={`p-2 rounded-md transition-all duration-200 shadow-sm ${
            activeFormats.has('bold') 
              ? 'bg-blue-500 text-white shadow-md transform scale-105' 
              : 'bg-white hover:bg-blue-50 hover:text-blue-600 hover:shadow-md text-gray-700'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => formatText('italic')}
          className={`p-2 rounded-md transition-all duration-200 shadow-sm ${
            activeFormats.has('italic') 
              ? 'bg-blue-500 text-white shadow-md transform scale-105' 
              : 'bg-white hover:bg-blue-50 hover:text-blue-600 hover:shadow-md text-gray-700'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={() => formatText('underline')}
          className={`p-2 rounded-md transition-all duration-200 shadow-sm ${
            activeFormats.has('underline') 
              ? 'bg-blue-500 text-white shadow-md transform scale-105' 
              : 'bg-white hover:bg-blue-50 hover:text-blue-600 hover:shadow-md text-gray-700'
          }`}
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </button>
        <button
          onClick={() => formatText('strikethrough')}
          className={`p-2 rounded-md transition-all duration-200 shadow-sm ${
            activeFormats.has('strikethrough') 
              ? 'bg-blue-500 text-white shadow-md transform scale-105' 
              : 'bg-white hover:bg-blue-50 hover:text-blue-600 hover:shadow-md text-gray-700'
          }`}
          title="Strikethrough (Ctrl+Shift+D)"
        >
          <Strikethrough className="h-4 w-4" />
        </button>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-1 pr-3 border-r border-gray-300">
        <button
          onClick={() => formatHeading('h1')}
          className={`px-3 py-2 rounded-md text-sm font-bold transition-all duration-200 shadow-sm ${
            blockType === 'h1' 
              ? 'bg-indigo-500 text-white shadow-md transform scale-105' 
              : 'bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-md text-gray-700'
          }`}
          title="Large Heading"
        >
          H1
        </button>
        <button
          onClick={() => formatHeading('h2')}
          className={`px-3 py-2 rounded-md text-sm font-bold transition-all duration-200 shadow-sm ${
            blockType === 'h2' 
              ? 'bg-indigo-500 text-white shadow-md transform scale-105' 
              : 'bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-md text-gray-700'
          }`}
          title="Medium Heading"
        >
          H2
        </button>
        <button
          onClick={() => formatHeading('h3')}
          className={`px-3 py-2 rounded-md text-sm font-bold transition-all duration-200 shadow-sm ${
            blockType === 'h3' 
              ? 'bg-indigo-500 text-white shadow-md transform scale-105' 
              : 'bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-md text-gray-700'
          }`}
          title="Small Heading"
        >
          H3
        </button>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 pr-3 border-r border-gray-300">
        <button
          onClick={() => formatList('ul')}
          className={`p-2 rounded-md transition-all duration-200 shadow-sm ${
            blockType === 'ul' 
              ? 'bg-green-500 text-white shadow-md transform scale-105' 
              : 'bg-white hover:bg-green-50 hover:text-green-600 hover:shadow-md text-gray-700'
          }`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => formatList('ol')}
          className={`p-2 rounded-md transition-all duration-200 shadow-sm ${
            blockType === 'ol' 
              ? 'bg-green-500 text-white shadow-md transform scale-105' 
              : 'bg-white hover:bg-green-50 hover:text-green-600 hover:shadow-md text-gray-700'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>

      {/* Special Formatting */}
      <div className="flex items-center gap-1">
        <button
          onClick={formatQuote}
          className={`p-2 rounded-md transition-all duration-200 shadow-sm ${
            blockType === 'quote' 
              ? 'bg-purple-500 text-white shadow-md transform scale-105' 
              : 'bg-white hover:bg-purple-50 hover:text-purple-600 hover:shadow-md text-gray-700'
          }`}
          title="Quote Block"
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          onClick={() => formatText('code')}
          className={`p-2 rounded-md transition-all duration-200 shadow-sm ${
            activeFormats.has('code') 
              ? 'bg-orange-500 text-white shadow-md transform scale-105' 
              : 'bg-white hover:bg-orange-50 hover:text-orange-600 hover:shadow-md text-gray-700'
          }`}
          title="Inline Code (Ctrl+Shift+E)"
        >
          <Code className="h-4 w-4" />
        </button>
        <button
          onClick={insertLink}
          className="p-2 rounded-md transition-all duration-200 shadow-sm bg-white hover:bg-cyan-50 hover:text-cyan-600 hover:shadow-md text-gray-700"
          title="Insert Link (Ctrl+K)"
        >
          <Link className="h-4 w-4" />
        </button>
      </div>
      
      {/* Keyboard Shortcuts Help */}
      <div className="ml-auto pl-3 border-l border-gray-300">
        <div 
          className="px-3 py-2 text-xs text-gray-500 bg-white rounded-md shadow-sm border border-gray-200 cursor-help"
          title="⌨️ Keyboard Shortcuts:
• Ctrl+B - Bold
• Ctrl+I - Italic  
• Ctrl+U - Underline
• Ctrl+K - Link
• Ctrl+Shift+E - Code
• Ctrl+Shift+D - Strikethrough
• Alt+1/2/3 - Headings"
        >
          ⌨️ Shortcuts
        </div>
      </div>
    </div>
  );
}

// Types
interface CandidateData {
  id: string;
  fullName: string;
  currentTitle: string;
  email: string;
  phone: string;
  location: string;
  yearsOfExperience: number;
  skills: string[];
  certifications: string[];
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    responsibilities: string;
  }>;
  education: string[];
  languages: string[];
  summary: string;
}

interface JobDescription {
  text: string;
  requirements: string[];
  skills: string[];
  responsibilities: string;
  title?: string;
  company?: string;
}

interface EditorStepProps {
  selectedCandidate: CandidateData;
  selectedTemplate: 'professional' | 'professional-classic' | 'modern' | 'minimal' | 'emineon' | 'antaes';
  jobDescription: JobDescription;
  managerContact?: { name?: string; email?: string; phone?: string };
  onBack: () => void;
  onSave: () => void;
  onGenerateDocument: (format: 'pdf' | 'docx', documentSections: Array<{
    id: string;
    type: string;
    title: string;
    content: string;
    visible: boolean;
    order: number;
    editable: boolean;
  }>) => void;
  isGenerating: boolean;
  isAutoSaving: boolean;
  language: string;
  onLanguageChange: (lang: string) => void;
  competenceFileId?: string;
}

// Unused structured interfaces removed to reduce lints

// SegmentBlock Component - Individual segment with Lexical editor and structured editing
function SegmentBlock({ segment, jobDescription, selectedCandidate }: { 
  segment: Segment;
  jobDescription: JDType;
  selectedCandidate: CandidateData;
}) {
  const { segments, updateSegment, removeSegment, regenerateSegment, improveSegment, expandSegment, rewriteSegment } = useSegmentStore();
  const { getToken } = useAuth();
  
  // Local state for UI interactions
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState<'improve' | 'expand' | 'rewrite' | 'optimize' | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(segment.title);
  
  // Cleanup global content tracking variables when component unmounts
  useEffect(() => {
    return () => {
      try {
        delete (window as any)[`editorContent_${segment.id}`];
        delete (window as any)[`editorHtmlContent_${segment.id}`];
      } catch (error) {
        console.warn('Failed to cleanup global content variables:', error);
      }
    };
  }, [segment.id]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: segment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Enhanced Lexical editor configuration with rich formatting support
  const editorConfig = useMemo(() => ({
    namespace: `segment-editor-${segment.id}`,
    theme: {
      text: {
        bold: 'font-bold text-gray-900',
        italic: 'italic text-gray-800',
        strikethrough: 'line-through text-gray-600',
        underline: 'underline decoration-2 underline-offset-2',
        code: 'bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-mono text-sm border border-gray-200',
      },
      paragraph: 'mb-3 leading-relaxed text-gray-700 text-base',
      heading: {
        h1: 'text-3xl font-bold mb-6 mt-8 text-gray-900 leading-tight border-b-2 border-gray-200 pb-2',
        h2: 'text-2xl font-bold mb-4 mt-6 text-gray-900 leading-tight',
        h3: 'text-xl font-semibold mb-3 mt-5 text-gray-800 leading-snug',
        h4: 'text-lg font-semibold mb-3 mt-4 text-gray-800',
        h5: 'text-base font-semibold mb-2 mt-3 text-gray-800',
        h6: 'text-sm font-semibold mb-2 mt-3 text-gray-700 uppercase tracking-wide',
      },
      list: {
        ol: 'list-decimal list-outside ml-6 mb-4 space-y-1',
        ul: 'list-disc list-outside ml-6 mb-4 space-y-1',
      },
      listItem: 'mb-1 leading-relaxed text-gray-700 pl-1',
      quote: 'border-l-4 border-blue-400 pl-6 py-3 my-6 italic text-gray-700 bg-gray-50 rounded-r-lg relative before:content-["""] before:text-4xl before:text-blue-400 before:absolute before:-left-2 before:-top-1',
      link: 'text-blue-600 underline decoration-2 underline-offset-2 hover:text-blue-800 hover:bg-blue-50 transition-colors duration-200 rounded px-1',
      code: 'bg-gray-100 text-gray-800 px-2 py-1 rounded font-mono text-sm border border-gray-200 shadow-sm',
      root: 'leading-relaxed text-gray-700',
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      LinkNode,
      QuoteNode,
      CodeNode,
    ],
    onError: (error: Error) => {
      console.error('Lexical editor error:', error);
    },
  }), [segment.id]);

  // Enhanced content initialization with proper markdown parsing
  const ContentInitializationPlugin = () => {
    const [editor] = useLexicalComposerContext();
    const isInitializedRef = React.useRef(false);
    const lastInitializedContentRef = React.useRef<string>('');
    
    React.useEffect(() => {
      // Prefer rich HTML if present, convert to plain text for initial load
      const htmlFromSegment = (segment as any).htmlContent as string | undefined;
      const contentToCheck = htmlFromSegment ? convertHtmlToPlain(htmlFromSegment) : segment.content;

      // If we already initialized with the same content, skip
      if (isInitializedRef.current && (contentToCheck || '') === (lastInitializedContentRef.current || '')) {
        return;
      }

      // Initialize only when we have something to show or when first time
      const shouldInitialize = !isInitializedRef.current && (contentToCheck?.trim()?.length || 0) > 0;
      if (!shouldInitialize) return;

      // Try to restore saved Lexical state first
      const savedLexicalState = (typeof window !== 'undefined' && (window as any)[`editorState_${segment.id}`]) || (segment as any).lexicalState;
      if (savedLexicalState) {
        try {
          const parsed = editor.parseEditorState(savedLexicalState as any);
          editor.setEditorState(parsed);
          isInitializedRef.current = true;
          lastInitializedContentRef.current = contentToCheck || '';
          return;
        } catch (e) {
          console.warn('Failed to restore saved Lexical state, falling back to content parsing:', e);
        }
      }

      editor.update(() => {
        const root = $getRoot();
        root.clear();

        try {
          createStructuredNodesFromMarkdown(root, contentToCheck || '');
        } catch (error) {
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(contentToCheck || ''));
          root.append(paragraph);
        }

        isInitializedRef.current = true;
        lastInitializedContentRef.current = contentToCheck || '';
      });
    }, [editor, (segment as any).htmlContent, segment.content]);
    
    return null;
  };

  // Enhanced markdown-to-Lexical parser for structured content
  const createStructuredNodesFromMarkdown = (root: RootNode, content: string) => {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(''));
      root.append(paragraph);
      return;
    }

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      
      // Parse headings (##, ###, etc.)
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
        const headingText = headingMatch[2].trim();
        const heading = $createHeadingNode(`h${level}`);
        
        // Parse mixed inline formatting for headings
        const parts = parseInlineFormatting(headingText);
        parts.forEach(part => {
          const textNode = $createTextNode(part.text);
          if (part.bold) textNode.setFormat('bold');
          if (part.italic) textNode.setFormat('italic');
          if (part.strikethrough) textNode.setFormat('strikethrough');
          if (part.code) textNode.setFormat('code');
          heading.append(textNode);
        });
        
        root.append(heading);
        i++;
        continue;
      }

      // Parse standalone bold headings (**Text** on its own line)
      const boldHeadingMatch = line.match(/^\*\*(.+?)\*\*\s*$/);
      if (boldHeadingMatch && !line.includes('-') && !line.includes('•')) {
        const heading = $createHeadingNode('h3');
        const textNode = $createTextNode(boldHeadingMatch[1].trim());
        textNode.setFormat('bold');
        heading.append(textNode);
        root.append(heading);
        i++;
        continue;
      }

      // Parse lists (bullet points starting with -, •, or *)
      if (line.match(/^[-•*]\s+/)) {
        const listItems: string[] = [];
        
        // Collect consecutive list items
        while (i < lines.length && lines[i].match(/^[-•*]\s+/)) {
          const listItemText = lines[i].replace(/^[-•*]\s+/, '').trim();
          listItems.push(listItemText);
          i++;
        }
        
        // Create unordered list with enhanced formatting support
        const list = $createListNode('bullet');
        listItems.forEach(itemText => {
          const listItem = $createListItemNode();
          
          // Parse mixed inline formatting for list items
          const parts = parseInlineFormatting(itemText);
          parts.forEach(part => {
            const textNode = $createTextNode(part.text);
            if (part.bold) textNode.setFormat('bold');
            if (part.italic) textNode.setFormat('italic');
            if (part.strikethrough) textNode.setFormat('strikethrough');
            if (part.code) textNode.setFormat('code');
            listItem.append(textNode);
          });
          
          list.append(listItem);
        });
        root.append(list);
        continue;
      }

      // Parse numbered lists (1., 2., etc.)
      if (line.match(/^\d+\.\s+/)) {
        const listItems: string[] = [];
        
        // Collect consecutive numbered items
        while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
          const listItemText = lines[i].replace(/^\d+\.\s+/, '').trim();
          listItems.push(listItemText);
          i++;
        }
        
        // Create ordered list with enhanced formatting support
        const list = $createListNode('number');
        listItems.forEach(itemText => {
          const listItem = $createListItemNode();
          
          // Parse mixed inline formatting for list items
          const parts = parseInlineFormatting(itemText);
          parts.forEach(part => {
            const textNode = $createTextNode(part.text);
            if (part.bold) textNode.setFormat('bold');
            if (part.italic) textNode.setFormat('italic');
            if (part.strikethrough) textNode.setFormat('strikethrough');
            if (part.code) textNode.setFormat('code');
            listItem.append(textNode);
          });
          
          list.append(listItem);
        });
        root.append(list);
        continue;
      }

      // Parse quotes (lines starting with >)
      if (line.startsWith('>')) {
        const quoteText = line.replace(/^>\s*/, '').trim();
        const quote = $createQuoteNode();
        
        // Parse mixed inline formatting for quotes
        const parts = parseInlineFormatting(quoteText);
        parts.forEach(part => {
          const textNode = $createTextNode(part.text);
          if (part.bold) textNode.setFormat('bold');
          if (part.italic) textNode.setFormat('italic');
          if (part.strikethrough) textNode.setFormat('strikethrough');
          if (part.code) textNode.setFormat('code');
          quote.append(textNode);
        });
        
        root.append(quote);
        i++;
        continue;
      }

      // Skip empty lines
      if (line.trim() === '') {
        i++;
        continue;
      }

      // Regular paragraph with mixed inline formatting
      const paragraph = createFormattedParagraph(line);
      root.append(paragraph);
      i++;
    }
  };

  // Convert basic HTML to plain text with simple markdown-like bullets and headings
  const convertHtmlToPlain = (html: string): string => {
    if (!html) return '';
    let text = html;
    // Line breaks
    text = text.replace(/<br\s*\/?>(\s*)/gi, '\n');
    // List items
    text = text.replace(/<li[^>]*>/gi, '- ');
    text = text.replace(/<\/li>/gi, '\n');
    // Headings -> markdown-ish
    text = text.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, (_m, p1) => `\n\n## ${p1}\n\n`);
    // Paragraphs
    text = text.replace(/<p[^>]*>/gi, '');
    text = text.replace(/<\/p>/gi, '\n\n');
    // Strong/emphasis -> keep text
    text = text.replace(/<\/?(strong|b|em|i)[^>]*>/gi, '');
    // Remove remaining tags
    text = text.replace(/<[^>]+>/g, '');
    // Collapse excessive newlines
    text = text.replace(/\n{3,}/g, '\n\n').trim();
    return text;
  };

  // Enhanced helper function to create text nodes with proper inline formatting
  const createFormattedTextNode = (text: string): TextNode => {
    // Simple case: if no formatting markers, return plain text
    if (!text.includes('**') && !text.includes('*') && !text.includes('_') && !text.includes('~~') && !text.includes('`')) {
      return $createTextNode(text);
    }

    // Handle the most common case: **Bold Text** (entire text is bold)
    const fullBoldMatch = text.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (fullBoldMatch) {
      const cleanText = fullBoldMatch[1].trim();
      const textNode = $createTextNode(cleanText);
      textNode.setFormat('bold');
      return textNode;
    }

    // Handle italic text: *Italic Text* (but not **bold**)
    const fullItalicMatch = text.match(/^\*(.+?)\*$/) && !text.includes('**');
    if (fullItalicMatch) {
      const cleanText = text.replace(/^\*(.+?)\*$/, '$1');
      const textNode = $createTextNode(cleanText);
      textNode.setFormat('italic');
      return textNode;
    }

    // Handle underscore italic: _Italic Text_
    const underscoreItalicMatch = text.match(/^_(.+?)_$/);
    if (underscoreItalicMatch) {
      const cleanText = underscoreItalicMatch[1];
      const textNode = $createTextNode(cleanText);
      textNode.setFormat('italic');
      return textNode;
    }

    // Handle strikethrough: ~~Text~~
    const strikethroughMatch = text.match(/^~~(.+?)~~$/);
    if (strikethroughMatch) {
      const cleanText = strikethroughMatch[1];
      const textNode = $createTextNode(cleanText);
      textNode.setFormat('strikethrough');
      return textNode;
    }

    // Handle inline code: `code`
    const codeMatch = text.match(/^`(.+?)`$/);
    if (codeMatch) {
      const cleanText = codeMatch[1];
      const textNode = $createTextNode(cleanText);
      textNode.setFormat('code');
      return textNode;
    }

    // For mixed formatting, we need to return a plain text node
    // The paragraph will handle mixed formatting by creating multiple text nodes
    let cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold markers
      .replace(/\*(.*?)\*/g, '$1')      // Remove italic markers
      .replace(/_(.*?)_/g, '$1')        // Remove underscore markers
      .replace(/~~(.*?)~~/g, '$1')      // Remove strikethrough markers
      .replace(/`(.*?)`/g, '$1');       // Remove code markers

    return $createTextNode(cleanText);
  };

  // Enhanced helper function to create a paragraph with mixed inline formatting
  const createFormattedParagraph = (text: string) => {
    const paragraph = $createParagraphNode();
    
    if (!text.includes('**') && !text.includes('*') && !text.includes('_') && !text.includes('~~') && !text.includes('`')) {
      paragraph.append($createTextNode(text));
      return paragraph;
    }

    // Parse mixed inline formatting
    const parts = parseInlineFormatting(text);
    parts.forEach(part => {
      const textNode = $createTextNode(part.text);
      if (part.bold) textNode.setFormat('bold');
      if (part.italic) textNode.setFormat('italic');
      if (part.strikethrough) textNode.setFormat('strikethrough');
      if (part.code) textNode.setFormat('code');
      paragraph.append(textNode);
    });

    return paragraph;
  };

  // Parse text with mixed inline formatting into parts
  const parseInlineFormatting = (text: string) => {
    const parts: Array<{
      text: string;
      bold?: boolean;
      italic?: boolean;
      strikethrough?: boolean;
      code?: boolean;
    }> = [];

    let currentIndex = 0;
    
    while (currentIndex < text.length) {
      // Find the next formatting marker
      const boldMatch = text.indexOf('**', currentIndex);
      const italicMatch = text.indexOf('*', currentIndex);
      const strikeMatch = text.indexOf('~~', currentIndex);
      const codeMatch = text.indexOf('`', currentIndex);
      
      // Get the nearest formatting marker
      const markers = [
        { type: 'bold', index: boldMatch, length: 2 },
        { type: 'italic', index: italicMatch === boldMatch ? -1 : italicMatch, length: 1 },
        { type: 'strike', index: strikeMatch, length: 2 },
        { type: 'code', index: codeMatch, length: 1 }
      ].filter(m => m.index >= 0).sort((a, b) => a.index - b.index);

      if (markers.length === 0) {
        // No more formatting, add rest as plain text
        if (currentIndex < text.length) {
          parts.push({ text: text.substring(currentIndex) });
        }
        break;
      }

      const nextMarker = markers[0];
      
      // Add any plain text before the marker
      if (nextMarker.index > currentIndex) {
        parts.push({ text: text.substring(currentIndex, nextMarker.index) });
      }

      // Find the closing marker
      const openMarker = nextMarker.type === 'bold' ? '**' :
                        nextMarker.type === 'italic' ? '*' :
                        nextMarker.type === 'strike' ? '~~' : '`';

      const closeIndex = text.indexOf(openMarker, nextMarker.index + nextMarker.length);
      
      if (closeIndex === -1) {
        // No closing marker, treat as plain text
        parts.push({ text: text.substring(nextMarker.index) });
        break;
      }

      // Extract formatted text
      const formattedText = text.substring(nextMarker.index + nextMarker.length, closeIndex);
      const formatProps: any = { text: formattedText };
      
      if (nextMarker.type === 'bold') formatProps.bold = true;
      else if (nextMarker.type === 'italic') formatProps.italic = true;
      else if (nextMarker.type === 'strike') formatProps.strikethrough = true;
      else if (nextMarker.type === 'code') formatProps.code = true;
      
      parts.push(formatProps);
      
      currentIndex = closeIndex + nextMarker.length;
    }

    return parts;
  };

  // Simplified OnChange plugin for basic content tracking only
  const handleContentChange = (editorState: any, editor: LexicalEditor) => {
    editorState.read(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();
      // Store plain text for search, but also store HTML for preview
      (window as any)[`editorContent_${segment.id}`] = textContent;
      // Store HTML content for sync
      const htmlContent = $generateHtmlFromNodes(editor, null);
      (window as any)[`editorHtmlContent_${segment.id}`] = htmlContent;
    });
    // Persist full Lexical state locally to preserve formatting on sync
    try {
      const serialized = editorState.toJSON();
      (window as any)[`editorState_${segment.id}`] = serialized;
      // Do NOT update the store here to avoid re-render loops
    } catch (e) {
      console.warn('Failed to serialize editor state for segment', segment.id, e);
    }
  };

  // Function to get current content from Lexical editor (simplified)
  const getCurrentEditorContent = (): string => {
    try {
      const textContent = (window as any)[`editorContent_${segment.id}`];
      return textContent || segment.content;
      } catch (error) {
      console.error('Failed to get current editor content:', error);
      return segment.content;
      }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      // Prefer queued, durable generation for robustness
      const enqueueRes = await fetch('/api/ai/queue/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ai_optimize',
          payload: {
            segmentType: segment.type,
            candidateId: selectedCandidate.id,
            language: (jobDescription as any)?.language,
            order: segment.order,
          },
        }),
      });
      if (!enqueueRes.ok) {
        throw new Error(`enqueue_failed ${enqueueRes.status}`);
      }
      const { jobId } = await enqueueRes.json();
      if (!jobId) throw new Error('No jobId returned');

      // Poll status until completion
      const start = Date.now();
      const timeoutMs = 120000; // 2 minutes
      let lastStatus = '' as any;
      while (Date.now() - start < timeoutMs) {
        const statusRes = await fetch(`/api/ai/queue/status?id=${encodeURIComponent(jobId)}`);
        if (statusRes.ok) {
          const statusJson = await statusRes.json();
          lastStatus = statusJson.status;
          if (statusJson.status === 'completed') {
            const result = statusJson.result || {};
            const content = result?.content || result?.data?.content || result?.htmlContent || '';
            updateSegment(segment.id, { content: content || segment.content, status: 'done' });
            return;
          }
          if (statusJson.status === 'failed') {
            updateSegment(segment.id, { status: 'error' });
            throw new Error(statusJson.error || 'Segment generation failed');
          }
        }
        await new Promise((r) => setTimeout(r, 900));
      }
      throw new Error('Segment generation timed out');
    } catch (error) {
      console.error('Failed to regenerate segment:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const [applyKey, setApplyKey] = useState(0);
  const applyContentRef = React.useRef<string>('');

  // Plugin to programmatically apply plain content into Lexical editor after enhancements
  const ExternalApplyPlugin = ({ triggerKey }: { triggerKey: number }) => {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
      if (!triggerKey) return;
      const content = applyContentRef.current || '';
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        if (content && content.trim()) {
          try {
            createStructuredNodesFromMarkdown(root, content);
          } catch {
            const paragraph = $createParagraphNode();
            paragraph.append($createTextNode(content));
            root.append(paragraph);
          }
        } else {
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(''));
          root.append(paragraph);
        }
      });
    }, [triggerKey, editor]);
    return null;
  };

  const handleEnhance = async (action: 'improve' | 'expand' | 'rewrite' | 'optimize') => {
    setIsEnhancing(action);
    try {
      // Get current content from the editor
      const currentContent = getCurrentEditorContent();
      const htmlContent = (window as any)[`editorHtmlContent_${segment.id}`] || '';
      
      console.log(`🎨 Enhancing segment ${segment.title} with action: ${action}`);
      console.log(`📝 Current content length: ${currentContent?.length || 0} chars`);
      console.log(`🔧 Current HTML content length: ${htmlContent?.length || 0} chars`);
      
      // Update the segment with the latest editor content prior to enhancement (editor only)
      updateSegment(segment.id, { 
        content: currentContent || segment.content
      });
      
      // Call the appropriate enhancement function based on action with current content
      switch (action) {
        case 'improve':
          await improveSegmentWithContent(segment.id, { ...(jobDescription as any) } as any, selectedCandidate, currentContent || segment.content, htmlContent);
          break;
        case 'expand':
          await expandSegmentWithContent(segment.id, { ...(jobDescription as any) } as any, selectedCandidate, currentContent || segment.content, htmlContent);
          break;
        case 'rewrite':
          await rewriteSegmentWithContent(segment.id, { ...(jobDescription as any) } as any, selectedCandidate, currentContent || segment.content, htmlContent);
          break;
        case 'optimize':
          await optimizeSegmentWithContent(segment.id, { ...(jobDescription as any) } as any, selectedCandidate, currentContent || segment.content, htmlContent);
          break;
        default:
          throw new Error(`Unknown enhancement action: ${action}`);
      }
    } catch (error) {
      console.error('Failed to enhance segment:', error);
    } finally {
      setIsEnhancing(null);
    }
  };

  // Enhanced segment functions that pass current content
  const improveSegmentWithContent = async (segmentId: string, jobData: any, candidateData: any, existingContent: string, existingHtml?: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;
    
    updateSegment(segmentId, { status: 'loading' });
    
    try {
      const response = await fetch('/api/openai-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segmentType: segment.type,
          candidateData,
          jobDescription: jobData,
          existingContent,
          existingHtml,
          enhancementAction: 'improve',
          order: segment.order,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
  
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Enhancement failed');
      }
  
      // Apply resulting content to the Lexical editor for this segment
      applyContentRef.current = convertHtmlToPlain(data.htmlContent || data.content || '');
      setApplyKey(k => k + 1);
      // Only update editor content; preview (htmlContent) should be synced explicitly via Sync Preview
      updateSegment(segmentId, {
        content: applyContentRef.current,
        status: 'done',
      });
    } catch (error) {
      console.error(`Failed to improve ${segment.title}:`, error);
      updateSegment(segmentId, { status: 'error' });
      throw error;
    }
  };

  const expandSegmentWithContent = async (segmentId: string, jobData: any, candidateData: any, existingContent: string, existingHtml?: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;
    
    updateSegment(segmentId, { status: 'loading' });
    
    try {
      const response = await fetch('/api/openai-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segmentType: segment.type,
          candidateData,
          jobDescription: jobData,
          existingContent,
          existingHtml,
          enhancementAction: 'expand',
          order: segment.order,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Enhancement failed');
      }

      // Apply resulting content to the Lexical editor for this segment
      applyContentRef.current = convertHtmlToPlain(data.htmlContent || data.content || '');
      setApplyKey(k => k + 1);
      // Only update editor content; preview (htmlContent) should be synced explicitly via Sync Preview
      updateSegment(segmentId, {
        content: applyContentRef.current,
        status: 'done',
      });
    } catch (error) {
      console.error(`Failed to expand ${segment.title}:`, error);
      updateSegment(segmentId, { status: 'error' });
      throw error;
    }
  };

  const rewriteSegmentWithContent = async (segmentId: string, jobData: any, candidateData: any, existingContent: string, existingHtml?: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;
    
    updateSegment(segmentId, { status: 'loading' });
    
    try {
      const response = await fetch('/api/openai-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segmentType: segment.type,
          candidateData,
          jobDescription: jobData,
          existingContent,
          existingHtml,
          enhancementAction: 'rewrite',
          order: segment.order,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Enhancement failed');
      }

      // Apply resulting content to the Lexical editor for this segment
      applyContentRef.current = convertHtmlToPlain(data.htmlContent || data.content || '');
      setApplyKey(k => k + 1);
      updateSegment(segmentId, {
        content: applyContentRef.current,
        htmlContent: data.htmlContent || (window as any)[`editorHtmlContent_${segmentId}`] || undefined,
        status: 'done',
      });
    } catch (error) {
      console.error(`Failed to rewrite ${segment.title}:`, error);
      updateSegment(segmentId, { status: 'error' });
      throw error;
    }
  };

  const optimizeSegmentWithContent = async (segmentId: string, jobData: any, candidateData: any, existingContent: string, existingHtml?: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;

    updateSegment(segmentId, { status: 'loading' });

    try {
      const isKnowledge = segment.type.startsWith('K_');
      const body: any = {
        segmentType: segment.type,
        order: segment.order,
        enhancementAction: 'optimize',
        existingContent,
      };
      if (isKnowledge) {
        body.knowledgeData = { text: (jobDescription as any)?.text || (jobDescription as any) || '' };
      } else {
        body.candidateData = candidateData;
        body.jobDescription = jobData;
      } // end else not loading

      const response = await fetch('/api/openai-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Optimization failed');
      }

      // Apply optimized content to the Lexical editor for this segment
      applyContentRef.current = convertHtmlToPlain(data.htmlContent || data.content || '');
      setApplyKey(k => k + 1);
      updateSegment(segmentId, {
        content: applyContentRef.current,
        status: 'done',
      });
    } catch (error) {
      console.error(`Failed to optimize ${segment.title}:`, error);
      updateSegment(segmentId, { status: 'error' });
      throw error;
    }
  };

  const handleTitleSave = () => {
    updateSegment(segment.id, { title: tempTitle });
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTempTitle(segment.title);
    setIsEditingTitle(false);
  };

  const toggleVisibility = () => {
    updateSegment(segment.id, { visible: !segment.visible });
    
    // Also adjust heights for smooth UX
    const segmentElement = document.querySelector(`[data-segment-id="${segment.id}"]`);
    if (segmentElement) {
      if (!segment.visible) {
        // Becoming visible
        segmentElement.classList.add('transition-all', 'duration-300', 'ease-in-out');
      } else {
        // Becoming hidden
        segmentElement.classList.add('transition-all', 'duration-300', 'ease-in-out');
      }
    }
  };

  const toggleEditorFullscreen = () => {
    // This will be handled by the parent EditorStep component
  };

  const togglePreviewFullscreen = () => {
    // This will be handled by the parent EditorStep component
  };

  // Add keyboard shortcuts for fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'e') {
          event.preventDefault();
          toggleEditorFullscreen();
        } else if (event.key === 'p') {
          event.preventDefault();
          togglePreviewFullscreen();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white border rounded-lg p-4 shadow-sm transition-opacity ${
        !segment.visible ? 'opacity-50' : ''
      }`}
    >
      {/* Segment Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div 
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          
          {isEditingTitle ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                className="px-2 py-1 border rounded text-sm font-semibold"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') handleTitleCancel();
                }}
                autoFocus
              />
              <Button size="sm" onClick={handleTitleSave}>Save</Button>
              <Button variant="outline" size="sm" onClick={handleTitleCancel}>Cancel</Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">{segment.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingTitle(true)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Segment Toolbar */}
        <div className="flex items-center space-x-2">
          {/* Enhancement Buttons - Only show if content exists */}
          {segment.content && segment.content.trim() && segment.status !== 'loading' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEnhance('improve')}
                disabled={isEnhancing === 'improve'}
                className="bg-green-50 border-green-200 hover:bg-green-100"
              >
                {isEnhancing === 'improve' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                )}
                Improve
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEnhance('expand')}
                disabled={isEnhancing === 'expand'}
                className="bg-blue-50 border-blue-200 hover:bg-blue-100"
              >
                {isEnhancing === 'expand' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Plus className="h-4 w-4 mr-1 text-blue-600" />
                )}
                Expand
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEnhance('rewrite')}
                disabled={isEnhancing === 'rewrite'}
                className="bg-purple-50 border-purple-200 hover:bg-purple-100"
              >
                {isEnhancing === 'rewrite' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1 text-purple-600" />
                )}
                Rewrite
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEnhance('optimize')}
                disabled={isEnhancing === 'optimize'}
                className="bg-amber-50 border-amber-200 hover:bg-amber-100"
              >
                {isEnhancing === 'optimize' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1 text-amber-600" />
                )}
                Optimize
              </Button>
            </>
          )}
          
          {/* Generate button for empty segments */}
          {(!segment.content || segment.content.trim() === '' || segment.status === 'error') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isRegenerating || segment.status === 'loading'}
              className="bg-blue-50 border-blue-200 hover:bg-blue-100"
            >
              {isRegenerating || segment.status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1 text-blue-600" />
              )}
              Generate
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleVisibility();
            }}
          >
            {segment.visible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Status indicator */}
      {segment.status === 'loading' && (
        <div className="mb-3 flex items-center space-x-2 text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Generating content...</span>
        </div>
      )}

      {segment.status === 'error' && (
        <div className="mb-3 flex items-center space-x-2 text-red-600">
          <span className="text-xs">⚠️ Generation failed. Try regenerating.</span>
        </div>
      )}

      {/* Content Editor - Only Lexical Rich Text Editor */}
      {segment.visible && (
        <>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700 truncate">{segment.title}</h4>
          <button
            onClick={() => {
              if (confirm(`Delete section "${segment.title}"? This cannot be undone.`)) {
                removeSegment(segment.id);
              }
            }}
            className="text-red-600 text-xs hover:underline"
            title="Delete section"
          >
            Delete
          </button>
        </div>
        <LexicalComposer initialConfig={editorConfig} key={segment.id}>
          <div className="relative">
            {/* Formatting Toolbar */}
            <FormattingToolbar />
            
            <RichTextPlugin
              contentEditable={
                <ContentEditable 
                  className="min-h-[200px] p-6 border border-t-0 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 prose prose-lg max-w-none text-base leading-relaxed bg-white transition-shadow duration-200 hover:shadow-sm cursor-text" 
                />
              }
              ErrorBoundary={() => <div className="p-4 text-red-600 bg-red-50 rounded border border-red-200">Something went wrong with the editor!</div>}
            />
            
            {/* Rich Formatting Plugins */}
            <ListPlugin />
            <LinkPlugin />
            <TabIndentationPlugin />
            {/* Removed AutoFocusPlugin to prevent cursor interference */}
            <MarkdownShortcutPlugin 
              transformers={[
                HEADING,
                BOLD_STAR,
                BOLD_UNDERSCORE,
                ITALIC_STAR,
                ITALIC_UNDERSCORE,
                STRIKETHROUGH,
                UNORDERED_LIST,
                ORDERED_LIST,
                QUOTE,
                CODE,
                LINK
              ]} 
            />
            
            {/* Core Plugins */}
            <OnChangePlugin onChange={(editorState, editor) => handleContentChange(editorState, editor)} />
            <HistoryPlugin />
            <KeyboardShortcutsPlugin />
            <ContentInitializationPlugin />
            <ExternalApplyPlugin triggerKey={applyKey} />
            
            {/* Editor Focus Management Plugin */}
            <EditorFocusPlugin segmentId={segment.id} />
          </div>
        </LexicalComposer>
        </>
      )}
    </div>
  );
}

// Live Preview Component
function LivePreview({ 
  segments, 
  selectedCandidate, 
  selectedTemplate, 
  managerContact,
  zoomLevel, 
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onToggleFullscreen,
  fullscreenMode,
  className = '',
  updateSegment,
  previewFont,
  previewFontSize,
  previewSyncKey,
  setPreviewSyncKey,
  previewHTMLRef,
  segmentsLoading
}: {
  segments: Segment[];
  selectedCandidate: CandidateData;
  selectedTemplate: string;
  managerContact?: { name?: string; email?: string; phone?: string };
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onToggleFullscreen: () => void;
  fullscreenMode: 'none' | 'editor' | 'preview' | 'both';
  className?: string;
  updateSegment: (id: string, data: Partial<Segment>) => void;
  previewFont: string;
  previewFontSize: number;
  previewSyncKey: number;
  setPreviewSyncKey: React.Dispatch<React.SetStateAction<number>>;
  previewHTMLRef: React.MutableRefObject<string>;
  segmentsLoading: boolean;
}) {
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Add sync state management
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [previewNeedsSync, setPreviewNeedsSync] = useState(false);
  const [isManualSync, setIsManualSync] = useState(false);

  // Function to handle manual sync
  const handleSyncPreview = useCallback(() => {
    // For each segment, pull the latest content captured by OnChangePlugin
    segments.forEach((segment) => {
      const latestContent =
        typeof window !== 'undefined' && (window as any)[`editorContent_${segment.id}`]
          ? (window as any)[`editorContent_${segment.id}`]
          : segment.content;
      const latestHtml =
        typeof window !== 'undefined' && (window as any)[`editorHtmlContent_${segment.id}`]
          ? (window as any)[`editorHtmlContent_${segment.id}`]
          : '';
      const latestState =
        typeof window !== 'undefined' && (window as any)[`editorState_${segment.id}`]
          ? (window as any)[`editorState_${segment.id}`]
          : undefined;

      // Clean HTML: compute if effectively empty
      const cleanedHtml = (latestHtml || '')
        .replace(/<br\s*\/?>(\s*)/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      // If text changed, prefer regenerating preview from plain text (force formatter path)
      const textChanged = (latestContent || '') !== (segment.content || '');
      const finalHtml = textChanged ? '' : (cleanedHtml.length === 0 ? '' : latestHtml);

      // Always persist BOTH plain text and rich HTML so preview reflects deletions
      updateSegment(segment.id, {
        content: latestContent || '',
        htmlContent: finalHtml,
        ...(latestState ? { lexicalState: latestState } : {}),
      } as Partial<Segment>);
    });
    // Trigger preview refresh (force iframe re-render) and reset sync indicators
    setPreviewSyncKey((k) => k + 1);
    // Also bump a unique query param to avoid browser caching
    previewHTMLRef.current = (previewHTMLRef.current || '') + `<!-- sync:${Date.now()} -->`;
    setPreviewNeedsSync(false);
    setLastSyncTime(new Date());
  }, [segments, updateSegment]);

  // Function to mark preview as needing sync when segments change
  useEffect(() => {
    if (lastSyncTime) {
      setPreviewNeedsSync(true);
    }
  }, [segments]);

  // Emineon-styled Sync Button Component
  const SyncButton = () => (
    <button
      onClick={handleSyncPreview}
      className={`flex items-center px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
        previewNeedsSync
          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:from-orange-600 hover:to-orange-700 transform hover:scale-105'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${isManualSync ? 'opacity-60 cursor-not-allowed' : ''}`}
      title={previewNeedsSync ? 'Preview is outdated - Click to sync' : 'Preview is up to date'}
      disabled={isManualSync}
    >
      {isManualSync ? (
        <>
          <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
          Syncing...
        </>
      ) : (
        <>
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sync Preview
        </>
      )}
    </button>
  );

  // Professional experience parser
  const parseExperienceContent = (content: string) => {
    if (!content) return null;
    
    // Extract company and role from patterns like "**Company** - Role" or "**Company - Role**"
    const companyRoleMatch = content.match(/\*\*(.*?)\*\*\s*-\s*(.*?)(?:\n|$)/);
    
    // Extract dates from patterns like "2021-07 - 2023-09"
    const dateMatch = content.match(/(\d{4}-\d{2})\s*-\s*(\d{4}-\d{2}|\w+)/);
    
    // Extract responsibilities (lines starting with •, -, or bullets)
    const responsibilities = content
      .split('\n')
      .filter(line => line.trim().match(/^[•\-\*]\s/))
      .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
      .filter(line => line.length > 0);

    // Extract achievements or key points
    const achievements = content
      .split('\n')
      .filter(line => line.includes('**') && !line.includes(' - ') && line.length > 10)
      .map(line => line.replace(/\*\*/g, '').trim())
      .filter(line => line.length > 0);

    return {
      company: companyRoleMatch?.[1]?.trim() || '',
      role: companyRoleMatch?.[2]?.trim() || '',
      dates: dateMatch ? `${dateMatch[1]} - ${dateMatch[2]}` : '',
      responsibilities,
      achievements,
      rawContent: content
    };
  };

  // Skills formatter for beautiful tags
  const formatSkillsContent = (content: string): string => {
    if (!content) return '';
    
    // Parse skills by categories
    const lines = content.split('\n').filter(line => line.trim());
    let formattedHTML = '<div class="skills-grid space-y-6">';
    
    let currentCategory = '';
    let currentSkills: string[] = [];
    
    lines.forEach(line => {
      // Check if it's a category header (bold text)
      const categoryMatch = line.match(/\*\*(.*?)\*\*/);
      if (categoryMatch) {
        // If we have previous skills, add them
        if (currentCategory && currentSkills.length > 0) {
          formattedHTML += formatSkillCategory(currentCategory, currentSkills);
        }
        currentCategory = categoryMatch[1].trim();
        currentSkills = [];
      } else if (line.trim() && currentCategory) {
        // Extract skills from bullet points
        const skillsText = line.replace(/^[•\-\*]\s*/, '').trim();
        if (skillsText) {
          // Split by commas or semicolons
          const skills = skillsText.split(/[,;]/).map(s => s.trim()).filter(s => s);
          currentSkills.push(...skills);
        }
      }
    });
    
    // Add final category
    if (currentCategory && currentSkills.length > 0) {
      formattedHTML += formatSkillCategory(currentCategory, currentSkills);
    }
    
    formattedHTML += '</div>';
    return formattedHTML;
  };

  const formatSkillCategory = (category: string, skills: string[]): string => {
    return `
      <div class="skill-category mb-6">
        <h4 class="text-lg font-semibold text-gray-800 mb-3">${category}</h4>
        <div class="flex flex-wrap gap-2">
          ${skills.map(skill => `
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
              ${skill}
            </span>
          `).join('')}
        </div>
      </div>
    `;
  };

  // Format TECHNICAL EXPERTISE like the editor: category headings in bold, bullet items normal
  const formatTechnicalSectionPreview = (content: string): string => {
    if (!content) return '';
    const cleaned = content
      .replace(/<[^>]+>/g, ' ')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`{1,3}/g, '')
      .replace(/\*{1,2}\s*$/gm, '')
      .replace(/^\s*\*\s*/gm, '') // Remove leading asterisks
      .trim();
    
    const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let html = '';
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (!line || line === '*' || line === '**') continue;
      
      // Check if line is a bullet item first (starts with bullet marker)
      if (line.match(/^[-•*]\s/)) {
        if (!inList) {
          html += '<ul class="preview-ul">';
          inList = true;
        }
        
        // Clean bullet and REMOVE any bold formatting from items - bullet points should be normal text
        const item = line
          .replace(/^[-•*]\s*/, '')
          .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold from bullet items
          .replace(/\*(.+?)\*/g, '$1') // Remove italic from bullet items
          .replace(/\*+/g, '') // Remove any remaining asterisks
          .trim();
        if (item && item !== '*' && item !== '**') {
          html += `<li class="preview-li">${item}</li>`;
        }
      }
      // Check if line is a category heading (not starting with bullet, contains text)
      else if (!line.match(/^[-•*]\s/) && line.length > 1) {
        // Close any open list
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        
        // Format as bold heading - titles SHOULD be bold
        let heading = line.replace(/:$/, '').trim();
        // If it already has ** around it, extract and make bold
        if (heading.includes('**')) {
          heading = heading.replace(/\*\*(.+?)\*\*/g, '$1');
        }
        // Remove any remaining asterisks and make it bold
        heading = heading.replace(/\*+/g, '').trim();
        if (heading) {
          html += `<h3 class="preview-h3">${heading}</h3>`;
        }
      }
    }
    
    // Close any remaining list
    if (inList) {
      html += '</ul>';
    }
    
    return html;
  };

  const formatRegularContent = (content: string, sectionTitle?: string): string => {
    if (!content) return '';
    const lines = content.split(/\r?\n/);
    let html = '';
    let inList = false;
    const treatAsBullets = sectionTitle && (
      sectionTitle.toUpperCase().includes('FUNCTIONAL SKILLS') ||
      sectionTitle.toUpperCase().includes('PROFESSIONAL CERTIFICATIONS')
    );
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      // Bold (**text**)
      line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Headings
      if (/^##\s+/.test(line)) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h2 class="preview-h2">${line.replace(/^##\s+/, '')}</h2>`;
        continue;
      }
      if (/^###\s+/.test(line)) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h3 class="preview-h3">${line.replace(/^###\s+/, '')}</h3>`;
        continue;
      }
      // Date line (e.g., 2018-11 - 2024-06)
      if (/^\d{4}-\d{2}\s*-\s*\d{4}-\d{2}$/.test(line)) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<div class="preview-date-line">${line}</div>`;
        continue;
      }
      // Bullet points (always for FUNCTIONAL SKILLS and PROFESSIONAL CERTIFICATIONS, or for any section)
      if (/^[-•*]\s*/.test(line)) {
        const cleaned = line.replace(/^[-•*]\s*/, '').trim();
        // Skip empty or stray asterisk-only items
        if (!cleaned || cleaned === '*' || cleaned === '**' || cleaned.replace(/[\.-–—\s]/g, '').length === 0) {
          continue;
        }
        if (!inList) { html += '<ul class="preview-ul">'; inList = true; }
        html += `<li class="preview-li">${cleaned}</li>`;
        continue;
      }
      // For FUNCTIONAL SKILLS and PROFESSIONAL CERTIFICATIONS, treat lines that are not headings or bullets as paragraph
      if (treatAsBullets) {
        if (inList) { html += '</ul>'; inList = false; }
        if (line) html += `<p class="preview-p">${line}</p>`;
        continue;
      }
      // For other sections, treat as paragraph if not empty
      if (inList) { html += '</ul>'; inList = false; }
      if (line) html += `<p class="preview-p">${line}</p>`;
    }
    if (inList) html += '</ul>';
    return html;
  };

  // Format a PROFESSIONAL EXPERIENCE block into neatly spaced sections with yellow bullets
  const formatProfessionalExperiencePreview = (content: string): string => {
    if (!content) return '';
    // Preserve text but strip HTML tags for parsing; keep bullet characters
    const text = content
      .replace(/<[^>]+>/g, ' ') // remove HTML tags
      .replace(/```[\s\S]*?```/g, ' ') // remove markdown code fences blocks
      .replace(/`{1,3}/g, '') // remove stray backticks
      .replace(/\*\s+•/g, '•') // remove asterisk before bullet
      .replace(/^\s*\*\s*/gm, '') // remove leading asterisk
      .replace(/\s+/g, ' ')    // collapse whitespace
      .trim();

    // Case-insensitive anchors
    const patterns: { label: string; regex: RegExp }[] = [
      { label: 'Key Responsibilities', regex: /key\s+responsibilities\s*:?/i },
      { label: 'Achievements & Impact', regex: /achievements\s*&\s*impact\s*:?/i },
      { label: 'Technical Environment', regex: /technical\s+environment\s*:?/i },
    ];
    const indices: { label: string; start: number; matchLen: number }[] = [];
    for (const p of patterns) {
      const m = p.regex.exec(text);
      if (m && typeof m.index === 'number') {
        indices.push({ label: p.label, start: m.index, matchLen: m[0].length });
      }
    }

    // Header part is text before the first known section (company - role dates)
    const firstIdx = indices.length ? Math.min(...indices.map(s => s.start)) : -1;
    const headerPart = firstIdx > -1 ? text.slice(0, firstIdx).trim() : text;

    // Build HTML
    let html = '';
    if (headerPart) {
      // Parse company name, job title, and dates from header
      let headerText = headerPart
        .replace(/\*{3,}/g, '') // Remove multiple asterisks
        .replace(/\*{1,2}$/g, '') // Remove trailing asterisks
        .replace(/^\*+\s*/, '') // Remove leading asterisks
        .replace(/\s+\*+\s*$/, '') // Remove trailing asterisks with spaces
        .trim();
      
      // Parse company, job title, and dates - always put dates under job title
      let company = '';
      let jobTitle = '';
      let extractedDates = '';
      
      // First extract dates from anywhere in the text
      const dateMatch = headerText.match(/(\d{4}-\d{2}\s*-\s*\d{4}-\d{2})/);
      if (dateMatch) {
        extractedDates = dateMatch[1].trim();
        // Remove dates from text for parsing company/title
        headerText = headerText.replace(dateMatch[0], '').trim();
      }
      
      // Now parse company and job title from remaining text
      const companyJobMatch = headerText.match(/(?:\*\*(.+?)\*\*|^(.+?))\s*-\s*(.+?)$/);
      
      if (companyJobMatch) {
        company = (companyJobMatch[1] || companyJobMatch[2] || '').replace(/\*+/g, '').trim();
        jobTitle = (companyJobMatch[3] || '').replace(/\*+/g, '').trim();
      } else {
        // If no dash, treat whole thing as company name
        company = headerText.replace(/\*+/g, '').trim();
      }
      
      // Format as: Bold Company Name (h3), Job Title (normal), Dates under job title
      if (company) {
        html += `<h3 class="preview-h3">${company}</h3>`;
      }
      if (jobTitle) {
        html += `<p class="preview-p">${jobTitle}</p>`;
      }
      if (extractedDates) {
        html += `<div class="preview-date-line">${extractedDates}</div>`;
      }
    }

    // Sort sections by appearance order
    indices.sort((a, b) => a.start - b.start);

    // Helper to extract chunk between current section and the next one
    const getChunk = (matchLen: number, startPos: number, nextPos: number | null): string => {
      const from = startPos + matchLen;
      const to = nextPos != null ? nextPos : text.length;
      return text.slice(from, to).trim();
    };

    for (let i = 0; i < indices.length; i++) {
      const cur = indices[i];
      const next = indices[i + 1];
      const chunk = getChunk(cur.matchLen, cur.start, next ? next.start : null);
      
      // Enhanced rich text processing for Professional Experience
      const processRichText = (text: string): string => {
        return text
          .replace(/^[-•*]\s*/, '') // Remove bullet markers
          .replace(/\*{3,}/g, '') // Remove multiple asterisks
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // Bold
          .replace(/\*(.+?)\*/g, '<em>$1</em>') // Italic (single asterisk)
          .replace(/\*{1,2}$/g, '') // Remove trailing asterisks
          .replace(/^\*+\s*/, '') // Remove leading asterisks
          .replace(/\s+\*+\s*$/, '') // Remove trailing asterisks with spaces
          .trim();
      };
      
      // Prefer splitting by bullet dot; fallback to commas
      let items = chunk
        .split('•')
        .map(s => processRichText(s))
        .filter(s => s && s !== '*' && s !== '**' && s.replace(/[\.-–—\s<>/]/g, '').length > 0);
        
      if (items.length === 0 && /Technical Environment/i.test(cur.label)) {
        items = chunk
          .split(',')
          .map(s => processRichText(s))
          .filter(s => s && s !== '*' && s !== '**' && s.replace(/[\.-–—\s<>/]/g, '').length > 0);
      }
      
      if (items.length > 0) {
        html += `<h3 class="preview-h3">${cur.label}</h3>`;
        html += `<ul class="preview-ul">${items.map(i => `<li class=\"preview-li\">${i}</li>`).join('')}</ul>`;
      }
    }

    return html || formatRegularContent(content);
  };

  const getDeviceWidth = () => {
    switch (previewDevice) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  // Generate live HTML from current segments
  const previewHTML = useMemo(() => {
    const visibleSegments = segments
      .filter(segment => segment.visible)
      .sort((a, b) => a.order - b.order);

    if (visibleSegments.length === 0) {
      return `
        <div style="padding: 40px; text-align: center; color: #666; font-family: '${previewFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <h3 style="margin-bottom: 16px;">Preview</h3>
          <p>Your competence file preview will appear here as you edit the content.</p>
        </div>
      `;
    }

    // --- HEADER ---
    const logoHtml = selectedTemplate === 'antaes'
      ? `<img src="https://res.cloudinary.com/emineon/image/upload/w_200,h_100,c_fit,q_100,f_png/Antaes_logo" alt="ANTAES" style="height:60px;width:auto;display:inline-block;" />`
      : selectedTemplate === 'emineon'
        ? `<img src="https://res.cloudinary.com/emineon/image/upload/v1749926503/Emineon_logo_tree_k8n5vj.png" alt="Emineon" style="height:60px;width:auto;display:inline-block;" />`
        : '';

    // Build Google Fonts link based on selected preview font (skip for system fonts)
    let fontLinkTag = '';
    switch (previewFont) {
      case 'Inter':
        fontLinkTag = `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">`;
        break;
      case 'Roboto':
        fontLinkTag = `<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">`;
        break;
      case 'Open Sans':
        fontLinkTag = `<link href=\"https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap\" rel=\"stylesheet\">`;
        break;
      case 'Lato':
        fontLinkTag = `<link href=\"https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap\" rel=\"stylesheet\">`;
        break;
      case 'Montserrat':
        fontLinkTag = `<link href=\"https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap\" rel=\"stylesheet\">`;
        break;
      case 'Poppins':
        fontLinkTag = `<link href=\"https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap\" rel=\"stylesheet\">`;
        break;
      case 'Merriweather':
        fontLinkTag = `<link href=\"https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap\" rel=\"stylesheet\">`;
        break;
      case 'Playfair Display':
        fontLinkTag = `<link href=\"https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap\" rel=\"stylesheet\">`;
        break;
      case 'Source Sans 3':
        fontLinkTag = `<link href=\"https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap\" rel=\"stylesheet\">`;
        break;
      case 'Source Serif 4':
        fontLinkTag = `<link href=\"https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&display=swap\" rel=\"stylesheet\">`;
        break;
      case 'IBM Plex Sans':
        fontLinkTag = `<link href=\"https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&display=swap\" rel=\"stylesheet\">`;
        break;
      default:
        fontLinkTag = '';
    }

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${selectedCandidate.fullName} - Competence File</title>
        ${fontLinkTag}
        ${selectedTemplate === 'antaes' ? '<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400;1,700&display=swap" rel="stylesheet">' : ''}
        <style>
          body {
            font-family: '${previewFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: ${previewFontSize}px;
            background: #fff;
            color: #1e293b;
            margin: 0;
          }
          .container {
            max-width: 100%;
            width: 100%;
            margin: 0;
            background: #fff;
            border-radius: 4px;
            box-shadow: 0 1px 3px 0 rgba(30,41,59,0.1);
            overflow: hidden;
            padding-left: 8px;
            padding-right: 8px;
            min-height: 100%;
            transform-origin: top left;
            box-sizing: border-box;
          }
          .header {
            padding: 20px 8px 16px 8px;
            border-bottom: none;
          }
          .brand-tagline {
            font-family: inherit;
            font-style: italic;
            font-weight: 500;
            color: #073C51;
            font-size: 16px;
            line-height: 1.2;
            margin-top: 6px;
            letter-spacing: 0.3px;
            text-align: center;
          }
          .candidate-name {
            font-size: 1.1rem;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 0.2rem;
          }
          .candidate-role {
            font-size: 0.75rem;
            font-weight: 600;
            color: #fbbf24;
            margin-bottom: 0.2rem;
          }
          .candidate-years {
            font-size: 0.7rem;
            font-weight: 500;
            color: #64748b;
            margin-bottom: 0.5rem;
          }
          .header-divider {
            border: none;
            border-top: 1px solid #e2e8f0;
            margin: 18px 0 0 0;
          }
          .section-title {
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #073C51;
            margin-bottom: 0.2rem;
            margin-top: 2.2em;
          }
          .section-divider {
            border: none;
            border-top: 1px solid #073C51;
            margin: 8px 0 18px 0;
            opacity: .8;
          }
          .section-card {
            background: #f5f7fa;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            padding: 22px 28px 18px 28px;
            margin-bottom: 24px;
            position: relative;
            display: flex;
            align-items: stretch;
            border-left: 4px solid #073C51;
          }
          /* removed decorative bracket */
          .section-card-title {
            font-weight: 700;
            color: #174452;
            margin-bottom: 0.5rem;
            font-size: 0.8rem;
          }
          ul.custom-bullets {
            list-style: disc;
            color: #1e293b;
            padding-left: 1.5em;
            margin: 0 0 0.5rem 0;
          }
          ul.custom-bullets li {
            margin-bottom: 0.3em;
            font-size: 0.8rem;
          }
          .tag {
            display: inline-flex;
            align-items: center;
            background: #eef4f8;
            color: #073C51;
            border-radius: 999px;
            padding: 0.28em 0.9em;
            font-size: 0.75rem;
            font-weight: 600;
            margin: 0 0.35em 0.35em 0;
            border: 1px solid #d1d9e0;
            position: relative;
            padding-left: 1.3em;
          }
          .tag::before {
            content: "";
            position: absolute;
            left: .6em;
            width: 6px;
            height: 6px;
            background: #FFB800;
            border-radius: 50%;
          }
          .footer {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #94a3b8;
            font-size: 0.75rem;
            margin-top: 40px;
            padding-bottom: 16px;
          }
          .footer-left {
            text-align: left;
          }
          .footer-right {
            margin-left: auto;
            display: flex;
            align-items: flex-end;
            gap: 12px;
          }
          .badge-block {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
          }
          .badge-text {
            font-size: 10px;
            color: #073C51;
            margin-top: 4px;
            font-weight: 700;
          }
          .page-number {
            text-align: right;
            color: #94a3b8;
            font-size: 0.75rem;
            margin-top: 24px;
          }
          @media (max-width: 700px) {
            .container { margin: 0; border-radius: 0; }
            .header { padding: 24px 16px 12px 16px; }
            .section-card { padding: 12px 8px 10px 8px; }
          }
          /* ...existing styles... */
          .preview-section {
            border-left: 5px solid #073C51;
            padding-left: 1.2rem;
            margin-bottom: 2.2rem;
            background: #f9f9f9;
            border-radius: 0.5rem;
            box-shadow: 0 1px 4px rgba(0,0,0,0.03);
            position: relative;
          }
          .preview-ul {
            margin: 0 0 1rem 1.5rem;
            padding: 0;
            list-style: disc inside;
          }
          .preview-li {
            margin-bottom: 0.25rem;
            font-size: 0.8rem;
            color: #222;
            position: relative;
          }
          .preview-ul li::marker {
            color: #FFC300; /* Yellow bullet */
            font-size: 1.1em;
          }
          .preview-date-line { margin-bottom: 0.7em; font-size: 0.9em; color: #444; font-style: italic; }
          /* Loading placeholders */
          @keyframes spin { 100% { transform: rotate(360deg); } }
          @keyframes shimmer {
            0% { background-position: -200px 0; }
            100% { background-position: calc(200px + 100%) 0; }
          }
          .spinner { width: 18px; height: 18px; border: 3px solid #e2e8f0; border-top-color: #073C51; border-radius: 50%; animation: spin 0.9s linear infinite; margin-right: 8px; }
          .skeleton-line {
            height: 10px; border-radius: 6px; margin: 8px 0; overflow: hidden;
            background: #e5edf3;
            background-image: linear-gradient(90deg, #e5edf3 0px, #f2f7fb 100px, #e5edf3 200px);
            background-size: 200px 100%;
            animation: shimmer 1.2s infinite linear;
          }
          .skeleton-line.sm { height: 8px; }
          .skeleton-line.lg { height: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="width:100%;text-align:center;margin-bottom:10px;">${logoHtml}</div>
            ${selectedTemplate === 'antaes' ? `
            <div class="brand-tagline">Partnership for Excellence</div>
            ` : ''}
            ${managerContact && (managerContact.name || managerContact.email || managerContact.phone) ? `
            <div style="margin: 4px 0 10px 0; font-size:12px; color:#475569; line-height:1.4;">
              <div style="font-weight:600; color:#334155; text-transform:uppercase; letter-spacing:.5px; margin-bottom:2px;">Manager Details</div>
              ${managerContact.name ? `<div><span style=\"font-weight:600; color:#1f2937;\">Manager:</span> ${managerContact.name}</div>` : ''}
              ${managerContact.email ? `<div><span style=\"font-weight:600; color:#1f2937;\">Email:</span> ${managerContact.email}</div>` : ''}
              ${managerContact.phone ? `<div><span style=\"font-weight:600; color:#1f2937;\">Phone:</span> ${managerContact.phone}</div>` : ''}
            </div>
            ` : ''}
            <div class="candidate-name">${selectedCandidate.fullName}</div>
            <div class="candidate-role">${selectedCandidate.currentTitle}</div>
            <div class="candidate-years">${selectedCandidate.yearsOfExperience ? selectedCandidate.yearsOfExperience + ' years of experience' : ''}</div>
            <hr class="header-divider" />
          </div>
    `;

    // --- SECTIONS ---
    for (const segment of visibleSegments) {
      const htmlContent = (segment as any).htmlContent as string | undefined;
      const plainContent = segment.content || '';
      const isLoading = segment.status === 'loading' || (!plainContent && !htmlContent && segmentsLoading);
      if (!htmlContent && !plainContent && !isLoading) continue;

      const sectionColor = '#073C51';
      let bodyHtml = '';
      if (isLoading) {
        bodyHtml = `
          <div style="display:flex;align-items:center;margin-bottom:8px;">
            <div class="spinner"></div>
            <div style="font-size:0.85rem;color:#475569;">Generating content...</div>
          </div>
          <div class="skeleton-line lg" style="width: 90%"></div>
          <div class="skeleton-line" style="width: 100%"></div>
          <div class="skeleton-line" style="width: 95%"></div>
          <div class="skeleton-line sm" style="width: 85%"></div>
        `;
      } else if (htmlContent) {
        bodyHtml = htmlContent
          .replace(/\*{2,}/g, '')
          .replace(/```[\s\S]*?```/g, '')
          .replace(/`{1,3}/g, '')
          .trim();
        if (!bodyHtml || bodyHtml.replace(/<[^>]+>/g, '').trim().length === 0) {
          const isTechSection = /TECHNICAL (ENVIRONMENT|EXPERTISE|SKILLS)|TECHNICAL PROFICIENCY/i.test(segment.title);
          if (isTechSection || segment.title.toUpperCase().includes('FUNCTIONAL SKILLS')) {
            bodyHtml = segment.title.toUpperCase().includes('TECHNICAL EXPERTISE') || segment.title.toUpperCase().includes('FUNCTIONAL SKILLS')
              ? formatTechnicalSectionPreview(plainContent)
              : formatRegularContent(plainContent, segment.title);
          } else if (/^PROFESSIONAL EXPERIENCE \d+$/i.test(segment.title)) {
            bodyHtml = formatProfessionalExperiencePreview(plainContent);
          } else {
            bodyHtml = formatRegularContent(plainContent, segment.title);
          }
        }
      } else {
        const isTechSection = /TECHNICAL (ENVIRONMENT|EXPERTISE|SKILLS)|TECHNICAL PROFICIENCY/i.test(segment.title);
        if (isTechSection || segment.title.toUpperCase().includes('FUNCTIONAL SKILLS')) {
          bodyHtml = segment.title.toUpperCase().includes('TECHNICAL EXPERTISE') || segment.title.toUpperCase().includes('FUNCTIONAL SKILLS')
            ? formatTechnicalSectionPreview(plainContent)
            : formatRegularContent(plainContent, segment.title);
        } else if (/^PROFESSIONAL EXPERIENCE \d+$/i.test(segment.title)) {
          bodyHtml = formatProfessionalExperiencePreview(plainContent);
        } else {
          bodyHtml = formatRegularContent(plainContent, segment.title);
        }
      }

      html += `
        <div class="section-title" style="color: ${sectionColor};">${segment.title}</div>
        <hr class="section-divider" />
        <div class="section-card">
          <div style="flex:1;">
            ${bodyHtml}
          </div>
        </div>
      `;
    }

    const footerText = selectedTemplate === 'emineon' ? 'Powered by Emineon' : selectedTemplate === 'antaes' ? 'Powered by Antaes' : '';
    html += `
          <div class=\"footer\">
            <div class=\"footer-left\">${footerText || ''}</div>
            ${selectedTemplate === 'antaes' ? `
            <div class=\"footer-right\">
              <div class=\"badge-block\">
                <img src=\"https://res.cloudinary.com/emineon/image/upload/f_auto,q_90,w_60/ecovadis\" alt=\"Ecovadis\" style=\"height:30px;width:auto;\" />
                <div class=\"badge-text\">top 5%</div>
              </div>
              <div class=\"badge-block\">
                <img src=\"https://res.cloudinary.com/emineon/image/upload/f_auto,q_90,w_60/glassdoor\" alt=\"Glassdoor\" style=\"height:30px;width:auto;\" />
                <div class=\"badge-text\">4,7/5</div>
              </div>
              <div class=\"badge-block\">
                <img src=\"https://res.cloudinary.com/emineon/image/upload/f_auto,q_90,w_60/happyatwork\" alt=\"Happy at Work\" style=\"height:30px;width:auto;\" />
                <div class=\"badge-text\">certified</div>
              </div>
            </div>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
    // After converting markdown headings, add a replace for bold:
    // Replace **text** with <strong>text</strong>
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Store in ref for PDF generation access
    previewHTMLRef.current = html;
    
    return html;
  }, [segments, selectedCandidate, selectedTemplate, formatRegularContent, previewFont, previewFontSize, segmentsLoading, previewSyncKey]);

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Preview Controls */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between h-16">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">Preview</span>
          
          {/* Preview Expand Button */}
          <button
            onClick={onToggleFullscreen}
            className="flex items-center px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            title={fullscreenMode === 'preview' ? 'Exit preview fullscreen' : 'Expand preview'}
          >
            {fullscreenMode === 'preview' ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Preview Zoom Controls */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button 
              onClick={onZoomOut}
              className="p-1 rounded hover:bg-gray-200"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium px-2">{zoomLevel}%</span>
            <button 
              onClick={onZoomIn}
              className="p-1 rounded hover:bg-gray-200"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button 
              onClick={onZoomReset}
              className="text-xs px-2 py-1 rounded hover:bg-gray-200"
              title="Fit to screen"
            >
              Fit
            </button>
          </div>
          
          {/* Sync Button */}
          <SyncButton />
        </div>
      </div>

      {/* Preview Content */}
      <div className={`flex-1 bg-gray-50 ${fullscreenMode === 'preview' ? 'overflow-hidden' : 'overflow-auto'}`}>
        <div className={`h-full w-full flex items-center justify-center ${fullscreenMode === 'preview' ? 'p-2' : 'p-1'}`}>
          <div 
            className="bg-white shadow-sm border border-gray-200 flex items-center justify-center"
            style={{ 
              width: fullscreenMode === 'preview' ? '100%' : '100%',
              maxWidth: fullscreenMode === 'preview' ? '100%' : '100%',
              height: fullscreenMode === 'preview' ? '100%' : '100%',
              maxHeight: '100%',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'center center',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <iframe
                key={previewSyncKey}
                srcDoc={previewHTML}
                className="border-0"
                style={{ 
                  width: '100%',
                  height: fullscreenMode === 'preview' ? '100vh' : '100%',
                  minHeight: fullscreenMode === 'preview' ? '100vh' : '800px',
                  overflow: 'hidden'
                }}
                title="Competence File Preview"
              />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export function EditorStep({
  selectedCandidate,
  selectedTemplate,
  jobDescription,
  managerContact,
  onBack,
  onSave,
  onGenerateDocument,
  isGenerating,
  isAutoSaving,
  language,
  onLanguageChange,
  competenceFileId
}: EditorStepProps) {
  const { getToken } = useAuth();
  const { 
    segments, 
    isLoading: segmentsLoading, 
    error: segmentsError,
    loadFromAI, 
    reorderSegments,
    clearSegments,
    getVisibleSegments,
    updateSegment,
    regenerateSegment 
  } = useSegmentStore();
  
  // Editor state
  const [hasInitialized, setHasInitialized] = useState(false);
  const [editorZoomLevel, setEditorZoomLevel] = useState(100);
  const [previewZoomLevel, setPreviewZoomLevel] = useState(100); // Start with 100% and let container handle fitting

  // Font and font size state for preview
  const [previewFont, setPreviewFont] = useState('Inter');
  const [previewFontSize, setPreviewFontSize] = useState(12);

  // Fullscreen modes: none, editor, preview, both
  const [fullscreenMode, setFullscreenMode] = useState<'none' | 'editor' | 'preview' | 'both'>('none');

  // Resizable panels state
  const [editorWidth, setEditorWidth] = useState(50); // Percentage
  const [isResizing, setIsResizing] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // If Emineon template is selected, render the new inline editor experience
  if (selectedTemplate === 'emineon') {
    const sections = (segments || [])
      .filter((s) => s.visible)
      .sort((a, b) => a.order - b.order)
      .map((s) => {
        const title = s.title || s.type || 'Section';
        const typeUpper = (s.type || '').toUpperCase();
        const kind = typeUpper.includes('SUMMARY') ? 'summary'
          : typeUpper.includes('EXPERIENCE') && !typeUpper.includes('SUMMARY') ? 'experience'
          : typeUpper.includes('ACHIEVEMENT') ? 'achievements'
          : typeUpper.includes('EDUCATION') ? 'education'
          : 'custom';
        const html = (s as any).htmlContent || s.content || '';
        return { id: s.id, kind, title, html, order: s.order } as any;
      });

    return (
      <div className="w-full h-full bg-white">
        <EmineonInlineEditor 
          initial={{ id: 'cv-emineon', sections }} 
          fileId={competenceFileId}
          onSave={onSave}
          onGenerateDocument={onGenerateDocument}
          isGenerating={isGenerating}
          isAutoSaving={isAutoSaving}
        />
      </div>
    );
  }

  // Auto-initialization
  useEffect(() => {
    if (!hasInitialized && selectedCandidate && segments.length === 0) {
      console.log('🚀 Seeding segments and queuing generation...');
      const localizedJob = { ...(jobDescription as any), language } as any;
      // Seed segments immediately for full preview list
      (useSegmentStore.getState().seedFromData as any)?.(localizedJob, selectedCandidate);
      setHasInitialized(true);
      // Optionally queue generation in the background
      const seeded = (useSegmentStore.getState().segments || []).slice();
      seeded.forEach(async (seg) => {
        try {
          const enqueueRes = await fetch('/api/ai/queue/enqueue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'ai_optimize', payload: { segmentType: seg.type, candidateId: selectedCandidate.id, language, order: seg.order } }),
          });
          if (!enqueueRes.ok) return;
          const { jobId } = await enqueueRes.json();
          if (!jobId) return;
          const start = Date.now();
          const timeoutMs = 120000;
          while (Date.now() - start < timeoutMs) {
            const statusRes = await fetch(`/api/ai/queue/status?id=${encodeURIComponent(jobId)}`);
            if (statusRes.ok) {
              const s = await statusRes.json();
              if (s.status === 'completed') {
                const result = s.result || {};
                const content = result?.content || result?.data?.content || result?.htmlContent || '';
                updateSegment(seg.id, { content: content || seg.content, status: 'done' });
                break;
              }
              if (s.status === 'failed') {
                updateSegment(seg.id, { status: 'error' });
                break;
              }
            }
            await new Promise((r) => setTimeout(r, 1100));
          }
        } catch {}
      });
    }
  }, [hasInitialized, selectedCandidate, jobDescription, language, segments.length, updateSegment]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // clearSegments(); // Uncomment if you want to clear segments on unmount
    };
  }, []);

  // Debug logging for segments
  useEffect(() => {
    console.log('🎯 EditorStep - Segments state:', {
      segmentsCount: segments.length,
      isLoading: segmentsLoading,
      error: segmentsError,
      segments: segments.map(s => ({
        id: s.id,
        title: s.title,
        type: s.type,
        status: s.status,
        contentLength: s.content?.length || 0,
        visible: s.visible,
        order: s.order
      }))
    });
  }, [segments, segmentsLoading, segmentsError]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = segments.findIndex(segment => segment.id === active.id);
      const newIndex = segments.findIndex(segment => segment.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderSegments(oldIndex, newIndex);
      }
    }
  };

  // Editor zoom controls
  const handleEditorZoomIn = () => setEditorZoomLevel((prev: number) => Math.min(prev + 10, 150));
  const handleEditorZoomOut = () => setEditorZoomLevel((prev: number) => Math.max(prev - 10, 50));
  const handleEditorZoomReset = () => setEditorZoomLevel(100);

  // Preview zoom controls  
  const handlePreviewZoomIn = () => setPreviewZoomLevel((prev: number) => Math.min(prev + 10, 150));
  const handlePreviewZoomOut = () => setPreviewZoomLevel((prev: number) => Math.max(prev - 10, 50));
  const handlePreviewZoomReset = () => setPreviewZoomLevel(100);

  // Resizable panel handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    // Set global cursor and prevent text selection
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.documentElement.style.cursor = 'col-resize';
    
    console.log('🎯 Started resizing panels');
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const container = document.querySelector('.editor-container') as HTMLElement;
    if (!container) {
      console.error('❌ Container not found for resizing');
      return;
    }
    
    const containerRect = container.getBoundingClientRect();
    const mouseX = e.clientX;
    const containerLeft = containerRect.left;
    const containerWidth = containerRect.width;
    
    // Calculate new width percentage with more precision
    const relativeX = mouseX - containerLeft;
    const newWidth = (relativeX / containerWidth) * 100;
    
    // Constrain between 25% and 75% for usability
    const constrainedWidth = Math.max(25, Math.min(75, newWidth));
    setEditorWidth(constrainedWidth);
    
    console.log('🎯 Mouse:', mouseX, 'Container:', containerLeft, 'Width:', containerWidth, 'New%:', constrainedWidth.toFixed(1));
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    if (!isResizing) return;
    
    setIsResizing(false);
    
    // Restore normal cursor and text selection
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.documentElement.style.cursor = '';
    
    console.log('🎯 Finished resizing panels');
  }, [isResizing]);

  // Global mouse event listeners for smooth dragging
  useEffect(() => {
    if (isResizing) {
      console.log('🎯 Setting up global mouse listeners');
      
      // Add event listeners to both document and window for maximum coverage
      const options = { passive: false, capture: true };
      
      document.addEventListener('mousemove', handleMouseMove, options);
      document.addEventListener('mouseup', handleMouseUp, options);
      window.addEventListener('mousemove', handleMouseMove, options);
      window.addEventListener('mouseup', handleMouseUp, options);
      
      // Prevent text selection during drag
      document.addEventListener('selectstart', (e) => e.preventDefault(), true);
      document.addEventListener('dragstart', (e) => e.preventDefault(), true);
      
      return () => {
        console.log('🎯 Cleaning up mouse listeners');
        document.removeEventListener('mousemove', handleMouseMove, options);
        document.removeEventListener('mouseup', handleMouseUp, options);
        window.removeEventListener('mousemove', handleMouseMove, options);
        window.removeEventListener('mouseup', handleMouseUp, options);
        document.removeEventListener('selectstart', (e) => e.preventDefault(), true);
        document.removeEventListener('dragstart', (e) => e.preventDefault(), true);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Fullscreen controls
  const toggleEditorFullscreen = () => {
    setFullscreenMode(fullscreenMode === 'editor' ? 'none' : 'editor');
  };

  const togglePreviewFullscreen = () => {
    if (fullscreenMode === 'preview') {
      // Exit fullscreen - restore normal view
      setFullscreenMode('none');
      setPreviewZoomLevel(100);
    } else {
      // Enter fullscreen - auto-fit to screen
      setFullscreenMode('preview');
      // Calculate zoom to fit screen height (A4 is taller than wide)
      // Assuming ~90vh available and A4 ratio, fit to about 70% for good viewing
      setPreviewZoomLevel(70);
    }
  };

  // Handle escape key for fullscreen exit
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && fullscreenMode !== 'none') {
        setFullscreenMode('none');
      }
    };

    if (fullscreenMode !== 'none') {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [fullscreenMode]);

  const editorScrollRef = useRef<HTMLDivElement>(null);

  // NO AUTOMATIC SCROLLING - Let user control scroll position completely

  // In EditorStep, add previewSyncKey state:
  const [previewSyncKey, setPreviewSyncKey] = useState(0);
  
  // Store preview HTML in a ref so it can be accessed by handleGenerateDocument
  const previewHTMLRef = useRef<string>('');

  // Regenerate content if language changes
  useEffect(() => {
    if (hasInitialized && selectedCandidate) {
      const localizedJob = { ...(jobDescription as any), language } as any;
      loadFromAI(localizedJob, selectedCandidate);
      setPreviewSyncKey(k => k + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // PDF generation state
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfStatus, setPdfStatus] = useState('');

  // Generate document using exact preview HTML - defined here to access previewHTML
  const handleGenerateDocument = async (format: 'pdf' | 'docx') => {
    console.log('🔄 Generating document using exact preview HTML...');
    
    setIsGeneratingPDF(true);
    setPdfProgress(0);
    setPdfStatus('Initializing PDF generation...');
    
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      setPdfProgress(25);
      setPdfStatus('Preparing document content...');

      // Send the exact preview HTML to PDF generation
      const response = await fetch('/api/competence-files/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          usePreviewHTML: true,
          previewHTML: previewHTMLRef.current,
          candidateData: selectedCandidate,
          template: selectedTemplate,
          managerContact: managerContact,
          format: format,
          enqueue: true
        }),
      });

      setPdfProgress(75);
      setPdfStatus('Generating PDF file...');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `PDF generation failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'PDF generation failed');
      }

      setPdfProgress(100);
      setPdfStatus('PDF ready! Opening in new window...');

      // Open PDF in new window - keep editor completely untouched
      if (result.downloadUrl) {
        try {
          // Only open in new tab - no download link to avoid navigation issues
          const newWindow = window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
          
          if (!newWindow) {
            // If popup blocked, show message
            alert('Please allow popups to view the PDF. You can also copy this URL: ' + result.downloadUrl);
          }
          
          console.log('📥 PDF opened in new tab, editor completely preserved');
        } catch (error) {
          console.error('PDF opening error:', error);
          // Fallback: copy URL to clipboard
          navigator.clipboard.writeText(result.downloadUrl).then(() => {
            alert('PDF URL copied to clipboard. Please paste in a new tab.');
          }).catch(() => {
            alert('PDF URL: ' + result.downloadUrl);
          });
        }
      }

      // Hide loading after brief delay
      setTimeout(() => {
        setIsGeneratingPDF(false);
        setPdfProgress(0);
        setPdfStatus('');
      }, 2000);

      console.log('✅ PDF generated successfully using exact preview HTML');
    } catch (error) {
      setIsGeneratingPDF(false);
      setPdfProgress(0);
      setPdfStatus('');
      
      console.error('❌ PDF generation failed:', error);
      alert(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (segmentsError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-red-600 text-center">
          <h3 className="text-lg font-semibold mb-2">Failed to load content</h3>
          <p className="text-sm mb-4">{segmentsError}</p>
          <Button 
            onClick={() => {
              setHasInitialized(false);
              clearSegments();
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const editorContent = (
    <div className={`flex-1 flex flex-col h-full ${fullscreenMode === 'editor' || fullscreenMode === 'preview' || fullscreenMode === 'both' ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Editor Header - Fixed height and proper spacing - Hidden in 'both' mode */}
      {fullscreenMode !== 'both' && (
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0 min-h-[4rem] relative z-10">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <Button variant="outline" onClick={fullscreenMode !== 'none' ? () => setFullscreenMode('none') : onBack} className="flex-shrink-0">
              {fullscreenMode !== 'none' ? (
                <X className="h-4 w-4 mr-2" />
              ) : (
                <ArrowLeft className="h-4 w-4 mr-2" />
              )}
              {fullscreenMode !== 'none' ? 'Exit' : 'Back'}
            </Button>
            <h1 className="text-xl font-semibold flex-shrink-0">Editor</h1>
            <div className="text-sm text-gray-500 truncate">
              {selectedCandidate.fullName} • {selectedTemplate} template
            </div>
          </div>
          {/* Language switcher in editor */}
          <div className="flex items-center space-x-3 ml-4">
            <select
              value={language}
              onChange={e => onLanguageChange(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
              aria-label="Change language"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="nl">Nederlands</option>
            </select>
            <select value={previewFont} onChange={e => setPreviewFont(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Poppins">Poppins</option>
              <option value="IBM Plex Sans">IBM Plex Sans</option>
              <option value="Merriweather">Merriweather (serif)</option>
              <option value="Playfair Display">Playfair Display (serif)</option>
              <option value="Source Sans 3">Source Sans 3</option>
              <option value="Source Serif 4">Source Serif 4 (serif)</option>
              <option value="Arial">Arial</option>
            </select>
            <select value={previewFontSize} onChange={e => setPreviewFontSize(Number(e.target.value))} className="border rounded px-2 py-1 text-sm">
              <option value={14}>14px</option>
              <option value={16}>16px</option>
              <option value={18}>18px</option>
              <option value={20}>20px</option>
              <option value={22}>22px</option>
            </select>
            {/* Save Button (exits knowledge modal on success) */}
            <Button
              variant="primary"
              onClick={onSave}
              className="ml-2 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
            >
              Save
            </Button>
            {/* Download PDF Button */}
            <Button
              variant="primary"
              onClick={() => handleGenerateDocument('pdf')}
              className="ml-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden editor-container">
        {/* Editor Panel */}
        <div 
          className={`${fullscreenMode === 'preview' ? 'hidden' : ''} flex flex-col`}
          style={{ 
            width: fullscreenMode === 'editor' ? '100%' : `${editorWidth}%`,
            minWidth: fullscreenMode !== 'preview' ? '300px' : '0px'
          }}
        >
          <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between flex-shrink-0 h-16">
        <div className="flex items-center space-x-3">
              <h3 className="text-sm font-medium text-gray-700">Content Editor</h3>
              
              {/* Editor Expand Button */}
              <button
                onClick={toggleEditorFullscreen}
                className="flex items-center px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                title={fullscreenMode === 'editor' ? 'Exit editor fullscreen' : 'Expand editor'}
              >
                {fullscreenMode === 'editor' ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Editor Zoom Controls */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={handleEditorZoomOut}
                  className="p-1 rounded hover:bg-gray-200"
                  title="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium px-2">{editorZoomLevel}%</span>
                <button 
                  onClick={handleEditorZoomIn}
                  className="p-1 rounded hover:bg-gray-200"
                  title="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button 
                  onClick={handleEditorZoomReset}
                  className="text-xs px-2 py-1 rounded hover:bg-gray-200"
                  title="Reset zoom"
                >
                  Reset
                </button>
              </div>
        </div>
      </div>

      {/* Editor Content */}
          <div 
            ref={editorScrollRef} 
            className="flex-1 overflow-auto" 
            style={{ height: 'calc(100vh - 200px)' }}
          >
            <div 
              style={{ 
                transform: `scale(${editorZoomLevel / 100})`,
                transformOrigin: 'top left',
                width: `${100 / (editorZoomLevel / 100)}%`,
                minHeight: '100%',
                overflow: 'visible'
              }}
            >
        {segmentsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Loading content...</p>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
                  <SortableContext 
                    items={segments.map(s => s.id)} 
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4 p-4" style={{ minHeight: '100%' }}>
                      {segments.map(segment => (
                        <SortableSegmentWrapper key={segment.id} segment={segment}>
                          <SegmentBlock 
                            segment={segment}
                            jobDescription={jobDescription}
                            selectedCandidate={selectedCandidate}
                          />
                        </SortableSegmentWrapper>
                ))}
              </div>
            </SortableContext>
          </DndContext>
              )}
            </div>
          </div>
        </div>

        {/* Resizable Divider - Only in header area */}
        {fullscreenMode === 'none' && (
          <div className="flex flex-col">
            {/* Header Divider */}
            <div className="h-16 bg-gray-50 border-b flex items-center justify-center relative">
              <div 
                className={`relative cursor-col-resize group h-8 ${isResizing ? 'bg-blue-100' : ''}`}
                onMouseDown={handleMouseDown}
                title="Drag to resize panels"
                style={{ 
                  width: '1px',
                  minWidth: '1px',
                  maxWidth: '1px',
                  background: isResizing ? '#3b82f6' : '#d1d5db'
                }}
              >
                {/* Invisible hover area for easier grabbing */}
                <div 
                  className="absolute inset-y-0 -left-3 -right-3 cursor-col-resize"
                  style={{ width: '8px', marginLeft: '-4px' }}
                />
                {/* Visual line */}
                <div className={`w-full h-full transition-colors ${isResizing ? 'bg-blue-500' : 'bg-gray-400 group-hover:bg-blue-400'}`} />
              </div>
            </div>
            {/* Content Divider - invisible */}
            <div className="flex-1 bg-gray-200" style={{ width: '1px' }} />
          </div>
        )}

        {/* Preview Panel */}
        {fullscreenMode !== 'editor' && (
          <div 
            className={`${fullscreenMode === 'preview' ? 'flex-1' : ''} flex flex-col`}
            style={{ 
              width: fullscreenMode === 'preview' ? '100%' : `${100 - editorWidth}%`,
              // Inside this branch fullscreenMode is never 'editor', so set constant minWidth
              minWidth: '300px'
            }}
          >
            <LivePreview
              key={previewSyncKey}
              segments={segments}
              selectedCandidate={selectedCandidate}
              selectedTemplate={selectedTemplate}
              managerContact={managerContact}
              zoomLevel={previewZoomLevel}
              onZoomIn={handlePreviewZoomIn}
              onZoomOut={handlePreviewZoomOut}
              onZoomReset={handlePreviewZoomReset}
              onToggleFullscreen={togglePreviewFullscreen}
              fullscreenMode={fullscreenMode}
              className=""
              updateSegment={updateSegment}
              previewFont={previewFont}
              previewFontSize={previewFontSize}
              previewSyncKey={previewSyncKey}
              setPreviewSyncKey={setPreviewSyncKey}
              previewHTMLRef={previewHTMLRef}
              segmentsLoading={segmentsLoading}
            />
          </div>
        )}
      </div>

      {/* PDF Generation Loading Overlay */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              {/* Loading Animation */}
              <div className="mb-6">
                <div className="relative">
                  <div className="w-20 h-20 mx-auto">
                    <svg className="w-20 h-20 animate-spin" viewBox="0 0 50 50">
                      <circle
                        className="path"
                        cx="25"
                        cy="25"
                        r="20"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="31.416"
                        strokeDashoffset={`${31.416 - (31.416 * pdfProgress) / 100}`}
                        style={{
                          transition: 'stroke-dashoffset 0.3s ease'
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-semibold text-blue-600">{pdfProgress}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Text */}
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Generating PDF
                </h3>
                <p className="text-gray-600">
                  {pdfStatus}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${pdfProgress}%` }}
                ></div>
              </div>

              {/* Additional Info */}
              <p className="text-sm text-gray-500">
                Creating professional competence file for {selectedCandidate.fullName}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // SortableSegmentWrapper for drag and drop
  function SortableSegmentWrapper({ 
    children, 
    segment 
  }: { 
    children: React.ReactNode; 
    segment: Segment; 
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: segment.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        <div className="relative group">
          <div
            {...listeners}
            className="absolute left-2 top-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          {children}
      </div>
    </div>
  );
  }

  return editorContent;
}