# Granular Progress Tracking Implementation Plan

> **Status:** On hold - implement after core workflow is stable
> **Estimated effort:** ~2 hours

---

## Overview

Replace fake timer-based progress with real-time Supabase subscriptions showing exactly what's happening in the n8n workflow.

## Architecture

```
n8n workflow → Updates Supabase `stories` table → Realtime subscription → Frontend displays live progress
```

## Example Progress Messages

- `"Analyzed story: The Time Machine"`
- `"Generating portrait for: The Time Traveller (1/3)"`
- `"Illustrating page 4 of 10: The Eloi garden scene..."`
- `"Found 2 inconsistencies, regenerating pages 3 and 7..."`
- `"Your 10-page picture book is ready!"`

---

## Part 1: Database Schema Changes

### Migration SQL

```sql
-- Add granular progress tracking columns to stories table
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS progress_message TEXT,
ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS progress_details JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS step_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS estimated_completion TIMESTAMPTZ;

-- Add index for real-time filtering
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);

-- Enable Realtime for stories table (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE stories;
```

### Progress Details JSONB Structure

```json
{
  "phase": "page_generation",
  "currentItem": 4,
  "totalItems": 10,
  "itemName": "The Eloi garden scene",
  "characterName": "The Time Traveller",
  "environmentName": "Victorian Laboratory",
  "estimatedSecondsRemaining": 240
}
```

---

## Part 2: Frontend Components

### New Hook: `useProgressSubscription.ts`

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ProgressState {
  status: string;
  currentStep: string;
  message: string;
  percent: number;
  details: ProgressDetails | null;
  lastUpdated: Date | null;
}

export function useProgressSubscription(storyId: string | null) {
  const [progress, setProgress] = useState<ProgressState>({
    status: 'loading',
    currentStep: '',
    message: 'Connecting...',
    percent: 0,
    details: null,
    lastUpdated: null,
  });

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!storyId || !supabase) return;

    let channel: RealtimeChannel | null = null;

    // First, fetch initial state
    const fetchInitialState = async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('status, current_step, progress_message, progress_percent, progress_details, updated_at')
        .eq('id', storyId)
        .single();

      if (data && !error) {
        setProgress({
          status: data.status || 'generating',
          currentStep: data.current_step || '',
          message: data.progress_message || 'Starting...',
          percent: data.progress_percent || 0,
          details: data.progress_details || null,
          lastUpdated: data.updated_at ? new Date(data.updated_at) : null,
        });
      }
    };

    fetchInitialState();

    // Then subscribe to real-time updates
    channel = supabase
      .channel(`story-progress-${storyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stories',
          filter: `id=eq.${storyId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          setProgress({
            status: newData.status || 'generating',
            currentStep: newData.current_step || '',
            message: newData.progress_message || '',
            percent: newData.progress_percent || 0,
            details: newData.progress_details || null,
            lastUpdated: new Date(),
          });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [storyId]);

  return { progress, isConnected };
}
```

### New Component: `ProgressDisplay.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Loader2, BookOpen, Users, Image, CheckCircle2, Clock } from 'lucide-react';

interface ProgressDisplayProps {
  message: string;
  percent: number;
  currentStep: string;
  details: ProgressDetails | null;
  isConnected: boolean;
}

const stepIcons: Record<string, React.ReactNode> = {
  story_analysis: <BookOpen className="h-5 w-5" />,
  character_portraits: <Users className="h-5 w-5" />,
  page_generation: <Image className="h-5 w-5" />,
  complete: <CheckCircle2 className="h-5 w-5" />,
};

export function ProgressDisplay({ message, percent, currentStep, details, isConnected }: ProgressDisplayProps) {
  return (
    <div className="card p-8 text-center max-w-xl mx-auto">
      {/* Connection indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs text-stone-400">
        <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-amber-400 animate-pulse'}`} />
        {isConnected ? 'Live' : 'Connecting...'}
      </div>

      {/* Icon and message */}
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-amber-100">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
        <h2 className="text-xl font-heading font-semibold text-stone-800 mb-2">
          Creating Your Picture Book
        </h2>
        <p className="text-stone-600">{message}</p>

        {/* Sub-progress for loops */}
        {details?.currentItem && details?.totalItems && (
          <div className="text-sm text-stone-500 mt-2">
            {details.currentItem} of {details.totalItems}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-stone-200 rounded-full h-3 overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>{percent}% complete</span>
        {details?.estimatedSecondsRemaining && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            ~{Math.ceil(details.estimatedSecondsRemaining / 60)} min remaining
          </span>
        )}
      </div>
    </div>
  );
}
```

---

## Part 3: n8n Workflow Progress Nodes

Add 12 Code nodes after each major step that update Supabase:

### Progress Update Helper Function

```javascript
async function updateProgress(storyId, step, message, percent, details = {}) {
  const supabaseUrl = 'https://znvqqnrwuzjtdgqlkgvf.supabase.co/rest/v1/stories';
  const supabaseKey = $env.SUPABASE_SERVICE_KEY;

  if (!supabaseKey) return;

  try {
    await fetch(`${supabaseUrl}?id=eq.${storyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        current_step: step,
        progress_message: message,
        progress_percent: Math.round(percent),
        progress_details: details,
        updated_at: new Date().toISOString()
      })
    });
  } catch (e) {
    console.error('Progress update failed:', e.message);
  }
}
```

### Node Insertion Points

| Insert After | Progress % | Message Format |
|--------------|------------|----------------|
| Extract & Validate Inputs | 2% | `Starting to analyze...` |
| Parse Story Analysis | 8% | `Analyzed story: "{title}"` |
| Parse Scenes | 15% | `Selected {n} scenes` |
| Parse Captions | 20% | `Wrote {n} captions` |
| Parse Characters | 25% | `Found {n} characters` |
| Generate Portrait (loop) | 25-40% | `Portrait for: {name} ({n}/{total})` |
| Generate Environment (loop) | 40-50% | `Reference for: {location} ({n}/{total})` |
| Build Page Prompt (loop) | 50-85% | `Illustrating page {n}: {scene}...` |
| Aggregate Pages | 85% | `Reviewing consistency...` |
| Parse Consistency Review | 90% | `Found {n} issues...` |
| Build Fix Prompt (loop) | 92% | `Fixing page {n}...` |
| Build Final Response | 100% | `Your book is ready!` |

---

## Part 4: Studio Page Updates

Replace fake timer with real subscription:

```typescript
// Remove this:
const steps = ['Analyzing...', 'Selecting...', ...];
const progressInterval = setInterval(() => {...}, 8000);

// Add this:
import { useProgressSubscription } from '@/hooks/useProgressSubscription';
import { ProgressDisplay } from '@/components/ProgressDisplay';

const { progress, isConnected } = useProgressSubscription(storyId);

// In render:
{status === 'generating' && (
  <ProgressDisplay
    message={progress.message}
    percent={progress.percent}
    currentStep={progress.currentStep}
    details={progress.details}
    isConnected={isConnected}
  />
)}
```

---

## Implementation Checklist

- [ ] Run database migration
- [ ] Create `useProgressSubscription.ts` hook
- [ ] Create `ProgressDisplay.tsx` component
- [ ] Update `studio/page.tsx` to use real progress
- [ ] Add 12 progress Code nodes to n8n workflow
- [ ] Test end-to-end

---

## Notes

- All progress updates use `SUPABASE_SERVICE_KEY` env var (already configured)
- Progress updates are fire-and-forget (don't break workflow on failure)
- Frontend falls back gracefully if connection lost
