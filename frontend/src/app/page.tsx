'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Sparkles,
  Settings2,
  ChevronDown,
  ChevronUp,
  Wand2,
  BookMarked,
  Star,
} from 'lucide-react';
import { Button, Card, Textarea } from '@/components';
import { StoryInput } from '@/components/StoryInput';
import { HeroPhotoUpload } from '@/components/HeroPhotoUpload';
import { StylePicker } from '@/components/StylePicker';
import { StorySelector } from '@/components/StorySelector';

// Floating decoration component
function FloatingDecoration({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`absolute pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

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
  const [aestheticStyle, setAestheticStyle] = useState(
    "watercolor children's book illustration, soft and whimsical, gentle brush strokes"
  );
  const [freeformNotes, setFreeformNotes] = useState('');
  const [heroImage, setHeroImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!storyText.trim()) {
      alert('Please enter or upload a story first');
      return;
    }

    setIsLoading(true);

    // Generate a unique story ID
    const storyId = crypto.randomUUID();

    // Store in sessionStorage for the studio page to pick up
    sessionStorage.setItem(
      'pendingStory',
      JSON.stringify({
        storyId,
        storyText,
        fileName,
        settings: {
          targetAge,
          harshness: intensity,
          desiredPageCount: pageCount,
          aestheticStyle,
          freeformNotes,
          heroImage,
          characterConsistency: true,
          qualityTier: 'standard-flash',
          aspectRatio: '2:3',
        },
      })
    );

    // Navigate to studio
    router.push(`/studio?id=${storyId}`);
  };

  const intensityLabels = ['Very gentle', 'Gentle', 'Mild', 'Moderate', 'Balanced', 'Standard', 'Engaging', 'Dynamic', 'Intense', 'Very intense', 'Maximum'];

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-stone-50 to-rose-50 animate-gradient" />

      {/* Floating decorations */}
      <FloatingDecoration className="top-20 left-[5%] animate-float text-4xl opacity-30">
        <BookOpen className="h-16 w-16 text-amber-400" />
      </FloatingDecoration>
      <FloatingDecoration className="top-40 right-[8%] animate-float-delayed text-4xl opacity-20">
        <Star className="h-12 w-12 text-amber-500" />
      </FloatingDecoration>
      <FloatingDecoration className="top-[60%] left-[3%] animate-float-slow text-4xl opacity-25">
        <Sparkles className="h-10 w-10 text-rose-400" />
      </FloatingDecoration>
      <FloatingDecoration className="bottom-40 right-[5%] animate-float text-4xl opacity-20">
        <BookMarked className="h-14 w-14 text-sage-400" />
      </FloatingDecoration>
      <FloatingDecoration className="bottom-20 left-[15%] animate-float-delayed opacity-15">
        <Wand2 className="h-10 w-10 text-amber-600" />
      </FloatingDecoration>

      {/* Subtle sparkle dots */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-2 h-2 bg-amber-400 rounded-full animate-shimmer" />
        <div className="absolute top-[25%] right-[25%] w-1.5 h-1.5 bg-rose-400 rounded-full animate-shimmer" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-[45%] left-[10%] w-1 h-1 bg-amber-500 rounded-full animate-shimmer" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-[30%] right-[15%] w-2 h-2 bg-amber-300 rounded-full animate-shimmer" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-[45%] left-[30%] w-1.5 h-1.5 bg-sage-400 rounded-full animate-shimmer" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="glass border-b border-white/50 sticky top-0 z-20">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-semibold text-stone-800">
                  Storybook Generator
                </h1>
                <p className="text-xs text-stone-500">
                  Powered by n8n + Gemini AI
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-6 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100/80 text-amber-700 text-sm font-medium mb-6">
              <Wand2 className="h-4 w-4" />
              AI-Powered Picture Books
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-stone-800 mb-6 leading-tight">
              Transform Any Story Into
              <br />
              <span className="bg-gradient-to-r from-amber-600 via-rose-500 to-amber-600 bg-clip-text text-transparent animate-gradient">
                Beautiful Illustrations
              </span>
            </h2>

            <p className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
              Paste your story or upload a file, and our AI will create
              stunning, consistent illustrations for every page of your
              children&apos;s book.
            </p>
          </div>

          {/* Main Form Card */}
          <Card variant="elevated" padding="lg" className="mb-8 animate-fade-in">
            {/* Story Input Section */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <span className="text-amber-600 font-heading font-bold text-sm">1</span>
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-stone-800">
                    Your Story
                  </h3>
                </div>
                <StorySelector
                  onSelect={(text, title) => {
                    setStoryText(text);
                    setFileName(title);
                  }}
                />
              </div>
              <StoryInput
                value={storyText}
                onChange={setStoryText}
                fileName={fileName}
                onFileChange={setFileName}
              />
            </div>

            {/* Settings Grid */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <span className="text-amber-600 font-heading font-bold text-sm">2</span>
                </div>
                <h3 className="text-lg font-heading font-semibold text-stone-800">
                  Book Settings
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Reader Age
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={3}
                      max={18}
                      value={targetAge}
                      onChange={(e) => setTargetAge(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl bg-white/80 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                      years
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1.5">
                    Adjusts vocabulary and themes
                  </p>
                </div>

                {/* Page Count */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Page Count
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={5}
                      max={30}
                      value={pageCount}
                      onChange={(e) => setPageCount(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl bg-white/80 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                      pages
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1.5">
                    5-30 pages available
                  </p>
                </div>

                {/* Intensity */}
                <div className="md:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Story Intensity
                  </label>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={intensity}
                      onChange={(e) => setIntensity(Number(e.target.value))}
                      className="w-full h-2 bg-gradient-to-r from-green-200 via-amber-200 to-red-200 rounded-full appearance-none cursor-pointer accent-amber-600"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-400">Gentle</span>
                      <span className="text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                        {intensityLabels[intensity]}
                      </span>
                      <span className="text-xs text-stone-400">Intense</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Art Style Section */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <span className="text-amber-600 font-heading font-bold text-sm">3</span>
                </div>
                <h3 className="text-lg font-heading font-semibold text-stone-800">
                  Art Style
                </h3>
              </div>
              <StylePicker value={aestheticStyle} onChange={setAestheticStyle} />
            </div>

            {/* Hero Photo Section */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <span className="text-amber-600 font-heading font-bold text-sm">4</span>
                </div>
                <h3 className="text-lg font-heading font-semibold text-stone-800">
                  Personalize
                </h3>
                <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                  Optional
                </span>
              </div>
              <div className="max-w-xs">
                <HeroPhotoUpload value={heroImage} onChange={setHeroImage} />
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="mb-8">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-stone-600 hover:text-amber-600 transition-colors group"
              >
                <Settings2 className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                Advanced Settings
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showAdvanced && (
                <div className="mt-4 p-5 bg-stone-50/80 rounded-xl animate-fade-in">
                  <Textarea
                    label="Creative Notes"
                    helper="Add any special instructions for the AI illustrator"
                    value={freeformNotes}
                    onChange={(e) => setFreeformNotes(e.target.value)}
                    placeholder="e.g., 'Make the forest scenes feel magical with glowing fireflies' or 'The dog should look like a golden retriever'"
                  />
                </div>
              )}
            </div>

            {/* Generate Button */}
            <Button
              size="lg"
              loading={isLoading}
              disabled={!storyText.trim()}
              onClick={handleGenerate}
              icon={<Sparkles className="h-5 w-5" />}
              className="w-full animate-glow"
            >
              {isLoading ? 'Preparing Your Story...' : 'Create Picture Book'}
            </Button>

            {/* Estimated time */}
            <p className="text-center text-xs text-stone-400 mt-4">
              Generation takes 12-20 minutes for a 10-page book
            </p>
          </Card>

          {/* Footer info */}
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center gap-4 text-xs text-stone-400">
              <span className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                n8n Workflow
              </span>
              <span className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Gemini 3 Pro
              </span>
              <span className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                ~$0.40/book
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
