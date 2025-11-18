import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function analyzeDonrussBasketballChecklist() {
  console.log('📄 Reading PDF file...');
  const pdfBuffer = readFileSync('/tmp/donruss-basketball-2016-17.pdf');
  const base64Data = pdfBuffer.toString('base64');

  console.log('🤖 Analyzing checklist with Claude...\n');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64Data,
            },
          },
          {
            type: 'text',
            text: `Analyze this 2016-17 Panini Donruss Basketball checklist PDF and extract the complete set structure.

For each set, provide:
1. Set name
2. Set type (Base, Insert, Autograph, Memorabilia)
3. Card number range (e.g., 1-200, RK-1 to RK-25)
4. Total cards in the set
5. All parallel variants with print runs (e.g., "Holo /99", "Press Proof Gold /10")
6. Sample of player names (first 5 and last 5 cards)

Organize the output in this JSON structure:
{
  "base": [
    {
      "name": "Base Set",
      "cardRange": "1-200",
      "totalCards": 200,
      "parallels": [
        {"name": "Holo", "printRun": null},
        {"name": "Press Proof", "printRun": 299},
        {"name": "Press Proof Gold", "printRun": 10}
      ],
      "samplePlayers": {
        "first5": ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5"],
        "last5": ["Player 196", "Player 197", "Player 198", "Player 199", "Player 200"]
      }
    }
  ],
  "inserts": [...],
  "autographs": [...],
  "memorabilia": [...]
}

Be thorough and extract ALL sets, parallels, and card counts.`,
          },
        ],
      },
    ],
  });

  // Extract the response
  const textContent = message.content.find(block => block.type === 'text');
  if (textContent && textContent.type === 'text') {
    const jsonMatch = textContent.text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      const checklistData = JSON.parse(jsonMatch[1]);
      console.log('✅ Checklist analysis complete!\n');

      // Write to file for reference
      const fs = require('fs');
      fs.writeFileSync('/tmp/donruss-basketball-analysis.json', JSON.stringify(checklistData, null, 2));
      console.log('💾 Saved analysis to /tmp/donruss-basketball-analysis.json\n');

      console.log(JSON.stringify(checklistData, null, 2));
      return checklistData;
    } else {
      console.log('Response:\n', textContent.text);
    }
  }
}

analyzeDonrussBasketballChecklist().catch(console.error);
