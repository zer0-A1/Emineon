'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

type Question = { id: string; type: 'multiple_choice' | 'text' | 'code' | 'rating'; question: string; options?: string[]; category?: string; weight?: number };

export default function TakeAssessmentPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const durationParam = Number(params.get('duration') || '0');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);
  const totalSeconds = useMemo(() => (durationParam > 0 ? durationParam * 60 : 0), [durationParam]);
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    // Load preview questions from sessionStorage if available
    const key = `assessment_preview_${token}`;
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem(key) : null;
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (Array.isArray(data?.questions)) {
          setQuestions(data.questions);
          setLoading(false);
          return;
        }
      } catch {}
    }
    // Fallback demo questions
    const mock: Question[] = [
      { id: 'q1', type: 'multiple_choice', question: 'What does HTML stand for?', options: ['Hyperlinks and Text Markup Language', 'Hyper Text Markup Language', 'Home Tool Markup Language'], category: 'Technical', weight: 2 },
      { id: 'q2', type: 'text', question: 'Explain event loop in JavaScript briefly.', category: 'Technical', weight: 1 },
      { id: 'q3', type: 'rating', question: 'Rate your experience with React (1-5).', category: 'Technical', weight: 1 },
      { id: 'q4', type: 'text', question: 'Describe a time you adapted to a product change.', category: 'Functional', weight: 1 },
    ];
    setQuestions(mock);
    setLoading(false);
  }, [token]);

  // countdown timer
  useEffect(() => {
    if (!totalSeconds) return;
    setRemaining(totalSeconds);
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          // auto-submit on timeout
          handleSubmit();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSeconds]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/assessments/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, answers }) });
      const js = await res.json();
      if (js?.success) setResult(js.result);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading…</div>;

  // Group by category in logical order
  const categoryOrder = ['Technical', 'Functional', 'Soft skills', 'Language', 'Uncategorized'];
  const byCategory: Record<string, Question[]> = {};
  for (const q of questions) {
    const cat = q.category || 'Uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(q);
  }
  const orderedCategories = Object.keys(byCategory).sort((a, b) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);
    const aa = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
    const bb = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
    return aa - bb || a.localeCompare(b);
  });
  // Sort questions inside category by weight desc then text
  for (const k of orderedCategories) {
    byCategory[k].sort((qa, qb) => (Number(qb.weight || 0) - Number(qa.weight || 0)) || String(qa.question).localeCompare(String(qb.question)));
  }

  if (result) return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Assessment submitted</h1>
      <p className="text-gray-700 mb-4">Score: {result.score} / {result.maxScore}</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Candidate Assessment</h1>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <p className="text-gray-600">Answer the questions below and submit when done.</p>
        </div>
        {totalSeconds > 0 && (
          <div className="text-sm font-medium bg-gray-100 px-3 py-1 rounded">
            Time left: {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
          </div>
        )}
      </div>
      <div className="space-y-8">
        {orderedCategories.map((cat) => (
          <div key={cat}>
            <h2 className="text-xl font-semibold mb-3">{cat}</h2>
            <div className="space-y-6">
              {byCategory[cat].map((q, i) => (
                <div key={q.id} className="border rounded-lg p-4 bg-white">
                  <div className="font-medium mb-2">{q.question}</div>
                  {q.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {q.options?.map((opt) => (
                        <label key={opt} className="flex items-center gap-2">
                          <input type="radio" name={q.id} onChange={() => setAnswers((p) => ({ ...p, [q.id]: opt }))} />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {q.type === 'text' && (
                    <Textarea onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))} />
                  )}
                  {q.type === 'rating' && (
                    <Input type="number" min={1} max={5} onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: Number(e.target.value) }))} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit'}</Button>
      </div>
    </div>
  );
}


