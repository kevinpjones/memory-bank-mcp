import { describe, expect, it } from "vitest";
import {
  addLineNumbers,
  stripLineNumbers,
  hasLineNumbers,
} from "../../../src/presentation/helpers/line-numbers.js";

describe("addLineNumbers", () => {
  it("should add 1-indexed line numbers to each line", () => {
    const content = "first\nsecond\nthird";
    const result = addLineNumbers(content);
    expect(result).toBe("1|first\n2|second\n3|third");
  });

  it("should handle single line content", () => {
    const content = "single line";
    const result = addLineNumbers(content);
    expect(result).toBe("1|single line");
  });

  it("should handle empty lines", () => {
    const content = "first\n\nthird";
    const result = addLineNumbers(content);
    expect(result).toBe("1|first\n2|\n3|third");
  });

  it("should return empty string for empty content", () => {
    const result = addLineNumbers("");
    expect(result).toBe("");
  });

  it("should return null/undefined as-is", () => {
    expect(addLineNumbers(null as any)).toBe(null);
    expect(addLineNumbers(undefined as any)).toBe(undefined);
  });

  it("should pad line numbers for alignment with many lines", () => {
    const lines = Array.from({ length: 100 }, (_, i) => `line ${i + 1}`);
    const content = lines.join("\n");
    const result = addLineNumbers(content);
    const resultLines = result.split("\n");

    // First line should be padded: "  1|line 1"
    expect(resultLines[0]).toBe("  1|line 1");
    // Line 10 should be padded: " 10|line 10"
    expect(resultLines[9]).toBe(" 10|line 10");
    // Line 100 should not need padding: "100|line 100"
    expect(resultLines[99]).toBe("100|line 100");
  });

  it("should handle content with pipe characters", () => {
    const content = "key|value\nfoo|bar";
    const result = addLineNumbers(content);
    expect(result).toBe("1|key|value\n2|foo|bar");
  });

  it("should handle content with special characters", () => {
    const content = "# Heading\n- item\n```code```";
    const result = addLineNumbers(content);
    expect(result).toBe("1|# Heading\n2|- item\n3|```code```");
  });
});

describe("stripLineNumbers", () => {
  it("should remove line number prefixes from content", () => {
    const content = "1|first\n2|second\n3|third";
    const result = stripLineNumbers(content);
    expect(result).toBe("first\nsecond\nthird");
  });

  it("should handle padded line numbers", () => {
    const content = "  1|first\n 10|tenth\n100|hundredth";
    const result = stripLineNumbers(content);
    expect(result).toBe("first\ntenth\nhundredth");
  });

  it("should preserve content without line numbers", () => {
    const content = "no line numbers here\njust regular content";
    const result = stripLineNumbers(content);
    expect(result).toBe("no line numbers here\njust regular content");
  });

  it("should return empty string for empty content", () => {
    const result = stripLineNumbers("");
    expect(result).toBe("");
  });

  it("should return null/undefined as-is", () => {
    expect(stripLineNumbers(null as any)).toBe(null);
    expect(stripLineNumbers(undefined as any)).toBe(undefined);
  });

  it("should handle mixed content (some lines with, some without)", () => {
    const content = "1|first\nno prefix\n3|third";
    const result = stripLineNumbers(content);
    expect(result).toBe("first\nno prefix\nthird");
  });

  it("should preserve pipe characters in actual content", () => {
    const content = "1|key|value\n2|foo|bar";
    const result = stripLineNumbers(content);
    expect(result).toBe("key|value\nfoo|bar");
  });
});

describe("hasLineNumbers", () => {
  it("should return true for content with line numbers", () => {
    const content = "1|first\n2|second\n3|third";
    expect(hasLineNumbers(content)).toBe(true);
  });

  it("should return true for content with padded line numbers", () => {
    const content = "  1|first\n  2|second\n  3|third";
    expect(hasLineNumbers(content)).toBe(true);
  });

  it("should return false for content without line numbers", () => {
    const content = "first\nsecond\nthird";
    expect(hasLineNumbers(content)).toBe(false);
  });

  it("should return false for empty content", () => {
    expect(hasLineNumbers("")).toBe(false);
  });

  it("should return false for null/undefined", () => {
    expect(hasLineNumbers(null as any)).toBe(false);
    expect(hasLineNumbers(undefined as any)).toBe(false);
  });

  it("should return true if most sample lines match", () => {
    // 2 out of 3 lines have line numbers
    const content = "1|first\nno prefix\n3|third";
    expect(hasLineNumbers(content)).toBe(true);
  });

  it("should return false if few sample lines match", () => {
    // Only 1 out of 3 lines has line number pattern
    const content = "1|first\nno prefix\nalso no prefix";
    expect(hasLineNumbers(content)).toBe(false);
  });
});

describe("roundtrip: addLineNumbers -> stripLineNumbers", () => {
  it("should preserve original content after roundtrip", () => {
    const original = "# Title\n\nSome content here\n- item 1\n- item 2\n\n```code```";
    const withLineNumbers = addLineNumbers(original);
    const stripped = stripLineNumbers(withLineNumbers);
    expect(stripped).toBe(original);
  });

  it("should handle large files in roundtrip", () => {
    const lines = Array.from({ length: 1000 }, (_, i) => `Content line ${i + 1}`);
    const original = lines.join("\n");
    const withLineNumbers = addLineNumbers(original);
    const stripped = stripLineNumbers(withLineNumbers);
    expect(stripped).toBe(original);
  });
});

describe("content alignment with varying line counts", () => {
  it("should not pad line numbers when total lines < 10", () => {
    const lines = Array.from({ length: 9 }, (_, i) => `line ${i + 1}`);
    const content = lines.join("\n");
    const result = addLineNumbers(content);
    const resultLines = result.split("\n");

    // All lines should have single-digit prefixes without padding
    expect(resultLines[0]).toBe("1|line 1");
    expect(resultLines[4]).toBe("5|line 5");
    expect(resultLines[8]).toBe("9|line 9");

    // Verify content starts immediately after pipe (no extra spaces in content)
    resultLines.forEach((line, index) => {
      const afterPipe = line.split("|").slice(1).join("|");
      expect(afterPipe).toBe(`line ${index + 1}`);
    });
  });

  it("should pad single-digit line numbers when total lines >= 10", () => {
    const lines = Array.from({ length: 12 }, (_, i) => `line ${i + 1}`);
    const content = lines.join("\n");
    const result = addLineNumbers(content);
    const resultLines = result.split("\n");

    // Single-digit lines should be padded to align with double-digit
    expect(resultLines[0]).toBe(" 1|line 1");
    expect(resultLines[8]).toBe(" 9|line 9");
    // Double-digit lines should not have extra padding
    expect(resultLines[9]).toBe("10|line 10");
    expect(resultLines[11]).toBe("12|line 12");
  });

  it("should ensure content remains aligned regardless of line number width", () => {
    const lines = Array.from({ length: 15 }, (_, i) => "same content");
    const content = lines.join("\n");
    const result = addLineNumbers(content);
    const resultLines = result.split("\n");

    // Extract content after the pipe for each line
    const extractedContent = resultLines.map(line => {
      const pipeIndex = line.indexOf("|");
      return line.substring(pipeIndex + 1);
    });

    // All extracted content should be identical
    extractedContent.forEach(content => {
      expect(content).toBe("same content");
    });
  });

  it("should maintain content integrity at the 9-to-10 line boundary", () => {
    // Test with exactly 10 lines to verify boundary behavior
    const lines = Array.from({ length: 10 }, (_, i) => `content-${i + 1}`);
    const content = lines.join("\n");
    const result = addLineNumbers(content);
    const resultLines = result.split("\n");

    // Lines 1-9 should be padded
    expect(resultLines[0]).toBe(" 1|content-1");
    expect(resultLines[8]).toBe(" 9|content-9");
    // Line 10 should not need padding
    expect(resultLines[9]).toBe("10|content-10");

    // Verify the original content is extractable and unchanged
    resultLines.forEach((line, index) => {
      const pipeIndex = line.indexOf("|");
      const extractedContent = line.substring(pipeIndex + 1);
      expect(extractedContent).toBe(`content-${index + 1}`);
    });
  });

  it("should maintain content integrity at the 99-to-100 line boundary", () => {
    // Test with exactly 100 lines to verify three-digit boundary
    const lines = Array.from({ length: 100 }, (_, i) => `data-${i + 1}`);
    const content = lines.join("\n");
    const result = addLineNumbers(content);
    const resultLines = result.split("\n");

    // Single-digit lines should have 2 spaces padding
    expect(resultLines[0]).toBe("  1|data-1");
    expect(resultLines[8]).toBe("  9|data-9");
    // Double-digit lines should have 1 space padding
    expect(resultLines[9]).toBe(" 10|data-10");
    expect(resultLines[98]).toBe(" 99|data-99");
    // Line 100 should have no padding
    expect(resultLines[99]).toBe("100|data-100");

    // Verify all content is extractable and unchanged
    resultLines.forEach((line, index) => {
      const pipeIndex = line.indexOf("|");
      const extractedContent = line.substring(pipeIndex + 1);
      expect(extractedContent).toBe(`data-${index + 1}`);
    });
  });

  it("should not shift content when padding is applied", () => {
    // Create content with specific characters to detect any shifting
    const lines = Array.from({ length: 11 }, () => "ABCDEFGHIJ");
    const content = lines.join("\n");
    const result = addLineNumbers(content);
    const resultLines = result.split("\n");

    // Every line's content after the pipe should be exactly "ABCDEFGHIJ"
    resultLines.forEach(line => {
      const pipeIndex = line.indexOf("|");
      const extractedContent = line.substring(pipeIndex + 1);
      expect(extractedContent).toBe("ABCDEFGHIJ");
      expect(extractedContent.length).toBe(10);
    });
  });

  it("should handle empty lines correctly with padding", () => {
    // Mix of content and empty lines with > 10 total lines
    const lines = ["first", "", "third", "", "fifth", "", "seventh", "", "ninth", "", "eleventh"];
    const content = lines.join("\n");
    const result = addLineNumbers(content);
    const resultLines = result.split("\n");

    expect(resultLines[0]).toBe(" 1|first");
    expect(resultLines[1]).toBe(" 2|");  // empty line
    expect(resultLines[2]).toBe(" 3|third");
    expect(resultLines[9]).toBe("10|");  // empty line at position 10
    expect(resultLines[10]).toBe("11|eleventh");

    // Verify empty lines remain empty after the pipe
    expect(resultLines[1].split("|")[1]).toBe("");
    expect(resultLines[9].split("|")[1]).toBe("");
  });

  it("should preserve leading spaces in content when padding line numbers", () => {
    // Content with intentional leading spaces (like code indentation)
    const lines = Array.from({ length: 12 }, (_, i) => {
      const indent = "  ".repeat(i % 3);
      return `${indent}code at level ${i % 3}`;
    });
    const content = lines.join("\n");
    const result = addLineNumbers(content);
    const resultLines = result.split("\n");

    // Verify that content leading spaces are preserved
    resultLines.forEach((line, index) => {
      const pipeIndex = line.indexOf("|");
      const extractedContent = line.substring(pipeIndex + 1);
      const expectedIndent = "  ".repeat(index % 3);
      expect(extractedContent).toBe(`${expectedIndent}code at level ${index % 3}`);
    });
  });
});
