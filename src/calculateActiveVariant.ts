// import crc32 from 'fbjs/lib/crc32'; // Remove this import
import emitter from './emitter';
import store from './store';

// Simple hash function (djb2 variation)
function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) + hash + char; /* hash * 33 + char */
  }
  return hash;
}

// Generate a consistent identifier for the current session if none is provided
function getSessionIdentifier(): string {
  // Check if we're in the browser environment
  if (typeof window !== 'undefined') {
    // Get or create a session identifier from localStorage
    let sessionId = localStorage.getItem('PUSHTELL-SESSION-ID');
    if (!sessionId) {
      // Create a new random session ID if none exists
      sessionId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('PUSHTELL-SESSION-ID', sessionId);
    }
    return sessionId;
  }

  // For server-side rendering, use a fixed seed for initial render
  // This will be replaced by the real sessionId on the client
  return 'server-render-seed';
}

const calculateVariant = (
  experimentName: string,
  userIdentifier?: string
): string => {
  /*
    Choosing a weighted variant:
      For C, A, B with weights 2, 4, 8

      variants = A, B, C
      weights = 4, 8, 2
      weightSum = 14
      weightedIndex = 9

      AAAABBBBBBBBCC
      ========^
      Select B
  */

  // Sorted array of the variant names, example: ["A", "B", "C"]
  const variants = emitter.getSortedVariants(experimentName);
  // Array of the variant weights, also sorted by variant name. For example, if
  // variant C had weight 2, variant A had weight 4, and variant B had weight 8
  // return [4, 8, 2] to correspond with ["A", "B", "C"]
  const weights = emitter.getSortedVariantWeights(experimentName);
  // Sum the weights
  const weightSum = weights.reduce((a: number, b: number): number => {
    return a + b;
  }, 0);

  // Use the provided userIdentifier or generate a consistent session identifier
  const identifier = userIdentifier || getSessionIdentifier();

  // A consistent value based on the identifier
  const weightedIndex = Math.abs(
    simpleHash(identifier + experimentName) % weightSum
  );

  // Iterate through the sorted weights, and deduct each from the weightedIndex.
  // If weightedIndex drops < 0, select the variant. If weightedIndex does not
  // drop < 0, default to the last variant in the array that is initially assigned.
  let selectedVariant = variants[variants.length - 1];
  let remainingWeight = weightedIndex;

  for (let index = 0; index < weights.length; index++) {
    remainingWeight -= weights[index];
    if (remainingWeight < 0) {
      selectedVariant = variants[index];
      break;
    }
  }

  emitter.setActiveVariant(experimentName, selectedVariant);
  return selectedVariant;
};

export default (
  experimentName: string,
  userIdentifier?: string,
  defaultVariantName?: string
): string => {
  if (typeof userIdentifier === 'string') {
    return calculateVariant(experimentName, userIdentifier);
  }
  // Check if there's already an active variant for this experiment
  const activeVariant = emitter.getActiveVariant(experimentName);
  if (activeVariant) {
    // Return the existing active variant if one exists
    return activeVariant;
  }
  const storedValue = store.getItem('PUSHTELL-' + experimentName);
  if (storedValue) {
    emitter.setActiveVariant(experimentName, storedValue, true);
    return storedValue;
  }
  if (defaultVariantName) {
    emitter.setActiveVariant(experimentName, defaultVariantName);
    return defaultVariantName;
  }
  return calculateVariant(experimentName);
};
