# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered children's picture book generator using **n8n Cloud workflows** as the backend and **Next.js** as the frontend. Uses direct HTTP Request nodes to call the Google Gemini API for maximum compatibility and control.

## Deployment

| Component | URL |
|-----------|-----|
| **Frontend** | https://storybookn8n.netlify.app |
| **n8n Workflow** | n8n Cloud (import `workflows/storybook-generator.json`) |
| **Database** | Supabase project `znvqqnrwuzjtdgqlkgvf` |

**Netlify:** Connected to GitHub repo, auto-deploys on push to `main`.

## Architecture

```
[Next.js Frontend] → [n8n Cloud Webhook] → [HTTP Request Pipeline] → [JSON Response]
        ↓
   [Supabase Stories Library]
```

**Frontend:** Next.js 15 app in `/frontend` that collects story input and settings, then calls the n8n webhook. Includes a Story Library dropdown that loads stories from Supabase.

**Backend:** n8n workflow (`workflows/storybook-generator.json`) using native HTTP Request nodes to call Gemini API directly.

### Pipeline Steps

1. **Webhook Input** - Receives POST with storyText, settings, heroImage
2. **Story Analyzer** - Gemini analyzes narrative structure + identifies key environments
3. **Scene Selector** - Chooses scenes, assigns camera angles and environments
4. **Caption Writer** - Writes age-appropriate captions
5. **Character Extractor** - Identifies characters, marks protagonist as hero
6. **Parse Characters & Create Style Bible** - Builds style rules, extracts environment list
7. **Save Story to Supabase** - Conditional branch for database storage (optional)
8. **Character Portrait Loop** - Generates portraits for main/supporting characters
   - **Parse Portrait Result** - Extracts image from Gemini response
   - **Save Character?** - Conditional check for saveToSupabase flag
   - **Save Character to DB** - Saves character to `characters` table
8b. **Environment Reference Loop** - Generates reference images for recurring locations
9. **Page Illustrator Loop** - Generates page illustrations
   - **Parse Page Result** - Extracts image from Gemini response
   - **Save Page?** - Conditional check for saveToSupabase flag
   - **Save Page to DB** - Saves page to `pages` table
10. **Consistency Reviewer** - Checks for visual consistency issues
11. **Consistency Fixer Loop** - Regenerates inconsistent pages (max 3 per run)
12. **Build Final Response** - Assembles complete book data
13. **Webhook Response** - Returns JSON to frontend

## AI Models (Gemini API)

| Task | Model | Why |
|------|-------|-----|
| Text analysis | `gemini-3-pro-preview` | Advanced text analysis with high quality |
| Image generation | `gemini-3-pro-image-preview` | High-quality image generation |

**IMPORTANT:** These model names are correct and authoritative. Do not change them.

## Memory Optimization (Critical)

The workflow prevents crashes on n8n Cloud by **stripping base64 BEFORE data returns to loops**, not after. n8n's `SplitInBatches` node accumulates ALL loop outputs in memory before firing "done", so base64 images must be removed immediately after saving.

### The Problem (Fixed)

n8n's `SplitInBatches` behavior:
- Collects ALL loop iteration outputs in memory
- Combines them when firing "done" output
- With 10 pages × 1-2MB base64 = 10-20MB accumulated → OOM crash

### How It Works Now

1. **Parse + Save + Strip Pattern** - Single Code nodes that:
   - Extract base64 from Gemini response
   - Save to Supabase immediately using `fetch()`
   - Return ONLY metadata (name, pageNumber, savedToSupabase) - **NO base64**
   - The stripped metadata flows back to the loop

2. **Loop accumulates tiny metadata** instead of huge base64 images
3. **Aggregation nodes** receive clean metadata, not Gemini responses

### Key Nodes (Memory-Safe)

| Node | What It Does |
|------|--------------|
| Parse + Save + Strip Character | Saves portrait to Supabase, returns metadata only |
| Parse + Save + Strip Environment | Saves environment ref to Supabase, returns metadata only |
| Parse + Save + Strip Page | Saves page image to Supabase, returns metadata only |

### Why This Works

```
BEFORE (crashed):
Generate Image → Parse → IF → HTTP Save → Rate Limit → Loop
                  ↑ base64 stays in loop accumulation

AFTER (fixed):
Generate Image → Parse+Save+Strip → Rate Limit → Loop
                  ↑ base64 removed, only metadata returns
```

### Frontend Requirement

When `savedToSupabase: true`, the frontend must fetch images from Supabase:

```javascript
// Fetch page images from Supabase
if (page.savedToSupabase) {
  const { data } = await supabase
    .from('pages')
    .select('image_url')
    .eq('story_id', storyId)
    .eq('page_number', page.pageNumber)
    .single();
  page.imageData = data.image_url;
}
```

## Node Architecture

All AI calls use **HTTP Request nodes** calling the Gemini REST API directly:
- **Text endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent`
- **Image endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent`

This approach was chosen over the LangChain Gemini node because:
1. LangChain nodes are sub-nodes meant for AI Agents, not standalone use
2. HTTP Request provides full control over API parameters
3. Image generation requires specific `responseModalities` configuration
4. Better error handling and response parsing

### Critical n8n Data Flow Rules

**HTTP Request Node Behavior:**
- HTTP Request nodes return ONLY the API response
- Original input data is NOT passed through automatically
- If you need to preserve input data, use a Code node instead

**Known Issue - Data Loss Pattern:**
```javascript
// ANTI-PATTERN (causes data loss):
IF Node → HTTP Request (returns API response only) → Merge Node (no data!)

// CORRECT PATTERN:
IF Node → Code Node (makes HTTP request + returns input data) → Merge Node ✓
```

**Example Fix for Supabase Save:**
```javascript
// Instead of HTTP Request node, use Code node:
const inputData = $input.first().json;

const response = await fetch('https://supabase.co/rest/v1/table', {
  method: 'POST',
  headers: { 'apikey': 'key' },
  body: JSON.stringify(inputData)
});

// Return original data, not API response
return { json: { ...inputData, saved: response.ok } };
```

**Node Reference Limitations:**
- Cannot use `$('NodeName')` to reference nodes from unexecuted branches
- IF nodes create separate execution paths
- Merge nodes can only access data from their connected inputs, not upstream nodes

## Supabase Database Schema

| Table | Purpose |
|-------|---------|
| `stories` | Story metadata, source text, settings, status |
| `characters` | Character references with base64 images |
| `environments` | Environment/location references with base64 images |
| `pages` | Page illustrations with captions and base64 images |

All tables have `story_id` foreign key linking back to `stories.id`.

## Development Commands

```bash
# Frontend
cd frontend
npm install
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
npm run lint       # ESLint
```

## Key Files

| File | Purpose |
|------|---------|
| `workflows/storybook-generator.json` | Main n8n workflow - import into n8n Cloud |
| `frontend/src/app/page.tsx` | Story input form with settings |
| `frontend/src/app/studio/page.tsx` | Calls n8n webhook, displays generated book |
| `frontend/src/components/StorySelector.tsx` | Supabase story library dropdown |
| `frontend/src/components/StylePicker.tsx` | Visual art style selector |
| `frontend/src/components/HeroPhotoUpload.tsx` | Hero photo upload for protagonist |
| `frontend/src/lib/supabase.ts` | Supabase client + story fetching |
| `SETUP_GUIDE.md` | Complete setup instructions for n8n Cloud |
| `env.example` | Template for frontend environment variables |

## Environment Variables

Create `frontend/.env.local` (or configure in Netlify):
```
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-name.app.n8n.cloud/webhook/generate-storybook
NEXT_PUBLIC_SUPABASE_URL=https://znvqqnrwuzjtdgqlkgvf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key_from_supabase_dashboard>
```

**Supabase** is used for the Story Library feature - stores pre-existing stories that users can select from a dropdown instead of pasting text.

## n8n Cloud Setup

### Credentials Required

#### 1. Gemini API Key (Query Auth)
The Gemini API requires the API key as a URL query parameter (`?key=...`). n8n automatically appends this when using Query Auth.

- **Type:** Query Auth
- **Name:** `Gemini API Key`
- **Parameter Name:** `key`
- **Parameter Value:** Your API key from [Google AI Studio](https://aistudio.google.com/apikey)

**Nodes requiring this credential (9 total):**
1. 2. Story Analyzer
2. 3. Scene Selector
3. 4. Caption Writer
4. 5. Character Extractor
5. Generate Portrait
6. Generate Environment Reference
7. Generate Page Image
8. 10. Consistency Reviewer
9. Regenerate Page

#### 2. Supabase Service Key (Header Auth)
The Supabase REST API requires the API key as a header (`apikey: ...`). n8n automatically adds this header when using Header Auth.

- **Type:** Header Auth
- **Name:** `Supabase Service Key`
- **Header Name:** `apikey`
- **Header Value:** Your service_role key from Supabase Dashboard > Settings > API

**Nodes requiring this credential (4 total):**
1. 7. Save Story to Supabase
2. Save Character to DB
3. Save Environment to DB
4. Save Page to DB

> **Note:** The workflow uses Query Auth for Gemini (URL parameter) and Header Auth for Supabase (HTTP header). n8n automatically injects these credentials - no manual expression references needed.

## Features

### Hero Photo Support
Send a base64-encoded photo to use as the protagonist's face reference:
```json
{
  "settings": {
    "heroImage": "data:image/jpeg;base64,..."
  }
}
```

### Environment References
The workflow automatically:
1. Identifies 3-5 key locations from the story
2. Generates empty scene references for each
3. Uses these references when illustrating pages set in those locations

### Error Handling
- All HTTP Request nodes have `onError: continueErrorOutput`
- Error Trigger node captures workflow failures
- Handle Error node logs errors for debugging

## Rate Limiting

Wait nodes between API calls:
- `Character Rate Limit` - 3 seconds
- `Environment Rate Limit` - 3 seconds
- `Page Rate Limit` - 4 seconds
- `Fix Rate Limit` - 4 seconds

## Expected Generation Times

For a 10-page book:
- Text processing: ~30-45 seconds
- Character portraits (3-4): ~2-3 minutes
- Environment references (3-5): ~2-3 minutes
- Page illustrations (10): ~7-10 minutes
- Consistency review + fixes: ~1-2 minutes
- **Total: 12-20 minutes**

For faster testing, use 5 pages (~6-10 minutes).

## Adjusting AI Behavior

Edit the `jsonBody` parameter in HTTP Request nodes to modify prompts:

| What to Change | Node to Edit |
|----------------|--------------|
| Story interpretation | 2. Story Analyzer |
| Scene selection criteria | 3. Scene Selector |
| Caption vocabulary/style | 4. Caption Writer |
| Character description detail | 5. Character Extractor |
| Art style mapping | 6. Parse Characters & Create Style Bible (Code node) |
| Page composition | Build Page Prompt (Code node) |
| Consistency thresholds | 10. Consistency Reviewer |
