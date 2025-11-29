# Detailed Setup Guide

This guide walks you through setting up the n8n Storybook Generator from scratch.

## Prerequisites

- Node.js 18+ installed
- A Google Cloud account with Gemini API access
- (Optional) A Supabase account for persistence

## Step 1: Set Up n8n

### Option A: Use n8n Cloud (Easiest)

1. Go to [n8n.io](https://n8n.io) and sign up
2. Create a new workflow
3. Click the "..." menu → Import from File
4. Upload `workflows/storybook-generator.json`
5. Note your webhook URL (shown in the Webhook node)

### Option B: Run n8n Locally

```bash
# Install and run n8n
npx n8n

# n8n will start at http://localhost:5678
```

Then import the workflow as above.

## Step 2: Configure Google Gemini Credentials

1. In n8n, go to **Credentials** (left sidebar)
2. Click **Add Credential**
3. Search for "Google Gemini"
4. Enter your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
5. Save

### Getting a Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Paste into n8n credentials

## Step 3: Configure Supabase (Optional)

If you want persistence (recommended), set up Supabase:

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### Create Tables

Run this SQL in Supabase SQL Editor:

```sql
-- Stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text TEXT,
  settings JSONB,
  theme TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Characters table
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  role TEXT DEFAULT 'supporting',
  is_hero BOOLEAN DEFAULT FALSE,
  reference_image TEXT,
  reference_images TEXT[],
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pages table
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  caption TEXT,
  prompt TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Add Supabase Credentials to n8n

1. In n8n, go to **Credentials**
2. Click **Add Credential**
3. Search for "Supabase"
4. Enter:
   - Host: Your project URL (e.g., `https://xxx.supabase.co`)
   - Service Role Key: Your service_role key (from Project Settings → API)

## Step 4: Update n8n Workflow Credentials

1. Open the workflow in n8n
2. Click on any Gemini node (e.g., "2. Story Analyzer Agent")
3. In the credentials dropdown, select your Gemini credential
4. Repeat for all Gemini nodes
5. Click on "7. Save to Supabase" and "Save Characters" nodes
6. Select your Supabase credential
7. Save the workflow

## Step 5: Activate the Workflow

1. In the top right, toggle the workflow to **Active**
2. Note the webhook URL shown (you'll need this for the frontend)

## Step 6: Set Up the Frontend

```bash
cd frontend
npm install

# Create environment file
cp ../.env.example .env.local

# Edit .env.local with your webhook URL
```

Edit `.env.local`:
```
NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook/generate-storybook
```

Then start the frontend:
```bash
npm run dev
```

## Step 7: Test It!

1. Open http://localhost:3000
2. Paste a short story or fairy tale
3. Adjust settings
4. Click "Generate Picture Book"
5. Watch n8n execute the workflow!

## Debugging

### View Execution Logs

1. In n8n, click "Executions" in the left sidebar
2. Click on any execution to see detailed step-by-step results
3. Each node shows its input and output data

### Common Issues

**"Error: Invalid API Key"**
- Check your Gemini credentials in n8n
- Make sure the key has access to the models used

**"Webhook returned 404"**
- Ensure the workflow is activated (green toggle)
- Check the webhook path matches your frontend config

**"Rate limit exceeded"**
- Increase the wait times in "Rate Limit Wait" nodes
- Default is 2-3 seconds; try 5-10 for heavy usage

## Customizing the Workflow

Each AI agent is a node you can edit:

1. Click on any node with "Agent" in the name
2. Edit the prompt in the "Prompt" field
3. Save and test

For example, to make captions more whimsical:
1. Click "4. Caption Writer Agent"
2. Add to the prompt: "Make captions playful and rhyme when possible"
3. Save and regenerate

## Architecture Notes

The workflow processes a story through these stages:

1. **Analysis** - Understand the story structure
2. **Selection** - Pick which moments become pages
3. **Writing** - Create age-appropriate captions
4. **Extraction** - Identify characters with visual details
5. **Styling** - Create consistent visual rules
6. **Generation** - Create character portraits and page illustrations
7. **Review** - Check for visual consistency issues
8. **Fixing** - Regenerate any inconsistent pages

Each stage can be adjusted independently!

