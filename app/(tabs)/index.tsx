// MenuScreen - Main menu matching Swift MenuView

import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Platform } from 'react-native';
import { router, Href } from 'expo-router';
import { GlassyButton, ButtonColors } from '@/components/game/GlassyButton';

export default function MenuScreen() {
  return (
    <ImageBackground
      source={require('@/assets/images/felt-background.jpg')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.content}>
        <Text style={styles.title}>Absolute Nutz</Text>
        <Text style={styles.subtitle}>Dealer Training</Text>

        <View style={styles.menuButtons}>
          <GlassyButton
            title="Hand Reading"
            onPress={() => router.push('/hand-reading' as Href)}
            baseColor={ButtonColors.green}
            width={200}
            height={55}
            fontSize={20}
          />

          {/* Other modules can be added here later */}
          <GlassyButton
            title="Side Pot"
            onPress={() => {}}
            baseColor={ButtonColors.gray}
            width={200}
            height={55}
            fontSize={20}
            disabled
          />

          <GlassyButton
            title="Three X"
            onPress={() => {}}
            baseColor={ButtonColors.gray}
            width={200}
            height={55}
            fontSize={20}
            disabled
          />

          <GlassyButton
            title="Pot"
            onPress={() => {}}
            baseColor={ButtonColors.gray}
            width={200}
            height={55}
            fontSize={20}
            disabled
          />
        </View>
      </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    marginBottom: 40,
  },
  menuButtons: {
    gap: 15,
  },
});
