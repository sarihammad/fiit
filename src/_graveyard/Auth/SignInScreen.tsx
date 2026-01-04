import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { useAuth } from '@/providers/AuthProvider';
import { useAuthStore } from '@/state/auth.store';
import { RootStackNavigationProp } from '@/utils/navigation';
import { MaterialIcons } from '@expo/vector-icons';

export const SignInScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const {
    signInWithGoogle,
    signInWithApple,
    signOut,
    user,
    isLoading,
    isAppleSignInAvailable,
    isGoogleSignInAvailable,
  } = useAuth();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
      navigation.navigate('Start');
    } catch (error) {
      Alert.alert('Sign In Failed', 'Google Sign-In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);

    try {
      await signInWithApple();
      navigation.navigate('Start');
    } catch (error) {
      Alert.alert('Sign In Failed', 'Apple Sign-In failed. Please try again.');
    } finally {
      setAppleLoading(false);
    }
  };

  const handleSkip = async () => {
    const { createAnonymousAccount } = useAuthStore.getState();

    try {
      const success = await createAnonymousAccount();
      if (success) {
        navigation.navigate('Start');
      }
    } catch (error) {
      console.error('Error creating anonymous account:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome to FIIT</Text>
              <Text style={styles.subtitle}>
                Sign in to track your nutrition and reach your fitness goals
              </Text>
            </View>

            {/* Social Sign In */}
            <View style={styles.socialButtonsContainer}>
              {isGoogleSignInAvailable && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <ActivityIndicator color="#374151" />
                  ) : (
                    <>
                      <MaterialIcons
                        name="g-translate"
                        size={20}
                        color="#374151"
                      />
                      <Text style={styles.socialButtonText}>
                        Continue with Google
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {isAppleSignInAvailable && (
                <TouchableOpacity
                  style={[styles.socialButton, styles.appleButton]}
                  onPress={handleAppleSignIn}
                  disabled={appleLoading}
                >
                  {appleLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <MaterialIcons name="apple" size={20} color="white" />
                      <Text
                        style={[
                          styles.socialButtonText,
                          styles.appleButtonText,
                        ]}
                      >
                        Continue with Apple
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Skip Option */}
            <View style={styles.skipSection}>
              <Text style={styles.skipText}>
                Want to try FIIT without signing in?
              </Text>
              <Button
                title="Continue as Guest"
                onPress={() => navigation.navigate('Start')}
                variant="ghost"
                size="small"
                disabled={isLoading}
                accessibilityLabel="Continue as guest"
                accessibilityHint="Continues without signing in, you can sign in later"
              />
            </View>

            {/* Privacy Notice */}
            <View style={styles.privacyNotice}>
              <Text style={styles.privacyText}>
                By signing in, you agree to our Terms of Service and Privacy
                Policy. Your data is encrypted and secure.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    lineHeight: 24,
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#dc2626',
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    fontSize: 16,
    height: 52,
  },
  emailButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9ca3af',
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
    height: 52,
  },
  socialButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  appleButtonText: {
    color: 'white',
  },
  switchContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  switchText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '500',
  },
  skipSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  skipText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  privacyNotice: {
    paddingHorizontal: 20,
  },
  privacyText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#9ca3af',
    lineHeight: 16,
  },
});
