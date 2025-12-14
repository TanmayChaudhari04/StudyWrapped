import { z } from "zod";
import { tool } from "@langchain/core/tools";
import fs from "fs/promises";

// Polyfill DOMMatrix for pdfjs-dist (if needed)
if (typeof global.DOMMatrix === "undefined") {
    (global as any).DOMMatrix = class DOMMatrix {
        constructor() { }
    };
}

export const pdfReaderTool = tool(
    async ({ filePath }: { filePath: string }) => {
        try {
            const PDFParser = require("pdf2json");
            const pdfParser = new PDFParser();

            return new Promise<string>((resolve, reject) => {
                pdfParser.on("pdfParser_dataError", (errData: any) => {
                    console.error("PDF Parser Error:", errData.parserError);
                    reject(new Error(errData.parserError));
                });

                pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                    try {
                        // Extract text from all pages
                        let text = "";
                        if (pdfData.Pages) {
                            pdfData.Pages.forEach((page: any) => {
                                if (page.Texts) {
                                    page.Texts.forEach((textItem: any) => {
                                        textItem.R.forEach((run: any) => {
                                            try {
                                                text += decodeURIComponent(run.T) + " ";
                                            } catch (e) {
                                                // If decoding fails, use the raw text
                                                text += run.T + " ";
                                            }
                                        });
                                    });
                                }
                            });
                        }
                        resolve(text.trim());
                    } catch (e) {
                        reject(e);
                    }
                });

                pdfParser.loadPDF(filePath);
            });
        } catch (error) {
            console.error("Error reading PDF:", error);
            return "PDF parsing failed. Please check the file.";
        }
    },
    {
        name: "pdf_reader",
        description: "Reads and extracts text content from a PDF file.",
        schema: z.object({
            filePath: z.string().describe("The file path of the PDF to read."),
        }),
    }
);
