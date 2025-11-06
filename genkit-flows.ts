/**
 * Genkit Flows Entry Point
 * This file exports all Genkit flows so they can be discovered by the Genkit Dev Tools
 */

import 'dotenv/config';

// Import and export all flows
export { analyzeReleaseFlow, generateDescriptionFlow, ai } from './lib/genkit';

// Start the reflection API server when run directly
if (require.main === module) {
  console.log('Genkit flows loaded and ready for development');
  console.log('Available flows:');
  console.log('  - analyzeRelease');
  console.log('  - generateDescription');
  console.log('\nGenkit Dev Tools: http://localhost:4000');

  // Keep the process running
  process.stdin.resume();
}
