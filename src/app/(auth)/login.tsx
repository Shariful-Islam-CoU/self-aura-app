import { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, Card, Input, Text, Checkbox } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { useAuth, useTheme } from '@/providers';
import { apiClient, getErrorMessage, isApiError, type ApiEnvelope } from '@/api';
import { spacing, radius } from '@/theme';
import type { AuthSession } from '@/features/auth';

/**
 * Login screen - authenticates against the existing self_aura_backend
 * (POST /auth/login). No shell preview; real session via setSession.
 *
 * Redesigned with premium dark navy/blue visual system:
 * - Self Aura branding header
 * - Welcome message
 * - Glass-like form container
 * - Modern input fields with icons
 * - Remember me / Forgot password
 * - Primary gradient Sign In button
 * - Polished error/loading states
 * - Brand footer
 * - Subtle background decoration
 */
export default function LoginScreen() {
  const { setSession } = useAuth();
  const { theme } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Animation for screen entrance
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const hasAnimated = useRef(false);

  const animateEntrance = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Trigger animation on mount
  useEffect(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true;
      animateEntrance();
    }
  }, [animateEntrance]);

  const validate = () => {
    const errors: Record<string, string[]> = {};
    if (!username.trim()) {
      errors.username = ['Username is required'];
    }
    if (!password) {
      errors.password = ['Password is required'];
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const response = await apiClient.post<ApiEnvelope<AuthSession>>('/auth/login', {
        username: username.trim(),
        password,
      });
      await setSession(response.data);
    } catch (err) {
      if (isApiError(err) && err.errors) {
        setFieldErrors(err.errors);
      }
      setFormError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const usernameError = fieldErrors.username?.[0];
  const passwordError = fieldErrors.password?.[0];

  return (
    <Screen
      safeTop
      keyboardAvoiding
      scroll
      style={styles.screen}
    >
      <View style={styles.backgroundDecoration} />

      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
          {/* Background decorative shapes */}
          <View style={styles.topGlow} />
          <View style={styles.bottomWave} />

          {/* 1. BRANDING HEADER */}
          <View style={styles.brandHeader}>
            <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="sparkles" size={32} color={theme.colors.onPrimary} />
            </View>
            <Text variant="display" tone="default" style={styles.brandTitle}>
              Self Aura
            </Text>
            <Text variant="body" tone="muted" style={styles.brandSubtitle}>
              Management App
            </Text>
          </View>

          {/* 2. WELCOME SECTION */}
          <View style={styles.welcomeSection}>
            <Text variant="display" tone="default" style={styles.welcomeTitle}>
              Welcome Back{' '}
              <Text tone="primary" style={styles.welcomeAccent}>
                👋
              </Text>
            </Text>
            <Text variant="body" tone="secondary" style={styles.welcomeDescription}>
              Sign in to your management account to continue.
            </Text>
          </View>

          {/* 3. LOGIN FORM CONTAINER */}
          <Card style={styles.formCard} padded={false}>
            <View style={styles.formContent}>
              {/* Error Banner */}
              {formError ? (
                <View
                  style={[
                    styles.errorContainer,
                    {
                      backgroundColor: theme.colors.dangerSoft,
                      borderColor: theme.colors.danger,
                    },
                  ]}
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                >
                  <View style={styles.errorRow}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={theme.iconSizes.md}
                      color={theme.colors.danger}
                      style={styles.errorIcon}
                    />
                    <Text variant="bodySmall" tone="danger" style={styles.errorText}>
                      {formError}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Username Input */}
              <Input
                label="Username"
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  if (fieldErrors.username) {
                    setFieldErrors((prev) => ({ ...prev, username: [] }));
                  }
                }}
                error={usernameError}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                returnKeyType="next"
                leadingIcon="person-outline"
                placeholder="Enter your username"
              />

              {/* Password Input */}
              <Input
                label="Password"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: [] }));
                  }
                }}
                error={passwordError}
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                leadingIcon="lock-closed-outline"
                placeholder="Enter your password"
                secure={true}
              />

              {/* Remember Me + Forgot Password */}
              <View style={styles.rememberForgotRow}>
                <View style={styles.rememberMeContainer}>
                  <Checkbox
                    label="Remember me"
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                  />
                </View>
                <View style={styles.forgotPasswordContainer}>
                  <Button
                    title="Forgot password?"
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      // Forgot password functionality - if backend supports it,
                      // this would navigate to a password reset flow.
                      // Currently keeping existing behavior (no-op if not implemented).
                    }}
                    accessibilityLabel="Forgot password"
                  />
                </View>
              </View>

              {/* Sign In Button */}
              <Button
                title={isSubmitting ? 'Signing in...' : 'Sign In'}
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting || !username.trim() || !password}
                variant="primary"
                size="lg"
                fullWidth
                icon="log-in-outline"
                style={styles.signInButton}
              />
            </View>
          </Card>

          {/* 4. BRAND FOOTER */}
          <View style={styles.footer}>
            <Text variant="caption" tone="muted" style={styles.footerText}>
              BETTER MANAGEMENT  •  BRIGHTER FUTURE
            </Text>
          </View>
        </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#06122B',
  },
  backgroundDecoration: {
    ...StyleSheet.absoluteFill,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xxl,
  },

  // Background decorative shapes
  topGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#3B82F6',
    opacity: 0.08,
    zIndex: 0,
  },
  bottomWave: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#4F46E5',
    opacity: 0.06,
    zIndex: 0,
  },

  // Branding Header
  brandHeader: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    zIndex: 1,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  brandTitle: {
    fontWeight: '800',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  brandSubtitle: {
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Welcome Section
  welcomeSection: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    zIndex: 1,
  },
  welcomeTitle: {
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  welcomeAccent: {
    fontWeight: '800',
  },
  welcomeDescription: {
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
    letterSpacing: 0.2,
  },

  // Form Card
  formCard: {
    zIndex: 1,
    marginTop: spacing.md,
    backgroundColor: 'rgba(11, 29, 61, 0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
  },
  formContent: {
    padding: spacing.xl,
    gap: spacing.lg,
  },

  // Inputs
  input: {
    marginBottom: spacing.xs,
  },

  // Remember Me + Forgot Password
  rememberForgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  rememberMeContainer: {
    flex: 1,
  },
  forgotPasswordContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },

  // Sign In Button
  signInButton: {
    marginTop: spacing.md,
    backgroundColor: 'transparent', // Overridden by gradient in Button
  },

  // Error Container
  errorContainer: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorIcon: {
    marginTop: 1,
  },
  errorText: {
    flex: 1,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    zIndex: 1,
  },
  footerText: {
    letterSpacing: 1.2,
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.7,
  },
});