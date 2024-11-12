"use server";

// import { openai } from "@ai-sdk/openai";
import { mistral } from "@ai-sdk/mistral";
import { generateObject } from "ai";
import { z } from "zod";
import { parse } from "csv-parse/sync";
import fs from "fs/promises";
import path from "path";
import { Tables } from "@/lib/supabase/database.types";

// Define common bank statement headers and keywords
// const COMMON_BANK_HEADERS = [
//   "date",
//   "description", 
//   "amount",
//   "balance",
//   "transaction",
//   "credit",
//   "debit",
//   "reference",
//   "payment",
//   "withdrawal",
//   "deposit",
// ];

// Common banking terms to look for in PDFs
const BANKING_TERMS = [
  "account",
  "statement",
  "balance",
  "transaction",
  "opening balance",
  "closing balance",
  "period",
  "branch",
  "account holder",
  "account number",
];

// South African banks and their abbreviations
const SA_BANKS = [
  { name: "First National Bank", abbr: "FNB" },
  { name: "ABSA Bank", abbr: "ABSA" },
  { name: "Standard Bank", abbr: "SBSA" },
  { name: "Nedbank", abbr: "NED" },
  { name: "Capitec Bank", abbr: "CPT" },
  { name: "Investec", abbr: "INV" },
  { name: "African Bank", abbr: "AFB" },
  { name: "Discovery Bank", abbr: "DISC" },
];

interface ValidationError {
  code:
    | "INVALID_FILE_TYPE"
    | "NOT_A_BANK_STATEMENT"
    | "FILE_TOO_LARGE"
    | "PROCESSING_ERROR";
  message: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

// Define the return type for successful parsing
type ParsedTransaction = Omit<
  Tables<"payments">,
  | "payment_id"
  | "created_at"
  | "updated_at"
  | "organization_id"
  | "bank_statement_id"
>;

export async function parseFile(
  file: File
): Promise<{ transactions: ParsedTransaction[] } | ValidationError> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      code: "FILE_TOO_LARGE",
      message: "File size exceeds 10MB limit",
    };
  }
  console.log("File size good");

  const fileType = file.name.split(".").pop()?.toLowerCase();
  if (!["pdf", "csv"].includes(fileType ?? "")) {
    return {
      code: "INVALID_FILE_TYPE",
      message: "Only PDF and CSV files are supported",
    };
  }
  console.log("File type good ", fileType);

  // Create temp directory if it doesn't exist
  const tempDir = path.join(process.cwd(), "tmp");
  try {
    await fs.access(tempDir);
  } catch {
    await fs.mkdir(tempDir);
  }
  console.log("Temp dir created", tempDir);
  // Write file to temp directory
  const tempFilePath = path.join(tempDir, `temp-${Date.now()}-${file.name}`);
  const buffer = await file.arrayBuffer();
  await fs.writeFile(tempFilePath, new Uint8Array(buffer));

  console.log("File written to temp dir", tempFilePath);

  try {
    if (fileType === "pdf") {
      const pdfContent = await fs.readFile(tempFilePath, "utf8");
      // First try traditional validation
      const traditionalValidation = validatePdfTraditionally(pdfContent);

      if (traditionalValidation.isValid) {
        console.log("Traditional validation passed");
        return extractTransactionsWithAI(pdfContent);
      }

      // If content is less than half a page (roughly 1500 chars), reject
      if (pdfContent.length < 1500) {
        console.log("PDF content too short to be a valid bank statement");
        return {
          code: "NOT_A_BANK_STATEMENT",
          message: "PDF content too short to be a valid bank statement",
        };
      }

      // Try AI validation as fallback for longer content
      const aiValidation = await validateBankStatement(pdfContent);
      if (!aiValidation.isValid) {
        console.log("AI validation failed", aiValidation.message);
        return {
          code: "NOT_A_BANK_STATEMENT",
          message: aiValidation.message,
        };
      }
      console.log("AI validation passed, extracting transactions");
      return extractTransactionsWithAI(pdfContent);
    } else if (fileType === "csv") {
      const text = await fs.readFile(tempFilePath, "utf8");
      const validation = await validateCsvBankStatement(text);
      if (!validation.isValid) {
        console.log("CSV validation failed", validation.message);
        return {
          code: "NOT_A_BANK_STATEMENT",
          message: validation.message,
        };
      }
      console.log("CSV validation passed, parsing CSV");
      return parseCsv(text);
    }

    throw new Error("Unsupported file type");
  } catch (error) {
    console.log("Error parsing file", error);
    return {
      code: "PROCESSING_ERROR",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  } finally {
    // Clean up temp file
    try {
      await fs.unlink(tempFilePath);
    } catch (error) {
      console.error("Error cleaning up temp file:", error);
    }
  }
}

function validatePdfTraditionally(content: string): {
  isValid: boolean;
  message: string;
} {
  const contentLower = content.toLowerCase();

  // Check for common banking terms
  const hasBankingTerms = BANKING_TERMS.some((term) =>
    contentLower.includes(term.toLowerCase())
  );

  if (!hasBankingTerms) {
    return {
      isValid: false,
      message: "No common banking terms found",
    };
  }

  // Check for bank identifiers
  const hasBankIdentifiers = SA_BANKS.some(
    (bank) =>
      contentLower.includes(bank.name.toLowerCase()) ||
      contentLower.includes(bank.abbr.toLowerCase())
  );

  if (!hasBankIdentifiers) {
    return {
      isValid: false,
      message: "No bank identifiers found",
    };
  }

  // Look for date patterns (various formats)
  const hasDatePatterns =
    /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(content);

  if (!hasDatePatterns) {
    return {
      isValid: false,
      message: "No date patterns found",
    };
  }

  // Look for currency/amount patterns
  const hasCurrencyPatterns = /R\s*\d+[.,]\d{2}|\d+[.,]\d{2}\s*R/.test(content);

  if (!hasCurrencyPatterns) {
    return {
      isValid: false,
      message: "No currency patterns found",
    };
  }

  return {
    isValid: true,
    message: "",
  };
}

async function validateCsvBankStatement(text: string): Promise<{
  isValid: boolean;
  message: string;
}> {
  try {
    // Parse CSV with relaxed options to handle inconsistent columns
    const records = parse(text, { 
      skip_empty_lines: true,
      relax_column_count: true, // Allow inconsistent column counts
      columns: false // Don't try to parse headers
    });

    if (records.length === 0) {
      return { isValid: false, message: "CSV file is empty" };
    }
    // Convert all records to string for easier searching
    const contentString = records.map((row: string[]) => row.join(' ')).join(' ').toLowerCase();

    // Check for bank identifiers in the full content
    const hasBankIdentifiers = SA_BANKS.some(bank => 
      contentString.includes(bank.name.toLowerCase()) ||
      contentString.includes(bank.abbr.toLowerCase())
    );

    if (!hasBankIdentifiers) {
      return {
        isValid: false,
        message: "No bank identifiers found in the content",
      };
    }

    // Check for banking terms
    const hasBankingTerms = BANKING_TERMS.some(term => 
      contentString.includes(term.toLowerCase())
    );

    if (!hasBankingTerms) {
      return {
        isValid: false,
        message: "No common banking terms found",
      };
    }

    // Check for numeric values (amounts)
    const hasNumericValues = /\d+[.,]\d{2}/.test(contentString);

    if (!hasNumericValues) {
      return {
        isValid: false,
        message: "No currency amounts found in CSV",
      };
    }

    return { isValid: true, message: "" };
  } catch (error: unknown) {
    console.error("Error validating CSV:", error);
    return {
      isValid: false,
      message: error instanceof Error ? error.message : "Invalid CSV format",
    };
  }
}

async function validateBankStatement(content: string): Promise<{
  isValid: boolean;
  message: string;
}> {
  /**
   * Validate the bank statement using AI
   */
  const { object } = await generateObject({
    // model: openai("gpt-4"),
    model: mistral("mistral-large-latest"),
    schema: z.object({
      isValid: z.boolean(),
      message: z.string(),
      confidence: z.number().min(0).max(1),
    }),
    prompt: `
      Analyze this document and determine if it's a valid bank statement.
      Look for:
      1. Common banking terms (account, balance, transaction, etc.)
      2. South African bank identifiers (FNB, ABSA, Standard Bank, Nedbank, Capitec, Investec, African Bank)
      3. Transaction patterns and financial data structure
      4. Statement period or date ranges
      5. Account holder information
      
      Return:
      - isValid: boolean indicating if this is a bank statement
      - message: explanation of the decision
      - confidence: number between 0-1 indicating confidence in the decision
      
      Content to analyze:
      ${content.substring(0, Math.floor(content.length / 2))}
    `,
  });

  return {
    isValid: object.isValid && object.confidence > 0.8,
    message: object.message,
  };
}

async function parseCsv(
  text: string
): Promise<{ transactions: ParsedTransaction[] }> {
  const records = parse(text, { 
    skip_empty_lines: true,
    relax_column_count: true, // Allow inconsistent columns
    columns: false // Don't try to parse headers
  });
  const csvString = records
    .map((record: string[]) => record.join(", "))
    .join("\n");
  return extractTransactionsWithAI(csvString);
}

async function extractTransactionsWithAI(
  content: string
): Promise<{ transactions: ParsedTransaction[] }> {
  console.log(
    "\n\n\nContent to analyze\n\n-----------------\n\n",
    content,
    "\n\n-----------------\n\n"
  );

  const { object } = await generateObject({
    // model: openai("gpt-4"),
    model: mistral("mistral-large-latest"),
    schema: z.object({
      isValidStatement: z.boolean(),
      error: z.string().optional(),
      transactions: z
        .array(
          z.object({
            amount: z.number().positive(),
            transaction_reference: z.string(),
            date: z.string(),
          })
        )
        .optional(),
    }),
    prompt: `
      First, verify this is a valid bank statement. Then extract transactions if it is.
      
      If this is NOT a bank statement, set isValidStatement: false and provide an error message.
      
      If this IS a bank statement, extract:
      - Date of transaction (in ISO format)
      - Reference or description
      - Amount (positive numbers for credits)

      Only include transactions that credit the account (positive amounts).

      Bank statement content:
      ${content}
    `,
  });

  if (!object.isValidStatement) {
    return {
      transactions: [],
    };
  }

  return {
    transactions: object.transactions || [],
  };
}
