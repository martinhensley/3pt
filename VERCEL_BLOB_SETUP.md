# Vercel Blob Storage Setup for Card Images

This document explains how to set up Vercel Blob storage for storing card images (front and back).

## Prerequisites

- Vercel account
- Project deployed on Vercel or linked via Vercel CLI

## Setup Steps

### 1. Create a Vercel Blob Store

1. Go to your project in the [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the "Storage" tab
3. Click "Create Database" or "Create Store"
4. Select "Blob" from the storage options
5. Give your blob store a name (e.g., "footy-card-images")
6. Click "Create"

### 2. Get Your Blob Read/Write Token

After creating the blob store, Vercel will automatically provide you with a `BLOB_READ_WRITE_TOKEN` environment variable.

### 3. Add Environment Variable

The `BLOB_READ_WRITE_TOKEN` is automatically added to your Vercel project environment variables.

For local development, you need to pull the environment variables:

```bash
# Install Vercel CLI if you haven't already
npm i -g vercel

# Link your project (if not already linked)
vercel link

# Pull environment variables
vercel env pull .env.local
```

Alternatively, you can manually add it to your `.env.local` file:

```env
BLOB_READ_WRITE_TOKEN=your_token_here
```

### 4. Verify Setup

To verify that the blob storage is set up correctly, you can test the upload endpoint:

```bash
# Test upload (requires authentication)
curl -X POST http://localhost:3000/api/upload/card-images \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -F "frontImage=@/path/to/front-image.jpg" \
  -F "backImage=@/path/to/back-image.jpg" \
  -F "cardId=CARD_ID"
```

## API Usage

### Upload Card Images

**Endpoint:** `POST /api/upload/card-images`

**Authentication:** Required (admin user)

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `frontImage` (File, optional): Front image of the card
  - `backImage` (File, optional): Back image of the card
  - `cardId` (string, optional): ID of the card (used for organizing files)

**Response:**
```json
{
  "success": true,
  "frontImageUrl": "https://blob.vercel-storage.com/cards/...",
  "backImageUrl": "https://blob.vercel-storage.com/cards/..."
}
```

## File Organization

Card images are stored in Vercel Blob with the following structure:

```
cards/
  {cardId}/
    front-{timestamp}.jpg
    back-{timestamp}.jpg
  temp/
    front-{timestamp}.jpg  # Temporary uploads without cardId
    back-{timestamp}.jpg
```

## Database Integration

The `imageFront` and `imageBack` fields in the `Card` model store the blob URLs:

```prisma
model Card {
  // ...
  imageFront String?  // Vercel Blob URL for front image
  imageBack  String?  // Vercel Blob URL for back image
  // ...
}
```

## Security

- All uploads require admin authentication
- Blob access is set to `public` for card display
- Files are organized by card ID to prevent conflicts
- Timestamps are added to filenames to ensure uniqueness

## Cost Considerations

Vercel Blob pricing (as of 2024):
- **Free tier:** 500 MB storage, 100 GB bandwidth/month
- **Pro:** $0.15/GB storage, $0.30/GB bandwidth

Monitor your usage in the Vercel Dashboard under Storage → Blob.

## Troubleshooting

### "BLOB_READ_WRITE_TOKEN is not set" Error

Make sure you've:
1. Created a Vercel Blob store in your project
2. Pulled environment variables with `vercel env pull`
3. Restarted your development server

### Upload fails with 401 Unauthorized

Ensure you're logged in as an admin user. The endpoint requires authentication via NextAuth.

### Image URLs not working

Check that:
1. The blob store has `public` access enabled
2. The URLs are correctly saved to the database
3. There are no CORS issues (Vercel Blob handles CORS automatically)
