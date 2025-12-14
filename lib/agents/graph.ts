import { StateGraph } from "@langchain/langgraph";
import { pdfReaderTool } from "./tools/pdf-reader";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { model } from "../ai";
import { z } from "zod";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

// Define structured output schemas
const SyllabusSchema = z.object({
    topics: z.array(z.string()).describe("A list of key topics found in the study material."),
});

const FlashcardSchema = z.object({
    question: z.string(),
    answer: z.string(),
    topic: z.string(),
});

const FlashcardListSchema = z.object({
    flashcards: z.array(FlashcardSchema)
});

// Define the State
const GraphState = Annotation.Root({
    ...MessagesAnnotation.spec,
    syllabus: Annotation<string[]>({
        reducer: (x, y) => y,
        default: () => [],
    }),
    flashcards: Annotation<any[]>({
        reducer: (x, y) => y,
        default: () => [],
    }),
    pdfPath: Annotation<string>({
        reducer: (x, y) => y,
        default: () => "",
    }),
    userId: Annotation<string>({
        reducer: (x, y) => y,
        default: () => "",
    }),
});

// NODE 1: The Reader
async function readerNode(state: typeof GraphState.State) {
    const { pdfPath } = state;
    const toolResult = await pdfReaderTool.invoke({ filePath: pdfPath });
    const content = toolResult.slice(0, 30000); // Limit context window for now

    return {
        messages: [new HumanMessage(content)], // Pass content as a message for context
    };
}

// NODE 2: The Architect
async function architectNode(state: typeof GraphState.State) {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1]; // This contains PDF content

    const prompt = `You are an expert curriculum designer. 
  Analyze the following text and extract a syllabus of the top 3-5 most important topics. 
  Return JSON only.`;

    const structuredModel = model.withStructuredOutput(SyllabusSchema);

    try {
        const response = await structuredModel.invoke([
            new SystemMessage(prompt),
            lastMessage
        ]);

        return {
            syllabus: response.topics,
            messages: [new SystemMessage(`Syllabus generated: ${response.topics.join(", ")}`)]
        };
    } catch (e) {
        console.error("Architect logic failed", e);
        return { syllabus: ["General Knowledge"], messages: [new SystemMessage("Architect failed, using fallback.")] };
    }
}

// NODE 3: The Creator
async function creatorNode(state: typeof GraphState.State) {
    const { syllabus, messages } = state;
    const pdfContent = messages.find(m => m instanceof HumanMessage)?.content || "";

    const prompt = `You are a flashcard generator.
    Based on the provided text, generate 3 specific flashcards for EACH of the following topics: ${syllabus.join(", ")}.
    Ensure questions are engaging and answers are concise.
    Return JSON only.`;

    const structuredModel = model.withStructuredOutput(FlashcardListSchema);

    try {
        const response = await structuredModel.invoke([
            new SystemMessage(prompt),
            new HumanMessage(pdfContent as string)
        ]);

        return {
            flashcards: response.flashcards,
            messages: [new SystemMessage(`Generated ${response.flashcards.length} flashcards.`)]
        };
    } catch (e) {
        console.error("Creator logic failed", e);
        return { flashcards: [], messages: [new SystemMessage("Creator failed.")] };
    }
}

// NODE 4: The Critic (Optimized out for speed in MVP, passing through)
async function criticNode(state: typeof GraphState.State) {
    return {
        messages: [new SystemMessage("Critique passed (Auto-approved).")]
    };
}

// NODE 5: The Saver
async function saverNode(state: typeof GraphState.State) {
    const { flashcards, syllabus, userId } = state;

    if (flashcards.length > 0) {
        try {
            await addDoc(collection(db, "decks"), {
                userId: userId,
                createdAt: new Date(),
                topics: syllabus,
                cardCount: flashcards.length,
                cards: flashcards
            });
            return { messages: [new SystemMessage("Saved to Firebase successfully.")] };
        } catch (e) {
            console.error("Firebase save failed", e);
            return { messages: [new SystemMessage("Failed to save to Firebase.")] };
        }
    }
    return { messages: [new SystemMessage("No cards to save.")] };
}

// Build the Graph
export const graph = new StateGraph(GraphState)
    .addNode("reader", readerNode)
    .addNode("architect", architectNode)
    .addNode("creator", creatorNode)
    .addNode("critic", criticNode)
    .addNode("saver", saverNode)
    .addEdge("__start__", "reader")
    .addEdge("reader", "architect")
    .addEdge("architect", "creator")
    .addEdge("creator", "critic")
    .addEdge("critic", "saver")
    .addEdge("saver", "__end__")
    .compile();
