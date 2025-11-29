# n8n Storybook Generator

AI-powered children's picture book generator built with **n8n workflows** and **Google Gemini AI**.

This is a modular, no-code-adjustable version of the Storybook Generator. Each AI "agent" is a separate n8n node that you can edit directly in the n8n UI.

## Quick Start

### 1. Set Up n8n

**Option A: n8n Cloud**
- Sign up at [n8n.io](https://n8n.io)
- Import the workflow JSON

**Option B: Self-hosted**
```bash
npx n8n
```

### 2. Import the Workflow

1. Open n8n
2. Go to Workflows → Import from File
3. Select `workflows/storybook-generator.json`

### 3. Configure Credentials

In n8n, add these credentials:

**Google Gemini API:**
- Type: `Google Gemini API`
- API Key: Your Gemini API key

**Supabase (optional, for persistence):**
- Type: `Supabase`
- URL: Your Supabase project URL
- API Key: Your Supabase anon key

### 4. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Then set your n8n webhook URL in `.env.local`:
```
NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook/generate-storybook
```

## Workflow Architecture

```
[Webhook Input] → [Story Analyzer] → [Scene Selector] → [Caption Writer]
       ↓
[Character Extractor] → [Style Bible Creator] → [Save to Supabase]
       ↓
[Character Portrait Loop] → [Page Illustrator Loop]
       ↓
[Consistency Reviewer] → [Consistency Fixer Loop] → [Webhook Response]
```

## Adjustable AI Agents

Each agent can be edited directly in n8n:

| Agent | Node Name | What to Adjust |
|-------|-----------|----------------|
| **Story Analyzer** | `2. Story Analyzer Agent` | How the AI interprets narrative structure |
| **Scene Selector** | `3. Scene Selector Agent` | Which moments become pages, pacing rules |
| **Caption Writer** | `4. Caption Writer Agent` | Age-appropriate language, vocabulary |
| **Character Extractor** | `5. Character Extractor Agent` | Visual description detail level |
| **Style Bible Creator** | `6. Style Bible Creator` | Art style mappings, color palettes |
| **Page Illustrator** | `Build Page Prompt` | Composition rules, camera angles |
| **Consistency Reviewer** | `10. Consistency Reviewer` | What counts as an "issue", thresholds |

## Example: Adjusting the Scene Selector

1. Open n8n workflow
2. Click on `3. Scene Selector Agent`
3. Edit the prompt to change selection criteria
4. Save and test

For example, add:
```
9. EMOTIONAL RESONANCE - Prioritize scenes that will make the child feel something
```

## Connecting to Your Existing Supabase

This workflow uses the same database schema as the original Storybook Generator:

- `stories` - Story metadata and source text
- `characters` - Character descriptions and reference images  
- `pages` - Page content and generated images

Just configure your Supabase credentials in n8n and it will write to your existing tables.

## Environment Variables

Create `frontend/.env.local`:

```bash
# n8n webhook URL
NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook/generate-storybook

# Optional: Supabase for direct queries (n8n handles writes)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Project Structure

```
N8N Storybook Generator/
├── workflows/
│   └── storybook-generator.json    # Main n8n workflow (import this!)
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx                # Home - story input
│   │   └── studio/page.tsx         # Studio - calls n8n, displays results
│   └── package.json
├── .env.example
└── README.md
```

## Differences from Legacy App

| Aspect | Legacy (Next.js API Routes) | n8n Version |
|--------|----------------------------|-------------|
| AI Logic | Hardcoded in TypeScript | Editable in n8n UI |
| Adjustments | Requires code changes + deploy | Edit node, save, test |
| Debugging | Console logs | Visual execution view |
| Rate Limits | Custom retry logic | Built-in Wait nodes |
| Monitoring | Manual logging | Execution history |

## Troubleshooting

### "Webhook not found"
- Make sure the n8n workflow is activated (toggle in top right)
- Check the webhook path matches your frontend config

### "Rate limit exceeded"
- Edit the `Rate Limit Wait` nodes to increase delay
- Default is 2-3 seconds between API calls

### "Images not generating"
- Verify your Gemini API key has access to image generation models
- Check n8n execution logs for specific errors

## Credits

Built on top of the original [Storybook Generator](../Storybook%20Generator/) project.

Uses:
- [n8n](https://n8n.io) - Workflow automation
- [Google Gemini](https://ai.google.dev) - AI text and image generation
- [Supabase](https://supabase.com) - Database
- [Next.js](https://nextjs.org) - Frontend

