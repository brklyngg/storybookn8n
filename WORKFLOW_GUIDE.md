# Storybook Generator Workflow - Explained

This document breaks down the n8n workflow in `workflows/storybook-generator.json` so you can understand what each node does.

## Visual Flow Diagram

```
                                    MAIN PIPELINE
===============================================================================================

[1. Webhook Input] ──> [Extract & Validate] ──> [2. Story Analyzer] ──> [Parse Analysis]
        │                    Inputs                    │                      │
        v                                              v                      v
   Receives POST                              Gemini AI analyzes        Extracts JSON
   with story +                               narrative structure       from AI response
   settings                                                                  │
                                                                             v
                                                                    [3. Scene Selector]
                                                                             │
                                                                             v
                                                                       [Parse Scenes]
                                                                             │
                                                                             v
                                                                    [4. Caption Writer]
                                                                             │
                                                                             v
                                                              [Parse Captions & Build Pages]
                                                                             │
                                                                             v
                                                                  [5. Character Extractor]
                                                                             │
                                                                             v
                                                   [6. Parse Characters & Create Style Bible]
                                                                             │
                                                                             v
                               ┌──[YES]── [Save to Supabase?] ──[NO]──┐
                               │                                       │
                               v                                       │
                    [7. Save to Supabase]                              │
                               │                                       │
                               └───────> [Continue Pipeline] <─────────┘
                                                   │
            ┌──────────────────────────────────────┴──────────────────────────────────────┐
            │                        IMAGE GENERATION LOOPS                                │
            │                                                                              │
            │  [8. Character Portraits] ──> [8b. Environment Refs] ──> [9. Page Images]   │
            │         (3s delay)                  (3s delay)               (4s delay)      │
            └──────────────────────────────────────┬──────────────────────────────────────┘
                                                   │
                                                   v
                                      [10. Consistency Reviewer]
                                                   │
                          ┌──[YES]── [Needs Fixing?] ──[NO]──┐
                          │                                   │
                          v                                   │
                   [11. Fix Loop]                             │
                          │                                   │
                          └───────> [12. Build Response] <────┘
                                            │
                                            v
                                   [13. Webhook Response]
                                            │
                                            v
                                    Returns JSON book


                                    ERROR PATH
================================================================================================
[Error Trigger] ──> [Handle Error] ──> [Error Response] ──> Returns 500 with error JSON
```

---

## The 4 Pipeline Phases

### Phase 1: Text Analysis (Nodes 1-6)

**Purpose:** Understand the story and plan the book

| Node | What it does |
|------|--------------|
| **1. Webhook Input** | Receives your story via POST request |
| **Extract & Validate Inputs** | Cleans up data, sets defaults (age=6, pages=10, etc.) |
| **2. Story Analyzer** | AI reads story → extracts title, theme, key moments, locations |
| **3. Scene Selector** | AI picks exactly N scenes to illustrate (based on page count) |
| **4. Caption Writer** | AI writes age-appropriate text for each page |
| **5. Character Extractor** | AI describes every character in precise visual detail |
| **6. Style Bible** | Creates art rules (colors, lighting, what to avoid) |

---

### Phase 2: Reference Generation (Nodes 8, 8b)

**Purpose:** Create visual references for consistency

| Loop | What it does | Rate limit |
|------|--------------|------------|
| **8. Character Portrait Loop** | Generates a reference portrait for each main character | 3 sec |
| **8b. Environment Reference Loop** | Generates empty scene refs for recurring locations | 3 sec |

**Why?** So when drawing pages, the AI knows exactly how each character and location should look.

---

### Phase 3: Page Illustration (Node 9)

**Purpose:** Generate the actual book pages

| Node | What it does |
|------|--------------|
| **Build Page Prompt** | Combines scene info + character refs + environment refs + style rules |
| **Generate Page Image** | Calls Gemini to create the illustration |
| **Page Rate Limit** | 4 second wait between pages |

This loop runs once per page (default 10 times).

---

### Phase 4: Quality Control & Output (Nodes 10-13)

**Purpose:** Fix inconsistencies and return the book

| Node | What it does |
|------|--------------|
| **10. Consistency Reviewer** | AI checks all pages for visual mistakes |
| **11. Consistency Fixer Loop** | Regenerates up to 3 problematic pages |
| **12. Build Final Response** | Assembles everything into JSON |
| **13. Webhook Response** | Sends the complete book back to the frontend |

---

## Node Count by Type

| Type | Count | Purpose |
|------|-------|---------|
| HTTP Request | 9 | All Gemini API calls |
| Code | 16 | Data transformation & parsing |
| Split In Batches | 4 | Loop controllers |
| Wait | 4 | Rate limiting |
| IF | 2 | Conditional branching |
| Webhook/Response | 3 | Input/output |
| Other | 2 | Supabase, Error Trigger |
| **Total** | **40** | |

---

## Timing Estimate

For a **10-page book** with 4 characters and 4 environments:

| Phase | Time |
|-------|------|
| Text analysis (5 AI calls) | ~45 seconds |
| Character portraits | ~2-3 minutes |
| Environment references | ~2-3 minutes |
| Page illustrations | ~7-10 minutes |
| Consistency review + fixes | ~1-2 minutes |
| **Total** | **12-20 minutes** |

---

## Key Design Patterns Used

1. **Direct HTTP over LangChain** - Full control over Gemini API parameters
2. **Sequential loops with rate limiting** - Prevents API throttling
3. **Reference-based consistency** - Generate refs first, use them in pages
4. **Two-pass quality** - Generate → Review → Fix
5. **Data accumulation** - Each node carries forward all previous data

---

## AI Models Used

| Task | Model |
|------|-------|
| Text analysis | `gemini-3-pro-preview` |
| Image generation | `gemini-3-pro-image-preview` |

All models use `temperature: 1.0` as recommended for Gemini 3.

---

## Detailed Node Reference

### Input Nodes

#### 1. Webhook Input
- **Type:** `n8n-nodes-base.webhook`
- **Path:** `/generate-storybook`
- **Method:** POST
- **Receives:** `{ storyText, settings, heroImage }`

#### Extract & Validate Inputs
- **Type:** `n8n-nodes-base.code`
- **Extracts:** storyText, storyId, targetAge, desiredPageCount, intensity, aestheticStyle, heroImage
- **Defaults:** age=6, pages=10, intensity=5, style="watercolor children's book illustration"

---

### Text Analysis Nodes

#### 2. Story Analyzer
- **Type:** HTTP Request → Gemini API
- **Input:** Story text (first 8000 chars)
- **Output:** title, theme, emotionalArc, protagonistJourney, keyMoments, tone, setting, keyEnvironments

#### 3. Scene Selector
- **Type:** HTTP Request → Gemini API
- **Input:** Story analysis + page count
- **Output:** Array of scenes with pageNumber, moment, emotionalBeat, visualPotential, cameraAngle, environment

#### 4. Caption Writer
- **Type:** HTTP Request → Gemini API
- **Input:** Scenes + target age
- **Output:** Age-appropriate captions for each page

#### 5. Character Extractor
- **Type:** HTTP Request → Gemini API
- **Input:** Story text + pages
- **Output:** Character list with name, description, role, isHero, keyFeatures, appearsOnPages

#### 6. Parse Characters & Create Style Bible
- **Type:** `n8n-nodes-base.code`
- **Creates:** styleBible object with artStyle, colorPalette, lighting, composition, visualDensity, doNots
- **Extracts:** List of environments for reference generation

---

### Image Generation Loops

#### 8. Character Portrait Loop
- **Loop Type:** Split In Batches (batchSize: 1)
- **Generates:** Front-facing character reference portraits
- **Rate Limit:** 3 seconds between portraits

#### 8b. Environment Reference Loop
- **Loop Type:** Split In Batches (batchSize: 1)
- **Generates:** Empty establishing shots of recurring locations
- **Rate Limit:** 3 seconds between environments

#### 9. Page Illustrator Loop
- **Loop Type:** Split In Batches (batchSize: 1)
- **Generates:** Full page illustrations with characters in environments
- **Rate Limit:** 4 seconds between pages

---

### Quality Control Nodes

#### 10. Consistency Reviewer
- **Type:** HTTP Request → Gemini API
- **Checks:** Character appearance, environment consistency, timeline logic, style drift
- **Output:** List of issues and pages needing regeneration

#### 11. Consistency Fixer Loop
- **Loop Type:** Split In Batches (batchSize: 1)
- **Limit:** Maximum 3 pages per run (prevents infinite loops)
- **Rate Limit:** 4 seconds between fixes

---

### Output Nodes

#### 12. Build Final Response
- **Type:** `n8n-nodes-base.code`
- **Assembles:** Complete book JSON with pages, characters, environments, styleBible, metadata

#### 13. Webhook Response
- **Type:** `n8n-nodes-base.respondToWebhook`
- **Returns:** JSON response to calling client

---

### Error Handling

#### Error Trigger
- **Type:** `n8n-nodes-base.errorTrigger`
- **Catches:** Any unhandled workflow errors

#### Handle Error
- **Type:** `n8n-nodes-base.code`
- **Formats:** Error message, node name, timestamp

#### Error Response
- **Type:** `n8n-nodes-base.respondToWebhook`
- **Returns:** 500 status with error JSON
