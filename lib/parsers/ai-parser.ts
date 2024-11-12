"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { parse } from "csv-parse/sync";
import fs from 'fs/promises';
import path from 'path';

export async function parseFile(file: File) {
  const fileType = file.name.split(".").pop()?.toLowerCase();

  // Create temp directory if it doesn't exist
  const tempDir = path.join(process.cwd(), 'tmp');
  try {
    await fs.access(tempDir);
  } catch {
    await fs.mkdir(tempDir);
  }

  // Write file to temp directory
  const tempFilePath = path.join(tempDir, `temp-${Date.now()}-${file.name}`);
  const buffer = await file.arrayBuffer();
  await fs.writeFile(tempFilePath, new Uint8Array(buffer));

  try {
    if (fileType === "pdf") {
      // Read PDF file using fs
      const pdfContent = await fs.readFile(tempFilePath, 'utf8');
      return extractTransactionsWithAI(pdfContent);
    } else if (fileType === "csv") {
      const text = await fs.readFile(tempFilePath, 'utf8');
      return parseCsv(text);
    } else {
      throw new Error("Unsupported file type");
    }
  } finally {
    // Clean up temp file
    try {
      await fs.unlink(tempFilePath);
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }
  }
}

async function parseCsv(text: string) {
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
    model: openai("gpt-4"),
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
