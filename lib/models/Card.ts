
export type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export const ALL_SUITS: Suit[] = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
export const ALL_RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export function createCard(suit: Suit, rank: Rank): Card {
  return {
    id: `${suit}-${rank}-${Math.random().toString(36).substr(2, 9)}`,
    suit,
    rank,
  };
}

export function getCardImageName(card: Card): string {
  return `card${card.suit}${card.rank}`;
}

export function getSuitSymbol(suit: Suit): string {
  switch (suit) {
    case 'Hearts': return '♥';
    case 'Diamonds': return '♦';
    case 'Clubs': return '♣';
    case 'Spades': return '♠';
  }
}

export function getRankDisplay(rank: Rank): string {
  return rank;
}

export function rankToValue(rank: Rank): number {
  switch (rank) {
    case '2': return 2;
    case '3': return 3;
    case '4': return 4;
    case '5': return 5;
    case '6': return 6;
    case '7': return 7;
    case '8': return 8;
    case '9': return 9;
    case '10': return 10;
    case 'J': return 11;
    case 'Q': return 12;
    case 'K': return 13;
    case 'A': return 14;
  }
}

export function rankToLowValue(rank: Rank): number {
  if (rank === 'A') return 1;
  return rankToValue(rank);
}
