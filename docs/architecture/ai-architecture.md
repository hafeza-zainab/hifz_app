# AI Architecture

## Overview
AI integration via Anthropic Claude API for coach capabilities, memory tip generation, and learning style assessment.

## AI Provider
- **Provider**: Anthropic Claude
- **Model**: claude-sonnet-4-6
- **API Key**: ANTHROPIC_API_KEY (environment variable)

## AI Features

### 1. Coach Chat
- **Purpose**: Interactive AI coach for memorization guidance
- **Module**: `backend/modules/coach/`
- **Client**: `groqClient.js`
- **Routes**: `/api/coach/chat`

### 2. Memory Tips
- **Purpose**: Generate memory tips for similar verse pairs
- **Module**: `backend/modules/coach/prompts/mutashabihatTips.prompt.js`
- **Trigger**: First visit to each similarity pair
- **Caching**: Tips saved to user_tips table

### 3. AQMOS Assessment
- **Purpose**: Learning style assessment
- **Module**: `backend/modules/coach/prompts/`
- **Output**: Learning profile saved to aqmos_profiles table

### 4. Sequence Generation
- **Purpose**: Generate memorization sequences
- **Module**: `backend/modules/coach/prompts/sequence.prompt.js`
- **Wizard**: SequenceWizard (frontend)

### 5. Time Management
- **Purpose**: Generate weekly schedules
- **Module**: `backend/modules/coach/prompts/scheduling.prompt.js`
- **Wizard**: TimeManagementWizard (frontend)

## Prompt Architecture

### System Prompts
- **core.prompt.js**: Base system prompt
- **home.prompt.js**: Home page guidance
- **mutashabihat.prompt.js**: Similarity search guidance
- **bestMethod.prompt.js**: Best method recommendations

### Prompt Builder
- **Module**: `promptBuilder.js`
- **Purpose**: Constructs context-aware prompts
- **Features**: Context injection, formatting, token optimization

## Rate Limiting
- Applied to AI endpoints
- Configurable limits per endpoint
- Prevents API abuse

## Error Handling
- 429 rate limit handling with retry
- API error logging
- Fallback responses

## Cost Management
- Token usage tracking (not implemented)
- Prompt optimization (ongoing)
- Caching to reduce API calls
