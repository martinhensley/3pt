import { list } from '@vercel/blob';

async function checkBlobAccess() {
  try {
    console.log('Checking Vercel Blob Storage access...\n');
    console.log(`Token configured: ${process.env.BLOB_READ_WRITE_TOKEN ? 'Yes' : 'No'}`);

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ BLOB_READ_WRITE_TOKEN not configured');
      return;
    }

    // List blobs to verify access
    const { blobs } = await list();

    console.log(`\n✓ Blob storage access confirmed`);
    console.log(`Total blobs: ${blobs.length}\n`);

    if (blobs.length > 0) {
      console.log('First 5 blobs:');
      blobs.slice(0, 5).forEach((blob, idx) => {
        console.log(`${idx + 1}. ${blob.pathname}`);
        console.log(`   URL: ${blob.url}`);
        console.log(`   Size: ${(blob.size / 1024).toFixed(2)} KB`);
        console.log(`   Uploaded: ${blob.uploadedAt}\n`);
      });
    } else {
      console.log('⚠️  No blobs found in storage');
    }

  } catch (error) {
    console.error('❌ Error accessing blob storage:', error);
  }
}

checkBlobAccess();
