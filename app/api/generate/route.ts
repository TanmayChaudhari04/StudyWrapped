import { NextRequest, NextResponse } from "next/server";
import { graph } from "@/lib/agents/graph";
import { HumanMessage } from "@langchain/core/messages";

export async function POST(req: NextRequest) {
    const { pdfPath, userId } = await req.json();

    if (!pdfPath) {
        return NextResponse.json({ error: "No PDF path provided" }, { status: 400 });
    }

    // Initialize the graph with the PDF path
    // We use `invoke` for a single run, or `stream` if we want updates.
    // For MVP Phase 1, we can just invoke and return the final state/messages.
    /* 
       Inputs to the graph:
       - messages: Initial trigger message
       - pdfPath: The path to the file
       - userId: The authenticated user's ID
    */

    try {
        const result = await graph.invoke({
            messages: [new HumanMessage("Generate flashcards from this PDF.")],
            pdfPath: pdfPath,
            userId: userId || "",
        });

        return NextResponse.json({
            messages: result.messages,
            syllabus: result.syllabus,
            flashcards: result.flashcards
        });
    } catch (error: any) {
        console.error("Graph execution failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
