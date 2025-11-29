'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Upload, Sparkles, Settings2, ChevronDown, ChevronUp } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [storyText, setStoryText] = useState('');
  const [fileName, setFileName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Settings
  const [targetAge, setTargetAge] = useState(6);
  const [intensity, setIntensity] = useState(5);
  const [pageCount, setPageCount] = useState(10);
  const [aestheticStyle, setAestheticStyle] = useState('watercolor children\'s book illustration, soft and whimsical');
  const [freeformNotes, setFreeformNotes] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    
    // Simple text extraction (for .txt files)
    if (file.type === 'text/plain') {
      const text = await file.text();
      setStoryText(text);
    } else {
      alert('For this demo, please use .txt files. PDF/EPUB parsing requires additional setup.');
    }
  };

  const handleGenerate = async () => {
    if (!storyText.trim()) {
      alert('Please enter or upload a story first');
      return;
    }

    setIsLoading(true);
    
    // Generate a unique story ID
    const storyId = crypto.randomUUID();
    
    // Store in sessionStorage for the studio page to pick up
    sessionStorage.setItem('pendingStory', JSON.stringify({
      storyId,
      storyText,
      fileName,
      settings: {
        targetAge,
        harshness: intensity,
        desiredPageCount: pageCount,
        aestheticStyle,
        freeformNotes,
        characterConsistency: true,
        qualityTier: 'standard-flash',
        aspectRatio: '2:3',
      }
    }));

    // Navigate to studio
    router.push(`/studio?id=${storyId}`);
  };

  const artStyles = [
    'watercolor children\'s book illustration, soft and whimsical',
    'Pixar-style 3D render, vibrant and expressive',
    'paper cutout collage, colorful and tactile',
    'classic Disney animation style, warm and magical',
    'Studio Ghibli inspired, detailed and serene',
    'bold cartoon style, bright colors and clean lines',
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-amber-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-amber-600" />
            <div>
              <h1 className="text-xl font-heading font-semibold text-stone-800">
                Storybook Generator
              </h1>
              <p className="text-xs text-stone-500">Powered by n8n + Gemini</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-heading font-bold text-stone-800 mb-4">
            Transform Any Story Into a
            <span className="text-amber-600"> Picture Book</span>
          </h2>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            Upload a story or paste text, and our AI will create beautiful, 
            consistent illustrations for every page.
          </p>
        </div>

        {/* Main Card */}
        <div className="card p-8 mb-8 animate-fade-in">
          {/* Story Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Your Story
            </label>
            <textarea
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              placeholder="Paste your story text here, or upload a file below..."
              className="input min-h-[200px] resize-y"
            />
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-stone-200 rounded-lg hover:border-amber-400 hover:bg-amber-50/50 transition-smooth cursor-pointer">
              <Upload className="h-5 w-5 text-stone-400" />
              <span className="text-stone-600">
                {fileName || 'Upload a .txt file'}
              </span>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Child's Age
              </label>
              <input
                type="number"
                min={3}
                max={18}
                value={targetAge}
                onChange={(e) => setTargetAge(Number(e.target.value))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Intensity (0-10)
              </label>
              <input
                type="range"
                min={0}
                max={10}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="text-sm text-stone-500 text-center mt-1">{intensity}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Page Count
              </label>
              <input
                type="number"
                min={5}
                max={30}
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                className="input"
              />
            </div>
          </div>

          {/* Art Style */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Art Style
            </label>
            <select
              value={aestheticStyle}
              onChange={(e) => setAestheticStyle(e.target.value)}
              className="input"
            >
              {artStyles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-stone-600 hover:text-amber-600 mb-4"
          >
            <Settings2 className="h-4 w-4" />
            Advanced Settings
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showAdvanced && (
            <div className="p-4 bg-stone-50 rounded-lg mb-6 animate-fade-in">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Creative Notes (optional)
              </label>
              <textarea
                value={freeformNotes}
                onChange={(e) => setFreeformNotes(e.target.value)}
                placeholder="Any additional instructions for the AI..."
                className="input min-h-[100px]"
              />
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || !storyText.trim()}
            className="w-full btn btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Picture Book
              </>
            )}
          </button>
        </div>

        {/* Info Section */}
        <div className="text-center text-sm text-stone-500">
          <p>
            This app calls an n8n workflow that orchestrates AI agents 
            for story analysis, character extraction, and image generation.
          </p>
        </div>
      </div>
    </main>
  );
}

