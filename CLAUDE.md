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
| Text analysis | `gemini-2.5-flash` | Fast, cost-effective text analysis |
| Image generation | `gemini-2.0-flash-preview-image-generation` | Image generation with good quality |

**Note:** Using Flash models for cost efficiency (~$0.40 per 20-page book vs ~$0.80 with Pro models).

## Memory Optimization (Critical)

The workflow includes **memory optimization** to prevent crashes on n8n Cloud. Without this, base64 images accumulate in memory during loops and exceed n8n's execution limits (~256-512MB).

### How It Works

1. **`saveToSupabase` is always `true`** - Images are saved to database immediately
2. **Base64 stripping** - After saving, aggregation nodes replace base64 with `[SAVED_TO_SUPABASE]` placeholder
3. **Explicit field selection** - Aggregation nodes only carry forward necessary fields, not entire `allData` objects

### Affected Nodes

| Node | Memory Optimization |
|------|---------------------|
| Aggregate Character Portraits | Strips base64, adds `savedToSupabase` flag |
| Aggregate Environment References | Strips base64, adds `savedToSupabase` flag |
| Aggregate Pages | Strips base64, adds `savedToSupabase` flag |
| Merge Fixed Pages | Strips base64 for fixed pages |
| Build Final Response | Includes `savedToSupabase` flags for frontend |

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
- **Text endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- **Image endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent`

This approach was chosen over the LangChain Gemini node because:
1. LangChain nodes are sub-nodes meant for AI Agents, not standalone use
2. HTTP Request provides full control over API parameters
3. Image generation requires specific `responseModalities` configuration
4. Better error handling and response parsing

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
