import { parseBankCSV } from "@/lib/parsers/bank-csv-parser";
import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";

describe("CSV Parsing", () => {
  it("parses a CSV with headers correctly", async () => {
    const csvData = `Date,Description,Amount
09Sep2024,Salary,14269.04
20Sep2024,Cash Deposit,2580.00
21Sep2024,Payment,-100.00`;

    fs.writeFileSync("/tmp/test_with_headers.csv", csvData);

    const result = await parseBankCSV("/tmp/test_with_headers.csv");

    expect(result.transactions).toEqual([
      { date: "2024-09-09", description: "Salary", amount: 14269.04 },
      { date: "2024-09-20", description: "Cash Deposit", amount: 2580.0 },
    ]);

    expect(result.invalidCount).toBe(0); // No invalid transactions
    expect(result.totalRows).toBe(2); // Number of credit transactions
    expect(result.errors.length).toBe(0); // No parsing errors
  });

  it("parses a CSV without headers correctly", async () => {
    const csvData = `09Sep2024,Salary,14269.04
20Sep2024,Cash Deposit,2580.00
21Sep2024,Payment,-100.00`;

    fs.writeFileSync("/tmp/test_without_headers.csv", csvData);

    const result = await parseBankCSV("/tmp/test_without_headers.csv");

    expect(result.transactions).toEqual([
      { date: "2024-09-09", description: "Salary", amount: 14269.04 },
      { date: "2024-09-20", description: "Cash Deposit", amount: 2580.0 },
    ]);

    expect(result.invalidCount).toBe(0); // No invalid transactions
    expect(result.totalRows).toBe(2); // Number of credit transactions
    expect(result.errors.length).toBe(0); // No parsing errors
  });

  it("parses the mock bank statement template correctly", async () => {
    const mockFilePath = path.resolve(
      __dirname,
      "../mock-data/csv statement template.csv"
    );
    const result = await parseBankCSV(mockFilePath);

    // Log errors for debugging (if any)
    console.log("Errors:", result.errors);

    const expectedTransactions = [
      { date: "2024-09-13", description: "01", amount: 160.9 },
      { date: "2024-09-20", description: "Nedbank Salary 00200366", amount: 14269.04 },
      { date: "2024-09-20", description: "cash", amount: 2580.0 },
      { date: "2024-09-20", description: "BMW Z4 - 2012121403", amount: 1000.0 },
      { date: "2024-09-20", description: "cash", amount: 600.0 },
      { date: "2024-09-20", description: "cash", amount: 250.0 },
      { date: "2024-09-20", description: "cash", amount: 200.0 },
      { date: "2024-09-20", description: "BMW Z4 - 2012121403", amount: 100.0 },
      { date: "2024-09-23", description: "REV_5898461186281083", amount: 180.0 },
      { date: "2024-09-25", description: "CAPFIN      17300434    BA3754", amount: 1360.0 },
      { date: "2024-09-25", description: "0815465704CASH DEP", amount: 4650.0 },
      { date: "2024-09-26", description: "Deposily", amount: 6500.0 },
      { date: "2024-09-26", description: "Send money", amount: 3700.0 },
      { date: "2024-09-26", description: "Deposily", amount: 600.0 },
      { date: "2024-10-01", description: "01", amount: 496.2 },
      { date: "2024-10-07", description: "0013848709-OMEB-P-6AZS-R001762", amount: 29402.71 },
    ];
    expect(result.transactions).toEqual(expectedTransactions);
    expect(result.invalidCount).toBe(0);
    expect(result.totalRows).toBe(16); // Number of credit transactions
    expect(result.errors.length).toBe(0);
  });
});
