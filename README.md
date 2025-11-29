# n8n Storybook Generator

AI-powered children's picture book generator built with **n8n workflows** and **Google Gemini AI**.

This is a modular, no-code-adjustable version of the Storybook Generator. Each AI "agent" is a separate n8n node that you can edit directly in the n8n UI.

**Tested on n8n Cloud v1.122.4**

## Quick Start

### 1. Set Up n8n

**Option A: n8n Cloud (Recommended)**
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

**Google Gemini API (Required):**
1. Go to Settings → Credentials → Add Credential
2. Search for "Google PaLM API" (this is used for Gemini)
3. Enter your API Key from [Google AI Studio](https://aistudio.google.com/apikey)
4. Name it "Google Gemini API" to match the workflow

> **Important**: The workflow uses HTTP Request nodes with `googlePalmApi` credential type. This is the correct credential type for calling the Gemini API directly.

**Supabase (optional, for persistence):**
- Type: `Supabase`
- URL: Your Supabase project URL
- API Key: Your Supabase anon key

### 4. Verify Model Access

The workflow uses these Gemini models:
- `gemini-2.5-flash` - For text analysis (story, scenes, captions, characters)
- `gemini-2.0-flash-preview-image-generation` - For image generation

Verify your API key has access to these models at [Google AI Studio](https://aistudio.google.com/).

### 5. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Then set your n8n webhook URL in `.env.local`:
```
NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook/generate-storybook
```

For n8n Cloud, use your cloud webhook URL:
```
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-instance.app.n8n.cloud/webhook/generate-storybook
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
- Default is 3-4 seconds between API calls

### "Images not generating"
- Verify your Gemini API key has access to image generation models
- The model `gemini-2.0-flash-preview-image-generation` requires specific API access
- Check n8n execution logs for specific errors
- Try the models page at [Google AI Studio](https://aistudio.google.com/) to verify availability

### "Credential errors"
- Ensure you created a "Google PaLM API" credential (not Google Gemini Chat Model)
- The HTTP Request nodes use `googlePalmApi` as the credential type
- After creating the credential, you may need to re-select it in each HTTP Request node

### "Model not found" errors
- Model availability varies by region and account type
- If `gemini-2.0-flash-preview-image-generation` is unavailable, try `gemini-2.0-flash-exp`
- Check [Google's model documentation](https://ai.google.dev/gemini-api/docs/models) for current availability

## Technical Notes

### Why HTTP Request Nodes Instead of Google Gemini Node?

The workflow uses HTTP Request nodes calling the Gemini API directly instead of n8n's built-in Google Gemini Chat Model node because:

1. **Image Generation**: The built-in node is primarily for text chat and doesn't support image generation with `responseModalities`
2. **Model Access**: HTTP requests allow using any model ID, including preview/experimental models
3. **Response Format**: Direct API access provides the full response structure including inline image data
4. **Flexibility**: Easier to update model IDs and API parameters without waiting for n8n node updates

### Model Selection

- **Text Analysis** (`gemini-2.5-flash`): Fast, cost-effective model for story analysis, scene selection, and caption writing
- **Image Generation** (`gemini-2.0-flash-preview-image-generation`): Specifically designed for image generation with text prompts

### Error Handling

The workflow includes:
- `onError: "continueErrorOutput"` on all HTTP Request nodes to prevent workflow crashes
- An Error Trigger node that captures workflow-level errors
- Graceful fallbacks in Code nodes for parsing failures

## Credits

Built on top of the original [Storybook Generator](../Storybook%20Generator/) project.

Uses:
- [n8n](https://n8n.io) - Workflow automation
- [Google Gemini](https://ai.google.dev) - AI text and image generation
- [Supabase](https://supabase.com) - Database
- [Next.js](https://nextjs.org) - Frontend

