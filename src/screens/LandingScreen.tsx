import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { VideoHero } from '@/components/VideoHero';
import { Button } from '@/components/Button';
import { RootStackNavigationProp } from '@/utils/navigation';
import { ResizeMode } from 'expo-av';

export const LandingScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const handleGetStarted = () => {
    navigation.navigate('Onboarding');
  };

  const handleSignIn = () => {
    navigation.navigate('Auth');
  };

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  const handleVideoError = (error: string) => {
    console.error('Video error:', error);
    setIsVideoLoaded(true); // Continue without video
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Hero Video Background */}
      <VideoHero
        source={require('@/assets/hero-video.mp4')}
        onLoad={handleVideoLoad}
        onError={handleVideoError}
        resizeMode={ResizeMode.COVER}
        shouldPlay={true}
        isMuted={true}
        isLooping={true}
        style={styles.video}
      />

      {/* Overlay for better text readability */}
      <View style={styles.overlay} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={handleSignIn}
            style={styles.signInButton}
            accessibilityRole="button"
            accessibilityLabel="Sign In"
          >
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Headline */}
        <View style={styles.headlineContainer}>
          <Text style={styles.headline}>Eat smarter.</Text>
          <Text style={styles.headline}>Feel lighter.</Text>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Lose 7 lbs in 30 days with an AI coach that plans your meals, logs
          calories from photos, and keeps you on track.
        </Text>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* CTA Button */}
        <Button
          title="Start Free 7-Day Trial"
          onPress={handleGetStarted}
          variant="primary"
          size="large"
          fullWidth
          style={styles.ctaButton}
          accessibilityLabel="Start free 7-day trial"
          accessibilityHint="Start your personalized meal plans and calorie tracking"
        />

        {/* Footer Links */}
        <View style={styles.footerLinks}>
          <TouchableOpacity
            onPress={() => {
              // Handle terms navigation
            }}
            accessibilityRole="button"
            accessibilityLabel="Terms of Service"
          >
            <Text style={styles.footerLink}>Terms</Text>
          </TouchableOpacity>

          <Text style={styles.footerSeparator}>•</Text>

          <TouchableOpacity
            onPress={() => {
              // Handle privacy navigation
            }}
            accessibilityRole="button"
            accessibilityLabel="Privacy Policy"
          >
            <Text style={styles.footerLink}>Privacy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  signInButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  signInText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  headlineContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headline: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ffffff',
    lineHeight: 56,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#ffffff',
    lineHeight: 24,
    opacity: 0.9,
    paddingHorizontal: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  ctaButton: {
    marginBottom: 24,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    textDecorationLine: 'underline',
  },
  footerSeparator: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.7,
    marginHorizontal: 12,
  },
});
