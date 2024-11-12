import { describe, it, expect, beforeEach, vi } from "vitest";
import { parseFile } from "./ai-parser";
import fs from "fs/promises";
import { generateObject } from "ai";
import type { GenerateObjectResult } from "ai";
import { z } from "zod";

// Mock dependencies
vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    unlink: vi.fn(),
    mkdir: vi.fn(),
    access: vi.fn(),
  },
}));

type ValidationResponse = z.infer<typeof validationSchema>;
type TransactionResponse = z.infer<typeof transactionSchema>;

const validationSchema = z.object({
  isValid: z.boolean(),
  message: z.string(),
  confidence: z.number()
});

const transactionSchema = z.object({
  isValidStatement: z.boolean(),
  transactions: z.array(z.object({
    date: z.string(),
    amount: z.number(),
    transaction_reference: z.string()
  }))
});

const mockAIResponse = {
  object: { isValid: true, confidence: 0.9, message: "Valid" },
  finishReason: "stop",
  usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
  response: { id: "1", model: "gpt-4", timestamp: new Date() }
} as GenerateObjectResult<ValidationResponse>;

const mockTransactionsResponse = {
  object: { isValidStatement: true, transactions: [] },
  finishReason: "stop",
  usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
  response: { id: "1", model: "gpt-4", timestamp: new Date() }
} as GenerateObjectResult<TransactionResponse>;

describe("AI Parser Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parseFile", () => {
    it("should reject files larger than 10MB", async () => {
      const largeFile = new File([""], "test.pdf", { type: "application/pdf" });
      Object.defineProperty(largeFile, "size", { value: 11 * 1024 * 1024 });

      const result = await parseFile(largeFile);
      expect(result).toEqual({
        code: "FILE_TOO_LARGE",
        message: "File size exceeds 10MB limit",
      });
    });

    it("should reject unsupported file types", async () => {
      const invalidFile = new File([""], "test.txt", { type: "text/plain" });

      const result = await parseFile(invalidFile);
      expect(result).toEqual({
        code: "INVALID_FILE_TYPE",
        message: "Only PDF and CSV files are supported",
      });
    });

    it("should process a PDF file", async () => {
      const testFile = new File(["test content"], "test.pdf", {
        type: "application/pdf",
      });
      vi.mocked(fs.readFile).mockResolvedValue("test content");
      vi.mocked(generateObject)
        .mockResolvedValueOnce(mockAIResponse)
        .mockResolvedValueOnce(mockTransactionsResponse);

      const result = await parseFile(testFile);

      expect(fs.readFile).toHaveBeenCalled();
      expect(generateObject).toHaveBeenCalled();
      expect(result).toHaveProperty("transactions");
    });

    it("should process a CSV file", async () => {
      const testFile = new File(["test,content"], "test.csv", {
        type: "text/csv",
      });
      vi.mocked(fs.readFile).mockResolvedValue("test,content");
      vi.mocked(generateObject).mockResolvedValue(mockTransactionsResponse);

      const result = await parseFile(testFile);

      expect(fs.readFile).toHaveBeenCalled();
      expect(generateObject).toHaveBeenCalled();
      expect(result).toHaveProperty("transactions");
    });

    it("should handle file system errors", async () => {
      const testFile = new File([""], "test.pdf", { type: "application/pdf" });
      vi.mocked(fs.readFile).mockRejectedValue(new Error("File read error"));

      const result = await parseFile(testFile);
      expect(result).toEqual({
        code: "PROCESSING_ERROR",
        message: "File read error",
      });
    });
  });
});
