'use client';

import { useState, useEffect, useRef } from 'react';
import { Library, ChevronDown, Search, Loader2, BookOpen, Clock } from 'lucide-react';
import { fetchStories, Story, supabase } from '@/lib/supabase';

interface StorySelectorProps {
  onSelect: (storyText: string, storyTitle: string) => void;
}

export function StorySelector({ onSelect }: StorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if Supabase is configured
  const isConfigured = !!supabase;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch stories when dropdown opens
  useEffect(() => {
    if (isOpen && stories.length === 0 && isConfigured) {
      loadStories();
    }
  }, [isOpen, isConfigured]);

  const loadStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStories();
      setStories(data);
    } catch (err) {
      setError('Failed to load stories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (story: Story) => {
    onSelect(story.source_text, story.title);
    setIsOpen(false);
    setSearch('');
  };

  // Filter stories by search term
  const filteredStories = stories.filter((story) => {
    const title = (story.title || '').toLowerCase();
    const theme = (story.theme || '').toLowerCase();
    const searchLower = search.toLowerCase();
    return title.includes(searchLower) || theme.includes(searchLower);
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isConfigured) {
    return null; // Don't show if Supabase isn't configured
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-3 rounded-xl
          bg-gradient-to-r from-sage-50 to-sage-100
          border border-sage-200
          text-sage-700 font-medium text-sm
          hover:from-sage-100 hover:to-sage-200 hover:border-sage-300
          transition-all duration-200
          ${isOpen ? 'ring-2 ring-sage-400/30' : ''}
        `}
      >
        <Library className="h-4 w-4" />
        Choose from Library
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 max-w-[calc(100vw-2rem)] z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-stone-100 bg-stone-50">
              <div className="flex items-center gap-2 mb-3">
                <Library className="h-5 w-5 text-sage-600" />
                <h3 className="font-heading font-semibold text-stone-800">Story Library</h3>
                <span className="ml-auto text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                  {stories.length} stories
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search stories..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-white border border-stone-200 text-sm
                    focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400
                    placeholder:text-stone-400"
                  autoFocus
                />
              </div>
            </div>

            {/* Story List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-sage-500" />
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-600 text-sm">
                  {error}
                  <button
                    onClick={loadStories}
                    className="block mx-auto mt-2 text-sage-600 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : filteredStories.length === 0 ? (
                <div className="p-8 text-center text-stone-500">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">
                    {search ? 'No stories match your search' : 'No stories found'}
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {filteredStories.map((story) => {
                    const wordCount = story.source_text.split(/\s+/).length;

                    return (
                      <button
                        key={story.id}
                        onClick={() => handleSelect(story)}
                        className="w-full px-4 py-3 text-left hover:bg-sage-50 transition-colors
                          border-b border-stone-50 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-100 to-sage-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-5 w-5 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-stone-800 truncate">
                              {story.title}
                            </p>
                            {story.theme && (
                              <p className="text-xs text-stone-500 truncate mt-0.5">
                                {story.theme}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-xs text-stone-400">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(story.created_at)}
                              </span>
                              <span>{wordCount.toLocaleString()} words</span>
                              {story.status && story.status !== 'planning' && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium
                                  ${story.status === 'error' ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-500'}`}>
                                  {story.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
