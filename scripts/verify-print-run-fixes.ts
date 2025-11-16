#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface VerificationResult {
  setName: string;
  totalCards: number;
  correctPrintRuns: number;
  incorrectPrintRuns: number;
  nullPrintRuns: number;
  printRunDistribution: Map<number | null, number>;
  issues: string[];
}

async function verifyPrintRunFixes() {
  console.log('🔍 VERIFYING PRINT RUN FIXES\n');

  const results: VerificationResult[] = [];

  // 1. Check Dragon Scale sets (should all be /8)
  console.log('🐉 Checking Dragon Scale Sets...\n');

  const dragonScaleSets = await prisma.set.findMany({
    where: {
      name: { contains: 'Dragon Scale' },
      release: {
        slug: '2024-25-panini-donruss-soccer'
      }
    },
    include: {
      cards: true
    }
  });

  for (const set of dragonScaleSets) {
    const result: VerificationResult = {
      setName: set.name,
      totalCards: set.cards.length,
      correctPrintRuns: 0,
      incorrectPrintRuns: 0,
      nullPrintRuns: 0,
      printRunDistribution: new Map(),
      issues: []
    };

    // Check set-level print run
    if (set.printRun !== 8) {
      result.issues.push(`Set.printRun is ${set.printRun}, expected 8`);
    }

    // Check card-level print runs
    for (const card of set.cards) {
      const pr = card.printRun;

      // Update distribution
      result.printRunDistribution.set(pr, (result.printRunDistribution.get(pr) || 0) + 1);

      if (pr === 8) {
        result.correctPrintRuns++;
      } else if (pr === null) {
        result.nullPrintRuns++;
      } else {
        result.incorrectPrintRuns++;
        if (result.issues.length < 5) {
          result.issues.push(`Card #${card.cardNumber} has printRun ${pr}`);
        }
      }
    }

    results.push(result);
  }

  // 2. Check Signature Series sets (should have variable print runs)
  console.log('\n✍️ Checking Signature Series Sets...\n');

  const signatureSets = await prisma.set.findMany({
    where: {
      OR: [
        { name: { contains: 'Signature Series' } },
        { name: { contains: 'Beautiful Game Autographs' } }
      ],
      release: {
        slug: '2024-25-panini-donruss-soccer'
      }
    },
    include: {
      cards: {
        orderBy: { cardNumber: 'asc' }
      }
    }
  });

  // Load expected print runs from the analysis file
  const analysisPath = path.join(process.cwd(), 'scripts', 'print-runs-analysis.json');
  let expectedData: any = {};
  if (fs.existsSync(analysisPath)) {
    expectedData = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
  }

  for (const set of signatureSets) {
    const result: VerificationResult = {
      setName: set.name,
      totalCards: set.cards.length,
      correctPrintRuns: 0,
      incorrectPrintRuns: 0,
      nullPrintRuns: 0,
      printRunDistribution: new Map(),
      issues: []
    };

    // Check card-level print runs distribution
    for (const card of set.cards) {
      const pr = card.printRun;

      // Update distribution
      result.printRunDistribution.set(pr, (result.printRunDistribution.get(pr) || 0) + 1);

      if (pr === null) {
        result.nullPrintRuns++;
      } else {
        result.correctPrintRuns++;
      }
    }

    // For Signature Series Dragon Scale, check specific distribution
    if (set.name === 'Signature Series Dragon Scale') {
      const expectedDistribution = {
        5: 3,
        10: 3,
        49: 1,
        50: 1,
        75: 2,
        99: 26,
        null: 5
      };

      for (const [printRun, expectedCount] of Object.entries(expectedDistribution)) {
        const pr = printRun === 'null' ? null : parseInt(printRun);
        const actualCount = result.printRunDistribution.get(pr) || 0;
        if (actualCount !== expectedCount) {
          result.issues.push(`Expected ${expectedCount} cards with /${pr}, found ${actualCount}`);
        }
      }
    }

    results.push(result);
  }

  // 3. Check Pink Velocity sets (should be /99)
  console.log('\n🌸 Checking Pink Velocity Sets...\n');

  const pinkVelocitySets = await prisma.set.findMany({
    where: {
      name: { contains: 'Pink Velocity' },
      release: {
        slug: '2024-25-panini-donruss-soccer'
      }
    },
    include: {
      cards: true
    }
  });

  for (const set of pinkVelocitySets) {
    const result: VerificationResult = {
      setName: set.name,
      totalCards: set.cards.length,
      correctPrintRuns: 0,
      incorrectPrintRuns: 0,
      nullPrintRuns: 0,
      printRunDistribution: new Map(),
      issues: []
    };

    // Check set-level print run
    if (set.printRun !== 99 && set.printRun !== null) {
      result.issues.push(`Set.printRun is ${set.printRun}, expected 99`);
    }

    // Check card-level print runs
    for (const card of set.cards) {
      const pr = card.printRun;
      result.printRunDistribution.set(pr, (result.printRunDistribution.get(pr) || 0) + 1);

      if (pr === 99 || pr === null) {
        result.correctPrintRuns++;
      } else {
        result.incorrectPrintRuns++;
        if (result.issues.length < 5) {
          result.issues.push(`Card #${card.cardNumber} has printRun ${pr}`);
        }
      }
    }

    results.push(result);
  }

  // Print results
  console.log('\n' + '='.repeat(70));
  console.log('VERIFICATION RESULTS\n');

  let totalIssues = 0;

  for (const result of results) {
    console.log(`📦 ${result.setName}`);
    console.log(`   Total cards: ${result.totalCards}`);

    // Print distribution
    console.log('   Print run distribution:');
    const sortedDistribution = Array.from(result.printRunDistribution.entries())
      .sort((a, b) => {
        if (a[0] === null) return 1;
        if (b[0] === null) return -1;
        return a[0] - b[0];
      });

    for (const [pr, count] of sortedDistribution) {
      const prStr = pr === null ? 'null' : `/${pr}`;
      console.log(`     ${prStr}: ${count} cards`);
    }

    if (result.issues.length > 0) {
      console.log(`   ⚠️ Issues found:`);
      for (const issue of result.issues) {
        console.log(`      - ${issue}`);
      }
      totalIssues += result.issues.length;
    } else {
      console.log(`   ✅ No issues found`);
    }
    console.log();
  }

  console.log('='.repeat(70));

  if (totalIssues === 0) {
    console.log('✅ ALL PRINT RUNS VERIFIED SUCCESSFULLY!');
  } else {
    console.log(`⚠️ FOUND ${totalIssues} ISSUES - REVIEW ABOVE`);
  }

  console.log('='.repeat(70) + '\n');

  // Generate summary report
  const summaryReport = {
    timestamp: new Date().toISOString(),
    totalSetsChecked: results.length,
    totalIssues,
    results: results.map(r => ({
      setName: r.setName,
      totalCards: r.totalCards,
      printRunDistribution: Object.fromEntries(r.printRunDistribution),
      issues: r.issues
    }))
  };

  const reportPath = path.join(process.cwd(), 'scripts', 'verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(summaryReport, null, 2));
  console.log(`💾 Verification report saved to: ${reportPath}\n`);
}

// Run verification
verifyPrintRunFixes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());