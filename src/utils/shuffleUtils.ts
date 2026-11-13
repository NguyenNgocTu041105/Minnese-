/**
 * src/utils/shuffleUtils.ts
 *
 * Immutable, Non-Mutating Fisher-Yates (Knuth) Array Shuffle Utility
 * Requirements R5 & R7 Implementation
 */

/**
 * Shuffles an array using the non-mutating Fisher-Yates (Knuth) algorithm.
 *
 * Guarantees:
 * 1. Immutability: The source array reference and its element positions are NEVER mutated.
 *    Always returns a new array instance (`result !== array`), even for empty or single-element inputs.
 *    The input type is `readonly T[]` to enforce immutability at compile time.
 * 2. Multiset Equality: The returned array contains the exact same elements with identical counts.
 * 3. Uniform Randomness: Every permutation of length N has an equal probability of 1/N!.
 * 4. Boundary Safety: Handles empty arrays `[]`, single-element arrays `[x]`, and null/undefined safely.
 * 5. Testability: Accepts an optional custom random number generator `rng` (defaulting to `Math.random`)
 *    allowing deterministic unit testing with seeded pseudo-random generators or fixed sequences.
 *
 * Time Complexity: O(N) linear time
 * Space Complexity: O(N) auxiliary space (single cloned array)
 *
 * @param array The input array (readonly)
 * @param rng Optional custom RNG function returning a float in [0, 1)
 * @returns A new shuffled array containing all elements of the input array
 */
export function shuffleArray<T>(
  array: readonly T[],
  rng: () => number = Math.random
): T[] {
  if (!array || array.length <= 1) {
    return array ? [...array] : [];
  }

  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    // Pick random index j in [0, i] (inclusive), clamped to prevent out-of-bounds corruption if rng() === 1.0
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }

  return result;
}
