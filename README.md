# footy limited - Soccer Card Syndication Blog

A modern blog platform for soccer card enthusiasts at footylimited.com. Features AI-powered content generation using Claude for card and set analysis.

## Features

- **AI-Powered Content Generation**: Upload card images or set documents and automatically generate engaging blog posts
- **Card Analysis**: Upload front and back card images for detailed reviews
- **Set Analysis**: Upload checklists and sell sheets for comprehensive set overviews
- **Image Management**: Automatic image upload and storage with gallery display
- **User Authentication**: Secure admin login system
- **Responsive Design**: Mobile-friendly interface with footy limited branding
- **SEO-Friendly**: Dynamic metadata and optimized for search engines

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js
- **AI**: Anthropic Claude API (Claude 3.5 Sonnet)
- **Image Processing**: Sharp

## Color Scheme

- Dark Green: #203732
- Gold: #FFB613
- White: #FFFFFF

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

1. The dependencies are already installed in this project.

2. The `.env` file is already configured with:
   - Database URL (SQLite)
   - Anthropic API Key
   - NextAuth configuration

3. The database is already initialized with the admin user:
   - Username: `footy`
   - Password: `test2222`

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the blog.

## Usage

### Admin Access

1. Navigate to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
2. Login with credentials:
   - Username: `footy`
   - Password: `test2222`

### Creating a Card Post

1. Go to the Admin Dashboard
2. Select the "Analyze Card" tab
3. Upload the card front image (required)
4. Optionally upload the card back image
5. Click "Analyze Card & Generate Post"
6. Review and edit the AI-generated content
7. Click "Publish Post" or "Save as Draft"

### Creating a Set Post

1. Go to the Admin Dashboard
2. Select the "Analyze Set" tab
3. Upload the checklist image (required)
4. Optionally upload the sell sheet image
5. Click "Analyze Set & Generate Post"
6. Review and edit the AI-generated content
7. Click "Publish Post" or "Save as Draft"

### Viewing Posts

- Homepage: [http://localhost:3000](http://localhost:3000)
- Individual posts: [http://localhost:3000/posts/[slug]](http://localhost:3000/posts/[slug])

## Project Structure

```
footy-limited-blog/
├── app/
│   ├── admin/              # Admin interface
│   │   ├── login/          # Login page
│   │   └── page.tsx        # Admin dashboard
│   ├── api/                # API routes
│   │   ├── auth/           # NextAuth endpoints
│   │   ├── upload/         # Image upload
│   │   ├── analyze/        # AI analysis endpoints
│   │   └── posts/          # Post CRUD operations
│   ├── posts/[slug]/       # Individual post pages
│   ├── globals.css         # Global styles with color scheme
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   └── providers.tsx       # Session provider
├── lib/
│   ├── prisma.ts           # Prisma client
│   ├── auth.ts             # NextAuth configuration
│   └── ai.ts               # Claude AI integration
├── prisma/
│   └── schema.prisma       # Database schema
├── public/
│   └── uploads/            # Uploaded images
├── scripts/
│   └── init-admin.ts       # Admin user initialization
└── types/
    └── next-auth.d.ts      # TypeScript definitions
```

## Database Schema

### User
- id: String (CUID)
- username: String (unique)
- password: String (hashed)
- createdAt: DateTime
- updatedAt: DateTime

### Post
- id: String (CUID)
- title: String
- slug: String (unique)
- content: String (HTML)
- excerpt: String
- type: PostType (CARD or SET)
- published: Boolean
- createdAt: DateTime
- updatedAt: DateTime
- authorId: String

### PostImage
- id: String (CUID)
- postId: String
- url: String
- caption: String (optional)
- order: Int
- createdAt: DateTime

## API Endpoints

- `POST /api/upload` - Upload images
- `POST /api/analyze/card` - Analyze card images with AI
- `POST /api/analyze/set` - Analyze set documents with AI
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create a new post
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

## Deployment

For production deployment:

1. Update `NEXTAUTH_URL` to your production domain
2. Use a production database (PostgreSQL, MySQL, etc.)
3. Update `NEXTAUTH_SECRET` with a strong secret
4. Ensure Anthropic API key is properly secured
5. Configure your hosting platform for Next.js App Router

## Security Notes

- Change the default admin password after first login
- Use strong secrets in production
- Keep API keys secure and never commit them to version control
- The `.env` file is already in `.gitignore`

## License

Private project for footy limited.
