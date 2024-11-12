
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import pdf from "pdf-parse";
import { parse } from "csv-parse/sync";

export async function parseFile(file: File) {
  const buffer = await file.arrayBuffer();
  const fileType = file.name.split(".").pop()?.toLowerCase();

  if (fileType === "pdf") {
    return parsePdf(buffer);
  } else if (fileType === "csv") {
    return parseCsv(buffer);
  } else {
    throw new Error("Unsupported file type");
  }
}

async function parsePdf(buffer: ArrayBuffer) {
  const data = await pdf(Buffer.from(buffer));
  return extractTransactionsWithAI(data.text);
}

async function parseCsv(buffer: ArrayBuffer) {
  const text = new TextDecoder().decode(buffer);
  const records = parse(text, { columns: true, skip_empty_lines: true });
  const csvString = records
    .map((record: Record<string, string>) => Object.values(record).join(", "))
    .join("\n");
  return extractTransactionsWithAI(csvString);
}

async function extractTransactionsWithAI(content: string) {
  const prompt = `
    Extract the following information from this bank statement:
    - Date of transaction
    - Reference or description
    - Amount (positive numbers for credits)

    Format the output as a JSON array of objects, each with 'date', 'reference', and 'amount' properties.
    Only include transactions that credit the account (positive amounts).

    Bank statement content:
    ${content}
  `;

  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: z.object({
      transactions: z.array(
        z.object({
          date: z.string(),
          reference: z.string(),
          amount: z.number().positive(),
        })
      ),
    }),
    prompt,
  });

  return object;
}
