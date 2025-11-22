import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Copy of the parseSetName function for testing
function parseSetName(name: string): { baseName: string; variant: string } {
  if (name === 'Base') return { baseName: 'Base', variant: '' };
  if (name === 'Optic') return { baseName: 'Optic', variant: '' };
  if (name.startsWith('Base ')) return { baseName: 'Base', variant: name.substring(5) };
  if (name.startsWith('Optic ')) return { baseName: 'Optic', variant: name.substring(6) };

  const artistProofPattern = /^(.+?)\s+Artist's Proof\s*(Gold|Red|Bronze)?$/i;
  const artistMatch = name.match(artistProofPattern);
  if (artistMatch) {
    const baseName = artistMatch[1].trim();
    const variant = artistMatch[2] ? `Artist's Proof ${artistMatch[2]}` : "Artist's Proof";
    return { baseName, variant };
  }

  if (name.endsWith(' Prime')) {
    const baseName = name.substring(0, name.length - 6).trim();
    return { baseName, variant: 'Prime' };
  }

  if (name.endsWith(' Tip-off')) {
    const baseName = name.substring(0, name.length - 8).trim();
    return { baseName, variant: 'Tip-off' };
  }

  const pressProofPattern = /^(.+?)\s+Press Proof(?:\s+(Silver|Gold|Black|Blue|Red|Purple|Green|Orange))?$/i;
  const pressProofMatch = name.match(pressProofPattern);
  if (pressProofMatch) {
    const baseName = pressProofMatch[1].trim();
    const variant = pressProofMatch[2]
      ? `Press Proof ${pressProofMatch[2]}`
      : 'Press Proof';
    return { baseName, variant };
  }

  const holoLaserPattern = /^(.+?)\s+Holo\s+(.+?)\s+Laser$/i;
  const holoLaserMatch = name.match(holoLaserPattern);
  if (holoLaserMatch) {
    const baseName = holoLaserMatch[1].trim();
    const variant = `Holo ${holoLaserMatch[2]} Laser`;
    return { baseName, variant };
  }

  if (name.endsWith(' Holo')) {
    const baseName = name.substring(0, name.length - 5).trim();
    return { baseName, variant: 'Holo' };
  }

  if (name.endsWith(' Patch')) {
    const baseName = name.substring(0, name.length - 6).trim();
    return { baseName, variant: 'Patch' };
  }

  if (name.endsWith(' Tag')) {
    const baseName = name.substring(0, name.length - 4).trim();
    return { baseName, variant: 'Tag' };
  }

  const colorPattern = /\s+(Red|Blue|Gold|Silver|Black|Pink|Green|Purple|Orange|Aqua|Teal|Dragon Scale|Plum Blossom|Pink Ice|Pink Velocity|Argyle|Ice|Velocity|Cubic|Diamond|Mojo|Power|Pandora|Green Vinyl|Gold Vinyl)(\s+\d+)?$/i;
  const match = name.match(colorPattern);
  if (match) {
    const baseName = name.substring(0, match.index).trim();
    const variant = match[0].trim();
    return { baseName, variant };
  }

  return { baseName: name, variant: '' };
}

async function verifyAllReleases() {
  console.log('🔍 Verifying Parallel Set Parsing Across All Releases\n');
  console.log('='.repeat(100));

  const releases = await prisma.release.findMany({
    include: {
      manufacturer: true,
      sets: {
        where: { isParallel: true },
        orderBy: { name: 'asc' }
      }
    },
    orderBy: [{ year: 'desc' }, { name: 'asc' }]
  });

  console.log(`\nFound ${releases.length} releases\n`);

  let totalSets = 0;
  let parsedCorrectly = 0;
  let parseIssues: Array<{ release: string; setName: string; issue: string }> = [];

  for (const release of releases) {
    const parallelSets = release.sets;
    if (parallelSets.length === 0) continue;

    console.log(`\n${release.year} ${release.manufacturer.name} ${release.name}`);
    console.log(`  Parallel sets: ${parallelSets.length}`);

    // Group by base name to verify grouping works
    const byBase = new Map<string, typeof parallelSets>();

    for (const set of parallelSets) {
      totalSets++;
      const parsed = parseSetName(set.name);

      // Check if parsing seems reasonable
      if (parsed.baseName === set.name) {
        // No variant extracted - this might be an issue
        parseIssues.push({
          release: `${release.year} ${release.name}`,
          setName: set.name,
          issue: 'No variant extracted (parallel marked but parsed as base)'
        });
        console.log(`    ⚠️  ${set.name}`);
        console.log(`        Parsed as: "${parsed.baseName}" (no variant)`);
      } else {
        parsedCorrectly++;
        if (!byBase.has(parsed.baseName)) {
          byBase.set(parsed.baseName, []);
        }
        byBase.get(parsed.baseName)!.push(set);
      }
    }

    // Show grouping summary
    if (byBase.size > 0) {
      console.log(`  Grouped into ${byBase.size} base sets:`);
      for (const [baseName, sets] of byBase.entries()) {
        if (sets.length > 1) {
          console.log(`    "${baseName}": ${sets.length} parallels`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log('\n📊 Summary:');
  console.log(`  Total parallel sets: ${totalSets}`);
  console.log(`  Parsed correctly: ${parsedCorrectly} (${((parsedCorrectly/totalSets)*100).toFixed(1)}%)`);
  console.log(`  Parse issues: ${parseIssues.length}`);

  if (parseIssues.length > 0) {
    console.log('\n⚠️  Sets with parsing issues:');
    for (const issue of parseIssues.slice(0, 20)) {
      console.log(`  ${issue.release}`);
      console.log(`    ${issue.setName}`);
      console.log(`    Issue: ${issue.issue}\n`);
    }
    if (parseIssues.length > 20) {
      console.log(`  ... and ${parseIssues.length - 20} more\n`);
    }
  } else {
    console.log('\n✅ All parallel sets parsed correctly!');
  }
}

verifyAllReleases()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
