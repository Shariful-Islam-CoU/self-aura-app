import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Image,
  StyleSheet,
  View,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, Card, Input, Text } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { useAuth, useTheme } from '@/providers';
import { apiClient, getErrorMessage, isApiError, type ApiEnvelope } from '@/api';
import { spacing, radius, fontFamilies } from '@/theme';
import { useLogo } from '@/hooks/useLogo';
import type { AuthSession } from '@/features/auth';

/**
 * Login screen - authenticates against the existing self_aura_backend
 * (POST /auth/login). No shell preview; real session via setSession.
 *
 * Layout: Self Aura brand logo + wordmark, welcome message, and a form
 * card. Every surface/text color comes from the theme tokens, so the screen
 * reads correctly in both light and dark mode; decorative glows use the
 * primary color at low opacity. The mark follows the theme via `useLogo`
 * (logo_light.png / logo_dark.png).
 */
export default function LoginScreen() {
  const { setSession } = useAuth();
  const { theme } = useTheme();
  const logo = useLogo();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    <Screen safeTop keyboardAvoiding scroll>
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
        <View style={[styles.topGlow, { backgroundColor: theme.colors.primary }]} />
        <View style={[styles.bottomWave, { backgroundColor: theme.colors.primary }]} />

        {/* 1. BRANDING HEADER */}
        <View style={styles.brandHeader}>
          <Image
            source={logo}
            style={styles.logo}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="Self Aura logo"
          />
          <Text numberOfLines={1} style={styles.brandTitle}>
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
        <Card style={[styles.formCard, theme.shadows.lg]} padded={false}>
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
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
  },
  brandTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: fontFamilies.display,
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

  // Form Card (surface/border/shadow come from the themed `Card`)
  formCard: {
    zIndex: 1,
    marginTop: spacing.md,
  },
  formContent: {
    padding: spacing.xl,
    gap: spacing.lg,
  },

  // Sign In Button
  signInButton: {
    marginTop: spacing.md,
  },

  // Error Container
  errorContainer: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
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
