# Natural Language to SQL Investigation

## Executive Summary

This document explores web-based natural language to SQL (NL-to-SQL) solutions using Claude AI for the 3pt.bot basketball trading card database. We investigate approaches for:
- Generating, running, and explaining SQL from natural language prompts
- Using Retrieval Augmented Generation (RAG) with vector stores
- Generating synthetic training data
- Building a conversational interface for basketball card queries

---

## 1. Current 3pt.bot Architecture

### Database Schema (PostgreSQL via Neon)
```
Manufacturer → Release → Set → Card
```

| Table | Key Fields | Records |
|-------|-----------|---------|
| **Manufacturer** | id, name | ~4 (Panini, Topps, Upper Deck, Leaf) |
| **Release** | name, year, slug, summary, manufacturerId | Variable |
| **Set** | name, type (Base/Auto/Mem/Insert), printRun, isParallel | Variable |
| **Card** | playerName, team, cardNumber, parallelType, printRun, rarity | ~thousands |

### Existing AI Integration (`lib/ai.ts`)
- Model: `claude-sonnet-4-20250514`
- Functions: `analyzeCardImages()`, `analyzeReleaseDocuments()`, `analyzeSetDocumentsWithCards()`
- Pattern: Uses Anthropic SDK with Zod schema validation

---

## 2. NL-to-SQL Approaches with Claude

### 2.1 Direct Prompting (Anthropic SQL Sorcerer Pattern)

The simplest approach from [Anthropic's Cookbook](https://github.com/anthropics/anthropic-cookbook/blob/main/misc/how_to_make_sql_queries.ipynb):

```typescript
async function generateSQL(question: string): Promise<string> {
  const schema = `
    CREATE TABLE Card (
      id TEXT PRIMARY KEY,
      playerName TEXT,
      team TEXT,
      cardNumber TEXT,
      parallelType TEXT,
      printRun INTEGER,
      rarity TEXT,
      setId TEXT REFERENCES Set(id)
    );
    CREATE TABLE Set (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT, -- Base, Autograph, Memorabilia, Insert
      printRun INTEGER,
      isParallel BOOLEAN,
      releaseId TEXT REFERENCES Release(id)
    );
    -- ... more tables
  `;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `You are an expert SQL generator. Given a database schema, convert natural language questions into valid PostgreSQL queries. Only output the SQL query, nothing else.`,
    messages: [{
      role: "user",
      content: `Schema:\n${schema}\n\nQuestion: ${question}`
    }]
  });

  return response.content[0].text;
}
```

**Pros:** Simple, no additional infrastructure
**Cons:** No semantic understanding of domain, limited accuracy on complex queries

### 2.2 RAG-Enhanced SQL Generation

From [AWS's text-to-SQL guide](https://aws.amazon.com/blogs/machine-learning/build-your-gen-ai-based-text-to-sql-application-using-rag-powered-by-amazon-bedrock-claude-3-sonnet-and-amazon-titan-for-embedding/):

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   User      │ -> │  Embedding   │ -> │  Vector DB  │
│   Question  │    │   Model      │    │  (pgvector) │
└─────────────┘    └──────────────┘    └──────────────┘
                                             │
                   ┌──────────────┐          │
                   │   Similar    │ <--------┘
                   │   Examples   │
                   └──────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────┐
│                 Claude Prompt                        │
│  - Schema                                           │
│  - Retrieved similar Q&A examples (few-shot)        │
│  - Domain documentation (table descriptions)        │
│  - User question                                    │
└─────────────────────────────────────────────────────┘
                         │
                         v
                   ┌──────────────┐
                   │  SQL Query   │
                   └──────────────┘
```

**Key Components:**
1. **Schema Embeddings**: Embed table/column descriptions
2. **Query Examples**: Store successful Q&A pairs
3. **Domain Documentation**: Basketball card terminology

### 2.3 Vanna AI Integration

[Vanna](https://github.com/vanna-ai/vanna) is an MIT-licensed Python RAG framework specifically for text-to-SQL:

```python
from vanna.anthropic import Anthropic_Chat
from vanna.chromadb import ChromaDB_VectorStore

class MyVanna(ChromaDB_VectorStore, Anthropic_Chat):
    def __init__(self, config=None):
        ChromaDB_VectorStore.__init__(self, config=config)
        Anthropic_Chat.__init__(self, config=config)

vn = MyVanna(config={
    'api_key': ANTHROPIC_API_KEY,
    'model': 'claude-sonnet-4-20250514'
})

# Train on schema
vn.train(ddl="CREATE TABLE Card ...")

# Train on documentation
vn.train(documentation="A 'parallel' is a variant of a base card...")

# Train on example queries
vn.train(question="Find all 1/1 cards", sql="SELECT * FROM Card WHERE printRun = 1")

# Generate SQL
sql = vn.generate_sql("Show me all LeBron James rookie cards")
```

**Features:**
- Supports Claude via `AnthropicLlmService`
- Pluggable vector stores (ChromaDB, pgvector, Milvus)
- Auto-training on successful queries
- Self-correction loop for failed queries

---

## 3. Vector Store Options for RAG

### 3.1 pgvector (Recommended for 3pt.bot)

Since 3pt.bot uses PostgreSQL (Neon), [pgvector](https://supabase.com/docs/guides/database/extensions/pgvector) is ideal:

```sql
-- Enable extension (check Neon dashboard)
CREATE EXTENSION IF NOT EXISTS vector;

-- Schema metadata embeddings table
CREATE TABLE schema_embeddings (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    column_name TEXT,
    description TEXT NOT NULL,
    embedding VECTOR(1536)  -- OpenAI ada-002 dimension
);

-- Example query embeddings table
CREATE TABLE query_examples (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    sql_query TEXT NOT NULL,
    explanation TEXT,
    embedding VECTOR(1536),
    success_count INT DEFAULT 0
);

-- Similarity search function
CREATE OR REPLACE FUNCTION match_examples(
    query_embedding VECTOR(1536),
    match_threshold FLOAT,
    match_count INT
)
RETURNS TABLE (question TEXT, sql_query TEXT, similarity FLOAT)
AS $$
    SELECT question, sql_query, 1 - (embedding <=> query_embedding) AS similarity
    FROM query_examples
    WHERE 1 - (embedding <=> query_embedding) > match_threshold
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$ LANGUAGE sql STABLE;
```

### 3.2 Prisma Integration

```typescript
// In schema.prisma - would require raw SQL for vector operations
// Alternatively, use Prisma's $queryRaw for vector queries

const similarExamples = await prisma.$queryRaw`
  SELECT question, sql_query, 1 - (embedding <=> ${queryEmbedding}::vector) as similarity
  FROM query_examples
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 5
`;
```

### 3.3 Next.js Implementation Template

From [NextRag](https://github.com/HamedMP/NextRag) and [Vercel's pgvector template](https://vercel.com/templates/next.js/postgres-pgvector):

```typescript
// lib/embeddings.ts
import { OpenAI } from 'openai';

const openai = new OpenAI();

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

// lib/nlToSql.ts
export async function nlToSql(question: string): Promise<{
  sql: string;
  explanation: string;
}> {
  // 1. Generate embedding for question
  const embedding = await generateEmbedding(question);

  // 2. Find similar examples
  const examples = await findSimilarExamples(embedding, 5);

  // 3. Generate SQL with Claude
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    system: buildSystemPrompt(SCHEMA, examples),
    messages: [{ role: 'user', content: question }]
  });

  return parseResponse(response);
}
```

---

## 4. Synthetic Data Generation

### 4.1 Why Synthetic Data?

From [research](https://link.springer.com/chapter/10.1007/978-981-95-0014-7_5) and [Predibase's guide](https://predibase.com/blog/how-to-create-an-sql-copilot-by-fine-tuning-llms-with-synthetic-data):

- Cold-start problem: No initial Q&A training data
- Domain-specific queries need domain-specific examples
- Retrieval accuracy improves with more diverse examples

### 4.2 Generation Strategy for 3pt.bot

```typescript
// scripts/generateSyntheticQueries.ts
const questionTemplates = [
  // Player queries
  "Find all {playerName} cards",
  "Show me {playerName} rookie cards",
  "What {playerName} cards are numbered to {printRun}?",

  // Set/Release queries
  "List all cards in the {releaseName} {setName} set",
  "How many cards are in {year} {releaseName}?",
  "Show me all base cards from {releaseName}",

  // Parallel queries
  "Find all 1/1 cards",
  "Show me cards numbered to 10 or less",
  "What parallels exist for {cardNumber} in {releaseName}?",

  // Analytics queries
  "Which release has the most autograph cards?",
  "What teams have the most cards in {year}?",
  "Show me the rarest cards by print run",
];

async function generateSyntheticPairs() {
  const pairs = [];

  for (const template of questionTemplates) {
    // Fill template with real data from DB
    const filledQuestion = await fillTemplate(template);

    // Generate SQL with Claude
    const sql = await generateSQL(filledQuestion);

    // Validate by execution
    const isValid = await validateSQL(sql);

    if (isValid) {
      pairs.push({ question: filledQuestion, sql });
    }
  }

  return pairs;
}
```

### 4.3 Synthetic Summary Approach

From [TigerData's research](https://www.tigerdata.com/blog/enhancing-text-to-sql-with-synthetic-summaries):

Instead of matching questions directly to SQL, generate natural language summaries:

```typescript
// For each existing SQL pattern, generate a description
const patterns = [
  {
    sql: "SELECT * FROM Card WHERE printRun = 1",
    summary: "Retrieves all one-of-one (1/1) cards from the database, which are the rarest possible cards with only a single copy in existence."
  },
  {
    sql: `SELECT c.* FROM Card c
          JOIN Set s ON c.setId = s.id
          WHERE s.type = 'Autograph'`,
    summary: "Finds all autographed cards across all releases by filtering to sets classified as Autograph type."
  }
];
```

Matching against summaries improved recall from 81% to 90% in their testing.

---

## 5. Chatbot Architecture

### 5.1 Conversational Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface                            │
│  "Show me all LeBron James rookie cards from Prizm"         │
└─────────────────────────────────────────────────────────────┘
                              │
                              v
┌─────────────────────────────────────────────────────────────┐
│                  Intent Classification                       │
│  - Query (generate SQL) ← selected                          │
│  - Explanation (describe data)                              │
│  - Conversation (general chat)                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              v
┌─────────────────────────────────────────────────────────────┐
│                    RAG Pipeline                              │
│  1. Embed question                                          │
│  2. Retrieve similar examples (pgvector)                    │
│  3. Build prompt with schema + examples                     │
│  4. Generate SQL with Claude                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              v
┌─────────────────────────────────────────────────────────────┐
│                   Query Execution                            │
│  1. Validate SQL (no DROP, DELETE, UPDATE)                  │
│  2. Execute against read replica                            │
│  3. Format results                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              v
┌─────────────────────────────────────────────────────────────┐
│                  Response Generation                         │
│  Claude explains results in natural language                │
│  + Shows data table + Offers follow-up suggestions          │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Example API Route

```typescript
// app/api/chat/route.ts
import { anthropic } from '@/lib/ai';
import { prisma } from '@/lib/prisma';
import { generateEmbedding, findSimilarExamples } from '@/lib/embeddings';
import { SCHEMA, DOMAIN_CONTEXT } from '@/lib/schema';

export async function POST(req: Request) {
  const { message, conversationHistory } = await req.json();

  // 1. Get similar examples via RAG
  const embedding = await generateEmbedding(message);
  const examples = await findSimilarExamples(embedding, 5);

  // 2. Generate SQL
  const sqlResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `You are a SQL expert for a basketball trading card database.

${SCHEMA}

${DOMAIN_CONTEXT}

Example queries:
${examples.map(e => `Q: ${e.question}\nSQL: ${e.sql}`).join('\n\n')}

Generate a PostgreSQL query for the user's question. Return JSON:
{
  "sql": "SELECT ...",
  "explanation": "This query finds..."
}`,
    messages: conversationHistory.concat([{ role: 'user', content: message }])
  });

  const { sql, explanation } = JSON.parse(sqlResponse.content[0].text);

  // 3. Validate and execute
  if (!isReadOnly(sql)) {
    return Response.json({ error: 'Only SELECT queries allowed' }, { status: 400 });
  }

  const results = await prisma.$queryRawUnsafe(sql);

  // 4. Generate natural language response
  const nlResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    system: 'Summarize the query results in a friendly, conversational way for a basketball card collector.',
    messages: [{
      role: 'user',
      content: `Question: ${message}\n\nResults: ${JSON.stringify(results, null, 2)}`
    }]
  });

  return Response.json({
    answer: nlResponse.content[0].text,
    sql,
    explanation,
    results,
    suggestedFollowups: generateFollowups(message, results)
  });
}
```

### 5.3 Domain Context for 3pt.bot

```typescript
// lib/domainContext.ts
export const DOMAIN_CONTEXT = `
Basketball Card Database Domain Knowledge:

TERMINOLOGY:
- "Parallel": A variant of a base card with different design/numbering (e.g., Gold /10, Silver /199)
- "1/1" or "One of One": The rarest card with only 1 copy in existence (printRun = 1)
- "Numbered": Cards with serial numbers (e.g., /99 means 99 total copies)
- "Rookie Card (RC)": A player's first official card in their rookie season
- "Base Card": Standard, non-parallel version of a card
- "Auto/Autograph": Card with player signature
- "Mem/Memorabilia": Card with piece of jersey/equipment

SET TYPES:
- Base: Main card set
- Autograph: Contains player signatures
- Memorabilia: Contains jersey/equipment pieces
- Insert: Special themed subsets

MANUFACTURERS:
- Panini: Prizm, Select, Donruss, Optic, National Treasures
- Topps: Chrome, Finest
- Upper Deck: Historic products

COMMON QUERIES:
- "Rookie cards" → cards where rookieYear is not null or specialFeatures contains 'rookie'
- "Numbered cards" → isNumbered = true or printRun is not null
- "1/1 cards" → printRun = 1
`;
```

---

## 6. Self-Correction Loop

From [AWS's enterprise guide](https://aws.amazon.com/blogs/machine-learning/build-a-robust-text-to-sql-solution-generating-complex-queries-self-correcting-and-querying-diverse-data-sources/):

```typescript
async function generateSQLWithCorrection(
  question: string,
  maxAttempts: number = 3
): Promise<{ sql: string; results: any[] }> {
  let attempts = 0;
  let lastError = '';
  let sql = '';

  while (attempts < maxAttempts) {
    attempts++;

    const prompt = lastError
      ? `Previous SQL failed with error: ${lastError}\n\nFix the query for: ${question}`
      : question;

    sql = await generateSQL(prompt);

    try {
      const results = await prisma.$queryRawUnsafe(sql);

      // Store successful query for training
      await storeSuccessfulQuery(question, sql);

      return { sql, results };
    } catch (error) {
      lastError = error.message;
      console.log(`Attempt ${attempts} failed: ${lastError}`);
    }
  }

  throw new Error(`Failed after ${maxAttempts} attempts. Last error: ${lastError}`);
}
```

---

## 7. Implementation Recommendations

### Phase 1: MVP (1-2 weeks implementation)

1. **Direct Claude Integration**
   - Add NL-to-SQL endpoint to existing API
   - Use schema + domain context prompting
   - Read-only query validation
   - Simple UI component

2. **Basic Safety**
   - Whitelist only SELECT statements
   - Query timeout limits
   - Rate limiting per user

### Phase 2: RAG Enhancement

1. **Add pgvector to Neon**
   - Enable extension
   - Create embedding tables
   - Index existing schema metadata

2. **Build Training Set**
   - Generate 100-200 synthetic Q&A pairs
   - Validate via execution
   - Store with embeddings

3. **Implement RAG Pipeline**
   - Embed incoming questions
   - Retrieve top-5 similar examples
   - Include in Claude prompt

### Phase 3: Production Features

1. **Vanna Integration** (optional)
   - Migrate to Vanna for mature RAG
   - Auto-training on successful queries
   - Self-correction loops

2. **Conversational Memory**
   - Multi-turn conversations
   - Context awareness

3. **Analytics Dashboard**
   - Track query patterns
   - Identify training gaps
   - Monitor accuracy

---

## 8. Example Queries for 3pt.bot

| Natural Language | Expected SQL |
|------------------|--------------|
| "Show me all LeBron James cards" | `SELECT * FROM "Card" WHERE "playerName" ILIKE '%LeBron James%'` |
| "Find 1/1 cards from 2024 Prizm" | `SELECT c.* FROM "Card" c JOIN "Set" s ON c."setId" = s.id JOIN "Release" r ON s."releaseId" = r.id WHERE c."printRun" = 1 AND r.year = '2024' AND r.name ILIKE '%Prizm%'` |
| "Which set has the most autograph cards?" | `SELECT s.name, COUNT(*) as count FROM "Set" s JOIN "Card" c ON c."setId" = s.id WHERE s.type = 'Autograph' GROUP BY s.id, s.name ORDER BY count DESC LIMIT 1` |
| "List all Lakers rookie cards" | `SELECT * FROM "Card" WHERE team ILIKE '%Lakers%' AND "rookieYear" IS NOT NULL` |

---

## 9. Sources

### Official Anthropic
- [Anthropic Cookbook - SQL Queries](https://github.com/anthropics/anthropic-cookbook/blob/main/misc/how_to_make_sql_queries.ipynb)
- [SQL Sorcerer Prompt](https://docs.claude.com/en/prompt-library/sql-sorcerer)

### RAG & Vector Stores
- [AWS Text-to-SQL with RAG](https://aws.amazon.com/blogs/machine-learning/build-your-gen-ai-based-text-to-sql-application-using-rag-powered-by-amazon-bedrock-claude-3-sonnet-and-amazon-titan-for-embedding/)
- [pgvector Documentation](https://supabase.com/docs/guides/database/extensions/pgvector)
- [NextRag Implementation](https://github.com/HamedMP/NextRag)
- [Vercel pgvector Starter](https://vercel.com/templates/next.js/postgres-pgvector)

### Frameworks
- [Vanna AI](https://github.com/vanna-ai/vanna)
- [Vanna + Azure SQL](https://devblogs.microsoft.com/azure-sql/vanna-ai-and-azure-sql-database/)

### Synthetic Data
- [LLM-Based Data Synthesis for Text-to-SQL](https://link.springer.com/chapter/10.1007/978-981-95-0014-7_5)
- [Predibase SQL Copilot Guide](https://predibase.com/blog/how-to-create-an-sql-copilot-by-fine-tuning-llms-with-synthetic-data)
- [TigerData Synthetic Summaries](https://www.tigerdata.com/blog/enhancing-text-to-sql-with-synthetic-summaries)

### Research
- [Claude 3 vs GPT-4 Text-to-SQL Comparison](https://medium.com/querymind/translating-natural-language-into-sql-gpt-4-vs-claude-3-showdown-603ba054c04f)
- [Enterprise NL-to-SQL at Scale](https://aws.amazon.com/blogs/machine-learning/enterprise-grade-natural-language-to-sql-generation-using-llms-balancing-accuracy-latency-and-scale/)
