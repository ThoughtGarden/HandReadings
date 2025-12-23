// Poker hand types matching Swift implementation

import { Card } from '../models/Card';

export enum HandRank {
  HighCard = 0,
  OnePair = 1,
  TwoPair = 2,
  ThreeOfAKind = 3,
  Straight = 4,
  Flush = 5,
  FullHouse = 6,
  FourOfAKind = 7,
  StraightFlush = 8,
  RoyalFlush = 9,
}

export function handRankToString(rank: HandRank): string {
  switch (rank) {
    case HandRank.HighCard: return 'High Card';
    case HandRank.OnePair: return 'One Pair';
    case HandRank.TwoPair: return 'Two Pair';
    case HandRank.ThreeOfAKind: return 'Three of a Kind';
    case HandRank.Straight: return 'Straight';
    case HandRank.Flush: return 'Flush';
    case HandRank.FullHouse: return 'Full House';
    case HandRank.FourOfAKind: return 'Four of a Kind';
    case HandRank.StraightFlush: return 'Straight Flush';
    case HandRank.RoyalFlush: return 'Royal Flush';
  }
}

export interface HandEvaluation {
  bestHighHand: Card[];
  bestHighRank: HandRank;
  bestLowHand: Card[] | null;
}

export interface PlayerHand {
  id: string;
  cards: Card[];
}

export function createPlayerHand(cards: Card[]): PlayerHand {
  return {
    id: Math.random().toString(36).substr(2, 9),
    cards,
  };
}

export type HandAnswer = 'hi' | 'low';

export type RoundStatus = 'incomplete' | 'correct' | 'failed';

export type RevealStage = 'ready' | 'flop' | 'turn' | 'river' | 'fullGame';

export interface RoundResult {
  isCorrect: boolean;
  timeTaken: number;
  date: string;
}
