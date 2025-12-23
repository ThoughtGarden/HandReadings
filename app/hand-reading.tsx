// Hand Reading Screen - matching Swift HiLowView

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { Card, rankToValue } from '@/lib/models/Card';
import { Deck } from '@/lib/models/Deck';
import {
  PlayerHand,
  HandAnswer,
  RoundStatus,
  RevealStage,
  RoundResult,
  createPlayerHand,
} from '@/lib/poker/types';
import {
  findBestHand,
  compareHighHands,
  compareLowHands,
  areLowHandsEqual,
  getHandDescription,
  getLowHandDescription,
} from '@/lib/poker/HandEvaluator';
import {
  loadRoundResults,
  saveRoundResult,
  resetStats,
  getCorrectPercentage,
  getAverageCompletedTime,
  formatTime,
} from '@/lib/storage/roundResults';
import { CardView } from '@/components/game/CardView';
import { GlassyButton, ButtonColors } from '@/components/game/GlassyButton';

// Platform-specific card sizes
const isWeb = Platform.OS === 'web';
const HOLE_CARD_WIDTH = isWeb ? 70 : 50;
const HOLE_CARD_HEIGHT = isWeb ? 98 : 70;
const HOLE_CARD_OFFSET = isWeb ? 40 : 28;
const COMMUNITY_CARD_WIDTH = isWeb ? 80 : 55;
const COMMUNITY_CARD_HEIGHT = isWeb ? 112 : 77;
const STAGE_CARD_WIDTH = isWeb ? 100 : 80;
const STAGE_CARD_HEIGHT = isWeb ? 140 : 112;

const CARD_COUNT_OPTIONS = [2, 4, 5] as const;
const PLAYER_COUNT_OPTIONS = [2, 3, 4, 5, 6, 7, 8] as const;

export default function HandReadingScreen() {
  // Settings state
  const [selectedCardCount, setSelectedCardCount] = useState<2 | 4 | 5>(5);
  const [selectedPlayerCount, setSelectedPlayerCount] = useState(5);

  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [revealStage, setRevealStage] = useState<RevealStage>('ready');
  const deckRef = useRef(new Deck());
  const [hands, setHands] = useState<PlayerHand[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);

  // Selection state
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, Set<HandAnswer>>>(new Map());
  const [elevatedCards, setElevatedCards] = useState<Set<number>>(new Set());
  const [selectedCommunityCards, setSelectedCommunityCards] = useState<Set<number>>(new Set());
  const [elevatedCommunityCards, setElevatedCommunityCards] = useState<Set<number>>(new Set());
  const [selectedHoleCards, setSelectedHoleCards] = useState<Map<number, Set<number>>>(new Map());
  const [elevatedHoleCards, setElevatedHoleCards] = useState<Map<number, Set<number>>>(new Map());
  const [noLowSelected, setNoLowSelected] = useState(false);
  const [showingResults, setShowingResults] = useState(false);

  // Timer & stats state
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [currentElapsedTime, setCurrentElapsedTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [roundStatus, setRoundStatus] = useState<RoundStatus>('incomplete');
  const [hadFailureThisRound, setHadFailureThisRound] = useState(false);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);

  // Load round results on mount
  useEffect(() => {
    loadRoundResults().then(setRoundResults);
  }, []);

  // Timer effect
  useEffect(() => {
    if (!timerActive || !timerStartTime) return;

    const interval = setInterval(() => {
      setCurrentElapsedTime(
        (new Date().getTime() - timerStartTime.getTime()) / 1000
      );
    }, 100);

    return () => clearInterval(interval);
  }, [timerActive, timerStartTime]);

  const startGame = useCallback(() => {
    // Save incomplete round if timer was running
    if (timerActive && timerStartTime) {
      const elapsedTime = (new Date().getTime() - timerStartTime.getTime()) / 1000;
      const result: RoundResult = {
        isCorrect: false,
        timeTaken: elapsedTime,
        date: new Date().toISOString(),
      };
      saveRoundResult(result);
      setRoundResults((prev) => [...prev.slice(-19), result]);
    }

    // Reset deck and deal
    const deck = new Deck();
    deckRef.current = deck;

    // Deal community cards
    const newCommunityCards = deck.dealCards(5);
    setCommunityCards(newCommunityCards);

    // Deal hands
    const numberOfHands =
      selectedPlayerCount === 2
        ? 2
        : Math.floor(Math.random() * (selectedPlayerCount - 1)) + 2;
    const newHands: PlayerHand[] = [];
    for (let i = 0; i < numberOfHands; i++) {
      const cards = deck.dealCards(selectedCardCount);
      newHands.push(createPlayerHand(cards));
    }
    setHands(newHands);

    // Reset all state
    setSelectedAnswers(new Map());
    setElevatedCards(new Set());
    setSelectedCommunityCards(new Set());
    setElevatedCommunityCards(new Set());
    setSelectedHoleCards(new Map());
    setElevatedHoleCards(new Map());
    setNoLowSelected(false);
    setShowingResults(false);
    setRoundStatus('incomplete');
    setHadFailureThisRound(false);
    setRevealStage('ready');
    setTimerActive(false);
    setCurrentElapsedTime(0);
    setGameStarted(true);
  }, [selectedCardCount, selectedPlayerCount, timerActive, timerStartTime]);

  const redealHands = useCallback(() => {
    // Keep community cards, deal new hands
    const deck = new Deck();

    // Remove community cards from deck
    for (const card of communityCards) {
      deck.removeCard(card);
    }
    deckRef.current = deck;

    // Deal new hands
    const numberOfHands =
      selectedPlayerCount === 2
        ? 2
        : Math.floor(Math.random() * (selectedPlayerCount - 1)) + 2;
    const newHands: PlayerHand[] = [];
    for (let i = 0; i < numberOfHands; i++) {
      const cards = deck.dealCards(selectedCardCount);
      newHands.push(createPlayerHand(cards));
    }
    setHands(newHands);

    // Reset selection state
    setSelectedAnswers(new Map());
    setElevatedCards(new Set());
    setSelectedCommunityCards(new Set());
    setElevatedCommunityCards(new Set());
    setSelectedHoleCards(new Map());
    setElevatedHoleCards(new Map());
    setNoLowSelected(false);
    setShowingResults(false);
    setRoundStatus('incomplete');
    setHadFailureThisRound(false);

    // Restart timer
    setTimerStartTime(new Date());
    setCurrentElapsedTime(0);
    setTimerActive(true);
  }, [communityCards, selectedCardCount, selectedPlayerCount]);

  const advanceRevealStage = useCallback(() => {
    if (!gameStarted) return;

    switch (revealStage) {
      case 'ready':
        setRevealStage('flop');
        break;
      case 'flop':
        setRevealStage('turn');
        break;
      case 'turn':
        setRevealStage('river');
        break;
      case 'river':
        setRevealStage('fullGame');
        setTimerStartTime(new Date());
        setCurrentElapsedTime(0);
        setTimerActive(true);
        break;
      case 'fullGame':
        // Do nothing
        break;
    }
  }, [gameStarted, revealStage]);

  const checkAnswer = useCallback(
    (handIndex: number, answer: HandAnswer): boolean => {
      const allEvaluations = hands.map((hand) =>
        findBestHand(hand.cards, communityCards, selectedCardCount)
      );
      const currentEval = allEvaluations[handIndex];

      if (answer === 'hi') {
        // Find the best high hand
        const bestHighRank = Math.max(...allEvaluations.map((e) => e.bestHighRank));
        if (currentEval.bestHighRank !== bestHighRank) return false;

        // Get all hands with best rank
        const handsWithBestRank = allEvaluations
          .map((e, i) => ({ eval: e, index: i }))
          .filter((e) => e.eval.bestHighRank === bestHighRank);

        if (handsWithBestRank.length === 1) return true;

        // Find actual winner
        let bestHandIndex = handsWithBestRank[0].index;
        for (let i = 1; i < handsWithBestRank.length; i++) {
          const challenger = handsWithBestRank[i];
          const comparison = compareHighHands(
            allEvaluations[challenger.index].bestHighHand,
            allEvaluations[bestHandIndex].bestHighHand,
            bestHighRank
          );
          if (comparison < 0) {
            bestHandIndex = challenger.index;
          }
        }

        // Check if current hand equals best
        const comparison = compareHighHands(
          currentEval.bestHighHand,
          allEvaluations[bestHandIndex].bestHighHand,
          bestHighRank
        );
        return comparison === 0;
      } else {
        // Low hand logic
        const handsWithLows = allEvaluations.filter((e) => e.bestLowHand !== null);
        if (handsWithLows.length === 0) return false;
        if (!currentEval.bestLowHand) return false;

        // Find best low
        let bestLow = handsWithLows[0].bestLowHand!;
        for (const e of handsWithLows) {
          if (e.bestLowHand && compareLowHands(e.bestLowHand, bestLow) < 0) {
            bestLow = e.bestLowHand;
          }
        }

        return areLowHandsEqual(currentEval.bestLowHand, bestLow);
      }
    },
    [hands, communityCards, selectedCardCount]
  );

  const checkNoLowAnswer = useCallback((): boolean => {
    const allEvaluations = hands.map((hand) =>
      findBestHand(hand.cards, communityCards, selectedCardCount)
    );
    return !allEvaluations.some((e) => e.bestLowHand !== null);
  }, [hands, communityCards, selectedCardCount]);

  const getWinningCommunityCards = useCallback((): Card[] | null => {
    const allEvaluations = hands.map((hand) =>
      findBestHand(hand.cards, communityCards, selectedCardCount)
    );

    // Find best high hand
    let bestEval = allEvaluations[0];
    for (const eval_ of allEvaluations) {
      if (eval_.bestHighRank > bestEval.bestHighRank) {
        bestEval = eval_;
      } else if (eval_.bestHighRank === bestEval.bestHighRank) {
        if (compareHighHands(eval_.bestHighHand, bestEval.bestHighHand, eval_.bestHighRank) < 0) {
          bestEval = eval_;
        }
      }
    }

    // Get community cards from best hand
    const communityCardsInWinning: Card[] = [];
    for (const card of bestEval.bestHighHand) {
      if (communityCards.some((c) => c.rank === card.rank && c.suit === card.suit)) {
        communityCardsInWinning.push(card);
      }
    }

    if (selectedCardCount === 2) {
      return communityCardsInWinning.length === 3 || communityCardsInWinning.length === 4
        ? communityCardsInWinning
        : null;
    }
    return communityCardsInWinning.length === 3 ? communityCardsInWinning : null;
  }, [hands, communityCards, selectedCardCount]);

  const getCorrectHoleCardIndices = useCallback(
    (handIndex: number): Set<number> => {
      const hand = hands[handIndex];
      const evaluation = findBestHand(hand.cards, communityCards, selectedCardCount);

      // Find hole cards in best hand
      const holeCardsInBest: Card[] = [];
      for (const card of evaluation.bestHighHand) {
        if (hand.cards.some((c) => c.rank === card.rank && c.suit === card.suit)) {
          holeCardsInBest.push(card);
        }
      }

      // Count needed ranks
      const neededRankCounts: Record<string, number> = {};
      for (const card of holeCardsInBest) {
        neededRankCounts[card.rank] = (neededRankCounts[card.rank] || 0) + 1;
      }

      // Return indices
      const correctIndices = new Set<number>();
      for (let i = 0; i < hand.cards.length; i++) {
        if (neededRankCounts[hand.cards[i].rank] > 0) {
          correctIndices.add(i);
        }
      }
      return correctIndices;
    },
    [hands, communityCards, selectedCardCount]
  );

  const isCorrectCommunityCard = useCallback(
    (index: number): boolean => {
      const winningCards = getWinningCommunityCards();
      if (!winningCards) return false;

      const selectedCard = communityCards[index];
      return winningCards.some((card) => card.rank === selectedCard.rank);
    },
    [communityCards, getWinningCommunityCards]
  );

  const isCorrectHoleCard = useCallback(
    (handIndex: number, cardIndex: number): boolean => {
      const hand = hands[handIndex];
      const evaluation = findBestHand(hand.cards, communityCards, selectedCardCount);

      // Find hole cards in best hand
      const holeCardsInBest: Card[] = [];
      for (const card of evaluation.bestHighHand) {
        if (hand.cards.some((c) => c.rank === card.rank && c.suit === card.suit)) {
          holeCardsInBest.push(card);
        }
      }

      const selectedCard = hand.cards[cardIndex];
      return holeCardsInBest.some((c) => c.rank === selectedCard.rank);
    },
    [hands, communityCards, selectedCardCount]
  );

  const checkRoundCompleteness = useCallback(() => {
    const winningCards = getWinningCommunityCards();
    if (!winningCards) return;

    // Check community cards
    const rankCounts: Record<string, number> = {};
    for (const card of winningCards) {
      rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    }

    const elevatedRankCounts: Record<string, number> = {};
    for (const index of elevatedCommunityCards) {
      const card = communityCards[index];
      elevatedRankCounts[card.rank] = (elevatedRankCounts[card.rank] || 0) + 1;
    }

    if (elevatedCommunityCards.size !== winningCards.length) return;

    for (const [rank, needed] of Object.entries(rankCounts)) {
      if ((elevatedRankCounts[rank] || 0) !== needed) return;
    }

    // Check all winning hands have correct selections
    for (let i = 0; i < hands.length; i++) {
      const hand = hands[i];

      if (selectedCardCount === 2) {
        const winsHi = checkAnswer(i, 'hi');
        const hasHiSelected = selectedAnswers.get(i)?.has('hi') ?? false;
        if (winsHi && !hasHiSelected) return;
      } else {
        const evaluation = findBestHand(hand.cards, communityCards, selectedCardCount);
        const hasLow = evaluation.bestLowHand !== null;

        const winsHi = checkAnswer(i, 'hi');
        const hasHiSelected = selectedAnswers.get(i)?.has('hi') ?? false;
        const winsLow = hasLow && checkAnswer(i, 'low');
        const hasLowSelected = selectedAnswers.get(i)?.has('low') ?? false;

        if (winsHi && !hasHiSelected) return;
        if (winsLow && !hasLowSelected) return;

        // Check hole cards for winning hi hands
        if (winsHi) {
          const selectedHole = elevatedHoleCards.get(i) ?? new Set();
          const holeCardsInBest: Card[] = [];
          for (const card of evaluation.bestHighHand) {
            if (hand.cards.some((c) => c.rank === card.rank && c.suit === card.suit)) {
              holeCardsInBest.push(card);
            }
          }

          const neededRankCounts: Record<string, number> = {};
          for (const card of holeCardsInBest) {
            neededRankCounts[card.rank] = (neededRankCounts[card.rank] || 0) + 1;
          }

          const selectedRankCounts: Record<string, number> = {};
          for (const cardIndex of selectedHole) {
            const card = hand.cards[cardIndex];
            selectedRankCounts[card.rank] = (selectedRankCounts[card.rank] || 0) + 1;
          }

          if (JSON.stringify(neededRankCounts) !== JSON.stringify(selectedRankCounts)) return;
        }
      }
    }

    // Check No Low
    if (selectedCardCount !== 2) {
      const anyHasLow = hands.some((hand) => {
        const eval_ = findBestHand(hand.cards, communityCards, selectedCardCount);
        return eval_.bestLowHand !== null;
      });
      if (!anyHasLow && !noLowSelected) return;
    }

    // All checks passed!
    setRoundStatus('correct');

    if (timerActive && timerStartTime) {
      const elapsedTime = (new Date().getTime() - timerStartTime.getTime()) / 1000;
      const result: RoundResult = {
        isCorrect: true,
        timeTaken: elapsedTime,
        date: new Date().toISOString(),
      };
      saveRoundResult(result);
      setRoundResults((prev) => [...prev.slice(-19), result]);
    }
    setTimerActive(false);
  }, [
    getWinningCommunityCards,
    elevatedCommunityCards,
    communityCards,
    hands,
    selectedCardCount,
    checkAnswer,
    selectedAnswers,
    elevatedHoleCards,
    noLowSelected,
    timerActive,
    timerStartTime,
  ]);

  const selectAnswer = useCallback(
    (handIndex: number, answer: HandAnswer) => {
      setSelectedAnswers((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(handIndex) ?? new Set();
        const wasSelected = current.has(answer);

        if (wasSelected) {
          current.delete(answer);
          setElevatedCards((prev) => {
            const newSet = new Set(prev);
            newSet.delete(handIndex);
            return newSet;
          });
          if (selectedCardCount === 2) {
            setElevatedHoleCards((prev) => {
              const newMap = new Map(prev);
              newMap.set(handIndex, new Set());
              return newMap;
            });
          }
          setRoundStatus('incomplete');
        } else {
          current.add(answer);
          const isCorrect = checkAnswer(handIndex, answer);

          if (isCorrect) {
            setElevatedCards((prev) => new Set([...prev, handIndex]));
            if (selectedCardCount === 2 && answer === 'hi') {
              setElevatedHoleCards((prev) => {
                const newMap = new Map(prev);
                newMap.set(handIndex, new Set([0, 1]));
                return newMap;
              });
            }
          } else {
            setRoundStatus('failed');
            setHadFailureThisRound(true);
            // Brief elevation then drop
            setElevatedCards((prev) => new Set([...prev, handIndex]));
            setTimeout(() => {
              setElevatedCards((prev) => {
                const newSet = new Set(prev);
                newSet.delete(handIndex);
                return newSet;
              });
            }, 500);
          }
        }

        newMap.set(handIndex, current);
        return newMap;
      });

      setShowingResults(true);
      setTimeout(() => checkRoundCompleteness(), 100);
    },
    [checkAnswer, selectedCardCount, checkRoundCompleteness]
  );

  const selectCommunityCard = useCallback(
    (index: number) => {
      const wasSelected = selectedCommunityCards.has(index);

      if (wasSelected) {
        setSelectedCommunityCards((prev) => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
        setElevatedCommunityCards((prev) => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
        setRoundStatus('incomplete');
      } else {
        setSelectedCommunityCards((prev) => new Set([...prev, index]));
        const isCorrect = isCorrectCommunityCard(index);

        if (isCorrect) {
          setElevatedCommunityCards((prev) => new Set([...prev, index]));
        } else {
          setRoundStatus('failed');
          setHadFailureThisRound(true);
          setElevatedCommunityCards((prev) => new Set([...prev, index]));
          setTimeout(() => {
            setElevatedCommunityCards((prev) => {
              const newSet = new Set(prev);
              newSet.delete(index);
              return newSet;
            });
            setSelectedCommunityCards((prev) => {
              const newSet = new Set(prev);
              newSet.delete(index);
              return newSet;
            });
          }, 500);
        }
      }

      setTimeout(() => checkRoundCompleteness(), 100);
    },
    [selectedCommunityCards, isCorrectCommunityCard, checkRoundCompleteness]
  );

  const selectHoleCard = useCallback(
    (handIndex: number, cardIndex: number) => {
      const current = selectedHoleCards.get(handIndex) ?? new Set();
      const wasSelected = current.has(cardIndex);

      if (wasSelected) {
        setSelectedHoleCards((prev) => {
          const newMap = new Map(prev);
          const newSet = new Set(current);
          newSet.delete(cardIndex);
          newMap.set(handIndex, newSet);
          return newMap;
        });
        setElevatedHoleCards((prev) => {
          const newMap = new Map(prev);
          const newSet = new Set<number>(prev.get(handIndex) ?? []);
          newSet.delete(cardIndex);
          newMap.set(handIndex, newSet);
          return newMap;
        });
        setRoundStatus('incomplete');
      } else {
        setSelectedHoleCards((prev) => {
          const newMap = new Map(prev);
          const newSet = new Set(current);
          newSet.add(cardIndex);
          newMap.set(handIndex, newSet);
          return newMap;
        });

        const isCorrect = isCorrectHoleCard(handIndex, cardIndex);

        if (isCorrect) {
          setElevatedHoleCards((prev) => {
            const newMap = new Map(prev);
            const newSet = new Set<number>(prev.get(handIndex) ?? []);
            newSet.add(cardIndex);
            newMap.set(handIndex, newSet);
            return newMap;
          });
        } else {
          setRoundStatus('failed');
          setHadFailureThisRound(true);
          setElevatedHoleCards((prev) => {
            const newMap = new Map(prev);
            const newSet = new Set<number>(prev.get(handIndex) ?? []);
            newSet.add(cardIndex);
            newMap.set(handIndex, newSet);
            return newMap;
          });
          setTimeout(() => {
            setElevatedHoleCards((prev) => {
              const newMap = new Map(prev);
              const newSet = new Set<number>(prev.get(handIndex) ?? []);
              newSet.delete(cardIndex);
              newMap.set(handIndex, newSet);
              return newMap;
            });
            setSelectedHoleCards((prev) => {
              const newMap = new Map(prev);
              const newSet = new Set<number>(prev.get(handIndex) ?? []);
              newSet.delete(cardIndex);
              newMap.set(handIndex, newSet);
              return newMap;
            });
          }, 500);
        }
      }

      setTimeout(() => checkRoundCompleteness(), 100);
    },
    [selectedHoleCards, isCorrectHoleCard, checkRoundCompleteness]
  );

  const handleNoLowPress = useCallback(() => {
    setNoLowSelected((prev) => !prev);
    setShowingResults(true);

    if (!noLowSelected) {
      const isCorrect = checkNoLowAnswer();
      if (!isCorrect) {
        setRoundStatus('failed');
        setHadFailureThisRound(true);
      }
    } else {
      setRoundStatus('incomplete');
    }

    setTimeout(() => checkRoundCompleteness(), 100);
  }, [noLowSelected, checkNoLowAnswer, checkRoundCompleteness]);

  const handleResetStats = useCallback(() => {
    resetStats();
    setRoundResults([]);
  }, []);

  const getButtonColor = (handIndex: number, answer: HandAnswer): string => {
    const selected = selectedAnswers.get(handIndex);
    const isSelected = selected?.has(answer) ?? false;

    if (!showingResults) {
      return isSelected ? 'rgba(59, 130, 246, 0.8)' : 'rgba(128, 128, 128, 0.6)';
    }

    if (isSelected) {
      const isCorrect = checkAnswer(handIndex, answer);
      return isCorrect ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
    }

    return 'rgba(128, 128, 128, 0.6)';
  };

  const getNoLowButtonColor = (): string => {
    if (!showingResults) {
      return noLowSelected ? 'rgba(59, 130, 246, 0.8)' : 'rgba(128, 128, 128, 0.6)';
    }

    if (noLowSelected) {
      return checkNoLowAnswer() ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
    }

    return 'rgba(128, 128, 128, 0.6)';
  };

  const shouldShowHandDescription = (handIndex: number): boolean => {
    if (roundStatus === 'correct') return true;
    if (selectedCardCount === 2) {
      return selectedAnswers.get(handIndex)?.has('hi') ?? false;
    }
    const elevatedHole = elevatedHoleCards.get(handIndex) ?? new Set();
    const correctHoleCards = getCorrectHoleCardIndices(handIndex);
    if (correctHoleCards.size === 0) return false;
    for (const idx of correctHoleCards) {
      if (!elevatedHole.has(idx)) return false;
    }
    return true;
  };

  const shouldShowLowDescription = (handIndex: number): boolean => {
    if (roundStatus === 'correct') return true;
    return selectedAnswers.get(handIndex)?.has('low') ?? false;
  };

  // Render settings view
  const renderSettingsView = () => (
    <View style={styles.settingsContainer}>
      {roundResults.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              {getCorrectPercentage(roundResults).toFixed(0)}% correct
            </Text>
            <Text style={styles.statsText}>
              Avg: {formatTime(getAverageCompletedTime(roundResults))}
            </Text>
          </View>
          <Text style={styles.statsSubtext}>({roundResults.length} rounds)</Text>
        </View>
      )}

      <Text style={styles.sectionLabel}>Number of cards:</Text>
      <View style={styles.optionRow}>
        {CARD_COUNT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              selectedCardCount === option && styles.optionButtonSelected,
            ]}
            onPress={() => setSelectedCardCount(option)}
          >
            <Text style={styles.optionButtonText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Number of players:</Text>
      <View style={styles.optionGrid}>
        <View style={styles.optionRow}>
          {PLAYER_COUNT_OPTIONS.slice(0, 4).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                styles.optionButtonSmall,
                selectedPlayerCount === option && styles.optionButtonSelectedOrange,
              ]}
              onPress={() => setSelectedPlayerCount(option)}
            >
              <Text style={styles.optionButtonText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.optionRow}>
          {PLAYER_COUNT_OPTIONS.slice(4).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                styles.optionButtonSmall,
                selectedPlayerCount === option && styles.optionButtonSelectedOrange,
              ]}
              onPress={() => setSelectedPlayerCount(option)}
            >
              <Text style={styles.optionButtonText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 25 }}>
        <GlassyButton
          title="Start"
          onPress={startGame}
          baseColor={ButtonColors.green}
          width={150}
          height={50}
          fontSize={20}
        />
      </View>
    </View>
  );

  // Render reveal stages
  const renderRevealStage = () => {
    if (revealStage === 'ready') {
      return (
        <Pressable style={styles.stageContainer} onPress={advanceRevealStage}>
          <Text style={styles.stageTitle}>Ready</Text>
          <Text style={styles.stageSubtitle}>Tap to continue</Text>
        </Pressable>
      );
    }

    if (revealStage === 'flop') {
      return (
        <Pressable style={styles.stageContainer} onPress={advanceRevealStage}>
          <Text style={styles.stageTitle}>The Flop</Text>
          <View style={styles.cardRow}>
            {communityCards.slice(0, 3).map((card) => (
              <CardView key={card.id} card={card} width={STAGE_CARD_WIDTH} height={STAGE_CARD_HEIGHT} />
            ))}
          </View>
          <Text style={styles.stageSubtitle}>Tap to continue</Text>
        </Pressable>
      );
    }

    if (revealStage === 'turn') {
      return (
        <Pressable style={styles.stageContainer} onPress={advanceRevealStage}>
          <Text style={styles.stageTitle}>The Turn</Text>
          <View style={styles.cardRow}>
            {communityCards.slice(0, 3).map((card) => (
              <CardView key={card.id} card={card} width={STAGE_CARD_WIDTH} height={STAGE_CARD_HEIGHT} />
            ))}
          </View>
          <View style={[styles.cardRow, { marginTop: 15 }]}>
            <CardView card={communityCards[3]} width={STAGE_CARD_WIDTH} height={STAGE_CARD_HEIGHT} />
          </View>
          <Text style={styles.stageSubtitle}>Tap to continue</Text>
        </Pressable>
      );
    }

    if (revealStage === 'river') {
      return (
        <View style={styles.stageContainer}>
          <Text style={styles.stageTitle}>The River</Text>
          <View style={styles.cardRow}>
            {communityCards.slice(0, 3).map((card) => (
              <CardView key={card.id} card={card} width={STAGE_CARD_WIDTH} height={STAGE_CARD_HEIGHT} />
            ))}
          </View>
          <View style={[styles.cardRow, { marginTop: 15 }]}>
            <CardView card={communityCards[3]} width={STAGE_CARD_WIDTH} height={STAGE_CARD_HEIGHT} />
            <CardView card={communityCards[4]} width={STAGE_CARD_WIDTH} height={STAGE_CARD_HEIGHT} />
          </View>
          <View style={styles.riverButtons}>
            <GlassyButton
              title="Showdown"
              onPress={advanceRevealStage}
              baseColor={ButtonColors.green}
              width={150}
              height={45}
              fontSize={18}
            />
            <GlassyButton
              title="New Flop"
              onPress={startGame}
              baseColor={ButtonColors.blue}
              width={150}
              height={45}
              fontSize={18}
            />
          </View>
        </View>
      );
    }

    return null;
  };

  // Render full game view
  const renderFullGameView = () => (
    <View style={styles.fullGameContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {hadFailureThisRound ? (
            <Text style={styles.statusFailed}>FAILED</Text>
          ) : roundStatus === 'correct' ? (
            <Text style={styles.statusCorrect}>CORRECT</Text>
          ) : (
            <Text style={styles.headerTitle}>Hand Reading</Text>
          )}
        </View>
        <Text style={styles.timerText}>{formatTime(currentElapsedTime)}</Text>
      </View>

      {/* Stats line */}
      <View style={styles.statsLine}>
        <Text style={styles.statsLineText}>{hands.length} players</Text>
        {roundResults.length > 0 && (
          <Text style={styles.statsLineText}>
            {getCorrectPercentage(roundResults).toFixed(0)}% | Avg:{' '}
            {formatTime(getAverageCompletedTime(roundResults))}
          </Text>
        )}
      </View>

      {/* Scrollable hands area */}
      <ScrollView style={styles.handsScroll} contentContainerStyle={styles.handsContent}>
        {hands.map((hand, handIndex) => (
          <View key={hand.id} style={styles.handRow}>
            {/* Cards */}
            <View style={styles.handCardsContainer}>
              <View style={styles.handCards}>
                {hand.cards.map((card, cardIndex) => (
                  <View
                    key={card.id}
                    style={[
                      styles.handCardWrapper,
                      { left: cardIndex * HOLE_CARD_OFFSET },
                    ]}
                  >
                    <CardView
                      card={card}
                      width={HOLE_CARD_WIDTH}
                      height={HOLE_CARD_HEIGHT}
                      elevated={elevatedHoleCards.get(handIndex)?.has(cardIndex) ?? false}
                      onPress={
                        selectedCardCount !== 2
                          ? () => selectHoleCard(handIndex, cardIndex)
                          : undefined
                      }
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Hi/Lo buttons */}
            <View style={styles.answerButtons}>
              <View style={styles.answerRow}>
                {shouldShowHandDescription(handIndex) && (
                  <Text style={styles.handDescription}>
                    {getHandDescription(hand.cards, communityCards, selectedCardCount)}
                  </Text>
                )}
                <TouchableOpacity
                  style={[styles.answerButton, { backgroundColor: getButtonColor(handIndex, 'hi') }]}
                  onPress={() => selectAnswer(handIndex, 'hi')}
                >
                  <Text style={styles.answerButtonText}>Hi</Text>
                </TouchableOpacity>
              </View>

              {selectedCardCount !== 2 && (
                <View style={styles.answerRow}>
                  {shouldShowLowDescription(handIndex) && (
                    <Text style={styles.handDescription}>
                      {getLowHandDescription(hand.cards, communityCards, selectedCardCount)}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={[styles.answerButton, { backgroundColor: getButtonColor(handIndex, 'low') }]}
                    onPress={() => selectAnswer(handIndex, 'low')}
                  >
                    <Text style={styles.answerButtonText}>Low</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}

        {/* Redeal button */}
        <View style={styles.actionButtonContainer}>
          <GlassyButton
            title="Redeal Player Cards"
            onPress={redealHands}
            baseColor={ButtonColors.purple}
            width={200}
            height={35}
            fontSize={14}
          />
        </View>

        {/* No Low button */}
        {selectedCardCount !== 2 && (
          <TouchableOpacity
            style={[styles.noLowButton, { backgroundColor: getNoLowButtonColor() }]}
            onPress={handleNoLowPress}
          >
            <Text style={styles.noLowButtonText}>No Low</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Footer with community cards */}
      <View style={styles.footer}>
        <View style={styles.communityCards}>
          {communityCards.map((card, index) => (
            <CardView
              key={card.id}
              card={card}
              width={COMMUNITY_CARD_WIDTH}
              height={COMMUNITY_CARD_HEIGHT}
              elevated={elevatedCommunityCards.has(index)}
              onPress={() => selectCommunityCard(index)}
            />
          ))}
        </View>
        <GlassyButton
          title="New Deal"
          onPress={startGame}
          baseColor={ButtonColors.blue}
          width={120}
          height={40}
          fontSize={14}
        />
      </View>
    </View>
  );

  return (
    <ImageBackground
      source={require('@/assets/images/felt-background.jpg')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <Stack.Screen
        options={{
          title: 'Hand Reading',
          headerStyle: { backgroundColor: '#1a472a' },
          headerTintColor: 'white',
          headerRight: () => (
            <TouchableOpacity onPress={handleResetStats} style={{ marginRight: 15 }}>
              <Text style={{ color: 'white' }}>Reset</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {!gameStarted && renderSettingsView()}
      {gameStarted && revealStage !== 'fullGame' && renderRevealStage()}
      {gameStarted && revealStage === 'fullGame' && renderFullGameView()}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? '100%' as any : undefined,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  settingsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  statsContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statsText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 15,
  },
  optionGrid: {
    gap: 10,
  },
  optionButton: {
    width: 60,
    height: 50,
    backgroundColor: 'rgba(128, 128, 128, 0.6)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionButtonSmall: {
    width: 50,
    height: 45,
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
  },
  optionButtonSelectedOrange: {
    backgroundColor: 'rgba(249, 115, 22, 0.8)',
  },
  optionButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  stageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb ? { maxWidth: 600, alignSelf: 'center' as const, width: '100%' } : {}),
  },
  stageTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
  },
  stageSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 30,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 15,
  },
  riverButtons: {
    marginTop: 30,
    gap: 15,
    alignItems: 'center',
  },
  fullGameContainer: {
    flex: 1,
    ...(isWeb ? { maxWidth: 600, alignSelf: 'center' as const, width: '100%' } : {}),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  statusCorrect: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  statusFailed: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  timerText: {
    fontSize: 22,
    fontWeight: '600',
    color: 'white',
  },
  statsLine: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    paddingBottom: 5,
  },
  statsLineText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  handsScroll: {
    flex: 1,
  },
  handsContent: {
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  handRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 15,
    width: '100%',
  },
  handCardsContainer: {
    width: isWeb ? 230 : 165,
    height: isWeb ? 110 : 85,
    justifyContent: 'center',
  },
  handCards: {
    position: 'relative',
    height: isWeb ? 98 : 70,
  },
  handCardWrapper: {
    position: 'absolute',
  },
  answerButtons: {
    flex: 1,
    gap: 5,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  handDescription: {
    fontSize: isWeb ? 12 : 10,
    color: 'white',
    textAlign: 'right',
    width: isWeb ? 100 : 70,
  },
  answerButton: {
    width: isWeb ? 70 : 60,
    height: isWeb ? 40 : 35,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerButtonText: {
    fontSize: isWeb ? 16 : 14,
    fontWeight: '600',
    color: 'white',
  },
  actionButtonContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  noLowButton: {
    width: 100,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
  },
  noLowButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  footer: {
    paddingVertical: isWeb ? 15 : 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    gap: isWeb ? 15 : 10,
  },
  communityCards: {
    flexDirection: 'row',
    gap: isWeb ? 12 : 8,
  },
});
