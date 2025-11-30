# Session Summary

---

## Session 4 - November 30, 2025 (Morning)

### Overview
Critical debugging session focused on fixing workflow crashes and data flow issues in the n8n Storybook Generator. Identified and resolved credential configuration errors and a major data preservation bug causing undefined property errors.

### Work Completed

#### 1. Credential Configuration Verification
**Issue:** Confusion about which credential type to use for Gemini and Supabase APIs.

**Resolution:**
- **Gemini API:** Uses **Query Auth** credential (parameter name: `key`)
  - API key passed as URL parameter: `?key=YOUR_KEY`
  - n8n automatically appends this when Query Auth credential is selected
- **Supabase API:** Uses **Header Auth** credential (header name: `apikey`)
  - API key passed as HTTP header: `apikey: YOUR_KEY`
  - n8n automatically adds this when Header Auth credential is selected

**Impact:** Clarified correct credential configuration for both API integrations, preventing authentication errors.

#### 2. Data Preservation Bug Fix
**Issue:** HTTP Request nodes were losing `allData` object containing the `pages` array, causing "Cannot read properties of undefined (reading 'cameraAngle')" error in the Build Page Prompt code node.

**Root Cause Analysis:**
- Loop aggregation nodes (Aggregate Character Portraits, Aggregate Environment References, Aggregate Pages) were referencing their immediate predecessor HTTP Request nodes
- HTTP Request nodes only return API response data, not the full workflow state
- The `allData` object was being lost at each aggregation point

**Fix Implementation:**
Updated all three aggregation nodes to reference source nodes that contain `allData`:
- **Aggregate Character Portraits:** Changed from `$('Generate Portrait')` to `$('Continue Pipeline')`
- **Aggregate Environment References:** Changed from `$('Generate Environment Reference')` to `$('Aggregate Character Portraits')`
- **Aggregate Pages:** Changed from `$('Generate Page Image')` to `$('Prep Page Illustrations')` or `$('Aggregate Environment References')`

**Impact:** Restored complete data flow through the workflow, ensuring `pages` array and all metadata persists through the entire pipeline.

#### 3. Defensive Error Handling
Added explicit undefined check in Build Page Prompt code node:
```javascript
if (!page) {
  throw new Error(`Page data is undefined at index ${i}. Check that allData.pages exists and has ${pageCount} items.`);
}
```

**Impact:** Provides clear error messages for debugging if data flow breaks in the future.

#### 4. Documentation Updates

**CLAUDE.md:**
- Rewrote credentials section with clear distinction between Query Auth (Gemini) and Header Auth (Supabase)
- Added "How it works" explanations for each credential type
- Listed all 9 nodes requiring Gemini credential and 3 nodes requiring Supabase credential
- Clarified that n8n auto-injects credentials (no manual expression references needed)

**SETUP_GUIDE.md:**
- Updated Step 2 to use Query Auth for Gemini (was incorrectly showing Header Auth)
- Changed header name from `x-goog-api-key` to parameter name `key`
- Fixed Supabase credential from `Authorization: Bearer ...` to `apikey: ...` (no Bearer prefix)
- Added "How it works" sections explaining automatic credential injection
- Updated troubleshooting section with correct credential types

### Files Modified
- `/workflows/storybook-generator.json` (aggregation node references updated)
- `/CLAUDE.md` (credentials section rewritten)
- `/SETUP_GUIDE.md` (credential configuration corrected)

### Commits Made
1. `bdb7c8e` - fix: add JSON.stringify escaping to prevent invalid JSON errors
2. `ce32f58` - fix: add JSON.stringify escaping to Scene Selector, Caption Writer, and Consistency Reviewer
3. `2df3c83` - fix: preserve allData through loop aggregation nodes

### Technical Insights

**n8n Data Flow Patterns:**
- Loop aggregation nodes must reference nodes that contain full workflow state, not just API responses
- HTTP Request nodes only return `$json` from API response, losing previous workflow context
- Use Code nodes or non-HTTP nodes as reference points to preserve `allData`

**n8n Credential System:**
- Query Auth: For API keys passed as URL parameters (Gemini, many REST APIs)
- Header Auth: For API keys passed as HTTP headers (Supabase, authenticated APIs)
- n8n handles credential injection automatically - no need for manual `{{ $credentials }}` references

**Debugging Strategy:**
- When seeing "Cannot read properties of undefined", check loop aggregation references first
- Verify data is flowing through the pipeline by checking node outputs in execution logs
- Add defensive checks in Code nodes to provide clear error messages

### Current Blockers

**Memory Crash Issue:**
The workflow crashes after ~5 minutes of execution due to n8n Cloud memory limits. The root cause is accumulating base64-encoded images in the workflow state.

**Current Architecture:**
- Generate images → Store in workflow state → Pass through all nodes → Return at end
- Each image is ~500KB-2MB in base64 format
- 10-page book = ~5-20MB of image data in memory
- Multiple loops compound the memory usage

**Potential Solutions:**

**Option A: Progressive Compression** (quickest)
- Use `sharp` library in Code nodes to compress images to lower quality JPEG
- Reduce from 2MB/image to ~200-500KB/image
- Trade-off: Lower image quality in final output

**Option B: Supabase Storage Integration** (recommended for production)
- Upload images to Supabase Storage immediately after generation
- Store only URLs in workflow state
- Return URLs instead of base64 in final response
- Frontend downloads images from Supabase Storage
- Requires: Supabase Storage bucket, signed URL generation

**Option C: Immediate Database Save** (hybrid approach)
- Save images to Supabase `pages` and `characters` tables immediately during generation
- Remove image data from workflow state after save
- Only pass metadata through remaining nodes
- Final response returns story ID + fetch images from database
- Requires: Database saves to be mandatory (not optional)

**Next Session Priority:** Implement Option C (immediate database save) to resolve memory crash.

### Project State

**Working Features:**
- Complete 12-node workflow with proper data flow
- Credential configuration documented and correct
- Environment reference generation
- Hero photo support
- Defensive error handling
- Loop aggregation references fixed

**Testing Status:**
- Data flow bug resolved (verified in workflow structure)
- Not yet tested end-to-end due to memory crash blocker
- Credential configuration verified against n8n documentation

**Known Issues:**
1. **Memory crash:** Workflow crashes after ~5 min due to accumulated base64 images
2. **Pending end-to-end test:** Cannot complete full test run until memory issue resolved

### Next Session Priorities

1. **Implement Option C - Immediate Database Save:**
   - Modify workflow to save images to Supabase immediately after generation
   - Remove base64 data from workflow state after database save
   - Update aggregation nodes to only pass metadata
   - Change final response to return story ID instead of full image data
   - Update frontend to fetch images from Supabase instead of webhook response

2. **Alternative: Implement Option B - Storage Integration:**
   - Set up Supabase Storage bucket for images
   - Add upload logic to Code nodes after image generation
   - Implement signed URL generation
   - Update response format to return URLs
   - Update frontend to display images from URLs

3. **Testing After Fix:**
   - Complete end-to-end test with real story
   - Verify memory usage stays within n8n Cloud limits
   - Test with 5-page, 10-page, and 20-page books
   - Monitor execution time and API costs

4. **Frontend Updates:**
   - Update studio page to handle new response format (URLs vs base64)
   - Add Supabase fetching logic if using database/storage approach
   - Implement loading states for image downloads
   - Add error handling for missing images

### Notes

- This session revealed critical architectural issue: n8n Cloud cannot handle large base64 payloads
- Original Next.js app doesn't have this issue because it processes images in streaming responses
- n8n workflow must use external storage (database or Supabase Storage) for images
- Trade-off: More complex architecture but necessary for n8n Cloud deployment
- Database approach (Option C) leverages existing Supabase integration
- Storage approach (Option B) is cleaner but requires additional setup

### Session Duration
Approximately 1.5 hours (debugging + documentation updates)

---

## Session 3 - November 29, 2025 (Late Evening)

### Overview
Critical bug fix session focused on fixing the Supabase integration in the n8n workflow. Resolved incorrect node operation and field mapping issues, then added complete database persistence for characters and pages.

### Work Completed

#### 1. Supabase Node Operation Fix
- **Issue:** Node 7 (Save to Supabase) was using "insert" operation, which is invalid in n8n's Supabase node
- **Fix:** Changed operation to "create" (correct n8n API)
- **Impact:** Resolved blocker preventing database saves

#### 2. Stories Table Field Mapping Configuration
Configured all field mappings for the `stories` table with proper Expression syntax:
- `id` - {{ $json.storyId }}
- `source_text` - {{ $json.storyText }}
- `settings` - {{ $json.settings }}
- `theme` - {{ $json.theme }}
- `title` - {{ $json.title }}
- `status` - {{ $json.status }}
- `current_step` - {{ $json.current_step }}

**Technical note:** n8n Supabase node requires "Expression" type for dynamic values, not "Fixed" type.

#### 3. Character Persistence Implementation
Added 3 new nodes for saving character portraits to Supabase:
- **Parse Portrait Result** (Code node) - Extracts base64 image data from Gemini API response
- **Save Character?** (IF node) - Conditional check on `saveToSupabase` flag
- **Save Character to DB** (Supabase node) - Saves to `characters` table with fields:
  - story_id (reference)
  - name
  - description
  - role
  - reference_image (base64)

#### 4. Page Persistence Implementation
Added 3 new nodes for saving page illustrations to Supabase:
- **Parse Page Result** (Code node) - Extracts base64 image data from Gemini API response
- **Save Page?** (IF node) - Conditional check on `saveToSupabase` flag
- **Save Page to DB** (Supabase node) - Saves to `pages` table with fields:
  - story_id (reference)
  - page_number
  - caption
  - scene_description
  - image_data (base64)
  - environment
  - camera_angle

#### 5. Workflow Connection Updates
- Properly wired all new nodes into the workflow
- Character save branch: After "Generate Portrait" → Parse → IF → Save → Continue loop
- Page save branch: After "Generate Page Image" → Parse → IF → Save → Continue loop
- Maintained loop functionality while adding conditional persistence

#### 6. Documentation Updates
- **CLAUDE.md:** Updated pipeline steps to document new save nodes
- **SETUP_GUIDE.md:**
  - Added complete database schema for all 3 tables (stories, characters, pages)
  - Updated Supabase configuration instructions
  - Documented credential setup for n8n Supabase nodes
  - Added table selection guidance

### Files Modified
- `/workflows/storybook-generator.json` (6 new nodes, multiple connection updates)
- `/CLAUDE.md` (pipeline documentation updated)
- `/SETUP_GUIDE.md` (Supabase setup section expanded)

### Commits Made
1. `f01869b` - fix: configure Supabase node with proper operation and field mappings
2. `c949fc0` - feat: add Supabase save nodes for characters and pages tables
3. `8a832e7` - docs: update documentation for Supabase character and page save nodes

### Technical Insights

**n8n Supabase Node Gotchas:**
1. Operation must be "create" not "insert" (n8n API terminology)
2. Field mappings require "Expression" type for dynamic values
3. Expression syntax: `{{ $json.fieldName }}` (double curly braces)
4. Table selection is a dropdown (must re-import workflow to see tables)

**n8n MCP Limitations:**
- Partial workflow updates via MCP tools don't work reliably
- User must manually re-import the workflow JSON file after changes
- Credential connections must be re-selected in n8n UI after import

**Database Design:**
- All 3 tables now have proper foreign key relationships
- `story_id` references enable CASCADE deletes
- Base64 image storage in TEXT columns for simplicity
- created_at timestamps for all records

### Project State

**Working Features:**
- Complete Supabase persistence across all 3 tables
- Conditional database saves (optional feature via saveToSupabase flag)
- Proper foreign key relationships between stories, characters, and pages
- All field mappings configured with correct Expression syntax

**Testing Status:**
- Workflow structure validated
- Database schema verified
- Not yet tested end-to-end with real n8n Cloud deployment

**Known Requirements for User:**
1. Re-import workflow JSON to n8n Cloud
2. Select tables from dropdown in each of the 3 Supabase nodes
3. Connect Supabase credential to all 3 Supabase nodes
4. Create the 3 tables in Supabase using provided schema

### Next Session Priorities

1. **n8n Cloud Deployment:**
   - Import updated workflow to n8n Cloud
   - Configure Supabase credential (Host + Service Role Key)
   - Select tables in Supabase node dropdowns
   - Verify all 3 save nodes are properly connected

2. **Database Testing:**
   - Create test story with `saveToSupabase: true`
   - Verify story record is created in `stories` table
   - Verify character records are created in `characters` table
   - Verify page records are created in `pages` table
   - Check foreign key relationships

3. **End-to-End Validation:**
   - Test complete workflow with Supabase persistence enabled
   - Verify image data is properly stored as base64
   - Test without Supabase (saveToSupabase: false) to ensure workflow still works
   - Validate response format with and without database saves

4. **Frontend Integration:**
   - Update frontend to support saveToSupabase parameter
   - Add UI toggle for database persistence
   - Display saved stories from Supabase in Story Library dropdown

### Notes

- The workflow now has complete database persistence capabilities
- Database saves are optional - workflow works with or without Supabase
- Base64 image storage is simple but may have size limitations for large books
- Consider migrating to Supabase Storage for images if base64 becomes problematic
- Foreign key CASCADE deletes ensure data integrity when stories are deleted

### Session Duration
Approximately 1.5 hours (Supabase configuration + documentation updates)

---

## Session 2 - November 29, 2025 (Evening)

### Overview
Major refactoring session focused on fixing critical workflow bugs and achieving n8n Cloud compatibility. Transitioned from LangChain nodes to direct Gemini API calls, updated models to actually available versions, and implemented missing features from the original GitHub repository.

### Work Completed

#### 1. Initial Project Documentation
- Created `CLAUDE.md` for AI-assisted development context
- Documented project architecture and purpose

#### 2. Workflow Bug Fixes (via n8n-workflow-architect agent)
- **Critical fix:** Resolved infinite loop bug in Page Illustrator Loop node
- Combined redundant nodes for cleaner workflow
- Made Supabase operations conditional (optional database usage)
- Added rate limiting (Wait nodes) to prevent API throttling
- Renamed conflicting wait node names for clarity

#### 3. Feature Parity Analysis
Compared n8n implementation against original GitHub repo (brklyngg/storybook-generator):
- Identified model discrepancies (original uses gemini-3-pro-image-preview)
- Found missing features: environment references, hero photo support, aspect ratios
- Documented differences in prompt engineering approach

#### 4. Missing Feature Implementation
- **Environment Reference Loop (Node 8b):** Generates reference images for recurring story locations
- **Hero Photo Support:** Added base64 heroImage parameter for protagonist face consistency
- **Prompt Updates:** Modified all generation prompts to reference environment images
- Enhanced character consistency across pages

#### 5. Model Alignment Updates
First attempt at model updates (later revised):
- Text models: gemini-3-pro-preview
- Image models: gemini-3-pro-image-preview
- Character Extractor: Updated to multimodal model
- Consistency Reviewer: Updated to multimodal model

#### 6. n8n Cloud Compatibility Overhaul (via n8n-workflow-architect agent)
Complete architectural rewrite for n8n Cloud v1.122.4:

**Node Type Changes:**
- Replaced all LangChain Gemini nodes with HTTP Request nodes
- Direct Gemini REST API calls (https://generativelanguage.googleapis.com/v1beta/models/)
- Changed credential type from custom to googlePalmApi

**Model Updates (Final):**
- Text generation: gemini-2.5-flash
- Image generation: gemini-2.0-flash-preview-image-generation
- Note: These are the actually available models in n8n Cloud (verified against production limitations)

**Error Handling:**
- Added Error Trigger node for workflow-level error capture
- Implemented Handle Error node for graceful failure recovery
- Proper error propagation and logging

**API Integration:**
- Updated response parsing for Gemini API JSON format
- Increased timeouts: 60s for text, 120s for images
- Adjusted rate limits: 3-4 second delays between calls
- Proper header configuration (Content-Type, x-goog-api-key)

**Request Body Structure:**
```json
{
  "contents": [{
    "parts": [{"text": "prompt"}]
  }],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 2048
  }
}
```

#### 7. Documentation Overhaul
- **CLAUDE.md:** New file with complete project context
- **SETUP_GUIDE.md:** Rewritten for n8n Cloud workflow (removed self-hosted instructions)
- **env.example:** Updated with correct credential requirements
- **README.md:** Updated architecture section with new node types

### Files Modified
- `workflows/storybook-generator.json` (764 insertions, 442 deletions - complete rewrite)
- `SETUP_GUIDE.md` (356 lines modified)
- `README.md` (66 lines modified)
- `env.example` (8 lines modified)
- `CLAUDE.md` (new file, untracked)

### Technical Decisions Made

1. **LangChain Abandonment:** LangChain nodes not available in n8n Cloud, necessitated direct API integration
2. **Model Selection:** Chose available models over ideal models (gemini-2.5-flash vs gemini-3-pro-preview)
3. **Credential Strategy:** Using googlePalmApi credential type for simplicity in n8n Cloud
4. **Error Handling Pattern:** Workflow-level error trigger + per-node error handling for robustness

### Challenges Overcome

1. **Infinite Loop Bug:** Original workflow had no exit condition in Page Illustrator Loop
2. **Model Availability:** Initial model choices were not available in n8n Cloud production
3. **API Format Mismatch:** LangChain abstraction vs raw Gemini API required different request/response handling
4. **Rate Limiting:** Added strategic Wait nodes to prevent 429 errors

### Project State

**Working Features:**
- Complete 12-node workflow with error handling
- Environment reference generation for location consistency
- Hero photo support for character face consistency
- All prompts updated from original GitHub repo
- n8n Cloud compatible (v1.122.4)

**Testing Status:**
- Workflow structure validated
- API integration patterns verified
- Not yet tested end-to-end with real story input

**Known Limitations:**
- Model capabilities reduced from ideal (flash models vs pro models)
- Image quality may differ from original Next.js version
- Supabase integration optional but not fully tested

### Next Session Priorities

1. **End-to-End Testing:**
   - Import workflow into n8n Cloud
   - Configure Google Gemini API credentials
   - Test with sample story from original repo
   - Validate image generation quality

2. **Quality Validation:**
   - Compare output quality vs original Next.js app
   - Assess if gemini-2.0-flash-preview-image-generation produces acceptable results
   - Consider aspect ratio implementation (currently missing)

3. **Frontend Integration:**
   - Test webhook integration with minimal frontend
   - Verify response format matches frontend expectations
   - Add error handling UI

4. **Documentation:**
   - Add troubleshooting section to SETUP_GUIDE.md
   - Document known model limitations
   - Create example payloads for testing

5. **Feature Additions:**
   - Implement aspect ratio selection (missing from current version)
   - Add age range customization (3-18, like original app)
   - Consider PDF/ZIP export options

### Notes

- This project is now significantly diverged from the original GitHub repo architecture
- Original uses Next.js API routes + server actions, this uses n8n webhook + visual workflow
- Trade-off: Lost some model capabilities but gained visual editing and execution transparency
- Cost implications: Flash models are cheaper than Pro models (approximately $0.40 vs $0.80 per 20-page book)
- The n8n version may be more maintainable for non-developers due to visual interface

### Session Duration
Approximately 3-4 hours (multiple agent iterations + architecture rewrites)

---

## Session 1 - November 29, 2025 (Initial)

## What We Built

Created a **complete n8n workflow version** of the Storybook Generator as a separate project.

## Key Deliverables

### 1. n8n Workflow (`workflows/storybook-generator.json`)
- 12-node pipeline replicating all functionality from the legacy app
- Each AI agent is independently adjustable in n8n UI
- Connects to existing Supabase tables

### 2. Minimal Frontend (`frontend/`)
- Next.js app with story input page and studio page
- Calls n8n webhook instead of API routes
- Same visual style as legacy app

### 3. Documentation
- `README.md` - Quick start guide
- `SETUP_GUIDE.md` - Detailed setup instructions

## Workflow Architecture

```
Webhook → Story Analyzer → Scene Selector → Caption Writer → Character Extractor
    ↓
Style Bible Creator → Save to Supabase → Character Portrait Loop
    ↓
Page Illustrator Loop → Consistency Reviewer → Consistency Fixer → Response
```

## Why n8n?

| Legacy App | n8n Version |
|------------|-------------|
| Edit TypeScript, deploy | Click node, edit prompt, save |
| Console.log debugging | Visual execution view |
| Custom retry logic | Built-in Wait nodes |
| No execution history | Full execution logs |

## Next Steps

1. Import workflow into n8n
2. Add Gemini + Supabase credentials
3. Run frontend locally
4. Test with a story
5. Tweak individual agents as needed

## Files Created

- `workflows/storybook-generator.json` (2000+ lines)
- `frontend/src/app/page.tsx`
- `frontend/src/app/studio/page.tsx`
- `frontend/src/app/layout.tsx`
- `frontend/src/app/globals.css`
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/tailwind.config.ts`
- `README.md`
- `SETUP_GUIDE.md`

