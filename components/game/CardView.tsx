
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Card, getSuitSymbol, Suit } from '@/lib/models/Card';

const cardImages: Record<string, any> = {
  // Clubs
  'cardClubs2': require('@/assets/images/Cards/cardClubs2.png'),
  'cardClubs3': require('@/assets/images/Cards/cardClubs3.png'),
  'cardClubs4': require('@/assets/images/Cards/cardClubs4.png'),
  'cardClubs5': require('@/assets/images/Cards/cardClubs5.png'),
  'cardClubs6': require('@/assets/images/Cards/cardClubs6.png'),
  'cardClubs7': require('@/assets/images/Cards/cardClubs7.png'),
  'cardClubs8': require('@/assets/images/Cards/cardClubs8.png'),
  'cardClubs9': require('@/assets/images/Cards/cardClubs9.png'),
  'cardClubs10': require('@/assets/images/Cards/cardClubs10.png'),
  'cardClubsJ': require('@/assets/images/Cards/cardClubsJ.png'),
  'cardClubsQ': require('@/assets/images/Cards/cardClubsQ.png'),
  'cardClubsK': require('@/assets/images/Cards/cardClubsK.png'),
  'cardClubsA': require('@/assets/images/Cards/cardClubsA.png'),
  // Diamonds
  'cardDiamonds2': require('@/assets/images/Cards/cardDiamonds2.png'),
  'cardDiamonds3': require('@/assets/images/Cards/cardDiamonds3.png'),
  'cardDiamonds4': require('@/assets/images/Cards/cardDiamonds4.png'),
  'cardDiamonds5': require('@/assets/images/Cards/cardDiamonds5.png'),
  'cardDiamonds6': require('@/assets/images/Cards/cardDiamonds6.png'),
  'cardDiamonds7': require('@/assets/images/Cards/cardDiamonds7.png'),
  'cardDiamonds8': require('@/assets/images/Cards/cardDiamonds8.png'),
  'cardDiamonds9': require('@/assets/images/Cards/cardDiamonds9.png'),
  'cardDiamonds10': require('@/assets/images/Cards/cardDiamonds10.png'),
  'cardDiamondsJ': require('@/assets/images/Cards/cardDiamondsJ.png'),
  'cardDiamondsQ': require('@/assets/images/Cards/cardDiamondsQ.png'),
  'cardDiamondsK': require('@/assets/images/Cards/cardDiamondsK.png'),
  'cardDiamondsA': require('@/assets/images/Cards/cardDiamondsA.png'),
  // Hearts
  'cardHearts2': require('@/assets/images/Cards/cardHearts2.png'),
  'cardHearts3': require('@/assets/images/Cards/cardHearts3.png'),
  'cardHearts4': require('@/assets/images/Cards/cardHearts4.png'),
  'cardHearts5': require('@/assets/images/Cards/cardHearts5.png'),
  'cardHearts6': require('@/assets/images/Cards/cardHearts6.png'),
  'cardHearts7': require('@/assets/images/Cards/cardHearts7.png'),
  'cardHearts8': require('@/assets/images/Cards/cardHearts8.png'),
  'cardHearts9': require('@/assets/images/Cards/cardHearts9.png'),
  'cardHearts10': require('@/assets/images/Cards/cardHearts10.png'),
  'cardHeartsJ': require('@/assets/images/Cards/cardHeartsJ.png'),
  'cardHeartsQ': require('@/assets/images/Cards/cardHeartsQ.png'),
  'cardHeartsK': require('@/assets/images/Cards/cardHeartsK.png'),
  'cardHeartsA': require('@/assets/images/Cards/cardHeartsA.png'),
  // Spades
  'cardSpades2': require('@/assets/images/Cards/cardSpades2.png'),
  'cardSpades3': require('@/assets/images/Cards/cardSpades3.png'),
  'cardSpades4': require('@/assets/images/Cards/cardSpades4.png'),
  'cardSpades5': require('@/assets/images/Cards/cardSpades5.png'),
  'cardSpades6': require('@/assets/images/Cards/cardSpades6.png'),
  'cardSpades7': require('@/assets/images/Cards/cardSpades7.png'),
  'cardSpades8': require('@/assets/images/Cards/cardSpades8.png'),
  'cardSpades9': require('@/assets/images/Cards/cardSpades9.png'),
  'cardSpades10': require('@/assets/images/Cards/cardSpades10.png'),
  'cardSpadesJ': require('@/assets/images/Cards/cardSpadesJ.png'),
  'cardSpadesQ': require('@/assets/images/Cards/cardSpadesQ.png'),
  'cardSpadesK': require('@/assets/images/Cards/cardSpadesK.png'),
  'cardSpadesA': require('@/assets/images/Cards/cardSpadesA.png'),
};

interface CardViewProps {
  card: Card;
  width?: number;
  height?: number;
  elevated?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

function getCardImageKey(card: Card): string {
  return `card${card.suit}${card.rank}`;
}

function getSuitColor(suit: Suit): string {
  return suit === 'Hearts' || suit === 'Diamonds' ? '#e74c3c' : '#2c3e50';
}

export function CardView({
  card,
  width = 50,
  height = 70,
  elevated = false,
  onPress,
  style,
}: CardViewProps) {
  const imageKey = getCardImageKey(card);
  const imageSource = cardImages[imageKey];

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(elevated ? -10 : 0, {
            duration: 300,
            easing: Easing.inOut(Easing.ease),
          }),
        },
      ],
    };
  }, [elevated]);

  const cardContent = imageSource ? (
    <Image
      source={imageSource}
      style={[{ width, height }]}
      contentFit="contain"
    />
  ) : (
    
    <View style={[styles.fallbackCard, { width, height }]}>
      <Text style={[styles.fallbackRank, { color: getSuitColor(card.suit) }]}>
        {card.rank}
      </Text>
      <Text style={[styles.fallbackSuit, { color: getSuitColor(card.suit) }]}>
        {getSuitSymbol(card.suit)}
      </Text>
    </View>
  );

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Wrapper
        onPress={onPress}
        style={styles.cardContainer}
        activeOpacity={0.8}
      >
        {cardContent}
      </Wrapper>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  fallbackCard: {
    backgroundColor: 'white',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  fallbackRank: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fallbackSuit: {
    fontSize: 14,
  },
});
