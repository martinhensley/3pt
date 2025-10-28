import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { setId, sellSheetText, additionalContext } = body;

    if (!setId) {
      return NextResponse.json(
        { error: "Set ID is required" },
        { status: 400 }
      );
    }

    // Fetch set details including release sell sheet data
    const set = await prisma.set.findUnique({
      where: { id: setId },
      include: {
        release: {
          include: {
            manufacturer: true,
          },
        },
        cards: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!set) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 });
    }

    const setFullName = `${set.release.year || ''} ${set.release.manufacturer.name} ${set.release.name} ${set.name}`.trim();
    const cardCount = set.cards.length || (set.totalCards ? parseInt(set.totalCards) : 0);
    const parallelCount = Array.isArray(set.parallels) ? set.parallels.length : 0;

    // Use stored sell sheet text from release if available, otherwise use provided text
    const finalSellSheetText = sellSheetText || set.release.sellSheetText || '';

    // Create the prompt
    const prompt = `Generate a description for this soccer card set based ONLY on the provided source document information.

Set Information:
- Set Name: ${setFullName}
- Total Cards: ${cardCount}
- Parallels: ${parallelCount}

${finalSellSheetText ? `Source Document Information:\n${finalSellSheetText}\n` : ''}

${additionalContext ? `Additional Context:\n${additionalContext}\n` : ''}

Write in the voice of footy, a passionate football (soccer) fanatic who lives in the British Commonwealth, attended the London School of Economics, and hails from the southern United States. Generate a 3-5 sentence description that:
1. ONLY includes information from the source documents provided above - do NOT make up features or details
2. Focuses entirely on the cards and set - NEVER talk about yourself or footy's perspective
3. Writes in third-person about the cards, not first-person commentary
4. Uses proper paragraph breaks if needed (separate paragraphs with double line breaks)
5. Captures the sophisticated appeal and analytical interest of this set based on source information
6. Highlights key features with LSE-level precision using only documented information
7. Uses posh, educated tone with Commonwealth English naturally (colour, favourite, whilst, analysed)
8. Focuses on what discerning collectors and football enthusiasts would appreciate
9. Blends intellectual sophistication with accessible passion—think Guardian Sport meets The Economist

Just provide the description with paragraph breaks (use double line breaks between paragraphs if applicable), nothing else.`;

    // Call Claude API with temperature 0.1
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const description = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Update the set with the generated description
    await prisma.set.update({
      where: { id: setId },
      data: { description },
    });

    return NextResponse.json({
      success: true,
      description,
      setName: setFullName,
    });
  } catch (error) {
    console.error("Generate description error:", error);
    return NextResponse.json(
      { error: "Failed to generate description" },
      { status: 500 }
    );
  }
}
