'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, BookOpen, Ear, Puzzle, Upload } from 'lucide-react';

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState('adhd');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const modes = [
    { 
      id: 'adhd', 
      name: 'ADHD Focus', 
      icon: Brain, 
      color: 'blue',
      desc: 'Short chunks, gamified, lots of breaks'
    },
   
  ];

  async function handleConvert() {
    if (!file) {
      alert('Please select a PDF file first');
      return;
    }

    // Check file type
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Please use a PDF smaller than 10MB');
      return;
    }

    setLoading(true);
    try {
      console.log('📄 Converting file:', file.name, 'Size:', file.size);
      
      const base64 = await fileToBase64(file);
      console.log('✅ Base64 conversion done, length:', base64.length);

      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64: base64, mode })
      });

      const data = await response.json();
      console.log('📡 Server response:', data);

      if (data.success) {
        sessionStorage.setItem('pdfContent', JSON.stringify(data));
        sessionStorage.setItem('pdfMode', mode);
        router.push('/reader');
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('💥 Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (!result) {
          reject(new Error('Failed to read file'));
          return;
        }
        resolve(result.split(',')[1]);
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsDataURL(file);
    });
  }

  const currentMode = modes.find(m => m.id === mode)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            📚 ReadEaseAI
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex justify-center items-center py-10">
  {modes.map(({ id, name, icon: Icon, color, desc }) => (
    <button
      key={id}
      onClick={() => setMode(id)}
      className={`p-8 w-96 text-center rounded-2xl border-2 transition-all ${
        mode === id
          ? `bg-${color}-500 text-white border-transparent shadow-xl scale-105`
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
      }`}
    >
      <Icon className="mx-auto mb-4" size={60} />
      <div className="font-bold text-2xl mb-2">{name}</div>
      <div className={`text-base ${mode === id ? 'text-white/90' : 'text-gray-600'}`}>
        {desc}
      </div>
    </button>
  ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6">Upload Your PDF</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors">
            <Upload className="mx-auto mb-4 text-gray-400" size={64} />
            
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="pdf-upload"
            />
            
            <label
              htmlFor="pdf-upload"
              className="cursor-pointer bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 inline-block transition-colors"
            >
              Choose PDF File
            </label>
            
            {file && (
              <div className="mt-4">
                <p className="text-green-600 font-medium">
                  ✓ {file.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Size: {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}
          </div>

          {file && (
            <button
              onClick={handleConvert}
              disabled={loading}
              className={`w-full mt-8 py-4 rounded-xl font-bold text-lg transition-all ${
                loading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-xl'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Converting to {currentMode.name}...
                </span>
              ) : (
                `✨ Convert to ${currentMode.name}`
              )}
            </button>
          )}
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm">
            🔒 Your PDFs are processed securely and never stored
          </p>
        </div>
      </div>
    </div>
  );
}
