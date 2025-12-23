
import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface GlassyButtonProps {
  title: string;
  onPress: () => void;
  baseColor: string;
  width?: number;
  height?: number;
  fontSize?: number;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassyButton({
  title,
  onPress,
  baseColor,
  width = 150,
  height = 50,
  fontSize = 18,
  disabled = false,
  style,
  textStyle,
}: GlassyButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withTiming(isPressed ? 0.96 : 1, {
            duration: 100,
            easing: Easing.inOut(Easing.ease),
          }),
        },
      ],
    };
  }, [isPressed]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled}
      style={[
        styles.buttonContainer,
        { width, height, backgroundColor: baseColor },
        disabled && styles.disabled,
        style,
        animatedStyle,
      ]}
    >
      {/* Gradient overlay for glass effect */}
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.4)',
          'rgba(255, 255, 255, 0.1)',
          'transparent',
          'rgba(0, 0, 0, 0.1)',
        ]}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Inner border highlight */}
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.6)',
          'rgba(255, 255, 255, 0.2)',
          'transparent',
        ]}
        locations={[0, 0.3, 0.5]}
        style={[StyleSheet.absoluteFill, styles.innerBorder]}
      />

      <Text style={[styles.buttonText, { fontSize }, textStyle]}>{title}</Text>
    </AnimatedPressable>
  );
}

// Preset colors matching Swift implementation
export const ButtonColors = {
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  orange: '#f97316',
  red: '#ef4444',
  gray: 'rgba(128, 128, 128, 0.6)',
};

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  innerBorder: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
