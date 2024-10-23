import { parse } from "papaparse";
import fs from "fs";
import { parse as parseDate, isValid, format } from "date-fns";

// Define the Transaction type
type Transaction = {
  date: string; // 'YYYY-MM-DD' format
  description: string;
  amount: number;
};

// Define the CSVRow type (raw data from CSV)
type CSVRow = string[];

// Define the ParseResult interface
interface ParseResult {
  transactions: Transaction[]; // Only credit transactions
  invalidCount: number;
  totalRows: number; // Number of credit transactions
  errors: string[];
}

// Helper function to parse the amount safely
function parseAmount(amount: string): number | null {
  const normalizedAmount = amount.replace(/,/g, ""); // Remove commas if any
  const parsedAmount = parseFloat(normalizedAmount);
  return isNaN(parsedAmount) ? null : parsedAmount;
}

// Helper function to parse and validate the date using date-fns
function parseAndValidateDate(dateStr: string): string | null {
  const dateFormats = [
    "ddMMMyyyy",
    "dd/MM/yyyy",
    "MM/dd/yyyy",
    "yyyy-MM-dd",
    "dd MMM yyyy",
    "dd MMMM yyyy",
  ];

  for (const formatString of dateFormats) {
    const parsed = parseDate(dateStr.trim(), formatString, new Date());
    if (isValid(parsed)) {
      return format(parsed, "yyyy-MM-dd"); // Return 'YYYY-MM-DD'
    }
  }

  return null;
}

export async function parseBankCSV(filePath: string): Promise<ParseResult> {
  const csvFile = fs.readFileSync(filePath, "utf8");

  return new Promise((resolve, reject) => {
    parse(csvFile, {
      delimiter: "", // Auto-detect delimiter
      skipEmptyLines: true, // Skip empty lines
      complete: (results) => {
        const { data } = results as { data: CSVRow[] };

        const transactions: Transaction[] = [];
        let invalidCount = 0;
        const errors: string[] = [];

        data.forEach((row, index) => {
          // Skip rows with fewer than 3 columns
          if (row.length < 3) {
            return;
          }

          const date = parseAndValidateDate(row[0]);

          if (date === null) {
            // Not a valid transaction row, skip
            return;
          }

          const description = row[1];
          const amount = parseAmount(row[2]);

          if (amount === null) {
            invalidCount++;
            errors.push(`Row ${index + 1}: Invalid amount "${row[2]}"`);
            return;
          }

          // Collect the transaction
          transactions.push({
            date,
            description,
            amount,
          });
        });

        // Filter for credit transactions (positive amounts)
        const credits = transactions.filter(
          (transaction) => transaction.amount > 0
        );

        resolve({
          transactions: credits, // Only credits
          invalidCount,
          totalRows: credits.length, // Number of credit transactions
          errors,
        });
      },
      error: (error: unknown) => reject(error),
    });
  });
}
