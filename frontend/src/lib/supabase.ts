import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Story library will be disabled.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface Story {
  id: string;
  title: string;
  source_text: string;
  theme: string | null;
  created_at: string;
  status: string | null;
}

// Extract a title from the story text (first line or first ~50 chars)
export function extractTitle(sourceText: string): string {
  if (!sourceText) return 'Untitled Story';

  // Try to extract title from common patterns
  // Pattern 1: **Title** or *Title*
  const boldMatch = sourceText.match(/^\*\*([^*]+)\*\*/);
  if (boldMatch) return boldMatch[1].trim();

  const italicMatch = sourceText.match(/^\*([^*]+)\*/);
  if (italicMatch) return italicMatch[1].trim();

  // Pattern 2: "Title" at start
  const quoteMatch = sourceText.match(/^"([^"]+)"/);
  if (quoteMatch) return quoteMatch[1].trim();

  // Pattern 3: Title: or Chapter 1: etc
  const colonMatch = sourceText.match(/^([^:.\n]{5,50}):/);
  if (colonMatch) return colonMatch[1].trim();

  // Fallback: First line or first 50 characters
  const firstLine = sourceText.split('\n')[0].trim();
  if (firstLine.length <= 60) return firstLine;

  return firstLine.substring(0, 50).trim() + '...';
}

// Fetch all stories for the dropdown (unique titles only, most recent first)
export async function fetchStories(): Promise<Story[]> {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const { data, error } = await supabase
    .from('stories')
    .select('id, title, source_text, theme, created_at, status')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching stories:', error);
    return [];
  }

  // Deduplicate by title, keeping the most recent entry for each unique title
  const seenTitles = new Set<string>();
  const uniqueStories: Story[] = [];

  for (const story of data || []) {
    const title = story.title || extractTitle(story.source_text);
    if (!seenTitles.has(title)) {
      seenTitles.add(title);
      uniqueStories.push({ ...story, title });
    }
  }

  return uniqueStories;
}

// Fetch a single story by ID
export async function fetchStoryById(id: string): Promise<Story | null> {
  if (!supabase) {
    console.warn('Supabase not configured');
    return null;
  }

  const { data, error } = await supabase
    .from('stories')
    .select('id, title, source_text, theme, created_at, status')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching story:', error);
    return null;
  }

  // Ensure title is set (fallback to extraction if missing)
  if (data && !data.title) {
    data.title = extractTitle(data.source_text);
  }

  return data;
}

// Types for generated content
export interface PageImage {
  page_number: number;
  image_url: string;
  caption: string;
}

export interface CharacterImage {
  name: string;
  role: string;
  reference_image: string;
  is_hero: boolean;
}

export interface EnvironmentImage {
  name: string;
  reference_image: string;
}

// Fetch page images for a story
export async function fetchPageImages(storyId: string): Promise<PageImage[]> {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const { data, error } = await supabase
    .from('pages')
    .select('page_number, image_url, caption')
    .eq('story_id', storyId)
    .order('page_number', { ascending: true });

  if (error) {
    console.error('Error fetching page images:', error);
    return [];
  }

  return data || [];
}

// Fetch character images for a story
export async function fetchCharacterImages(storyId: string): Promise<CharacterImage[]> {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const { data, error } = await supabase
    .from('characters')
    .select('name, role, reference_image, is_hero')
    .eq('story_id', storyId);

  if (error) {
    console.error('Error fetching character images:', error);
    return [];
  }

  return data || [];
}

// Fetch environment images for a story
export async function fetchEnvironmentImages(storyId: string): Promise<EnvironmentImage[]> {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const { data, error } = await supabase
    .from('environments')
    .select('name, reference_image')
    .eq('story_id', storyId);

  if (error) {
    console.error('Error fetching environment images:', error);
    return [];
  }

  return data || [];
}

// Poll story status until completion
export async function pollStoryStatus(
  storyId: string,
  onProgress?: (status: string, step: string) => void,
  maxAttempts: number = 240 // 20 minutes at 5s intervals
): Promise<'completed' | 'error' | 'timeout'> {
  if (!supabase) {
    console.warn('Supabase not configured');
    return 'error';
  }

  let attempts = 0;

  while (attempts < maxAttempts) {
    const { data, error } = await supabase
      .from('stories')
      .select('status, current_step')
      .eq('id', storyId)
      .single();

    if (error) {
      console.error('Error polling story status:', error);
      return 'error';
    }

    if (data) {
      const status = data.status || 'generating';
      const step = data.current_step || 'processing';

      // Notify progress
      if (onProgress) {
        onProgress(status, step);
      }

      // Check completion
      if (status === 'completed') {
        return 'completed';
      }

      if (status === 'error' || status === 'failed') {
        return 'error';
      }
    }

    // Wait 5 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }

  return 'timeout';
}
