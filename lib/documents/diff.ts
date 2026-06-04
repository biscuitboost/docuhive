/**
 * Document Version Diff Utility
 * Computes section-level and word-level diffs between two version snapshots.
 */

export type DiffStatus = "unchanged" | "added" | "removed" | "modified";

export interface WordDiffSegment {
  text: string;
  type: "same" | "insert" | "delete";
}

export interface SectionDiff {
  key: string;
  status: DiffStatus;
  v1Value: string | null;
  v2Value: string | null;
  wordDiff: WordDiffSegment[] | null;
}

export interface DiffResult {
  sections: SectionDiff[];
  totalChanges: number;
  sectionsChanged: number;
}

/**
 * Flatten a nested document output object into a flat key → string map.
 * Sections can be nested objects (e.g. { clause_1: "text", sub: { a: "b" } })
 * or flat strings. We flatten them to dot-separated keys.
 */
function flattenToKeys(data: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      result[fullKey] = value;
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenToKeys(value as Record<string, unknown>, fullKey));
    } else if (value !== null && value !== undefined) {
      result[fullKey] = String(value);
    }
  }
  return result;
}

/**
 * Longest Common Subsequence of words.
 * Returns arrays of indices that belong to the LCS.
 */
function computeLCS(wordsA: string[], wordsB: string[]): Set<number> {
  const m = wordsA.length;
  const n = wordsB.length;
  // Build LCS length table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (wordsA[i - 1] === wordsB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS indices in wordsA
  const setA = new Set<number>();
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (wordsA[i - 1] === wordsB[j - 1]) {
      setA.add(i - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return setA;
}

/**
 * Compute word-level diff segments between two text strings.
 * Returns an array of segments labelled as "same", "insert", or "delete".
 */
function computeWordDiff(textA: string, textB: string): WordDiffSegment[] {
  if (textA === textB) {
    return [{ text: textA, type: "same" }];
  }

  const wordsA = textA.split(/(\s+)/);
  const wordsB = textB.split(/(\s+)/);

  // Filter to non-whitespace tokens for LCS
  const tokensA = wordsA.filter((w) => w.trim().length > 0);
  const tokensB = wordsB.filter((w) => w.trim().length > 0);

  const lcsIndicesA = computeLCS(tokensA, tokensB);

  // Build aligned segments using indices
  const segments: WordDiffSegment[] = [];
  let idxA = 0;
  let idxB = 0;

  while (idxA < tokensA.length || idxB < tokensB.length) {
    // Collect deletions from A not in LCS
    const deleted: string[] = [];
    while (idxA < tokensA.length && !lcsIndicesA.has(idxA)) {
      deleted.push(tokensA[idxA]);
      idxA++;
    }
    if (deleted.length > 0) {
      segments.push({ text: deleted.join(" "), type: "delete" });
      // Add spacer if next token exists
      if (idxA < tokensA.length || idxB < tokensB.length) {
        segments.push({ text: " ", type: "same" });
      }
    }

    // Collect insertions from B (anything not matched in A)
    const inserted: string[] = [];
    while (
      idxB < tokensB.length &&
      (idxA >= tokensA.length || tokensA[idxA] !== tokensB[idxB])
    ) {
      inserted.push(tokensB[idxB]);
      idxB++;
    }
    if (inserted.length > 0) {
      segments.push({ text: inserted.join(" "), type: "insert" });
      if (idxA < tokensA.length || idxB < tokensB.length) {
        segments.push({ text: " ", type: "same" });
      }
    }

    // Skip matching tokens
    while (
      idxA < tokensA.length &&
      idxB < tokensB.length &&
      tokensA[idxA] === tokensB[idxB]
    ) {
      segments.push({ text: tokensA[idxA], type: "same" });
      segments.push({ text: " ", type: "same" });
      idxA++;
      idxB++;
    }
  }

  // Collapse consecutive same-type segments
  return collapseSegments(segments);
}

function collapseSegments(segments: WordDiffSegment[]): WordDiffSegment[] {
  const collapsed: WordDiffSegment[] = [];
  for (const seg of segments) {
    const last = collapsed[collapsed.length - 1];
    if (last && last.type === seg.type) {
      last.text += seg.text;
    } else {
      collapsed.push({ ...seg });
    }
  }
  return collapsed;
}

/**
 * Compare two document output snapshots and produce a full diff result.
 */
export function computeDiff(
  v1Data: Record<string, unknown>,
  v2Data: Record<string, unknown>
): DiffResult {
  const flat1 = flattenToKeys(v1Data);
  const flat2 = flattenToKeys(v2Data);

  const allKeys = new Set([...Object.keys(flat1), ...Object.keys(flat2)]);
  const sections: SectionDiff[] = [];
  let totalChanges = 0;
  let sectionsChanged = 0;

  for (const key of [...allKeys].sort()) {
    const v1Val = flat1[key] ?? null;
    const v2Val = flat2[key] ?? null;

    let status: DiffStatus;
    if (v1Val === null && v2Val !== null) {
      status = "added";
      sectionsChanged++;
      totalChanges++;
    } else if (v1Val !== null && v2Val === null) {
      status = "removed";
      sectionsChanged++;
      totalChanges++;
    } else if (v1Val !== v2Val) {
      status = "modified";
      sectionsChanged++;
      totalChanges++;
    } else {
      status = "unchanged";
    }

    const wordDiff =
      status === "modified" && v1Val !== null && v2Val !== null
        ? computeWordDiff(v1Val, v2Val)
        : null;

    sections.push({ key, status, v1Value: v1Val, v2Value: v2Val, wordDiff });
  }

  return { sections, totalChanges, sectionsChanged };
}