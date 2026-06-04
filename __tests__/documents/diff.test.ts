// ── Document Diff Utility Tests ────────────────────────────────────
// Tests the computeDiff function for section-level and word-level diffs.

import { computeDiff } from "@/lib/documents/diff";

describe("Document Diff — computeDiff", () => {
  describe("identical documents", () => {
    it("returns all sections unchanged when documents are identical", () => {
      const data1 = { clause_1: "Hello world", clause_2: "Second clause" };
      const result = computeDiff(data1, { ...data1 });

      expect(result.sections).toHaveLength(2);
      expect(result.sections.every((s) => s.status === "unchanged")).toBe(
        true
      );
      expect(result.totalChanges).toBe(0);
      expect(result.sectionsChanged).toBe(0);
    });

    it("handles empty objects", () => {
      const result = computeDiff({}, {});
      expect(result.sections).toHaveLength(0);
      expect(result.totalChanges).toBe(0);
    });
  });

  describe("added sections", () => {
    it("detects new sections added in v2", () => {
      const v1 = { clause_1: "Original" };
      const v2 = { clause_1: "Original", clause_2: "New clause" };
      const result = computeDiff(v1, v2);

      const added = result.sections.find((s) => s.key === "clause_2");
      expect(added?.status).toBe("added");
      expect(added?.v1Value).toBeNull();
      expect(added?.v2Value).toBe("New clause");
      expect(result.totalChanges).toBe(1);
      expect(result.sectionsChanged).toBe(1);
    });
  });

  describe("removed sections", () => {
    it("detects sections removed in v2", () => {
      const v1 = { clause_1: "Original", clause_2: "Will disappear" };
      const v2 = { clause_1: "Original" };
      const result = computeDiff(v1, v2);

      const removed = result.sections.find((s) => s.key === "clause_2");
      expect(removed?.status).toBe("removed");
      expect(removed?.v1Value).toBe("Will disappear");
      expect(removed?.v2Value).toBeNull();
      expect(result.totalChanges).toBe(1);
    });
  });

  describe("modified sections", () => {
    it("detects modified text and provides word diff", () => {
      const v1 = { clause_1: "The quick brown fox" };
      const v2 = { clause_1: "The slow brown fox" };
      const result = computeDiff(v1, v2);

      const modified = result.sections.find((s) => s.key === "clause_1");
      expect(modified?.status).toBe("modified");
      expect(modified?.v1Value).toBe("The quick brown fox");
      expect(modified?.v2Value).toBe("The slow brown fox");
      expect(modified?.wordDiff).toBeDefined();
      expect(result.sectionsChanged).toBe(1);
    });

    it("produces word diff with insert and delete segments", () => {
      const v1 = { text: "quick brown fox" };
      const v2 = { text: "slow brown fox and hound" };
      const result = computeDiff(v1, v2);

      const m = result.sections[0];
      expect(m.status).toBe("modified");
      expect(m.wordDiff).toBeDefined();
      expect(m.wordDiff!.some((seg) => seg.type === "delete")).toBe(true);
      expect(m.wordDiff!.some((seg) => seg.type === "insert")).toBe(true);
      expect(m.wordDiff!.some((seg) => seg.type === "same")).toBe(true);
    });

    it("handles completely different text", () => {
      const v1 = { clause: "Original totally different content here" };
      const v2 = { clause: "Brand new rewritten content" };
      const result = computeDiff(v1, v2);

      expect(result.sections[0].status).toBe("modified");
      expect(result.sectionsChanged).toBe(1);
    });
  });

  describe("nested document structures", () => {
    it("flattens nested objects into dot-separated keys", () => {
      const v1 = {
        party_a: { name: "Alice", role: "Employee" },
        party_b: { name: "Bob", role: "Employer" },
      };
      const v2 = {
        party_a: { name: "Alice", role: "Director" },
        party_b: { name: "Bob", role: "Employer" },
      };
      const result = computeDiff(v1, v2);

      // Should have 4 flattened keys
      expect(result.sections.length).toBeGreaterThanOrEqual(4);
      const changedRole = result.sections.find(
        (s) => s.key === "party_a.role"
      );
      expect(changedRole?.status).toBe("modified");
      expect(changedRole?.v1Value).toBe("Employee");
      expect(changedRole?.v2Value).toBe("Director");
    });
  });

  describe("mixed changes", () => {
    it("correctly counts multiple changes of different types", () => {
      const v1 = {
        clause_1: "Unchanged text",
        clause_2: "Removed text",
        clause_3: "Modified here",
      };
      const v2 = {
        clause_1: "Unchanged text",
        clause_3: "Modified there",
        clause_4: "Brand new",
      };
      const result = computeDiff(v1, v2);

      expect(result.sections).toHaveLength(4);
      expect(result.sectionsChanged).toBe(3); // removed, modified, added
      expect(result.totalChanges).toBe(3);

      const removed = result.sections.find((s) => s.key === "clause_2");
      expect(removed?.status).toBe("removed");

      const added = result.sections.find((s) => s.key === "clause_4");
      expect(added?.status).toBe("added");

      const modified = result.sections.find((s) => s.key === "clause_3");
      expect(modified?.status).toBe("modified");

      const unchanged = result.sections.find((s) => s.key === "clause_1");
      expect(unchanged?.status).toBe("unchanged");
    });
  });
});