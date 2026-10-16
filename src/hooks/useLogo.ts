import type { ImageSourcePropType } from 'react-native';

import { useTheme } from '@/providers';

const logoLight = require('../../assets/logo_light.png');
const logoDark = require('../../assets/logo_dark.png');

/**
 * Theme-aware brand logo. Dark mode renders `logo_dark.png`, light mode
 * renders `logo_light.png` - the same asset pair the product ships, so the
 * mark always contrasts with the surface behind it. Consumed by the login
 * screen and the dashboard (Home) header.
 */
export function useLogo(): ImageSourcePropType {
  const { resolvedMode } = useTheme();
  return resolvedMode === 'dark' ? logoDark : logoLight;
}
