import * as fs from 'fs';
import * as path from 'path';

/**
 * Cleanup script to remove completed one-off scripts
 * Created: 2025-11-21
 *
 * This script removes scripts that were used for one-time data fixes,
 * migrations, and intermediate import steps that are no longer needed.
 */

const scriptsToDelete = [
  // 2016-17 Panini Absolute Basketball - Completed intermediate steps
  '2016-17-panini-absolute-basketball/import-absolute-basketball-2016.ts',
  '2016-17-panini-absolute-basketball/import-absolute-basketball-manual.ts',
  '2016-17-panini-absolute-basketball/expand-parallels.ts',
  '2016-17-panini-absolute-basketball/merge-base-set.ts',
  '2016-17-panini-absolute-basketball/update-cards-101-200.ts',
  '2016-17-panini-absolute-basketball/remaining-mem-sets.txt',
  '2016-17-panini-absolute-basketball/upload-checklist.ts',

  // 2016-17 Panini Donruss Basketball - Completed fixes
  '2016-17-panini-donruss-basketball/add-court-kings-parallels.ts',
  '2016-17-panini-donruss-basketball/add-crashers-parallels.ts',
  '2016-17-panini-donruss-basketball/add-dimes-parallels.ts',
  '2016-17-panini-donruss-basketball/add-elite-series-parallels.ts',
  '2016-17-panini-donruss-basketball/add-hall-kings-parallels.ts',
  '2016-17-panini-donruss-basketball/add-missing-parallels.ts',
  '2016-17-panini-donruss-basketball/add-rookie-kings.ts',
  '2016-17-panini-donruss-basketball/add-the-champ-is-here-parallels.ts',
  '2016-17-panini-donruss-basketball/add-the-rookies-parallels.ts',
  '2016-17-panini-donruss-basketball/check-holo-parallels.ts',
  '2016-17-panini-donruss-basketball/fix-legacy-holo-parallels.ts',
  '2016-17-panini-donruss-basketball/fix-optic-preview-set-type.ts',
  '2016-17-panini-donruss-basketball/fix-rookies-set-type.ts',
  '2016-17-panini-donruss-basketball/generate-autograph-data.ts',
  '2016-17-panini-donruss-basketball/import-remaining-autographs-batch2.ts',

  // Road to Qatar 2021-22 - Completed fixes
  'road-to-qatar-2021-22/check-beautiful-game-sets.ts',
  'road-to-qatar-2021-22/check-beautiful-game-slugs.ts',
  'road-to-qatar-2021-22/check-signature-series.ts',
  'road-to-qatar-2021-22/fix-beautiful-game-names.ts',
  'road-to-qatar-2021-22/fix-beautiful-game-types-and-slugs.ts',
  'road-to-qatar-2021-22/fix-dual-autographs.ts',
  'road-to-qatar-2021-22/fix-kit-kings-print-runs.ts',
  'road-to-qatar-2021-22/fix-kit-series-print-runs.ts',
  'road-to-qatar-2021-22/fix-road-to-qatar-base-parallels.ts',
  'road-to-qatar-2021-22/fix-road-to-qatar-optic-parallels.ts',
  'road-to-qatar-2021-22/fix-signature-series-print-runs.ts',

  // Root-level completed one-offs
  'analyze-donruss-basketball-pdf.ts',
  'analyze-null-print-runs.ts',
  'check-duplicate-source-docs.ts',
  'check-legacy-source-files.ts',
  'check-source-documents.ts',
  'extract-complete-print-runs.ts',
  'extract-correct-print-runs.ts',
  'find-card-set.ts',
  'fix-card-slugs-add-set-names.ts',
  'fix-dragon-scale-print-run.ts',
  'fix-dragon-scale-print-runs.ts',
  'fix-missing-optic-cards.ts',
  'fix-optic-base-slugs.ts',
  'fix-optic-parallels.ts',
  'fix-optic-print-runs.ts',
  'fix-optic-slugs-complete.ts',
  'fix-road-to-qatar-rated-rookies.ts',
  'fix-set-ordering.ts',
  'fix-uniform-print-runs.ts',
  'fix-variable-print-runs-v2.ts',
  'migrate-description-to-review.ts',
  'migrate-legacy-source-files.ts',
  'verify-auth-schema.ts',
  'verify-final-slugs.ts',
  'verify-print-run-fixes.ts',
  'verify-road-to-qatar-import.ts',
  'delete-card-set-final.ts',
  'delete-card-set.ts',
];

async function cleanup() {
  const scriptsDir = path.join(process.cwd(), 'scripts');

  console.log('🧹 Starting cleanup of one-off scripts...\n');
  console.log(`📁 Scripts directory: ${scriptsDir}\n`);

  let deletedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (const scriptPath of scriptsToDelete) {
    const fullPath = path.join(scriptsDir, scriptPath);

    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`✅ Deleted: ${scriptPath}`);
        deletedCount++;
      } else {
        console.log(`⚠️  Not found: ${scriptPath}`);
        notFoundCount++;
      }
    } catch (error) {
      console.error(`❌ Error deleting ${scriptPath}:`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Cleanup Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Deleted: ${deletedCount} files`);
  console.log(`⚠️  Not found: ${notFoundCount} files`);
  console.log(`❌ Errors: ${errorCount} files`);
  console.log('='.repeat(60));

  // Check for empty directories and report them
  console.log('\n📂 Checking for empty directories...\n');

  const releaseDirs = [
    '2016-17-panini-absolute-basketball',
    '2016-17-panini-donruss-basketball',
    '2016-17-panini-donruss-optic-basketball',
    'road-to-qatar-2021-22',
  ];

  for (const dir of releaseDirs) {
    const dirPath = path.join(scriptsDir, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      if (files.length === 0) {
        console.log(`📦 Empty directory (can be removed): ${dir}`);
      } else {
        console.log(`📁 ${dir}: ${files.length} file(s) remaining`);
      }
    }
  }

  console.log('\n✅ Cleanup complete!');
}

cleanup().catch(console.error);
