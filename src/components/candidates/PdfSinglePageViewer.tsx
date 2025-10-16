// Ensure this renders only on client to avoid DOMMatrix SSR errors
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
// Lazy-load react-pdf components on client only
const Document = dynamic(async () => (await import('react-pdf')).Document as any, { ssr: false }) as any;
const Page = dynamic(async () => (await import('react-pdf')).Page as any, { ssr: false }) as any;

interface PdfSinglePageViewerProps {
  url: string;
  heightClass?: string; // tailwind height class, defaults to 70vh
}

export default function PdfSinglePageViewer({ url, heightClass }: PdfSinglePageViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [width, setWidth] = useState<number>(0);
  const [failed, setFailed] = useState<boolean>(false);

  // Set workerSrc if not already set by parent
  useEffect(() => {}, []);

  const onDocumentLoadSuccess = ({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages);
    if (pageNumber > nextNumPages) setPageNumber(nextNumPages);
    setFailed(false);
  };

  const handleResize = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Leave small padding
    setWidth(Math.max(0, rect.width - 16));
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const canPrev = pageNumber > 1;
  const canNext = pageNumber < numPages;

  return (
    <div className="w-full" ref={containerRef}>
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b">
        <div className="text-xs text-gray-600">Page {pageNumber} / {numPages || '?'} </div>
        <div className="space-x-2">
          <button
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={!canPrev}
            className="px-2 py-1 text-xs rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50"
          >Prev</button>
          <button
            onClick={() => setPageNumber((p) => Math.min(numPages || 1, p + 1))}
            disabled={!canNext}
            className="px-2 py-1 text-xs rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50"
          >Next</button>
        </div>
      </div>
      <div className={`flex items-center justify-center bg-gray-50 ${heightClass ?? ''}`} style={!heightClass ? { height: '70vh' } : undefined}>
        {failed ? (
          <iframe src={url} className="w-full h-full" title="PDF Preview"></iframe>
        ) : (
          <Document 
            file={{ url }} 
            onLoadSuccess={onDocumentLoadSuccess} 
            onLoadError={() => setFailed(true)}
            loading={<div className="text-sm text-gray-500">Loading PDF…</div>}
          >
            <Page pageNumber={pageNumber} width={width} renderTextLayer={false} renderAnnotationLayer={false} />
          </Document>
        )}
      </div>
    </div>
  );
}


