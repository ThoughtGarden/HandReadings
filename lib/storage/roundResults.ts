// Round results storage matching Swift implementation

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RoundResult } from '../poker/types';

const STORAGE_KEY = 'HandReadingRoundResults';
const MAX_RESULTS = 20;

export async function loadRoundResults(): Promise<RoundResult[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as RoundResult[];
    }
    return [];
  } catch (error) {
    console.error('Error loading round results:', error);
    return [];
  }
}

export async function saveRoundResult(result: RoundResult): Promise<void> {
  try {
    const results = await loadRoundResults();
    results.push(result);

    // Keep only last MAX_RESULTS results
    const trimmedResults = results.slice(-MAX_RESULTS);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedResults));
  } catch (error) {
    console.error('Error saving round result:', error);
  }
}

export async function resetStats(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error resetting stats:', error);
  }
}

export function getCorrectPercentage(results: RoundResult[]): number {
  if (results.length === 0) return 0;
  const correctCount = results.filter((r) => r.isCorrect).length;
  return (correctCount / results.length) * 100;
}

export function getAverageCompletedTime(results: RoundResult[]): number {
  if (results.length === 0) return 0;
  const sum = results.reduce((acc, r) => acc + r.timeTaken, 0);
  return sum / results.length;
}

export function formatTime(timeInterval: number): string {
  const minutes = Math.floor(timeInterval / 60);
  const seconds = Math.floor(timeInterval % 60);
  const milliseconds = Math.floor((timeInterval % 1) * 10);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
}
