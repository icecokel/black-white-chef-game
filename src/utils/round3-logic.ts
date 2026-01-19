export interface CalculateRevealOrderResult {
  revealOrder: number[];
  phase1Count: number;
  blackCount: number;
  whiteCount: number;
}

/**
 * Calculates the order in which judge votes should be revealed.
 * Phase 1: Reveal votes one by one until the tie point (min votes * 2).
 *          Votes in this phase are perfectly balanced (1:1 ratio).
 * Phase 2: Burst reveal for the remaining votes (winner's surplus).
 *
 * @param votes Array of vote preferences ("BLACK", "WHITE", or undefined/null)
 * @returns Object containing the reveal order indices and stats
 */
export function calculateRevealOrder(
  votes: ("BLACK" | "WHITE" | undefined | null)[],
): CalculateRevealOrderResult {
  const blackIndices: number[] = [];
  const whiteIndices: number[] = [];
  const otherIndices: number[] = [];

  // 1. Categorize indices
  votes.forEach((vote, index) => {
    if (vote === "BLACK") {
      blackIndices.push(index);
    } else if (vote === "WHITE") {
      whiteIndices.push(index);
    } else {
      otherIndices.push(index);
    }
  });

  const blackCount = blackIndices.length;
  const whiteCount = whiteIndices.length;
  const tieCount = Math.min(blackCount, whiteCount);
  const phase1Count = tieCount * 2;

  // 2. Shuffle Helper
  const shuffleArray = (arr: number[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };

  // 3. Create Reveal Order

  // Phase 1: Tie Sequence (Balanced Shuffle)
  // We need exactly 'tieCount' from Black and 'tieCount' from White.
  // First, shuffle the source arrays to pick random candidates.
  shuffleArray(blackIndices);
  shuffleArray(whiteIndices);

  const p1Black = blackIndices.slice(0, tieCount);
  const p1White = whiteIndices.slice(0, tieCount);
  const p1Mixed = [...p1Black, ...p1White];
  shuffleArray(p1Mixed); // Mix them up so it's not BBB...WWW...

  // Phase 2: Burst Sequence (Remaining)
  const p2Black = blackIndices.slice(tieCount);
  const p2White = whiteIndices.slice(tieCount);
  const p2Mixed = [...p2Black, ...p2White, ...otherIndices];
  shuffleArray(p2Mixed);

  // Combine
  const revealOrder = [...p1Mixed, ...p2Mixed];

  return {
    revealOrder,
    phase1Count,
    blackCount,
    whiteCount,
  };
}
