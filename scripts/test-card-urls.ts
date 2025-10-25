// Test if card URLs work with the updated API
async function testCardURLs() {
  const testUrls = [
    'http://localhost:3000/api/cards?slug=2024-25-donruss-soccer-base-4-folarin-balogun-black-1of1',
    'http://localhost:3000/api/cards?slug=2024-25-donruss-soccer-base-5-tyler-adams-blue-49',
  ];

  for (const url of testUrls) {
    console.log(`\nTesting: ${url}`);
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        console.log('✅ SUCCESS!');
        console.log(`Found card: ${data.playerName} #${data.cardNumber}`);
        console.log(`Set: ${data.set.name}`);
        console.log(`Parallel: ${data.parallelType || 'none'}`);
      } else {
        console.log('❌ FAILED');
        console.log(`Error: ${data.error}`);
      }
    } catch (error) {
      console.log('❌ REQUEST FAILED');
      console.log(error);
    }
  }
}

testCardURLs();
