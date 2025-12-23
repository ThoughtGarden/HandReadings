
import { Card, Suit, Rank, ALL_SUITS, ALL_RANKS, createCard } from './Card';

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.cards = [];
    for (const suit of ALL_SUITS) {
      for (const rank of ALL_RANKS) {
        this.cards.push(createCard(suit, rank));
      }
    }
    this.shuffle();
  }

  shuffle(): void {
    // Fisher-Yates shuffle
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  dealCards(count: number): Card[] {
    if (this.cards.length < count) {
      return [];
    }
    const dealt = this.cards.slice(0, count);
    this.cards = this.cards.slice(count);
    return dealt;
  }

  removeCard(card: Card): void {
    // Remove card by matching rank and suit (since IDs are unique per instance)
    this.cards = this.cards.filter(
      (c) => !(c.rank === card.rank && c.suit === card.suit)
    );
  }

  get isEmpty(): boolean {
    return this.cards.length < 3;
  }

  get remainingCount(): number {
    return this.cards.length;
  }
}
