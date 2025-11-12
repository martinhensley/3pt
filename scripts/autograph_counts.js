const { PrismaClient } = require('@prisma/client');

async function getAutographCounts() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Fetching autograph card counts...\n');
    
    // Get all sets with autograph cards
    const autographSets = await prisma.set.findMany({
      where: {
        OR: [
          { type: 'Autograph' },
          {
            cards: {
              some: {
                hasAutograph: true
              }
            }
          }
        ]
      },
      include: {
        release: {
          include: {
            manufacturer: true
          }
        },
        cards: {
          where: {
            hasAutograph: true
          }
        },
        _count: {
          select: {
            cards: {
              where: {
                hasAutograph: true
              }
            }
          }
        }
      },
      orderBy: [
        {
          release: {
            name: 'asc'
          }
        },
        {
          name: 'asc'
        }
      ]
    });

    // Format data for table display
    const tableData = [];
    let totalCount = 0;

    for (const set of autographSets) {
      const count = set._count.cards;
      if (count > 0) {
        tableData.push({
          'Release': set.release.name,
          'Manufacturer': set.release.manufacturer.name,
          'Set Name': set.name,
          'Set Type': set.type,
          'Autograph Cards': count
        });
        totalCount += count;
      }
    }

    // Display table
    console.table(tableData);
    
    // Display summary statistics
    console.log('\n=== SUMMARY ===');
    console.log(`Total Sets with Autographs: ${tableData.length}`);
    console.log(`Total Autograph Cards: ${totalCount}`);
    
    // Group by release
    const releaseGroups = {};
    for (const row of tableData) {
      if (!releaseGroups[row.Release]) {
        releaseGroups[row.Release] = 0;
      }
      releaseGroups[row.Release] += row['Autograph Cards'];
    }
    
    console.log('\n=== AUTOGRAPH CARDS BY RELEASE ===');
    const releaseTable = Object.entries(releaseGroups)
      .sort((a, b) => b[1] - a[1])
      .map(([release, count]) => ({
        'Release': release,
        'Autograph Cards': count
      }));
    console.table(releaseTable);
    
    // Group by manufacturer
    const manufacturerGroups = {};
    for (const row of tableData) {
      if (!manufacturerGroups[row.Manufacturer]) {
        manufacturerGroups[row.Manufacturer] = 0;
      }
      manufacturerGroups[row.Manufacturer] += row['Autograph Cards'];
    }
    
    console.log('\n=== AUTOGRAPH CARDS BY MANUFACTURER ===');
    const manufacturerTable = Object.entries(manufacturerGroups)
      .sort((a, b) => b[1] - a[1])
      .map(([manufacturer, count]) => ({
        'Manufacturer': manufacturer,
        'Autograph Cards': count
      }));
    console.table(manufacturerTable);

  } catch (error) {
    console.error('Error fetching autograph counts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
getAutographCounts();
