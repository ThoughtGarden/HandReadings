// Hand evaluation logic matching Swift implementation

import { Card, Rank, Suit, rankToValue, rankToLowValue, getSuitSymbol, getRankDisplay } from '../models/Card';
import { HandRank, HandEvaluation } from './types';

// Helper function to generate combinations
export function combinations<T>(items: T[], k: number): T[][] {
  if (k <= 0) return [[]];
  if (k > items.length) return [];
  if (k === items.length) return [items];

  const result: T[][] = [];

  for (let i = 0; i <= items.length - k; i++) {
    const head = items[i];
    const tail = items.slice(i + 1);
    const subcombos = combinations(tail, k - 1);

    for (const subcombo of subcombos) {
      result.push([head, ...subcombo]);
    }
  }

  return result;
}

// Check if a 5-card hand is a qualifying low (8 or better)
export function isQualifyingLow(fiveCards: Card[]): boolean {
  // All 5 cards must be 8 or lower
  const lowCards = fiveCards.filter((card) => rankToLowValue(card.rank) <= 8);

  if (lowCards.length !== 5) {
    return false;
  }

  // All 5 cards must be unique ranks
  const ranks = new Set(fiveCards.map((card) => card.rank));
  return ranks.size === 5;
}

// Compare two low hands
// Returns: -1 if hand1 is better (lower), 0 if equal, 1 if hand2 is better
export function compareLowHands(hand1: Card[], hand2: Card[]): number {
  // Get card values sorted from high to low
  const values1 = hand1.map((card) => rankToLowValue(card.rank)).sort((a, b) => b - a);
  const values2 = hand2.map((card) => rankToLowValue(card.rank)).sort((a, b) => b - a);

  // Compare from highest card to lowest
  for (let i = 0; i < 5; i++) {
    if (values1[i] < values2[i]) {
      return -1; // hand1 is better (lower)
    } else if (values1[i] > values2[i]) {
      return 1; // hand2 is better (lower)
    }
  }

  return 0; // Equal hands
}

// Check if two low hands are equal
export function areLowHandsEqual(hand1: Card[], hand2: Card[]): boolean {
  return compareLowHands(hand1, hand2) === 0;
}

// Check for straight
function checkStraight(ranks: Rank[]): boolean {
  // Convert ranks to numerical values for comparison
  let values = ranks.map(rankToValue).sort((a, b) => a - b);

  // Check for regular straight (5 consecutive values)
  let isConsecutive = true;
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i + 1] - values[i] !== 1) {
      isConsecutive = false;
      break;
    }
  }

  if (isConsecutive) {
    return true;
  }

  // Check for wheel (A-2-3-4-5)
  // In this case, Ace (14) should be treated as 1
  if (values.includes(14)) {
    // Has Ace
    const wheelValues = values.map((v) => (v === 14 ? 1 : v)).sort((a, b) => a - b);
    isConsecutive = true;
    for (let i = 0; i < wheelValues.length - 1; i++) {
      if (wheelValues[i + 1] - wheelValues[i] !== 1) {
        isConsecutive = false;
        break;
      }
    }
    if (isConsecutive && JSON.stringify(wheelValues) === JSON.stringify([1, 2, 3, 4, 5])) {
      return true;
    }
  }

  return false;
}

// Check for royal flush
function isRoyalFlush(ranks: Rank[]): boolean {
  const royalRanks = new Set<Rank>(['A', 'K', 'Q', 'J', '10']);
  const handRanks = new Set(ranks);
  if (handRanks.size !== royalRanks.size) return false;
  for (const rank of royalRanks) {
    if (!handRanks.has(rank)) return false;
  }
  return true;
}

// Evaluate a 5-card hand
export function evaluateHand(cards: Card[]): HandRank {
  const ranks = cards.map((card) => card.rank);
  const suits = cards.map((card) => card.suit);

  // Check for flush
  const isFlush = new Set(suits).size === 1;

  // Check for straight
  const isStraight = checkStraight(ranks);

  // Check for pairs, trips, etc.
  const rankCounts: Record<string, number> = {};
  for (const rank of ranks) {
    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
  }
  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  // Royal Flush: A-K-Q-J-10 all same suit
  if (isFlush && isStraight && isRoyalFlush(ranks)) {
    return HandRank.RoyalFlush;
  }

  // Straight Flush
  if (isFlush && isStraight) {
    return HandRank.StraightFlush;
  }

  // Four of a Kind
  if (JSON.stringify(counts) === JSON.stringify([4, 1])) {
    return HandRank.FourOfAKind;
  }

  // Full House
  if (JSON.stringify(counts) === JSON.stringify([3, 2])) {
    return HandRank.FullHouse;
  }

  // Flush
  if (isFlush) {
    return HandRank.Flush;
  }

  // Straight
  if (isStraight) {
    return HandRank.Straight;
  }

  // Three of a Kind
  if (JSON.stringify(counts) === JSON.stringify([3, 1, 1])) {
    return HandRank.ThreeOfAKind;
  }

  // Two Pair
  if (JSON.stringify(counts) === JSON.stringify([2, 2, 1])) {
    return HandRank.TwoPair;
  }

  // One Pair
  if (JSON.stringify(counts) === JSON.stringify([2, 1, 1, 1])) {
    return HandRank.OnePair;
  }

  return HandRank.HighCard;
}

// Helper functions for hand description
export function getHighCard(cards: Card[]): Card {
  return cards.reduce((max, card) =>
    rankToValue(card.rank) > rankToValue(max.rank) ? card : max
  );
}

export function getStraightHighCard(cards: Card[]): Card {
  const ranks = cards.map((card) => card.rank);
  const values = ranks.map(rankToValue).sort((a, b) => a - b);

  // Check if it's a wheel (A-2-3-4-5)
  if (JSON.stringify(values) === JSON.stringify([2, 3, 4, 5, 14])) {
    // For the wheel, the high card is the 5, not the Ace
    return cards.find((card) => card.rank === '5')!;
  }

  // Otherwise, return the highest card
  return getHighCard(cards);
}

export function getRepeatedRank(cards: Card[], count: number): Rank {
  const rankCounts: Record<string, number> = {};
  for (const card of cards) {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  }
  for (const [rank, c] of Object.entries(rankCounts)) {
    if (c === count) {
      return rank as Rank;
    }
  }
  throw new Error(`No rank with count ${count} found`);
}

export function getTwoPairRanks(cards: Card[]): { high: Rank; low: Rank } {
  const rankCounts: Record<string, number> = {};
  for (const card of cards) {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  }
  const pairs = Object.entries(rankCounts)
    .filter(([_, count]) => count === 2)
    .map(([rank]) => rank as Rank)
    .sort((a, b) => rankToValue(b) - rankToValue(a));

  return { high: pairs[0], low: pairs[1] };
}

// Compare two hands with the same rank
// Returns: -1 if hand1 is better, 0 if equal, 1 if hand2 is better
export function compareHighHands(hand1: Card[], hand2: Card[], rank: HandRank): number {
  switch (rank) {
    case HandRank.RoyalFlush:
      return 0; // All royal flushes are equal

    case HandRank.StraightFlush:
    case HandRank.Straight: {
      // Compare the high card of the straight
      const high1 = getStraightHighCard(hand1);
      const high2 = getStraightHighCard(hand2);
      const val1 = rankToValue(high1.rank);
      const val2 = rankToValue(high2.rank);
      if (val1 > val2) return -1;
      if (val1 < val2) return 1;
      return 0;
    }

    case HandRank.FourOfAKind: {
      // Compare the quad rank first
      const quad1 = getRepeatedRank(hand1, 4);
      const quad2 = getRepeatedRank(hand2, 4);
      const val1 = rankToValue(quad1);
      const val2 = rankToValue(quad2);
      if (val1 > val2) return -1;
      if (val1 < val2) return 1;

      // If quads are equal, compare kicker
      const kicker1 = Math.max(
        ...hand1.filter((c) => c.rank !== quad1).map((c) => rankToValue(c.rank))
      );
      const kicker2 = Math.max(
        ...hand2.filter((c) => c.rank !== quad2).map((c) => rankToValue(c.rank))
      );
      if (kicker1 > kicker2) return -1;
      if (kicker1 < kicker2) return 1;
      return 0;
    }

    case HandRank.FullHouse: {
      // Compare the trip rank first
      const trip1 = getRepeatedRank(hand1, 3);
      const trip2 = getRepeatedRank(hand2, 3);
      const val1 = rankToValue(trip1);
      const val2 = rankToValue(trip2);
      if (val1 > val2) return -1;
      if (val1 < val2) return 1;

      // If trips are equal, compare pair
      const pair1 = getRepeatedRank(hand1, 2);
      const pair2 = getRepeatedRank(hand2, 2);
      const pairVal1 = rankToValue(pair1);
      const pairVal2 = rankToValue(pair2);
      if (pairVal1 > pairVal2) return -1;
      if (pairVal1 < pairVal2) return 1;
      return 0;
    }

    case HandRank.Flush:
    case HandRank.HighCard: {
      // Compare all cards from highest to lowest
      const values1 = hand1.map((c) => rankToValue(c.rank)).sort((a, b) => b - a);
      const values2 = hand2.map((c) => rankToValue(c.rank)).sort((a, b) => b - a);
      for (let i = 0; i < 5; i++) {
        if (values1[i] > values2[i]) return -1;
        if (values1[i] < values2[i]) return 1;
      }
      return 0;
    }

    case HandRank.ThreeOfAKind: {
      // Compare the trip rank first
      const trip1 = getRepeatedRank(hand1, 3);
      const trip2 = getRepeatedRank(hand2, 3);
      const val1 = rankToValue(trip1);
      const val2 = rankToValue(trip2);
      if (val1 > val2) return -1;
      if (val1 < val2) return 1;

      // If trips are equal, compare kickers
      const kickers1 = hand1
        .filter((c) => c.rank !== trip1)
        .map((c) => rankToValue(c.rank))
        .sort((a, b) => b - a);
      const kickers2 = hand2
        .filter((c) => c.rank !== trip2)
        .map((c) => rankToValue(c.rank))
        .sort((a, b) => b - a);
      for (let i = 0; i < kickers1.length; i++) {
        if (kickers1[i] > kickers2[i]) return -1;
        if (kickers1[i] < kickers2[i]) return 1;
      }
      return 0;
    }

    case HandRank.TwoPair: {
      // Compare high pair first
      const pairs1 = getTwoPairRanks(hand1);
      const pairs2 = getTwoPairRanks(hand2);

      const highVal1 = rankToValue(pairs1.high);
      const highVal2 = rankToValue(pairs2.high);
      if (highVal1 > highVal2) return -1;
      if (highVal1 < highVal2) return 1;

      // If high pairs equal, compare low pair
      const lowVal1 = rankToValue(pairs1.low);
      const lowVal2 = rankToValue(pairs2.low);
      if (lowVal1 > lowVal2) return -1;
      if (lowVal1 < lowVal2) return 1;

      // If both pairs equal, compare kicker
      const kicker1 = Math.max(
        ...hand1
          .filter((c) => c.rank !== pairs1.high && c.rank !== pairs1.low)
          .map((c) => rankToValue(c.rank))
      );
      const kicker2 = Math.max(
        ...hand2
          .filter((c) => c.rank !== pairs2.high && c.rank !== pairs2.low)
          .map((c) => rankToValue(c.rank))
      );
      if (kicker1 > kicker2) return -1;
      if (kicker1 < kicker2) return 1;
      return 0;
    }

    case HandRank.OnePair: {
      // Compare pair rank first
      const pair1 = getRepeatedRank(hand1, 2);
      const pair2 = getRepeatedRank(hand2, 2);
      const val1 = rankToValue(pair1);
      const val2 = rankToValue(pair2);
      if (val1 > val2) return -1;
      if (val1 < val2) return 1;

      // If pairs equal, compare kickers
      const kickers1 = hand1
        .filter((c) => c.rank !== pair1)
        .map((c) => rankToValue(c.rank))
        .sort((a, b) => b - a);
      const kickers2 = hand2
        .filter((c) => c.rank !== pair2)
        .map((c) => rankToValue(c.rank))
        .sort((a, b) => b - a);
      for (let i = 0; i < kickers1.length; i++) {
        if (kickers1[i] > kickers2[i]) return -1;
        if (kickers1[i] < kickers2[i]) return 1;
      }
      return 0;
    }

    default:
      return 0;
  }
}

// Find the best hand from hole cards and community cards
export function findBestHand(
  holeCards: Card[],
  communityCards: Card[],
  cardCount: number
): HandEvaluation {
  let bestHighRank = HandRank.HighCard;
  let bestHighHand: Card[] = [];
  let bestLowHand: Card[] | null = null;

  // Determine combination rules based on selected card count
  let allCombinations: [Card[], Card[]][] = [];

  if (cardCount === 2) {
    // 2-card game: Can use EITHER 1 or 2 hole cards
    // Try 1 hole card + 4 community cards
    const oneCardCombos = combinations(holeCards, 1);
    const fourBoardCombos = combinations(communityCards, 4);
    for (const holeCombo of oneCardCombos) {
      for (const boardCombo of fourBoardCombos) {
        allCombinations.push([holeCombo, boardCombo]);
      }
    }

    // Try 2 hole cards + 3 community cards
    const twoCardCombos = combinations(holeCards, 2);
    const threeBoardCombos = combinations(communityCards, 3);
    for (const holeCombo of twoCardCombos) {
      for (const boardCombo of threeBoardCombos) {
        allCombinations.push([holeCombo, boardCombo]);
      }
    }
  } else {
    // 4 or 5-card game (Omaha): Use exactly 2 hole cards + 3 community cards
    const holeCardCombos = combinations(holeCards, 2);
    const boardCombos = combinations(communityCards, 3);
    for (const holeCombo of holeCardCombos) {
      for (const boardCombo of boardCombos) {
        allCombinations.push([holeCombo, boardCombo]);
      }
    }
  }

  // Evaluate all combinations
  for (const [holeCombo, boardCombo] of allCombinations) {
    const fiveCardHand = [...holeCombo, ...boardCombo];

    // Evaluate high hand
    const highRank = evaluateHand(fiveCardHand);

    // Initialize bestHighHand with the first combination if it's still empty
    if (bestHighHand.length === 0) {
      bestHighHand = fiveCardHand;
      bestHighRank = highRank;
    } else if (highRank > bestHighRank) {
      bestHighRank = highRank;
      bestHighHand = fiveCardHand;
    } else if (highRank === bestHighRank) {
      // Same rank - compare kickers to find the better hand
      const comparison = compareHighHands(fiveCardHand, bestHighHand, highRank);
      if (comparison < 0) {
        // This hand is better
        bestHighHand = fiveCardHand;
      }
    }

    // Check if this combination makes a qualifying low
    if (isQualifyingLow(fiveCardHand)) {
      if (bestLowHand === null) {
        bestLowHand = fiveCardHand;
      } else {
        // Compare lows - lower is better
        if (compareLowHands(fiveCardHand, bestLowHand) < 0) {
          bestLowHand = fiveCardHand;
        }
      }
    }
  }

  return {
    bestHighHand,
    bestHighRank,
    bestLowHand,
  };
}

// Get hand description string
export function getHandDescription(
  hand: Card[],
  communityCards: Card[],
  cardCount: number
): string {
  const evaluation = findBestHand(hand, communityCards, cardCount);
  const bestHand = evaluation.bestHighHand;
  const rank = evaluation.bestHighRank;

  switch (rank) {
    case HandRank.RoyalFlush:
      return 'Royal Flush';

    case HandRank.StraightFlush: {
      const highCard = getStraightHighCard(bestHand);
      return `Straight Flush-${getRankDisplay(highCard.rank)}`;
    }

    case HandRank.FourOfAKind: {
      const quadRank = getRepeatedRank(bestHand, 4);
      return `Four of a Kind-${getRankDisplay(quadRank)}`;
    }

    case HandRank.FullHouse: {
      const tripRank = getRepeatedRank(bestHand, 3);
      const pairRank = getRepeatedRank(bestHand, 2);
      return `Full House-${getRankDisplay(tripRank)}/${getRankDisplay(pairRank)}`;
    }

    case HandRank.Flush: {
      const highCard = getHighCard(bestHand);
      const suit = getSuitSymbol(highCard.suit);
      return `Flush-${getRankDisplay(highCard.rank)}${suit}`;
    }

    case HandRank.Straight: {
      const highCard = getStraightHighCard(bestHand);
      return `Straight-${getRankDisplay(highCard.rank)}`;
    }

    case HandRank.ThreeOfAKind: {
      const tripRank = getRepeatedRank(bestHand, 3);
      const kickers = bestHand
        .filter((c) => c.rank !== tripRank)
        .map((c) => rankToValue(c.rank))
        .sort((a, b) => b - a);
      const highKicker = bestHand.find((c) => rankToValue(c.rank) === kickers[0])!;
      return `Three of a Kind-${getRankDisplay(tripRank)}/${getRankDisplay(highKicker.rank)}`;
    }

    case HandRank.TwoPair: {
      const pairs = getTwoPairRanks(bestHand);
      const kicker = Math.max(
        ...bestHand
          .filter((c) => c.rank !== pairs.high && c.rank !== pairs.low)
          .map((c) => rankToValue(c.rank))
      );
      const kickerCard = bestHand.find((c) => rankToValue(c.rank) === kicker)!;
      return `Two Pair-${getRankDisplay(pairs.high)}/${getRankDisplay(pairs.low)}-${getRankDisplay(kickerCard.rank)}`;
    }

    case HandRank.OnePair: {
      const pairRank = getRepeatedRank(bestHand, 2);
      return `Pair-${getRankDisplay(pairRank)}`;
    }

    case HandRank.HighCard: {
      const highCard = getHighCard(bestHand);
      return `High Card-${getRankDisplay(highCard.rank)}`;
    }
  }
}

// Get low hand description string
export function getLowHandDescription(
  hand: Card[],
  communityCards: Card[],
  cardCount: number
): string {
  const evaluation = findBestHand(hand, communityCards, cardCount);

  if (!evaluation.bestLowHand) {
    return 'No low';
  }

  // Get card values and sort in descending order
  const values = evaluation.bestLowHand
    .map((card) => rankToLowValue(card.rank))
    .sort((a, b) => b - a);

  // Convert to string (8-7-6-5-4 format)
  return values.map(String).join('');
}
