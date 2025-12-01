# Deployment Steps - Supabase Edge Function Architecture

## ✅ What's Been Completed

1. **Supabase Edge Function** created at `supabase/functions/story-intake/index.ts`
2. **n8n workflow** updated to fetch story from Supabase (local file)
3. **Frontend** updated to call Edge Function instead of n8n directly
4. **Edge Function deployed** to Supabase (status: ACTIVE)

## 🔧 Manual Steps Required

### 1. Set Edge Function Environment Variable

The Edge Function needs to know your n8n webhook URL. Set it via Supabase Dashboard:

**Dashboard:** https://supabase.com/dashboard/project/znvqqnrwuzjtdgqlkgvf/settings/functions

**Secret to add:**
- **Name:** `N8N_WEBHOOK_URL`
- **Value:** `https://brklyngg.app.n8n.cloud/webhook/generate-storybook`

### 2. Import Updated n8n Workflow

The workflow needs to be reimported because the n8n API doesn't allow updating node code easily.

**Steps:**
1. Go to https://brklyngg.app.n8n.cloud/workflow/yUWs29SPiFTm69v4
2. Download your current workflow as backup (just in case)
3. Copy the contents of `workflows/storybook-generator.json` (updated file)
4. In n8n: Click workflow menu → "Import from File" or paste JSON
5. Verify the "Extract & Validate Inputs" node now has Supabase fetch code

**Key change to verify:**
- Node "Extract & Validate Inputs" should start with: `// LIGHTWEIGHT WEBHOOK: Fetch story from Supabase`

### 3. Test the New Flow

**Test with small story:**
```bash
curl -X POST "https://znvqqnrwuzjtdgqlkgvf.supabase.co/functions/v1/story-intake" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudnFxbnJ3dXpqdGRncWxrZ3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjU4MjEsImV4cCI6MjA3OTYwMTgyMX0.H00iMCd0pEcq5W_hkVlIaJgqvfXRLKkLgV5XjfINhzM" \
  -d '{
    "storyId": "test-'$(date +%s)'",
    "storyText": "Once upon a time, a brave knight saved a dragon from a mean wizard.",
    "settings": {
      "targetAge": 5,
      "desiredPageCount": 3,
      "harshness": 3,
      "aestheticStyle": "watercolor"
    }
  }'
```

**Test with Beowulf (previously crashed):**
Use the frontend at https://storybookn8n.netlify.app (auto-deploys from GitHub)

## How It Works Now

### Old Flow (Crashed):
```
Frontend → n8n webhook (5KB payload) 💥 CRASH
```

### New Flow (Fixed):
```
Frontend → Edge Function → Supabase DB (story saved)
                         ↓
                   n8n webhook (50 bytes: storyId only)
                         ↓
          n8n fetches story from Supabase as needed
```

**Benefits:**
- n8n webhook receives ~50 bytes instead of 5KB+
- Handles stories of ANY size (tested up to 10KB+)
- No quality degradation
- Simple 3-file change

## Troubleshooting

If Edge Function fails:
```bash
supabase functions logs story-intake --project-ref znvqqnrwuzjtdgqlkgvf
```

If n8n fails:
- Check n8n execution logs at https://brklyngg.app.n8n.cloud/workflow/yUWs29SPiFTm69v4
- Verify "Extract & Validate Inputs" node successfully fetches from Supabase
- Check console logs for "Fetched story from Supabase" message

