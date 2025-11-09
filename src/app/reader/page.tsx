'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { 
  CheckCircle, Clock, ArrowLeft, PlayCircle, PauseCircle, Volume2, VolumeX 
} from 'lucide-react';

export default function ReaderPage() {
  const router = useRouter();
  const [chunks, setChunks] = useState<string[]>([]);
  const [mode, setMode] = useState('');
  const [currentChunk, setCurrentChunk] = useState(0);
  const [completedChunks, setCompletedChunks] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  // TTS state
  const [isNarrating, setIsNarrating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voice, setVoice] = useState<'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'>('alloy');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const content = sessionStorage.getItem('pdfContent');
    const savedMode = sessionStorage.getItem('pdfMode');
    
    if (!content || !savedMode) {
      router.push('/');
      return;
    }

    const data = JSON.parse(content);
    setChunks(data.chunks);
    setMode(savedMode);
  }, [router]);

  useEffect(() => {
    if (!isTimerActive) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsTimerActive(false);
          alert('🎉 Great focus! Time for a 5-minute break!');
          return 25 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isTimerActive]);

  // Stop audio when chunk changes
  useEffect(() => {
    return () => {
      stopNarration();
    };
  }, [currentChunk]);

  function cleanTextForSpeech(text: string): string {
    return text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/---/g, '. ')
      .replace(/([🎯📚✅💡🔥⚡🌟🎮🏆⭐🌈🌱🌿🌳])\s*/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\n/g, '. ')
      .trim();
  }

  async function startNarration() {
    if (isNarrating) {
      stopNarration();
      return;
    }

    setIsLoading(true);
    console.log('🎤 Starting OpenAI TTS...');

    try {
      const text = cleanTextForSpeech(chunks[currentChunk]);
      
      if (!text || text.length === 0) {
        alert('❌ No text to read in this section');
        setIsLoading(false);
        return;
      }

      console.log('📝 Text length:', text.length);
      console.log('🎵 Voice:', voice);

      // Call your TTS API
      const response = await fetch('/api/tts_adhd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, model: 'tts-1' })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'TTS failed');
      }

      const data = await response.json();
      console.log('✅ Received audio data');

      // Create audio element
      const audioBlob = base64ToBlob(data.base64Chunks[0].base64, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        console.log('▶️ Audio playing');
        setIsNarrating(true);
        setIsLoading(false);
      };

      audio.onended = () => {
        console.log('⏹️ Audio ended');
        setIsNarrating(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (e) => {
        console.error('❌ Audio error:', e);
        setIsNarrating(false);
        setIsLoading(false);
        alert('Error playing audio');
      };

      await audio.play();

    } catch (error: any) {
      console.error('❌ TTS Error:', error);
      alert('Error: ' + error.message);
      setIsLoading(false);
      setIsNarrating(false);
    }
  }

  function stopNarration() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsNarrating(false);
    setIsLoading(false);
  }

  function base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
  }

  function handleChunkComplete(index: number) {
    stopNarration();
    
    const newCompleted = new Set(completedChunks);
    newCompleted.add(index);
    setCompletedChunks(newCompleted);
    
    if (newCompleted.size === chunks.length) {
      celebrate();
    } else {
      setCurrentChunk(index + 1);
    }
  }

  function celebrate() {
    stopNarration();
    const confetti = document.createElement('div');
    confetti.innerHTML = '🎉🎊✨🌟🏆'.repeat(10);
    confetti.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 3rem;
      z-index: 10000;
      animation: celebrate 2s ease-out;
    `;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 2000);
  }

  const progress = (completedChunks.size / chunks.length) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (chunks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      
      <div className="sticky top-0 z-50 bg-white shadow-lg">
        <div className="max-w-4xl mx-auto p-6">
          
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => {
                stopNarration();
                router.push('/');
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                <Clock size={20} className="text-blue-500" />
                <span className="font-mono text-xl font-bold">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
              </div>
              <button
                onClick={() => setIsTimerActive(!isTimerActive)}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {isTimerActive ? <PauseCircle size={24} /> : <PlayCircle size={24} />}
              </button>
            </div>
          </div>

          {/* AI Narrator Controls */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-4 border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="text-purple-600" size={24} />
                <div>
                  <div className="font-bold text-gray-900">AI Narrator (OpenAI)</div>
                  <div className="text-sm text-gray-600">
                    {isLoading ? '⏳ Generating audio...' : isNarrating ? '🔊 Playing...' : '🔇 Ready to read'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Voice Selection */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Voice:</label>
                  <select
                    value={voice}
                    onChange={(e) => setVoice(e.target.value as any)}
                    className="px-3 py-1 border-2 border-gray-300 rounded-lg text-sm font-medium"
                    disabled={isNarrating || isLoading}
                  >
                    <option value="alloy">Alloy (Neutral)</option>
                    <option value="echo">Echo (Male)</option>
                    <option value="fable">Fable (British)</option>
                    <option value="onyx">Onyx (Deep)</option>
                    <option value="nova">Nova (Female)</option>
                    <option value="shimmer">Shimmer (Soft)</option>
                  </select>
                </div>

                {/* Play/Stop Button */}
                <button
                  onClick={startNarration}
                  disabled={isLoading}
                  className={`px-6 py-3 rounded-lg font-bold text-lg transition-all flex items-center gap-2 ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : isNarrating
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-purple-500 hover:bg-purple-600'
                  } text-white`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      Loading...
                    </>
                  ) : isNarrating ? (
                    <>
                      <VolumeX size={24} />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 size={24} />
                      Read Aloud
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Your Progress</span>
              <span className="font-bold text-blue-600">
                {completedChunks.size} / {chunks.length} sections
              </span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex justify-around">
            {[
              { threshold: 25, emoji: '🌱', label: 'Started' },
              { threshold: 50, emoji: '🌿', label: 'Halfway!' },
              { threshold: 75, emoji: '🌳', label: 'Almost!' },
              { threshold: 100, emoji: '🏆', label: 'Complete!' }
            ].map(({ threshold, emoji, label }) => (
              <div
                key={threshold}
                className={`text-center transition-all duration-500 ${
                  progress >= threshold 
                    ? 'scale-110 opacity-100' 
                    : 'opacity-30 grayscale'
                }`}
              >
                <div className="text-4xl mb-1">{emoji}</div>
                <div className="text-xs font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-8">
        {chunks.map((chunk, index) => {
          const isActive = index === currentChunk;
          const isCompleted = completedChunks.has(index);
          
          return (
            <div
              key={index}
              className={`mb-12 transition-all duration-500 ${
                isActive 
                  ? 'scale-100 opacity-100' 
                  : 'scale-95 opacity-20 blur-sm pointer-events-none'
              }`}
            >
              <div className={`bg-white rounded-2xl shadow-2xl p-8 ${
                isActive ? 'ring-4 ring-blue-400' : ''
              } ${
                isCompleted ? 'border-l-8 border-green-500' : ''
              }`}>
                
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-lg">Section {index + 1}</div>
                      <div className="text-sm text-gray-500">⏱️ 2-3 min read</div>
                    </div>
                  </div>
                  
                  {isCompleted && (
                    <div className="flex items-center gap-2 text-green-600 font-bold">
                      <CheckCircle size={32} />
                      <span>Done!</span>
                    </div>
                  )}
                </div>

                <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-li:text-gray-800">
                  <ReactMarkdown
                    components={{
                      p: ({ node, children, ...props }) => (
                        <p className="text-gray-800 text-lg leading-relaxed mb-4" {...props}>
                          {children}
                        </p>
                      ),
                      h1: ({ node, ...props }) => (
                        <h1 className="text-3xl font-bold text-gray-900 mb-4" {...props} />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 className="text-2xl font-bold text-gray-900 mb-3 mt-6" {...props} />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-xl font-bold text-gray-900 mb-2 mt-4" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="bg-yellow-200 px-1 font-bold text-gray-900" {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="space-y-2 my-4 text-gray-800" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="space-y-2 my-4 text-gray-800" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="ml-6 text-gray-800 text-lg" {...props} />
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-4" {...props} />
                      ),
                      code: ({ node, ...props }) => (
                        <code className="bg-gray-100 text-gray-900 px-2 py-1 rounded text-sm" {...props} />
                      ),
                    }}
                  >
                    {chunk}
                  </ReactMarkdown>
                </div>

                {isActive && !isCompleted && (
                  <button
                    onClick={() => handleChunkComplete(index)}
                    className="mt-8 w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    ✅ Got it! {index < chunks.length - 1 ? 'Next section' : 'Complete!'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes celebrate {
          0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.5) rotate(180deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
