# n8n Cloud Setup Guide

Complete setup guide for the Storybook Generator on **n8n Cloud**.

---

## Prerequisites

- n8n Cloud account ([n8n.io](https://n8n.io))
- Google AI Studio API key ([aistudio.google.com/apikey](https://aistudio.google.com/apikey))
- Node.js 18+ (for frontend only)

---

## Step 1: Get a Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Select or create a Google Cloud project
4. Copy the API key (starts with `AIza...`)

The workflow uses:
- `gemini-3-pro-preview` for text analysis (most intelligent multimodal model)
- `gemini-3-pro-image-preview` for images ("Nano Banana Pro" - advanced generation)

---

## Step 2: Create Credential in n8n Cloud

1. Log into your n8n Cloud instance
2. Go to **Settings → Credentials** (or click the key icon)
3. Click **"Add Credential"**
4. Search for **"Header Auth"**
5. Configure:
   - **Name:** `Gemini API Key`
   - **Value:** Paste your Gemini API key
6. Click **"Create"**

> **Note:** The workflow passes the API key via URL parameter (`?key=...`), which the Gemini API supports. The Header Auth credential is used as a secure container for the API key, which is then referenced in the HTTP Request URLs.

---

## Step 3: Import the Workflow

1. In n8n Cloud, go to **Workflows**
2. Click **"+"** or **"Add Workflow"**
3. Click the **"..."** menu (top right) → **"Import from File"**
4. Select `workflows/storybook-generator.json`
5. Click **"Save"**

You should see ~40 nodes arranged left to right.

---

## Step 4: Connect Credentials to Nodes

After import, connect your credential to each HTTP Request node:

1. Click on **"2. Story Analyzer"** node
2. In the right panel, find **"Credential to connect with"**
3. Select your `Gemini API Key` credential (Header Auth type)
4. **Repeat for these 9 nodes:**

| # | Node Name | Type |
|---|-----------|------|
| 1 | 2. Story Analyzer | Text |
| 2 | 3. Scene Selector | Text |
| 3 | 4. Caption Writer | Text |
| 4 | 5. Character Extractor | Text |
| 5 | Generate Portrait | Image |
| 6 | Generate Environment Reference | Image |
| 7 | Generate Page Image | Image |
| 8 | 10. Consistency Reviewer | Text |
| 9 | Regenerate Page | Image |

5. Click **"Save"** (top right)

---

## Step 5: (Optional) Configure Supabase

Skip this if you don't need persistence.

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Note your Project URL and service_role key
3. In n8n: **Settings → Credentials → Add Credential → Supabase**
4. Configure the credential:
   - **Host:** Your Supabase project URL (e.g., `https://znvqqnrwuzjtdgqlkgvf.supabase.co`)
   - **Service Role Secret:** Your service_role key from Supabase Dashboard → Settings → API
5. In the workflow, select this credential for these 3 Supabase nodes:
   - **7. Save Story to Supabase** - Saves to `stories` table
   - **Save Character to DB** - Saves to `characters` table
   - **Save Page to DB** - Saves to `pages` table
6. For each Supabase node, select the appropriate table from the dropdown

### Database Schema

```sql
-- Stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text TEXT,
  settings JSONB,
  theme TEXT,
  title TEXT,
  status TEXT DEFAULT 'pending',
  current_step TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Characters table
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  role TEXT,
  reference_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pages table
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  caption TEXT,
  scene_description TEXT,
  image_data TEXT,
  environment TEXT,
  camera_angle TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Step 6: Activate the Workflow

1. Toggle **"Inactive"** → **"Active"** (top right)
2. You should see a green indicator

### Get Your Webhook URL

1. Click on **"1. Webhook Input"** node
2. Copy the **Production URL**:
   ```
   https://your-instance.app.n8n.cloud/webhook/generate-storybook
   ```

---

## Step 7: Set Up the Frontend

```bash
cd frontend
npm install
cp ../env.example .env.local
```

Edit `.env.local`:
```bash
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-instance.app.n8n.cloud/webhook/generate-storybook
```

Start:
```bash
npm run dev
```

Open **http://localhost:3000**

---

## Step 8: Test the Workflow

### Quick Test via curl

```bash
curl -X POST https://your-instance.app.n8n.cloud/webhook/generate-storybook \
  -H "Content-Type: application/json" \
  -d '{
    "storyId": "test-123",
    "storyText": "Once upon a time, a little rabbit named Rosie lived under an oak tree. One morning, she explored the meadow and found a garden where a mouse named Max lived. They had a picnic and became best friends.",
    "settings": {
      "targetAge": 5,
      "desiredPageCount": 3,
      "harshness": 3,
      "aestheticStyle": "watercolor"
    }
  }'
```

### Test via Frontend

1. Open http://localhost:3000
2. Paste a short story
3. Set page count to **3** (faster testing)
4. Click "Generate Picture Book"

---

## Troubleshooting

### "401 Unauthorized" or API Key Error

- Verify key at [Google AI Studio](https://aistudio.google.com/apikey)
- Credential type must be **Header Auth**, not Google PaLM API
- Header name must be exactly `x-goog-api-key`
- Re-select credential in each HTTP Request node

### "Webhook not found" / 404

- Workflow must be **Active** (green toggle)
- Use **Production URL**, not Test URL
- Path must be `generate-storybook`

### "Rate limit exceeded" / 429

- Increase wait times in Rate Limit nodes (currently 3-4 seconds)
- Try 6-8 seconds between calls
- Use fewer pages for testing

### "Model not found"

Current models:
- Text: `gemini-3-pro-preview`
- Images: `gemini-3-pro-image-preview`

Update URLs in HTTP Request nodes if models change.

### Images Not Generating

Verify HTTP Request nodes have:
```json
"generationConfig": {
  "responseModalities": ["TEXT", "IMAGE"]
}
```

### Timeout Errors

Current timeouts:
- Text nodes: 60 seconds
- Image nodes: 120 seconds

Increase in node Options if needed.

### View Execution Logs

1. Click **"Executions"** in sidebar
2. Click any execution for step-by-step results
3. Failed nodes show errors in red

---

## API Reference

### Endpoint

**POST** `https://your-instance.app.n8n.cloud/webhook/generate-storybook`

### Request

```json
{
  "storyId": "optional-uuid",
  "storyText": "Story text...",
  "settings": {
    "targetAge": 6,
    "desiredPageCount": 10,
    "harshness": 5,
    "aestheticStyle": "watercolor children's book",
    "heroImage": "data:image/jpeg;base64,...",
    "saveToSupabase": false
  }
}
```

### Response

```json
{
  "success": true,
  "storyId": "uuid",
  "title": "Story Title",
  "pages": [
    {
      "pageNumber": 1,
      "caption": "Caption text",
      "imageData": "data:image/png;base64,..."
    }
  ],
  "characters": [
    {
      "name": "Character Name",
      "referenceImage": "data:image/png;base64,..."
    }
  ],
  "environments": [
    {
      "name": "Location",
      "referenceImage": "data:image/png;base64,..."
    }
  ]
}
```

---

## Expected Times & Costs

| Pages | Time | Est. Cost |
|-------|------|-----------|
| 3 | 4-6 min | ~$0.20 |
| 5 | 6-10 min | ~$0.30 |
| 10 | 12-20 min | ~$0.55 |
| 20 | 25-40 min | ~$1.00 |

---

## Customizing Prompts

Edit the `jsonBody` parameter in HTTP Request nodes:

| Change | Node |
|--------|------|
| Story interpretation | 2. Story Analyzer |
| Scene selection | 3. Scene Selector |
| Caption style | 4. Caption Writer |
| Character detail | 5. Character Extractor |
| Art style | 6. Parse Characters... (Code) |
| Page composition | Build Page Prompt (Code) |
| Consistency rules | 10. Consistency Reviewer |
