<!-- 190934f5-c188-4dc8-9521-23d1810d9139 2160b525-d29a-4746-877b-f4b1ea41cfde -->
# Deploy n8n Workflow Fix

## Problem Confirmed

Execution 12978 shows the exact error at `Continue Pipeline` node - the deployed workflow still uses:

- `$('Save to Supabase?').first().json` which fails because the HTTP Request node loses input data

## Fix (from local file)

### Node 1: "7. Save to Supabase" (id: `9297a424-fa23-48b2-a64c-53b52a7519e3`)

**Change:** HTTP Request -> Code node with `fetch()`

```javascript
// Save story to Supabase AND return original data (not API response)
const data = $input.first().json;

try {
  const response = await fetch('https://znvqqnrwuzjtdgqlkgvf.supabase.co/rest/v1/stories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': $credentials.httpHeaderAuth.value,
      'Authorization': `Bearer ${$credentials.httpHeaderAuth.value}`,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      id: data.storyId,
      source_text: (data.storyText || '').substring(0, 10000),
      settings: data.settings,
      theme: data.analysis?.theme || '',
      title: data.analysis?.title || 'Untitled',
      status: 'generating',
      current_step: 'characters'
    })
  });
  
  if (!response.ok) {
    console.error('Supabase save failed:', response.status);
  }
} catch (e) {
  console.error('Supabase save error:', e.message);
}

// CRITICAL: Return original data, not API response
return [{ json: data }];
```

### Node 2: "Continue Pipeline" (id: `7bb40391-d818-40a8-82c9-f72671817fd0`)

**Change:** Update code to use `$input.first().json`

```javascript
// Simply pass through data from whichever branch executed
const data = $input.first().json;
return [{ json: data }];
```

## Deployment Method

Use n8n MCP `n8n_update_workflow` to update both nodes in a single API call.

## Verification

After deployment, trigger a test execution and verify it passes the `Continue Pipeline` node.

### To-dos

- [ ] Use n8n MCP to update both nodes in the deployed workflow
- [ ] Trigger test execution and verify workflow passes Continue Pipeline