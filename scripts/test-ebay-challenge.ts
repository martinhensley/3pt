// Test eBay challenge endpoint validation
import crypto from 'crypto';

async function testEbayChallengeValidation() {
  const ENDPOINT_URL = 'https://www.footy.bot/api/ebay/account-deletion';
  const VERIFICATION_TOKEN = 'eb49dd4f3526dd42fafb55d2860eb9d99099b0d3d0bd397ee54326f9def885c1';

  // Generate a test challenge code (eBay would send this)
  const challengeCode = crypto.randomBytes(32).toString('hex');

  console.log('\n=== Testing eBay Challenge Validation ===');
  console.log('Endpoint:', ENDPOINT_URL);
  console.log('Challenge Code:', challengeCode);
  console.log('Verification Token:', VERIFICATION_TOKEN);

  // Calculate expected response
  const hash = crypto.createHash('sha256');
  hash.update(challengeCode);
  hash.update(VERIFICATION_TOKEN);
  hash.update(ENDPOINT_URL);
  const expectedResponse = hash.digest('hex');

  console.log('\nExpected Challenge Response:', expectedResponse);

  // Test POST request (eBay sends challenge as POST)
  console.log('\n--- Testing POST Request ---');
  try {
    const postResponse = await fetch(ENDPOINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        challengeCode: challengeCode
      })
    });

    const postData = await postResponse.json();
    console.log('Status:', postResponse.status);
    console.log('Response:', postData);

    if (postData.challengeResponse === expectedResponse) {
      console.log('✅ POST Challenge validation PASSED!');
    } else {
      console.log('❌ POST Challenge validation FAILED!');
      console.log('Expected:', expectedResponse);
      console.log('Received:', postData.challengeResponse);
    }
  } catch (error) {
    console.log('❌ POST Request failed:', error);
  }

  // Test GET request with query parameter (alternative method)
  console.log('\n--- Testing GET Request ---');
  try {
    const getUrl = `${ENDPOINT_URL}?challenge_code=${challengeCode}`;
    const getResponse = await fetch(getUrl);
    const getData = await getResponse.json();

    console.log('Status:', getResponse.status);
    console.log('Response:', getData);

    if (getData.challengeResponse === expectedResponse) {
      console.log('✅ GET Challenge validation PASSED!');
    } else {
      console.log('❌ GET Challenge validation FAILED!');
      console.log('Expected:', expectedResponse);
      console.log('Received:', getData.challengeResponse);
    }
  } catch (error) {
    console.log('❌ GET Request failed:', error);
  }
}

testEbayChallengeValidation().catch(console.error);
