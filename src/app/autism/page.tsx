'use client';

import React, { useState, ChangeEvent, useMemo } from 'react';
import { Upload, FileText, Loader2, BookOpen, CheckCircle2, Volume2, Square } from 'lucide-react';

/** ---------- Types matching the backend schema ---------- */
type VocabItem = { term: string; definition: string; example: string };
type TFQ = { q: string; answer: boolean; explain: string };
type MCQ = { q: string; options: string[]; answer: string; explain: string };
type SAQ = { q: string; idealAnswer: string; rubric: string[] };

type LessonJSON = {
  "Summary": string[];
  "Vocabulary": VocabItem[];
  "Questions": {
    "trueFalse": TFQ;
    "mcq": MCQ;
    "shortAnswer": SAQ;
  };
  "Draw-it": { title: string; labels: string[]; caption: string };
  "Review Plan": { when: string; minutes: number; plan: string[] }[];
};

/** ---------- Small UI helpers ---------- */
const cn = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

function Pill({
  children,
  kind = 'info' as 'info' | 'correct' | 'wrong',
}: React.PropsWithChildren<{ kind?: 'info' | 'correct' | 'wrong' }>) {
  const base = 'inline-block text-xs font-semibold px-2 py-1 rounded-full';
  const palette =
    kind === 'correct'
      ? 'bg-green-100 text-green-800 border border-green-200'
      : kind === 'wrong'
      ? 'bg-red-100 text-red-800 border border-red-200'
      : 'bg-blue-100 text-blue-800 border border-blue-200';
  return <span className={cn(base, palette)}>{children}</span>;
}

/** ---------- Speech hook (shared across buttons) ---------- */
function useSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [speaking, setSpeaking] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const stop = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setCurrentId(null);
  };

  const speak = (id: string, text: string) => {
    if (!supported || !text.trim()) return;
    // If the same section is currently speaking, toggle to stop
    if (speaking && currentId === id) {
      stop();
      return;
    }
    // Stop any ongoing speech and start new
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.75;   // slightly slower, easier to follow
    u.pitch = 1;
    u.onend = () => { setSpeaking(false); setCurrentId(null); };
    u.onerror = () => { setSpeaking(false); setCurrentId(null); };

    setSpeaking(true);
    setCurrentId(id);
    window.speechSynthesis.speak(u);
  };

  return { supported, speaking, currentId, speak, stop };
}

/** ---------- Speak Button ---------- */
function SpeakButton({
  id,
  getText,
  speech,
  label = 'Read aloud'
}: {
  id: string;
  getText: () => string;
  speech: ReturnType<typeof useSpeech>;
  label?: string;
}) {
  const { supported, speaking, currentId, speak, stop } = speech;
  const isThisSpeaking = speaking && currentId === id;
  return (
    <button
      type="button"
      onClick={() => (isThisSpeaking ? stop() : speak(id, getText()))}
      disabled={!supported}
      title={supported ? (isThisSpeaking ? 'Stop' : label) : 'Not supported in this browser'}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-sm',
        isThisSpeaking ? 'bg-red-50 border-red-300 text-red-800' : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-800',
        !supported && 'opacity-50 cursor-not-allowed'
      )}
    >
      {isThisSpeaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      {isThisSpeaking ? 'Stop' : label}
    </button>
  );
}

export default function AutismPDFLearner() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [lesson, setLesson] = useState<LessonJSON | null>(null);
  const [error, setError] = useState<string>('');
  const [age, setAge] = useState<string>('20');
  const [currentSection, setCurrentSection] = useState<number>(0);

  // Interactive states
  const [tfAnswered, setTfAnswered] = useState<boolean>(false);
  const [tfChoice, setTfChoice] = useState<boolean | null>(null);

  const [mcqChecked, setMcqChecked] = useState<boolean>(false);
  const [mcqChoice, setMcqChoice] = useState<string>('');

  const [saShown, setSaShown] = useState<boolean>(false);
  const [saText, setSaText] = useState<string>('');

  // Shared speech controller
  const speech = useSpeech();

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setFile(uploadedFile);
      setError('');
    } else {
      setError('Please upload a PDF file');
    }
  };

  async function callGenerate(section: number) {
    if (!file) return;

    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const response = await fetch('/api/generate-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfData: base64Data,
        age,
        sectionNumber: section
      })
    });

    const data = await response.json();

    if (data?.json) {
      setLesson(data.json as LessonJSON);
    } else {
      throw new Error(data?.error || 'Could not parse lesson JSON');
    }
  }

  const resetQA = () => {
    setTfAnswered(false);
    setTfChoice(null);
    setMcqChecked(false);
    setMcqChoice('');
    setSaShown(false);
    setSaText('');
    // stop any playing speech
    speech.stop();
  };

  const generateLesson = async () => {
    if (!file) {
      setError('Please upload a PDF first');
      return;
    }
    setLoading(true);
    setError('');
    resetQA();
    try {
      await callGenerate(0);
      setCurrentSection(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Error processing PDF: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getNextSection = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    resetQA();
    try {
      await callGenerate(currentSection + 1);
      setCurrentSection(s => s + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Error processing PDF: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /** ---------- Section text builders for TTS ---------- */
  const summaryText = useMemo(() => {
    if (!lesson?.['Summary']?.length) return '';
    return ['Summary.', ...lesson['Summary'].map((b) => `• ${b}.`)].join(' ');
  }, [lesson]);

  const vocabularyText = useMemo(() => {
    if (!lesson?.['Vocabulary']?.length) return '';
    return [
      'Vocabulary.',
      ...lesson['Vocabulary'].map(
        (v) =>
          `Term: ${v.term}. Definition: ${v.definition}. Example: ${v.example || 'No example.'}.`
      ),
    ].join(' ');
  }, [lesson]);

  const questionsText = useMemo(() => {
    const q = lesson?.['Questions'];
    if (!q) return '';
    const mcqOpts = q.mcq.options.map((o, i) => `Option ${String.fromCharCode(65 + i)}: ${o}.`).join(' ');
    return [
      'Questions.',
      `True or False: ${q.trueFalse.q}.`,
      `Multiple choice: ${q.mcq.q}. ${mcqOpts}`,
      `Short answer: ${q.shortAnswer.q}.`,
    ].join(' ');
  }, [lesson]);

  const drawItText = useMemo(() => {
    const d = lesson?.['Draw-it'];
    if (!d) return '';
    return [
      'Draw it.',
      `Title: ${d.title}.`,
      `Labels: ${d.labels.join(', ')}.`,
      `Caption: ${d.caption}.`,
    ].join(' ');
  }, [lesson]);

  const reviewPlanText = useMemo(() => {
    const rp = lesson?.['Review Plan'];
    if (!rp?.length) return '';
    const items = rp
      .map(
        (r) =>
          `${r.when}, ${r.minutes} minutes. ${r.plan?.length ? r.plan.join('. ') + '.' : ''}`
      )
      .join(' ');
    return `Review plan. ${items}`;
  }, [lesson]);

  /** ---------- Renderers ---------- */
  const renderSummary = () => {
    if (!lesson?.['Summary']?.length) return null;
    return (
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-blue-800">Summary</h2>
          <Pill>overview</Pill>
          <SpeakButton id="summary" getText={() => summaryText} speech={speech} />
        </div>
        <ul className="list-disc pl-6 space-y-1">
          {lesson['Summary'].map((b, i) => (
            <li key={i} className="leading-7">{b}</li>
          ))}
        </ul>
      </section>
    );
  };

  const renderVocabulary = () => {
    if (!lesson?.['Vocabulary']?.length) return null;
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-blue-800">Vocabulary</h2>
          <Pill>3 terms</Pill>
          <SpeakButton id="vocab" getText={() => vocabularyText} speech={speech} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 border-b">Term</th>
                <th className="text-left px-4 py-2 border-b">Definition</th>
                <th className="text-left px-4 py-2 border-b">Example</th>
              </tr>
            </thead>
            <tbody>
              {lesson['Vocabulary'].map((v, i) => (
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  <td className="px-4 py-2 border-b align-top font-medium">{v.term}</td>
                  <td className="px-4 py-2 border-b align-top">{v.definition}</td>
                  <td className="px-4 py-2 border-b align-top">{v.example || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  const renderQuestions = () => {
    const qs = lesson?.['Questions'];
    if (!qs) return null;

    const tfCorrect = tfChoice === qs.trueFalse.answer;

    return (
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-blue-800">Check Your Understanding</h2>
          <Pill>practice</Pill>
          <SpeakButton id="questions" getText={() => questionsText} speech={speech} />
        </div>

        {/* True / False */}
        <div className="p-5 border rounded-2xl bg-white shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">True / False</h3>
            <Pill>1 question</Pill>
          </div>
          <p className="text-lg">{qs.trueFalse.q}</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={tfChoice === true}
              onClick={() => {
                if (tfAnswered) return;
                setTfChoice(true);
                setTfAnswered(true);
              }}
              className={cn(
                'w-full rounded-xl border px-4 py-3 text-center text-lg font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                !tfAnswered && tfChoice === true && 'ring-2 ring-blue-400',
                tfAnswered && tfChoice === true && tfCorrect && 'bg-green-100 border-green-300 text-green-900',
                tfAnswered && tfChoice === true && !tfCorrect && 'bg-red-100 border-red-300 text-red-900',
                tfChoice !== true && 'bg-white hover:bg-gray-50 border-gray-300 text-gray-900'
              )}
            >
              True
            </button>

            <button
              type="button"
              aria-pressed={tfChoice === false}
              onClick={() => {
                if (tfAnswered) return;
                setTfChoice(false);
                setTfAnswered(true);
              }}
              className={cn(
                'w-full rounded-xl border px-4 py-3 text-center text-lg font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                !tfAnswered && tfChoice === false && 'ring-2 ring-blue-400',
                tfAnswered && tfChoice === false && !(tfCorrect) && 'bg-red-100 border-red-300 text-red-900',
                tfAnswered && tfChoice === false && tfCorrect && 'bg-green-100 border-green-300 text-green-900',
                tfChoice !== false && 'bg-white hover:bg-gray-50 border-gray-300 text-gray-900'
              )}
            >
              False
            </button>
          </div>

          <div className="min-h-[1.5rem]" aria-live="polite" role="status">
            {tfAnswered && (
              <p className={cn('mt-2 font-medium transition-colors', tfCorrect ? 'text-green-700' : 'text-red-700')}>
                {tfCorrect
                  ? '✅ Correct'
                  : `❌ Incorrect. Correct answer: ${qs.trueFalse.answer ? 'True' : 'False'}`}
                {qs.trueFalse.explain ? (
                  <span className="block text-gray-700 mt-1">{qs.trueFalse.explain}</span>
                ) : null}
              </p>
            )}
          </div>
        </div>

        {/* MCQ */}
        <div className="p-5 border rounded-2xl bg-white shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Multiple Choice</h3>
            <Pill>pick one</Pill>
          </div>
          <p className="text-lg">{qs.mcq.q}</p>

          <div className="grid gap-3">
            {qs.mcq.options.map((opt, idx) => {
              const selected = mcqChoice === opt;
              const isCorrectOpt = mcqChecked && opt === qs.mcq.answer;
              const isWrongOpt = mcqChecked && selected && opt !== qs.mcq.answer;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => !mcqChecked && setMcqChoice(opt)}
                  className={cn(
                    'flex items-center justify-start gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    !mcqChecked && selected && 'ring-2 ring-blue-400 border-blue-300 bg-blue-50',
                    !mcqChecked && !selected && 'bg-white hover:bg-gray-50 border-gray-300',
                    isCorrectOpt && 'bg-green-100 border-green-300',
                    isWrongOpt && 'bg-red-100 border-red-300'
                  )}
                >
                  <span className="shrink-0 h-6 w-6 grid place-items-center rounded-full border">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-base">{opt}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              className="mt-1 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              onClick={() => setMcqChecked(true)}
              disabled={mcqChecked || !mcqChoice}
            >
              Check Answer
            </button>
            {mcqChecked && (
              <Pill kind={mcqChoice === qs.mcq.answer ? 'correct' : 'wrong'}>
                {mcqChoice === qs.mcq.answer ? 'Correct' : 'Try again'}
              </Pill>
            )}
          </div>

          <div className="min-h-[1.5rem]" aria-live="polite" role="status">
            {mcqChecked && (
              <p className="mt-2 text-gray-700">
                Correct answer: <span className="font-semibold">{qs.mcq.answer}</span>
                {qs.mcq.explain ? <span className="block mt-1">{qs.mcq.explain}</span> : null}
              </p>
            )}
          </div>
        </div>

        {/* Short Answer */}
        <div className="p-5 border rounded-2xl bg-white shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Short Answer</h3>
            <Pill>free response</Pill>
          </div>
          <p className="text-lg">{qs.shortAnswer.q}</p>

          <textarea
            className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
            rows={3}
            placeholder="Type your answer..."
            value={saText}
            onChange={(e) => setSaText(e.target.value)}
            disabled={saShown}
          />
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              onClick={() => setSaShown(true)}
              disabled={saShown || !saText.trim()}
            >
              Show Feedback
            </button>
            {saShown && <Pill kind="info">model answer</Pill>}
          </div>

          {saShown && (
            <div className="mt-2 rounded-xl border bg-gray-50 px-4 py-3">
              <p className="font-medium text-blue-800">Ideal answer</p>
              <p className="text-gray-900 mt-1">{qs.shortAnswer.idealAnswer || '(No ideal answer provided)'}</p>
              {qs.shortAnswer.rubric?.length ? (
                <ul className="list-disc pl-6 mt-2 text-gray-700">
                  {qs.shortAnswer.rubric.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              ) : null}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderDrawIt = () => {
    const d = lesson?.['Draw-it'];
    if (!d) return null;
    return (
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-blue-800">Draw-it (Make a simple diagram)</h2>
          <Pill>visual</Pill>
          <SpeakButton id="drawit" getText={() => drawItText} speech={speech} />
        </div>
        <p><span className="font-semibold">Title:</span> {d.title}</p>
        <p className="font-semibold">Labels:</p>
        <ul className="list-disc pl-6">
          {d.labels.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
        <p><span className="font-semibold">Caption:</span> {d.caption}</p>
      </section>
    );
  };

  const renderReviewPlan = () => {
    const rp = lesson?.['Review Plan'];
    if (!rp?.length) return null;
    return (
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-blue-800">Review Plan</h2>
          <Pill>spaced</Pill>
          <SpeakButton id="review" getText={() => reviewPlanText} speech={speech} />
        </div>
        <ul className="list-disc pl-6">
          {rp.map((r, i) => (
            <li key={i}>
              <span className="font-semibold">{r.when}</span> — {r.minutes} min
              {r.plan?.length ? (
                <ul className="list-disc pl-6 mt-1">
                  {r.plan.map((p, j) => <li key={j}>{p}</li>)}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Learning Assistant</h1>
          </div>
          <p className="text-gray-600 text-lg">Upload a PDF and learn step by step</p>
        </div>

        {!lesson && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-700 mb-2">Your Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-32 px-4 py-2 border-2 border-gray-300 rounded-lg text-lg"
                min="1"
                max="100"
              />
            </div>

            <div className="border-4 border-dashed border-blue-300 rounded-lg p-12 text-center">
              <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <label className="cursor-pointer">
                <span className="text-xl font-semibold text-blue-600 hover:text-blue-700">
                  Click to upload PDF
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {file && (
                <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="text-lg font-medium">{file.name}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-100 border-2 border-red-300 rounded-lg">
                <p className="text-red-700 text-lg">{error}</p>
              </div>
            )}

            <button
              onClick={generateLesson}
              disabled={!file || loading}
              className="w-full mt-6 py-4 bg-blue-600 text-white rounded-lg text-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Creating your lesson...
                </>
              ) : (
                <>
                  <FileText className="w-6 h-6" />
                  Start Learning
                </>
              )}
            </button>
          </div>
        )}

        {lesson && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-8">{renderSummary()}</div>
            <div className="bg-white rounded-lg shadow-lg p-8">{renderVocabulary()}</div>
            <div className="bg-white rounded-lg shadow-lg p-8">{renderQuestions()}</div>
            <div className="bg-white rounded-lg shadow-lg p-8">{renderDrawIt()}</div>
            <div className="bg-white rounded-lg shadow-lg p-8">{renderReviewPlan()}</div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setLesson(null);
                  setFile(null);
                  setCurrentSection(0);
                  resetQA();
                }}
                className="flex-1 py-4 bg-gray-600 text-white rounded-lg text-xl font-semibold hover:bg-gray-700"
              >
                Upload New PDF
              </button>

              <button
                onClick={getNextSection}
                disabled={loading}
                className="flex-1 py-4 bg-green-600 text-white rounded-lg text-xl font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Next Section'
                )}
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-100 border-2 border-red-300 rounded-lg">
                <p className="text-red-700 text-lg">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}