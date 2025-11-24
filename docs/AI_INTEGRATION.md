# AI Integration Guide

Complete guide for implementing AI functionality using the Anthropic SDK in the Footy.bot application.

## Table of Contents
- [Overview](#overview)
- [Configuration](#configuration)
- [Creating AI Functions](#creating-ai-functions)
- [Using AI Functions](#using-ai-functions)
- [PDF and Image Handling](#pdf-and-image-handling)
- [Best Practices](#best-practices)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Overview

**This project uses the [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) directly for all AI operations.**

The application is deployed serverless on Vercel with a database-as-a-service backend. All AI functionality uses the Anthropic SDK for maximum compatibility and minimal overhead.

### Why Anthropic SDK?

- **Serverless Compatibility**: Designed for edge and serverless environments
- **Minimal Overhead**: Lightweight client with no heavy dependencies
- **Native PDF Support**: Claude can analyze PDFs and images directly
- **Type Safety**: Full TypeScript support out of the box

---

## Configuration

All AI functions are centralized in `/lib/release-analyzer.ts`.

### Basic Setup

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

### API Route Configuration

For long-running AI operations, configure appropriate timeouts in API routes:

```typescript
// app/api/analyze/route.ts
export const maxDuration = 300; // 5 minutes for complex analysis
export const runtime = 'nodejs'; // Use Node.js runtime for file operations
```

---

## Creating AI Functions

Define reusable AI functions with Zod schema validation to ensure type safety and data integrity.

### Example: Release Analysis

```typescript
// Define the output schema
export const ReleaseInfoSchema = z.object({
  manufacturer: z.string(),
  releaseName: z.string(),
  year: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  releaseDate: z.string().optional(),
  // ... more fields
});

export type ReleaseInfo = z.infer<typeof ReleaseInfoSchema>;

// Create the AI function
export async function analyzeRelease(input: {
  documentText?: string;
  documentUrl?: string;
  mimeType?: string;
}): Promise<ReleaseInfo> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Analyze this trading card release and extract key information.

        Return a JSON object with the following structure:
        {
          "manufacturer": "Manufacturer name",
          "releaseName": "Product name",
          "year": "Release year (YYYY or YYYY-YY format)",
          "slug": "url-friendly-slug",
          "description": "Brief product description"
        }

        Document text: ${input.documentText}`,
      },
    ],
  });

  // Extract JSON from response
  const responseText = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  // Find JSON in the response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in AI response');
  }

  const output = JSON.parse(jsonMatch[0]);

  // Validate and return
  return ReleaseInfoSchema.parse(output);
}
```

### Example: Description Generation

```typescript
export async function generateDescription(input: {
  name: string;
  manufacturer: string;
  year: string;
  features?: string[];
}): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Write a compelling 2-3 sentence description for this trading card release:

        Product: ${input.name}
        Manufacturer: ${input.manufacturer}
        Year: ${input.year}
        ${input.features ? `Features: ${input.features.join(', ')}` : ''}

        Make it engaging and informative for collectors.`,
      },
    ],
  });

  return message.content[0].type === 'text'
    ? message.content[0].text
    : '';
}
```

---

## Using AI Functions

Call AI functions from API routes to process data:

### From API Routes

```typescript
// app/api/releases/analyze/route.ts
import { analyzeRelease, generateDescription } from '@/lib/release-analyzer';

export async function POST(request: Request) {
  try {
    const { documentText, documentUrl } = await request.json();

    // Analyze the release
    const releaseInfo = await analyzeRelease({
      documentText,
      documentUrl,
    });

    // Generate a description
    const description = await generateDescription({
      name: releaseInfo.releaseName,
      manufacturer: releaseInfo.manufacturer,
      year: releaseInfo.year,
    });

    return Response.json({
      ...releaseInfo,
      description,
    });
  } catch (error) {
    console.error('AI analysis failed:', error);
    return Response.json(
      { error: 'Failed to analyze release' },
      { status: 500 }
    );
  }
}
```

### From Import Scripts

```typescript
// scripts/import-release.ts
import { analyzeRelease } from '@/lib/ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function importRelease(pdfPath: string) {
  // Read PDF and extract text
  const pdfBuffer = await fs.readFile(pdfPath);
  const base64Data = pdfBuffer.toString('base64');

  // Analyze with AI
  const releaseInfo = await analyzeRelease({
    documentUrl: `data:application/pdf;base64,${base64Data}`,
    mimeType: 'application/pdf',
  });

  // Save to database
  const release = await prisma.release.create({
    data: {
      name: releaseInfo.releaseName,
      slug: releaseInfo.slug,
      year: releaseInfo.year,
      description: releaseInfo.description,
      manufacturerId: manufacturerId,
    },
  });

  console.log(`✅ Created release: ${release.name}`);
}
```

---

## PDF and Image Handling

Claude supports direct analysis of PDFs and images via base64 encoding.

### PDF Analysis

```typescript
export async function analyzePDF(fileUrl: string): Promise<ReleaseInfo> {
  // Download file
  const response = await fetch(fileUrl);
  const arrayBuffer = await response.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString('base64');

  // Analyze with Claude
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64Data,
            },
          },
          {
            type: 'text',
            text: 'Analyze this PDF and extract release information. Return a JSON object with manufacturer, releaseName, year, and description.',
          },
        ],
      },
    ],
  });

  // Extract and validate response
  const responseText = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in AI response');
  }

  const output = JSON.parse(jsonMatch[0]);
  return ReleaseInfoSchema.parse(output);
}
```

### Image Analysis

```typescript
export async function analyzeCard Image(imageUrl: string) {
  // Download image
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString('base64');

  // Determine MIME type from URL
  const mimeType = imageUrl.endsWith('.png')
    ? 'image/png'
    : 'image/jpeg';

  // Analyze with Claude
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: base64Data,
            },
          },
          {
            type: 'text',
            text: `Analyze this trading card image and extract:
            - Player name
            - Card number
            - Parallel/variant name
            - Any visible serial numbers
            - Team name

            Return as JSON.`,
          },
        ],
      },
    ],
  });

  const responseText = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  return JSON.parse(responseText);
}
```

### Supported File Types

| Type | MIME Type | Max Size |
|------|-----------|----------|
| PDF | `application/pdf` | 32 MB |
| JPEG | `image/jpeg` | 5 MB |
| PNG | `image/png` | 5 MB |
| GIF | `image/gif` | 5 MB |
| WebP | `image/webp` | 5 MB |

---

## Best Practices

### 1. Schema Validation

Always use Zod schemas to validate AI outputs:

```typescript
// ❌ BAD: No validation
const result = JSON.parse(aiResponse);

// ✅ GOOD: Validate with Zod
const result = ReleaseInfoSchema.parse(JSON.parse(aiResponse));
```

### 2. Error Handling

Wrap AI calls in try-catch blocks with detailed error messages:

```typescript
export async function analyzeRelease(input: any): Promise<ReleaseInfo> {
  try {
    const message = await anthropic.messages.create({
      // ... configuration
    });

    const output = extractJSON(message);
    return ReleaseInfoSchema.parse(output);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation failed:', error.errors);
      throw new Error(`Invalid AI response: ${error.errors.map(e => e.message).join(', ')}`);
    }

    if (error instanceof SyntaxError) {
      console.error('JSON parsing failed:', error);
      throw new Error('AI returned invalid JSON');
    }

    console.error('AI request failed:', error);
    throw new Error('Failed to analyze release');
  }
}
```

### 3. Timeouts

Set appropriate `maxDuration` in API routes based on complexity:

```typescript
// Quick operations (< 30 seconds)
export const maxDuration = 30;

// Medium operations (1-2 minutes)
export const maxDuration = 120;

// Complex operations (3-5 minutes)
export const maxDuration = 300;
```

### 4. Token Limits

Use appropriate `max_tokens` based on expected response size:

```typescript
// Simple extraction (< 500 tokens)
max_tokens: 1024

// Moderate analysis (1000-2000 tokens)
max_tokens: 2048

// Complex analysis (2000-4000 tokens)
max_tokens: 4096
```

### 5. Model Selection

Use `claude-sonnet-4-20250514` for production workloads:

```typescript
// ✅ GOOD: Latest production model
model: 'claude-sonnet-4-20250514'

// ❌ BAD: Using outdated or experimental models
model: 'claude-3-opus-20240229'
```

### 6. Prompt Engineering

Write clear, specific prompts with examples:

```typescript
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 2048,
  messages: [
    {
      role: 'user',
      content: `Extract player information from this checklist.

      Format each entry as JSON:
      {
        "cardNumber": "1",
        "playerName": "Lionel Messi",
        "team": "Inter Miami",
        "variant": "Base"
      }

      Checklist text:
      ${checklistText}`,
    },
  ],
});
```

---

## Environment Variables

Required environment variable:

```bash
ANTHROPIC_API_KEY=your-api-key-here
```

### Setting Up Locally

1. Create a `.env.local` file in project root
2. Add your API key:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```

### Setting Up on Vercel

1. Go to Project Settings → Environment Variables
2. Add `ANTHROPIC_API_KEY` with your key
3. Make sure it's available in all environments (Production, Preview, Development)

---

## Troubleshooting

### Common Issues

#### 1. "No JSON found in AI response"

**Cause**: AI didn't return valid JSON

**Solution**: Improve prompt clarity:

```typescript
// Add explicit JSON instructions
const message = await anthropic.messages.create({
  // ...
  messages: [
    {
      role: 'user',
      content: `Return ONLY a valid JSON object, no additional text.

      Required format:
      {
        "field1": "value1",
        "field2": "value2"
      }`,
    },
  ],
});
```

#### 2. "Validation failed" errors

**Cause**: AI response doesn't match Zod schema

**Solution**: Log the response and adjust schema:

```typescript
try {
  return ReleaseInfoSchema.parse(output);
} catch (error) {
  console.error('Raw output:', JSON.stringify(output, null, 2));
  console.error('Validation errors:', error.errors);
  throw error;
}
```

#### 3. Timeout errors

**Cause**: Operation takes too long

**Solution**: Increase `maxDuration` or optimize prompt:

```typescript
// Increase timeout
export const maxDuration = 300;

// Simplify prompt to reduce processing time
const message = await anthropic.messages.create({
  max_tokens: 1024, // Reduce token limit
  // ... more concise prompt
});
```

#### 4. Rate limiting

**Cause**: Too many requests

**Solution**: Implement retry logic with exponential backoff:

```typescript
async function analyzeWithRetry(input: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await analyzeRelease(input);
    } catch (error: any) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

---

## Related Documentation

- [Anthropic SDK Documentation](https://github.com/anthropics/anthropic-sdk-typescript)
- [Claude API Reference](https://docs.anthropic.com/claude/reference)
- [Import Guide](/docs/IMPORT_GUIDE.md) - Using AI for data imports
- [Database Schema](/docs/DATABASE.md) - Understanding data models

---

*Last Updated: November 17, 2025*
