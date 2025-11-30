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

// Fetch all stories for the dropdown
export async function fetchStories(): Promise<Story[]> {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const { data, error } = await supabase
    .from('stories')
    .select('id, source_text, theme, created_at, status')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching stories:', error);
    return [];
  }

  return data || [];
}

// Fetch a single story by ID
export async function fetchStoryById(id: string): Promise<Story | null> {
  if (!supabase) {
    console.warn('Supabase not configured');
    return null;
  }

  const { data, error } = await supabase
    .from('stories')
    .select('id, source_text, theme, created_at, status')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching story:', error);
    return null;
  }

  return data;
}
