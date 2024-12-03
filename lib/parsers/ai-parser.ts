import { mistral } from "@ai-sdk/mistral";
import { generateObject } from "ai";
import { z } from "zod";
import { parse } from "csv-parse/sync";
import { Tables } from "@/lib/supabase/database.types";

// Constants for validation
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

// Type definitions
interface ValidationError {
  code:
    | "INVALID_FILE_TYPE"
    | "NOT_A_BANK_STATEMENT"
    | "FILE_TOO_LARGE"
    | "PROCESSING_ERROR";
  message: string;
}

type ParsedTransaction = Omit<
  Tables<"payments">,
  | "payment_id"
  | "created_at"
  | "updated_at"
  | "organization_id"
  | "bank_statement_id"
>;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

// Main parsing function
export async function parseFile(
  file: File
): Promise<{ transactions: ParsedTransaction[] } | ValidationError> {
  if (file.size > MAX_FILE_SIZE) {
    return {
      code: "FILE_TOO_LARGE",
      message: "File size exceeds 10MB limit",
    };
  }

  const fileType = file.name.split(".").pop()?.toLowerCase();
  if (!["pdf", "csv"].includes(fileType ?? "")) {
    return {
      code: "INVALID_FILE_TYPE",
      message: "Only PDF and CSV files are supported",
    };
  }

  try {
    const content = await file.text();

    if (fileType === "pdf") {
      return handlePdfContent(content);
    } else if (fileType === "csv") {
      return handleCsvContent(content);
    }

    throw new Error("Unsupported file type");
  } catch (error) {
    console.error("Error parsing file:", error);
    return {
      code: "PROCESSING_ERROR",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// PDF handling
async function handlePdfContent(
  content: string
): Promise<{ transactions: ParsedTransaction[] } | ValidationError> {
  const traditionalValidation = validatePdfTraditionally(content);

  if (traditionalValidation.isValid) {
    return extractTransactionsWithAI(content);
  }

  if (content.length < 1500) {
    return {
      code: "NOT_A_BANK_STATEMENT",
      message: "PDF content too short to be a valid bank statement",
    };
  }

  const aiValidation = await validateBankStatement(content);
  if (!aiValidation.isValid) {
    return {
      code: "NOT_A_BANK_STATEMENT",
      message: aiValidation.message,
    };
  }

  return extractTransactionsWithAI(content);
}

// CSV handling
async function handleCsvContent(
  content: string
): Promise<{ transactions: ParsedTransaction[] } | ValidationError> {
  const validation = await validateCsvBankStatement(content);
  if (!validation.isValid) {
    return {
      code: "NOT_A_BANK_STATEMENT",
      message: validation.message,
    };
  }

  return parseCsv(content);
}

// Validation functions
function validatePdfTraditionally(content: string): {
  isValid: boolean;
  message: string;
} {
  const contentLower = content.toLowerCase();

  // Check for banking terms
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

  // Check for date patterns
  const hasDatePatterns =
    /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(content);

  if (!hasDatePatterns) {
    return {
      isValid: false,
      message: "No date patterns found",
    };
  }

  // Check for currency patterns
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
    const records = parse(text, {
      skip_empty_lines: true,
      relax_column_count: true,
      columns: false,
    });

    if (records.length === 0) {
      return { isValid: false, message: "CSV file is empty" };
    }

    const contentString = records
      .map((row: string[]) => row.join(" "))
      .join(" ")
      .toLowerCase();

    // Check for bank identifiers
    const hasBankIdentifiers = SA_BANKS.some(
      (bank) =>
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
    const hasBankingTerms = BANKING_TERMS.some((term) =>
      contentString.includes(term.toLowerCase())
    );

    if (!hasBankingTerms) {
      return {
        isValid: false,
        message: "No common banking terms found",
      };
    }

    // Check for numeric values
    const hasNumericValues = /\d+[.,]\d{2}/.test(contentString);

    if (!hasNumericValues) {
      return {
        isValid: false,
        message: "No currency amounts found in CSV",
      };
    }

    return { isValid: true, message: "" };
  } catch (error) {
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
  const { object } = await generateObject({
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
    relax_column_count: true,
    columns: false,
  });

  const csvString = records
    .map((record: string[]) => record.join(", "))
    .join("\n");

  return extractTransactionsWithAI(csvString);
}

async function extractTransactionsWithAI(
  content: string
): Promise<{ transactions: ParsedTransaction[] }> {
  const { object } = await generateObject({
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
    transactions: (object.transactions || []).map((transaction) => ({
      ...transaction,
      payer_id: "",
      reference_on_deposit: "",
    })),
  };
}
