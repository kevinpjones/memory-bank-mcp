import { describe, expect, it } from "vitest";
import {
  normalizeLineEndings,
  normalizeForComparison,
} from "../../../src/data/helpers/content-normalizer.js";

describe("Content Normalizer", () => {
  describe("normalizeLineEndings", () => {
    describe("Basic Line Ending Conversion", () => {
      it("should convert CRLF (Windows) to LF", () => {
        const input = "line1\r\nline2\r\nline3";
        const expected = "line1\nline2\nline3";
        expect(normalizeLineEndings(input)).toBe(expected);
      });

      it("should convert CR (old Mac) to LF", () => {
        const input = "line1\rline2\rline3";
        const expected = "line1\nline2\nline3";
        expect(normalizeLineEndings(input)).toBe(expected);
      });

      it("should preserve LF (Unix) unchanged", () => {
        const input = "line1\nline2\nline3";
        expect(normalizeLineEndings(input)).toBe(input);
      });

      it("should handle mixed line endings", () => {
        const input = "line1\r\nline2\rline3\nline4";
        const expected = "line1\nline2\nline3\nline4";
        expect(normalizeLineEndings(input)).toBe(expected);
      });
    });

    describe("Edge Cases", () => {
      it("should handle empty string", () => {
        expect(normalizeLineEndings("")).toBe("");
      });

      it("should handle null-like empty value", () => {
        expect(normalizeLineEndings("")).toBe("");
      });

      it("should handle single line without line endings", () => {
        const input = "single line";
        expect(normalizeLineEndings(input)).toBe(input);
      });

      it("should handle content with only CRLF", () => {
        expect(normalizeLineEndings("\r\n")).toBe("\n");
      });

      it("should handle content with only CR", () => {
        expect(normalizeLineEndings("\r")).toBe("\n");
      });

      it("should handle content with only LF", () => {
        expect(normalizeLineEndings("\n")).toBe("\n");
      });

      it("should handle multiple consecutive CRLF", () => {
        const input = "line1\r\n\r\n\r\nline2";
        const expected = "line1\n\n\nline2";
        expect(normalizeLineEndings(input)).toBe(expected);
      });

      it("should handle multiple consecutive CR", () => {
        const input = "line1\r\r\rline2";
        const expected = "line1\n\n\nline2";
        expect(normalizeLineEndings(input)).toBe(expected);
      });

      it("should handle trailing CRLF", () => {
        const input = "line1\r\nline2\r\n";
        const expected = "line1\nline2\n";
        expect(normalizeLineEndings(input)).toBe(expected);
      });

      it("should handle trailing CR", () => {
        const input = "line1\rline2\r";
        const expected = "line1\nline2\n";
        expect(normalizeLineEndings(input)).toBe(expected);
      });
    });

    describe("Content Preservation", () => {
      it("should preserve whitespace in lines", () => {
        const input = "  indented\r\n\ttabbed\r\n  trailing spaces  ";
        const expected = "  indented\n\ttabbed\n  trailing spaces  ";
        expect(normalizeLineEndings(input)).toBe(expected);
      });

      it("should preserve special characters", () => {
        const input = "line with $pecial ch@rs!\r\nand `backticks`\r\nand \"quotes\"";
        const expected = "line with $pecial ch@rs!\nand `backticks`\nand \"quotes\"";
        expect(normalizeLineEndings(input)).toBe(expected);
      });

      it("should preserve unicode characters", () => {
        const input = "Hello 世界\r\nПривет мир\r\n🎉 emoji";
        const expected = "Hello 世界\nПривет мир\n🎉 emoji";
        expect(normalizeLineEndings(input)).toBe(expected);
      });

      it("should preserve empty lines between content", () => {
        const input = "line1\r\n\r\nline3\r\n\r\n\r\nline6";
        const expected = "line1\n\nline3\n\n\nline6";
        expect(normalizeLineEndings(input)).toBe(expected);
      });
    });
  });

  describe("normalizeForComparison", () => {
    describe("Line Ending Normalization", () => {
      it("should normalize CRLF and trim trailing newline", () => {
        const input = "line1\r\nline2\r\n";
        const expected = "line1\nline2";
        expect(normalizeForComparison(input)).toBe(expected);
      });

      it("should normalize CR and trim trailing newline", () => {
        const input = "line1\rline2\r";
        const expected = "line1\nline2";
        expect(normalizeForComparison(input)).toBe(expected);
      });

      it("should normalize LF and trim trailing newline", () => {
        const input = "line1\nline2\n";
        const expected = "line1\nline2";
        expect(normalizeForComparison(input)).toBe(expected);
      });

      it("should normalize mixed line endings", () => {
        const input = "line1\r\nline2\rline3\n";
        const expected = "line1\nline2\nline3";
        expect(normalizeForComparison(input)).toBe(expected);
      });
    });

    describe("Trailing Newline Handling", () => {
      it("should trim single trailing newline by default", () => {
        const input = "content\n";
        expect(normalizeForComparison(input)).toBe("content");
      });

      it("should not trim trailing newline when disabled", () => {
        const input = "content\n";
        expect(normalizeForComparison(input, false)).toBe("content\n");
      });

      it("should only trim one trailing newline, preserving empty lines", () => {
        const input = "content\n\n";
        expect(normalizeForComparison(input)).toBe("content\n");
      });

      it("should handle content without trailing newline", () => {
        const input = "content";
        expect(normalizeForComparison(input)).toBe("content");
      });

      it("should handle content with trailing CRLF", () => {
        const input = "content\r\n";
        expect(normalizeForComparison(input)).toBe("content");
      });
    });

    describe("Edge Cases", () => {
      it("should handle empty string", () => {
        expect(normalizeForComparison("")).toBe("");
      });

      it("should handle single newline", () => {
        expect(normalizeForComparison("\n")).toBe("");
      });

      it("should handle single CRLF", () => {
        expect(normalizeForComparison("\r\n")).toBe("");
      });

      it("should handle multiple empty lines", () => {
        const input = "\n\n\n";
        expect(normalizeForComparison(input)).toBe("\n\n");
      });
    });

    describe("Comparison Scenarios", () => {
      it("should make CRLF and LF versions equal", () => {
        const crlfContent = "line1\r\nline2\r\nline3";
        const lfContent = "line1\nline2\nline3";
        expect(normalizeForComparison(crlfContent)).toBe(
          normalizeForComparison(lfContent)
        );
      });

      it("should make content with and without trailing newline equal", () => {
        const withNewline = "content\n";
        const withoutNewline = "content";
        expect(normalizeForComparison(withNewline)).toBe(
          normalizeForComparison(withoutNewline)
        );
      });

      it("should make CRLF with trailing and LF without trailing equal", () => {
        const crlfWithTrailing = "line1\r\nline2\r\n";
        const lfWithoutTrailing = "line1\nline2";
        expect(normalizeForComparison(crlfWithTrailing)).toBe(
          normalizeForComparison(lfWithoutTrailing)
        );
      });

      it("should distinguish content with different line counts", () => {
        const twoLines = "line1\nline2";
        const threeLines = "line1\nline2\nline3";
        expect(normalizeForComparison(twoLines)).not.toBe(
          normalizeForComparison(threeLines)
        );
      });

      it("should distinguish content with different text", () => {
        const content1 = "hello\nworld";
        const content2 = "hello\nearth";
        expect(normalizeForComparison(content1)).not.toBe(
          normalizeForComparison(content2)
        );
      });

      it("should distinguish content with whitespace differences", () => {
        const content1 = "line 1\nline 2";
        const content2 = "line1\nline2";
        expect(normalizeForComparison(content1)).not.toBe(
          normalizeForComparison(content2)
        );
      });
    });
  });
});
