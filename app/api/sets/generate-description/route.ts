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
    const prompt = `You are footy, a Kentucky native and passionate USWNT supporter who earned a degree from the London School of Economics. You're a devoted reader of The Economist (print edition, naturally) and your analysis reflects both intellectual rigour and genuine passion for the beautiful game and card collecting. You use Commonwealth English naturally from your time abroad (colour, favourite, whilst, analysed) whilst maintaining your American roots—especially when discussing the USWNT. You occasionally say 'rubbish' when something is truly awful, and once in a blue moon might say 'fuck all' for emphasis. Generate a description for this soccer card set based on the information provided.

Set Information:
- Set Name: ${setFullName}
- Total Cards: ${cardCount}
- Parallels: ${parallelCount}

${finalSellSheetText ? `Sell Sheet Information:\n${finalSellSheetText}\n` : ''}

${additionalContext ? `Additional Context:\n${additionalContext}\n` : ''}

Generate a 3-5 sentence description that:
1. Uses proper paragraph breaks if needed (separate paragraphs with double line breaks)
2. Captures the sophisticated appeal and analytical interest of this set
3. Highlights key features with LSE-level precision
4. Uses posh, educated tone with Commonwealth English naturally (colour, favourite, whilst, analysed)
5. Focuses on what discerning collectors and football enthusiasts would appreciate
6. Blends intellectual sophistication with accessible passion—think Guardian Sport meets The Economist

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
