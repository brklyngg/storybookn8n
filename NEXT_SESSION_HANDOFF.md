# Next Session Handoff - Session 11

**Date:** November 30, 2025 (Late Night)
**Project:** N8N Storybook Generator
**Status:** Critical Blocker - Workflow Crashes at Data Merge Point

---

## Quick Context

This is an n8n Cloud workflow that generates AI-illustrated children's books using Google Gemini API. The workflow currently crashes during the Supabase save operation due to a data preservation issue.

**Project Location:** `/Users/garygurevich/Documents/Vibe Coding/N8N Storybook Generator`
**Remote Repository:** github.com/brklyngg/storybookn8n
**Latest Commit:** `a1dd1be` (contains failed fix attempt)

---

## Critical Blocker

### The Problem

**Symptom:** Workflow crashes with error:
```
Cannot read properties of undefined (reading 'json') [line 3]
```

**Location:** "Continue Pipeline" node (merges branches after Supabase save)

**Root Cause:**
The "7. Save to Supabase" HTTP Request node returns only the Supabase API response (empty/minimal data), NOT the original workflow data containing the `pages` array. When "Continue Pipeline" tries to merge the branches, there's no data to work with.

### Why Session 9's Fix Failed

Session 9 attempted to fix this by changing "Continue Pipeline" to reference the IF node:

```javascript
// This doesn't work:
const ifNodeData = $('Save to Supabase?').first().json;
return [{ json: ifNodeData }];
```

**Why it failed:** In n8n, you cannot reference nodes from unexecuted branches. The IF node creates two execution paths, and "Continue Pipeline" can only see the branch it's currently in, not reach back to the IF node.

---

## Recommended Solution

### Convert HTTP Request to Code Node

Replace "7. Save to Supabase" HTTP Request node with a Code node that:
1. Makes the HTTP request to Supabase
2. Returns the ORIGINAL input data, not just the API response
3. Optionally includes Supabase response metadata

### Example Implementation

```javascript
const inputData = $input.first().json;

// Extract Supabase credentials (use n8n credential system)
const supabaseUrl = 'https://znvqqnrwuzjtdgqlkgvf.supabase.co';
const supabaseKey = '<credential_reference>';

// Make Supabase HTTP request
const response = await fetch(`${supabaseUrl}/rest/v1/stories`, {
  method: 'POST',
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  },
  body: JSON.stringify({
    id: inputData.storyId,
    source_text: inputData.storyText,
    settings: inputData.settings,
    theme: inputData.theme,
    title: inputData.title,
    status: inputData.status,
    current_step: inputData.current_step
  })
});

// Return original data + Supabase confirmation
return {
  json: {
    ...inputData,
    supabaseSaved: response.ok,
    supabaseStatus: response.status
  }
};
```

### Why This Works

- Code nodes preserve input data by default
- No reliance on external node references
- Original data flows through to "Continue Pipeline"
- Supabase save still happens, just in a different node type

---

## Alternative Solution (If Code Node Doesn't Work)

### Remove the Branch Entirely

If converting to Code node is problematic:

1. Remove "Save to Supabase?" IF node
2. Remove "7. Save to Supabase" HTTP Request node
3. Remove "Continue Pipeline" merge node
4. Connect "6. Parse Characters & Create Style Bible" directly to "8. Character Portrait Loop"
5. Add Supabase save AFTER all generation is complete (in "Build Final Response")

**Trade-off:** Lose incremental save capability, but gain workflow stability.

---

## Current Workflow State

### What's Working ✅

- Webhook receives JSON correctly (Session 9 fixed rawBody issue)
- Story analyzer, scene selector, caption writer all functioning
- Character extractor identifies characters properly
- Style bible is created successfully
- Character portraits are being generated
- Environment references are being generated

### What's Broken ❌

- Workflow crashes at "Continue Pipeline" (after Supabase save)
- Pages are never generated (crash happens before page loop)
- Frontend never receives a response (workflow never completes)
- Users see "Generation Failed" or timeout errors

### Data Flow Breakdown

```
"6. Parse Characters & Create Style Bible" (has pages ✓)
    ↓
"Save to Supabase?" (IF node - passes data unchanged ✓)
    ↓ true branch
"7. Save to Supabase" (HTTP Request)
    ↓ OUTPUT: {} ← DATA LOST HERE!
"Continue Pipeline" (receives {}, crashes)
    ↓
All downstream nodes: NEVER EXECUTED
```

---

## Architecture Context

### Legacy App vs n8n Workflow

| Aspect | Next.js (Legacy) | n8n Workflow |
|--------|------------------|--------------|
| Data Storage | Client-side React state | Must flow node-to-node |
| API Calls | Stateless, receive all needed data | Depend on previous node outputs |
| Data Loss Risk | Low - client always has data | High - HTTP nodes drop input |
| Orchestration | Client-side (browser) | Server-side (n8n Cloud) |

### Key Difference

- **Legacy:** Client sends story data to EVERY API endpoint. Each endpoint is independent.
- **n8n:** Story data flows through the workflow. Each node receives output from previous node.

### n8n Data Flow Rules

1. **Code nodes:** Return whatever you specify (full control)
2. **HTTP Request nodes:** Return ONLY API response (input data is lost)
3. **IF nodes:** Pass data through unchanged
4. **Merge nodes:** Can only access data from connected branches, not upstream nodes

---

## Testing Strategy

Once the fix is implemented:

1. **Re-import workflow** to n8n Cloud (`workflows/storybook-generator.json`)
2. **Re-assign credentials:**
   - Gemini API Key (Query Auth) - 9 nodes
   - Supabase Service Key (Header Auth) - 4 nodes (or 3 if HTTP node removed)
3. **Test with minimal story:**
   ```json
   {
     "storyText": "Once upon a time, a brave knight went on an adventure.",
     "settings": {
       "artStyle": "watercolor",
       "ageGroup": "5-7",
       "pageCount": 5,
       "aspectRatio": "2:3"
     },
     "saveToSupabase": true
   }
   ```
4. **Monitor n8n execution logs** for data flow
5. **Verify pages array reaches "Build Page Prompt"**
6. **Check Supabase tables** for saved records

---

## Feature Request for Future

**Real-time Granular Progress Updates:**

Current frontend shows a fake 8-second timer with generic steps like:
- "Analyzing story..."
- "Generating characters..."
- "Creating pages..."

User wants SUPER GRANULAR real-time updates showing exactly what's happening:
- "Analyzing narrative structure..."
- "Identified 3 characters: Sarah, Dragon, Wizard"
- "Generating portrait for Sarah..."
- "Portrait complete (1/3)"
- "Generating page 1 of 10..."

### Suggested Implementation

Use Supabase real-time subscriptions:

1. Workflow updates `stories.current_step` and `stories.progress_detail` frequently
2. Frontend subscribes to changes on the story record
3. Display progress_detail in real-time as workflow runs

**Example:**
```javascript
// In workflow Code nodes:
await updateStoryProgress(storyId, 'characters', 'Generating portrait for Sarah (1/3)');

// In frontend:
supabase
  .channel('story-progress')
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'stories', filter: `id=eq.${storyId}` },
    (payload) => {
      setProgressMessage(payload.new.progress_detail);
    }
  )
  .subscribe();
```

---

## Commits from Session 9

### `daf2537` - Fix: remove rawBody from webhook
**Status:** ✅ SUCCESSFUL
**What it fixed:** Webhook was receiving JSON as string instead of parsed object
**Impact:** Webhook now correctly receives `storyText`, `settings`, etc.

### `a1dd1be` - Fix: preserve pages data through Supabase save
**Status:** ❌ FAILED
**What it attempted:** Reference IF node data instead of HTTP node data
**Why it failed:** Can't reference nodes across unexecuted branches in n8n
**Current error:** `Cannot read properties of undefined (reading 'json')`

---

## Files to Review

### Workflow
- `/workflows/storybook-generator.json` - Main workflow definition (73KB)

### Documentation
- `/SESSION_SUMMARY.md` - Complete session history (Sessions 1-10)
- `/CLAUDE.md` - Project context for AI assistants
- `/SETUP_GUIDE.md` - n8n Cloud setup instructions

### Frontend
- `/frontend/src/app/studio/page.tsx` - Calls webhook, displays book
- `/frontend/src/lib/supabase.ts` - Supabase integration

---

## Success Criteria

The fix will be successful when:

1. ✅ Workflow completes without crashing at "Continue Pipeline"
2. ✅ `pages` array flows through to "Build Page Prompt"
3. ✅ Page illustrations are generated successfully
4. ✅ Frontend receives complete book data (or storyId to fetch from Supabase)
5. ✅ Supabase `stories` table has a record with status "completed"
6. ✅ Supabase `pages` table has records for all generated pages

---

## Quick Start Commands

```bash
# Navigate to project
cd "/Users/garygurevich/Documents/Vibe Coding/N8N Storybook Generator"

# Check git status
git status

# View recent commits
git log --oneline -5

# View workflow (use JSON viewer for better readability)
cat workflows/storybook-generator.json | python3 -m json.tool | less

# Test frontend locally (optional)
cd frontend
npm run dev
# Visit http://localhost:3000
```

---

## Notes

- Git working tree is clean (Session 9 committed all changes)
- Frontend is deployed on Netlify: https://storybookn8n.netlify.app
- Supabase project: `znvqqnrwuzjtdgqlkgvf`
- n8n Cloud version: v1.122.4
- This project diverged from brklyngg/storybook-generator (legacy Next.js app)

---

## Estimated Time to Fix

- Code node implementation: 30-45 minutes
- Workflow re-import and credential re-assignment: 15 minutes
- End-to-end testing: 20-30 minutes
- **Total: 1-1.5 hours**

---

## Contact Context

If more context is needed, review:
1. **Session 9 summary** in SESSION_SUMMARY.md (lines 130-280)
2. **Session 4 summary** for similar data preservation issue (lines 630-810)
3. **CLAUDE.md** for complete project architecture

---

**Ready to proceed with the fix!** 🚀
