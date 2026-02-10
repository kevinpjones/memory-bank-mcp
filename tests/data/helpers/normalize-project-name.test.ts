import { describe, expect, it } from "vitest";
import { normalizeProjectName } from "../../../src/data/helpers/normalize-project-name.js";

describe("normalizeProjectName", () => {
  describe("basic normalization", () => {
    it("should convert spaces to hyphens", () => {
      expect(normalizeProjectName("My Cool Project")).toBe("my-cool-project");
    });

    it("should convert to lowercase", () => {
      expect(normalizeProjectName("MyProject")).toBe("myproject");
    });

    it("should trim whitespace", () => {
      expect(normalizeProjectName("  my-project  ")).toBe("my-project");
    });

    it("should convert underscores to hyphens", () => {
      expect(normalizeProjectName("my_cool_project")).toBe("my-cool-project");
    });

    it("should keep existing hyphens", () => {
      expect(normalizeProjectName("my-project")).toBe("my-project");
    });

    it("should keep dots", () => {
      expect(normalizeProjectName("my.project")).toBe("my.project");
    });

    it("should keep numbers", () => {
      expect(normalizeProjectName("project-123")).toBe("project-123");
    });

    it("should pass through already-normalized names unchanged", () => {
      expect(normalizeProjectName("my-cool-project")).toBe("my-cool-project");
    });
  });

  describe("special characters", () => {
    it("should remove exclamation marks", () => {
      expect(normalizeProjectName("My Project!")).toBe("my-project");
    });

    it("should remove at signs", () => {
      expect(normalizeProjectName("my@project")).toBe("myproject");
    });

    it("should remove hash symbols", () => {
      expect(normalizeProjectName("project#1")).toBe("project1");
    });

    it("should remove dollar signs", () => {
      expect(normalizeProjectName("$project")).toBe("project");
    });

    it("should remove percent signs", () => {
      expect(normalizeProjectName("100% project")).toBe("100-project");
    });

    it("should remove ampersands", () => {
      expect(normalizeProjectName("cats & dogs")).toBe("cats-dogs");
    });

    it("should remove parentheses", () => {
      expect(normalizeProjectName("project (v2)")).toBe("project-v2");
    });

    it("should remove colons", () => {
      expect(normalizeProjectName("project: the sequel")).toBe(
        "project-the-sequel"
      );
    });

    it("should remove forward slashes", () => {
      expect(normalizeProjectName("frontend/backend")).toBe(
        "frontendbackend"
      );
    });

    it("should remove backslashes", () => {
      expect(normalizeProjectName("front\\back")).toBe("frontback");
    });

    it("should handle mixed special characters", () => {
      expect(normalizeProjectName("My (Cool) Project! #1")).toBe(
        "my-cool-project-1"
      );
    });
  });

  describe("unicode/international characters", () => {
    it("should transliterate German umlauts", () => {
      expect(normalizeProjectName("Über Projekt")).toBe("ueber-projekt");
    });

    it("should transliterate French accents", () => {
      expect(normalizeProjectName("café résumé")).toBe("cafe-resume");
    });

    it("should transliterate Spanish ñ", () => {
      expect(normalizeProjectName("España")).toBe("espana");
    });

    it("should transliterate Nordic characters", () => {
      expect(normalizeProjectName("smörgåsbord")).toBe("smoergasbord");
    });

    it("should transliterate German ß", () => {
      expect(normalizeProjectName("Straße")).toBe("strasse");
    });

    it("should strip non-transliterable unicode characters", () => {
      expect(normalizeProjectName("项目 project")).toBe("project");
    });

    it("should handle emoji by stripping them", () => {
      expect(normalizeProjectName("🚀 My Project")).toBe("my-project");
    });
  });

  describe("consecutive separators", () => {
    it("should collapse multiple spaces into single hyphen", () => {
      expect(normalizeProjectName("my   project")).toBe("my-project");
    });

    it("should collapse multiple hyphens into one", () => {
      expect(normalizeProjectName("my---project")).toBe("my-project");
    });

    it("should collapse multiple dots into one", () => {
      expect(normalizeProjectName("my...project")).toBe("my.project");
    });

    it("should collapse hyphens resulting from special char removal", () => {
      expect(normalizeProjectName("a - - b")).toBe("a-b");
    });
  });

  describe("leading/trailing cleanup", () => {
    it("should remove leading hyphens", () => {
      expect(normalizeProjectName("-my-project")).toBe("my-project");
    });

    it("should remove trailing hyphens", () => {
      expect(normalizeProjectName("my-project-")).toBe("my-project");
    });

    it("should remove leading dots", () => {
      expect(normalizeProjectName(".my-project")).toBe("my-project");
    });

    it("should remove trailing dots", () => {
      expect(normalizeProjectName("my-project.")).toBe("my-project");
    });

    it("should remove multiple leading hyphens and dots", () => {
      expect(normalizeProjectName("--..my-project")).toBe("my-project");
    });

    it("should remove multiple trailing hyphens and dots", () => {
      expect(normalizeProjectName("my-project.-.-")).toBe("my-project");
    });

    it("should handle alternating leading special chars like -.foo", () => {
      expect(normalizeProjectName("-.foo")).toBe("foo");
    });
  });

  describe("length constraints", () => {
    it("should truncate names exceeding max length", () => {
      const longName = "a".repeat(300);
      const result = normalizeProjectName(longName);
      expect(result.length).toBeLessThanOrEqual(200);
    });

    it("should clean trailing hyphens after truncation", () => {
      // Create a name that will have a hyphen right at the truncation point
      const name = "a".repeat(199) + "-b";
      const result = normalizeProjectName(name);
      expect(result).not.toMatch(/[-.]$/);
    });
  });

  describe("error cases", () => {
    it("should throw on empty string", () => {
      expect(() => normalizeProjectName("")).toThrow(
        "Project name cannot be empty"
      );
    });

    it("should throw on whitespace-only string", () => {
      expect(() => normalizeProjectName("   ")).toThrow(
        "Project name cannot be empty"
      );
    });

    it("should throw when name normalizes to empty string", () => {
      expect(() => normalizeProjectName("!!!")).toThrow(
        'Project name "!!!" cannot be normalized to a valid directory name'
      );
    });

    it("should throw when name is only special characters", () => {
      expect(() => normalizeProjectName("@#$%^&")).toThrow(
        "cannot be normalized"
      );
    });

    it("should throw when name is only unicode with no transliteration", () => {
      expect(() => normalizeProjectName("中文项目")).toThrow(
        "cannot be normalized"
      );
    });
  });

  describe("real-world project names", () => {
    it("should handle typical project names with spaces", () => {
      expect(normalizeProjectName("My Memory Bank")).toBe("my-memory-bank");
    });

    it("should handle names with version numbers", () => {
      expect(normalizeProjectName("Project v2.0")).toBe("project-v2.0");
    });

    it("should handle names with organization prefixes", () => {
      expect(normalizeProjectName("Acme Corp - Widget Builder")).toBe(
        "acme-corp-widget-builder"
      );
    });

    it("should handle camelCase names", () => {
      expect(normalizeProjectName("myProject")).toBe("myproject");
    });

    it("should handle names that are already filesystem-safe", () => {
      expect(normalizeProjectName("already-safe-name")).toBe(
        "already-safe-name"
      );
    });

    it("should handle single character names", () => {
      expect(normalizeProjectName("a")).toBe("a");
    });

    it("should handle numeric names", () => {
      expect(normalizeProjectName("12345")).toBe("12345");
    });
  });
});
