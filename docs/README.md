# 3pt.bot Documentation

Welcome to the 3pt.bot documentation hub.

## Documentation Index

### Core Reference

#### 📊 [Database Reference](./DATABASE.md)
Complete database schema documentation with field definitions, relationships, and query patterns.

**Covers:**
- Detailed field descriptions for all models
- Enum definitions (SetType, ImageType, PostType, etc.)
- Parent-child parallel architecture
- Common query patterns with Prisma examples
- Data integrity rules and cascading deletes
- Migration guide and deprecated fields

#### 📖 [API Reference](./API.md)
Complete REST API documentation with TypeScript examples, cURL commands, and request/response samples.

**Covers:**
- Releases, Sets, Cards, and Posts APIs
- AI Analysis & Generation endpoints
- Admin-only operations
- Public checklist browser
- Authentication and error handling
- URL slug conventions

### Development Guides

#### 🤖 [AI Integration Guide](./AI_INTEGRATION.md)
Complete guide for implementing AI functionality using the Anthropic SDK.

**Covers:**
- Configuration and setup
- Creating AI functions with Zod validation
- PDF and image handling
- Best practices and troubleshooting
- Environment variables

#### 🎨 [Frontend Patterns Guide](./FRONTEND_PATTERNS.md)
Standardized UI patterns for consistent user experience.

**Covers:**
- Three-column layout pattern
- Header placement rules
- Loading and error states
- Component development guidelines
- Styling conventions and responsive design

#### 🔗 [URL Slug Conventions](./SLUG_CONVENTIONS.md)
Complete guide for generating and formatting URL slugs.

**Covers:**
- Card slug formats (base and parallel)
- Set and release slug formats
- Special cases (1/1 cards, Optic naming)
- Implementation reference and examples

#### 🎯 [Parallel Architecture Guide](./PARALLEL_ARCHITECTURE.md)
Simplified independent parallel set architecture.

**Covers:**
- Database structure for parallels
- Naming conventions
- Query patterns
- Testing checklist

#### 📥 [Data Import Guide](./IMPORT_GUIDE.md)
Complete guide for importing trading card data.

**Covers:**
- Checklist upload requirement
- Script organization and documentation
- Import workflow
- Verification and fix scripts

#### ⚽ [Donruss Product Guide](./DONRUSS_GUIDE.md)
Special handling for Donruss products and Rated Rookies.

**Covers:**
- Rated Rookies structure
- Import strategy
- Merge scripts
- Common issues and solutions

### Project Documentation

#### 📘 [Project README](../README.md)
Project overview, setup instructions, and quick start guide.

**Covers:**
- Overview and features
- Tech stack and architecture
- Database schema and relationships
- Development setup
- Production deployment
- Environment variables

#### 🛠️ [Development Guide](../.claude/CLAUDE.md)
Internal development documentation and quick reference (streamlined version).

**Covers:**
- Quick reference for common patterns
- Critical warnings and rules
- Component patterns
- TypeScript best practices
- Testing checklist

#### 📋 [Changelog](./CHANGELOG.md)
Complete history of changes to the project.

**Covers:**
- Feature additions
- Bug fixes
- Schema changes
- Import milestones

## Quick Links

### Database
- [Database Schema Overview](../README.md#database-schema)
- [Complete Database Reference](./DATABASE.md)
- [Parallel Architecture](./PARALLEL_ARCHITECTURE.md)
- [Common Query Patterns](./DATABASE.md#common-query-patterns)

### Development
- [Quick Start](../README.md#quick-start)
- [AI Integration](./AI_INTEGRATION.md)
- [Frontend Patterns](./FRONTEND_PATTERNS.md)
- [URL Slug Conventions](./SLUG_CONVENTIONS.md)
- [Data Import Workflow](./IMPORT_GUIDE.md)

### Product-Specific
- [Donruss Rated Rookies Guide](./DONRUSS_GUIDE.md)

### Deployment
- [Production Deployment](../README.md#production-deployment-vercel)
- [Environment Variables](../README.md#environment-variables)

---

**Last Updated:** November 17, 2025
