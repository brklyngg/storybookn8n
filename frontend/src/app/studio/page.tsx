'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  BookOpen, ChevronLeft, Loader2, AlertTriangle,
  RefreshCw, Download, Eye, CheckCircle2
} from 'lucide-react';
import { fetchPageImages, fetchCharacterImages, pollStoryStatus } from '@/lib/supabase';

// Types
interface StoryPage {
  pageNumber: number;
  caption: string;
  imageData?: string;
  wasFixed?: boolean;
  savedToSupabase?: boolean;
}

interface Character {
  name: string;
  role: string;
  description: string;
  referenceImage?: string;
  savedToSupabase?: boolean;
}

interface GenerationResult {
  success: boolean;
  storyId: string;
  title: string;
  theme: string;
  storyArcSummary: string[];
  pages: StoryPage[];
  characters: Character[];
  metadata: {
    pageCount: number;
    characterCount: number;
    consistencyIssuesFound: number;
    pagesFixed: number;
    savedToSupabase?: boolean;
  };
}

// Get n8n webhook URL from env or use default
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/generate-storybook';

function StudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const storyId = searchParams.get('id');

  const [status, setStatus] = useState<'loading' | 'generating' | 'complete' | 'error'>('loading');
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);

  useEffect(() => {
    const pendingStory = sessionStorage.getItem('pendingStory');
    if (pendingStory) {
      const data = JSON.parse(pendingStory);
      if (data.storyId === storyId) {
        sessionStorage.removeItem('pendingStory');
        startGeneration(data);
      }
    }
  }, [storyId]);

  const startGeneration = async (data: any) => {
    setStatus('generating');
    setCurrentStep('Connecting to n8n workflow...');
    setError(null);

    try {
      // Trigger n8n workflow (fire and forget - don't wait for response)
      setCurrentStep('Starting workflow...');
      
      fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId: data.storyId,
          storyText: data.storyText,
          settings: data.settings,
        }),
      }).catch(err => {
        // Ignore timeout errors - workflow continues in background
        console.log('Workflow started (response may have timed out, but workflow continues)');
      });

      // Poll Supabase for completion status
      setCurrentStep('Workflow running...');
      
      const pollResult = await pollStoryStatus(
        data.storyId,
        (status, step) => {
          // Update progress based on workflow step
          const stepMessages: Record<string, string> = {
            'characters': 'Extracting characters...',
            'portraits': 'Generating character portraits...',
            'environments': 'Creating environment references...',
            'pages': 'Illustrating pages...',
            'consistency': 'Reviewing for consistency...',
            'fixing': 'Fixing inconsistencies...',
            'finalizing': 'Finalizing...'
          };
          setCurrentStep(stepMessages[step] || step);
        }
      );

      if (pollResult === 'timeout') {
        throw new Error('Story generation timed out after 20 minutes');
      }

      if (pollResult === 'error') {
        throw new Error('Story generation failed');
      }

      // Fetch completed results from Supabase
      setCurrentStep('Loading generated content...');
      
      const result: any = {
        success: true,
        storyId: data.storyId,
        metadata: { savedToSupabase: true }
      };

      // If images were saved to Supabase, fetch them
      if (result.metadata?.savedToSupabase) {
        setCurrentStep('Fetching images from database...');

        // Fetch page images
        const pageImages = await fetchPageImages(result.storyId);
        if (pageImages.length > 0) {
          result.pages = result.pages.map((page: StoryPage) => {
            const dbPage = pageImages.find(p => p.page_number === page.pageNumber);
            if (dbPage && dbPage.image_url) {
              return { ...page, imageData: dbPage.image_url };
            }
            return page;
          });
        }

        // Fetch character images
        const charImages = await fetchCharacterImages(result.storyId);
        if (charImages.length > 0) {
          result.characters = result.characters.map((char: Character) => {
            const dbChar = charImages.find(c => c.name === char.name);
            if (dbChar && dbChar.reference_image) {
              return { ...char, referenceImage: dbChar.reference_image };
            }
            return char;
          });
        }
      }

      setResult(result);
      setStatus('complete');
      setCurrentStep('');

    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate storybook');
      setStatus('error');
    }
  };

  const handleRetry = () => {
    const pendingStory = sessionStorage.getItem('pendingStory');
    if (pendingStory) {
      startGeneration(JSON.parse(pendingStory));
    } else {
      router.push('/');
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-smooth"
              >
                <ChevronLeft className="h-5 w-5" />
                Back
              </button>
              <div className="border-l border-stone-200 pl-4">
                <h1 className="text-lg font-heading font-semibold text-stone-800">
                  {result?.title || 'Generating...'}
                </h1>
                {result && (
                  <p className="text-sm text-stone-500">
                    {result.metadata.pageCount} pages • {result.metadata.characterCount} characters
                  </p>
                )}
              </div>
            </div>

            {status === 'complete' && (
              <div className="flex items-center gap-2">
                <button className="btn btn-secondary flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
                <button className="btn btn-primary flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Generating State */}
        {status === 'generating' && (
          <div className="card p-8 text-center max-w-xl mx-auto animate-fade-in">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              </div>
              <h2 className="text-xl font-heading font-semibold text-stone-800 mb-2">
                Creating Your Picture Book
              </h2>
              <p className="text-stone-600">{currentStep}</p>
            </div>

            <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-amber-600 progress-animate" style={{ width: '60%' }} />
            </div>

            <p className="text-sm text-stone-500 mt-4">
              This may take a few minutes. The n8n workflow is orchestrating
              multiple AI agents to create your book.
            </p>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="card p-8 text-center max-w-xl mx-auto border-red-200 bg-red-50 animate-fade-in">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-heading font-semibold text-red-800 mb-2">
              Generation Failed
            </h2>
            <p className="text-red-600 mb-6">{error}</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => router.push('/')} className="btn btn-secondary">
                Go Back
              </button>
              <button onClick={handleRetry} className="btn btn-primary flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Complete State - Results */}
        {status === 'complete' && result && (
          <div className="animate-fade-in">
            {/* Story Summary */}
            <div className="card p-6 mb-8">
              <h2 className="text-lg font-heading font-semibold text-stone-800 mb-3">
                Story Arc
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {result.storyArcSummary.map((beat, i) => (
                  <span key={i} className="px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-sm">
                    {beat}
                  </span>
                ))}
              </div>
              <p className="text-stone-600">Theme: {result.theme}</p>

              {result.metadata.pagesFixed > 0 && (
                <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                  <CheckCircle2 className="h-4 w-4" />
                  {result.metadata.pagesFixed} pages were automatically fixed for consistency
                </div>
              )}
            </div>

            {/* Characters */}
            <div className="card p-6 mb-8">
              <h2 className="text-lg font-heading font-semibold text-stone-800 mb-4">
                Characters
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {result.characters.map((char, i) => (
                  <div key={i} className="text-center">
                    <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-stone-200 overflow-hidden">
                      {char.referenceImage ? (
                        <img
                          src={char.referenceImage}
                          alt={char.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                          <BookOpen className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-stone-800">{char.name}</p>
                    <p className="text-xs text-stone-500 capitalize">{char.role}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pages Grid */}
            <h2 className="text-lg font-heading font-semibold text-stone-800 mb-4">
              Pages
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {result.pages.map((page) => (
                <div
                  key={page.pageNumber}
                  className={`card overflow-hidden cursor-pointer transition-smooth hover:shadow-lg ${
                    selectedPage === page.pageNumber ? 'ring-2 ring-amber-500' : ''
                  }`}
                  onClick={() => setSelectedPage(page.pageNumber)}
                >
                  <div className="aspect-[2/3] bg-stone-100 relative">
                    {page.imageData ? (
                      <img
                        src={page.imageData}
                        alt={`Page ${page.pageNumber}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <BookOpen className="h-12 w-12" />
                      </div>
                    )}
                    {page.wasFixed && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Fixed
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-stone-500 mb-1">Page {page.pageNumber}</p>
                    <p className="text-sm text-stone-700 line-clamp-2">{page.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Loading fallback for Suspense
function StudioLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
    </div>
  );
}

// Main export with Suspense boundary
export default function StudioPage() {
  return (
    <Suspense fallback={<StudioLoading />}>
      <StudioContent />
    </Suspense>
  );
}
