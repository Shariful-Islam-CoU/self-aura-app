/**
 * DEV ONLY - design-system showcase.
 *
 * Visually validates the reusable theme + component library before real
 * business screens are built. Every piece of data here is static; nothing
 * calls the API, and no business logic lives in this file.
 *
 * Removal (or keep as a dev tool): delete this file, the `Tabs.Screen`
 * entry in `(tabs)/_layout.tsx`, and the "Development" link in `more.tsx`.
 */
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { EmptyState, ErrorState, LoadingState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import {
  Avatar,
  Badge,
  BottomSheet,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  Divider,
  IconButton,
  Input,
  ListItem,
  Radio,
  SearchInput,
  SectionHeader,
  Select,
  Switch,
  Text,
} from '@/components/ui';
import { useTheme, useToast, type ThemeMode } from '@/providers';
import { radius, resolveStatusTone, spacing, type ThemeColors, type TextVariant } from '@/theme';
import { formatCurrency } from '@/utils';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const SWATCHES: { key: keyof ThemeColors; label: string }[] = [
  { key: 'background', label: 'background' },
  { key: 'surface', label: 'surface' },
  { key: 'surfaceElevated', label: 'surfaceElevated' },
  { key: 'surfaceMuted', label: 'surfaceMuted' },
  { key: 'border', label: 'border' },
  { key: 'primary', label: 'primary' },
  { key: 'primaryPressed', label: 'primaryPressed' },
  { key: 'primarySoft', label: 'primarySoft' },
  { key: 'success', label: 'success' },
  { key: 'successSoft', label: 'successSoft' },
  { key: 'warning', label: 'warning' },
  { key: 'warningSoft', label: 'warningSoft' },
  { key: 'danger', label: 'danger' },
  { key: 'dangerSoft', label: 'dangerSoft' },
  { key: 'info', label: 'info' },
  { key: 'infoSoft', label: 'infoSoft' },
  { key: 'text', label: 'text' },
  { key: 'textSecondary', label: 'textSecondary' },
  { key: 'textMuted', label: 'textMuted' },
  { key: 'overlay', label: 'overlay' },
];

const TYPE_SPECIMENS: { variant: TextVariant; sample: string }[] = [
  { variant: 'display', sample: 'Display' },
  { variant: 'h1', sample: 'Heading 1' },
  { variant: 'h2', sample: 'Heading 2' },
  { variant: 'h3', sample: 'Heading 3' },
  { variant: 'title', sample: 'Title' },
  { variant: 'subtitle', sample: 'Subtitle' },
  { variant: 'body', sample: 'Body - the default reading size for lists and prose.' },
  { variant: 'bodyMedium', sample: 'Body medium - emphasised rows and values' },
  { variant: 'bodySmall', sample: 'Body small - supporting lines inside rows' },
  { variant: 'caption', sample: 'Caption - metadata and timestamps' },
  { variant: 'label', sample: 'LABEL - FIELD AND BADGE LABELS' },
  { variant: 'button', sample: 'Button' },
];

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const PAYMENT_STATUSES = ['Pending', 'Submitted', 'Verified', 'Rejected'];
const STOCK_STATUSES = ['In Stock', 'Low Stock', 'Out of Stock'];
const RETURN_STATUSES = ['Requested', 'Approved', 'Received', 'Refunded', 'Completed'];

function ShowcaseSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} subtitle={subtitle} />
      <View style={styles.block}>{children}</View>
    </View>
  );
}

function StatusRow({ label, statuses }: { label: string; statuses: string[] }) {
  return (
    <View style={styles.statusRow}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <View style={styles.wrap}>
        {statuses.map((status) => (
          <Badge key={status} label={status} tone={resolveStatusTone(status)} />
        ))}
      </View>
    </View>
  );
}

export default function DesignSystemScreen() {
  const router = useRouter();
  const { theme, mode, setTheme } = useTheme();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [email, setEmail] = useState('');
  const [size, setSize] = useState<string | null>('medium');
  const [archived, setArchived] = useState(true);
  const [priority, setPriority] = useState('normal');
  const [notify, setNotify] = useState(true);
  const [filter, setFilter] = useState('all');
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const runLoadingDemo = () => {
    setLoadingDemo(true);
    setTimeout(() => setLoadingDemo(false), 1600);
  };

  const confirmDiscard = () => {
    setConfirming(true);
    setTimeout(() => {
      setConfirming(false);
      setDialogOpen(false);
      toast.warning('Changes discarded');
    }, 1000);
  };

  return (
    <Screen>
      {/* The feature-header pattern: back button + title (this screen pushes
          onto the tab stack). */}
      <AppHeader variant="feature" title="Design system" onBack={() => router.back()} />

      <ShowcaseSection title="Theme" subtitle="Persisted light / dark / system preference">
        <View style={styles.wrap}>
          {THEME_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={mode === option.value}
              onPress={() => setTheme(option.value)}
            />
          ))}
        </View>
        <Text variant="caption" tone="muted">
          Resolved mode: {theme.mode} - tokens never leak into components.
        </Text>
      </ShowcaseSection>

      <ShowcaseSection title="Colors" subtitle="Semantic tokens - never raw values in components">
        <View style={styles.swatchGrid}>
          {SWATCHES.map((swatch) => (
            <View key={swatch.key} style={styles.swatch}>
              <View style={[styles.swatchChip, { backgroundColor: theme.colors[swatch.key] }]} />
              <View style={styles.swatchText}>
                <Text variant="caption" numberOfLines={1}>
                  {swatch.label}
                </Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {theme.colors[swatch.key]}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ShowcaseSection>

      <ShowcaseSection title="Typography" subtitle="Semantic variants on a shared scale">
        {TYPE_SPECIMENS.map((specimen) => (
          <View key={specimen.variant} style={styles.specimen}>
            <Text variant="caption" tone="muted" style={styles.specimenName}>
              {specimen.variant}
            </Text>
            <Text variant={specimen.variant} style={styles.specimenSample}>
              {specimen.sample}
            </Text>
          </View>
        ))}
        <View style={styles.specimen}>
          <Text variant="caption" tone="muted" style={styles.specimenName}>
            numeric
          </Text>
          <Text variant="numeric" style={styles.specimenSample}>
            {formatCurrency(128400)}
          </Text>
        </View>
        <Text variant="caption" tone="muted">
          numeric/stat uses tabular figures - prices and totals align in columns.
        </Text>
      </ShowcaseSection>

      <ShowcaseSection title="Spacing, radius, elevation">
        <View style={styles.wrap}>
          {Object.entries(spacing).map(([name, value]) => (
            <View key={name} style={styles.tokenPill}>
              <View
                style={[styles.spacingBar, { width: value, backgroundColor: theme.colors.primary }]}
              />
              <Text variant="caption" tone="muted">
                {name} {value}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.wrap}>
          {(['sm', 'md', 'lg', 'xl', 'pill'] as const).map((corner) => (
            <View key={corner} style={styles.tokenColumn}>
              <View
                style={[
                  styles.radiusBox,
                  { borderRadius: radius[corner], borderColor: theme.colors.border },
                ]}
              />
              <Text variant="caption" tone="muted">
                {corner}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.wrap}>
          {(['sm', 'md', 'lg'] as const).map((level) => (
            <View key={level} style={styles.tokenColumn}>
              <View
                style={[
                  styles.elevationBox,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: radius.lg,
                  },
                  theme.shadows[level],
                ]}
              />
              <Text variant="caption" tone="muted">
                {level}
              </Text>
            </View>
          ))}
        </View>
        <Text variant="caption" tone="muted">
          Dark mode relies on borders + subtle shadow instead of large glows.
        </Text>
      </ShowcaseSection>

      <ShowcaseSection title="Buttons" subtitle="Variants, sizes, disabled and loading">
        <View style={styles.wrap}>
          <Button title="Primary" onPress={() => toast.info('Primary pressed')} />
          <Button
            title="Secondary"
            variant="secondary"
            onPress={() => toast.info('Secondary pressed')}
          />
          <Button title="Outline" variant="outline" onPress={() => toast.info('Outline pressed')} />
          <Button title="Ghost" variant="ghost" onPress={() => toast.info('Ghost pressed')} />
          <Button title="Danger" variant="danger" onPress={() => toast.warning('Danger pressed')} />
          <Button
            title="Success"
            variant="success"
            onPress={() => toast.success('Success pressed')}
          />
        </View>
        <View style={styles.wrap}>
          <Button title="Small" size="sm" variant="secondary" onPress={runLoadingDemo} />
          <Button title="Medium" size="md" variant="secondary" onPress={runLoadingDemo} />
          <Button title="Large" size="lg" variant="secondary" onPress={runLoadingDemo} />
          <Button title="With icon" icon="add-outline" variant="outline" onPress={runLoadingDemo} />
          <Button title="Disabled" variant="secondary" disabled onPress={runLoadingDemo} />
          <Button
            title="Loading"
            variant="primary"
            loading={loadingDemo}
            onPress={runLoadingDemo}
          />
        </View>
        <Text variant="caption" tone="muted">
          Loading blocks presses so a slow tap cannot submit twice.
        </Text>
      </ShowcaseSection>

      <ShowcaseSection title="Inputs" subtitle="Label, required, error, helper, disabled, keyboard">
        <Card>
          <View style={styles.block}>
            <Input
              label="Email"
              required
              placeholder="name@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              helperText="We never share your email."
            />
            <Input label="Password" required secure error="Password is required" />
            <Input label="Notes" placeholder="Multiline input" multiline />
            <Input label="Disabled" value="Read only value" editable={false} />
            <SearchInput value={query} onValueChange={setQuery} label="Search components" />
            <Select
              label="Size"
              value={size}
              onChange={setSize}
              options={[
                { label: 'Small', value: 'small' },
                { label: 'Medium', value: 'medium' },
                { label: 'Large (unavailable)', value: 'large', disabled: true },
              ]}
              helperText="Tap to open the bottom sheet picker."
            />
            <Divider />
            <Checkbox
              label="Include archived items"
              checked={archived}
              onCheckedChange={setArchived}
            />
            <View>
              <Text variant="label" tone="secondary">
                PRIORITY
              </Text>
              <Radio
                label="Low"
                selected={priority === 'low'}
                onSelect={() => setPriority('low')}
              />
              <Radio
                label="Normal"
                selected={priority === 'normal'}
                onSelect={() => setPriority('normal')}
              />
            </View>
            <Switch
              label="Notify me about status changes"
              value={notify}
              onValueChange={setNotify}
            />
          </View>
        </Card>
      </ShowcaseSection>

      <ShowcaseSection title="Cards">
        <Card>
          <View style={styles.block}>
            <Text variant="label" tone="muted">
              TODAY&apos;S SALES
            </Text>
            <View style={styles.statRow}>
              <Text variant="numeric">{formatCurrency(128400)}</Text>
              <Badge label="+12.5%" tone="success" />
            </View>
            <Text variant="caption" tone="muted">
              vs yesterday (static showcase data)
            </Text>
          </View>
        </Card>
        <Card onPress={() => toast.info('Card pressed')}>
          <View style={styles.statRow}>
            <View style={styles.statText}>
              <Text variant="bodyMedium">Pressable card</Text>
              <Text variant="bodySmall" tone="secondary">
                Tapping a card gives subtle scale + opacity feedback.
              </Text>
            </View>
            <IconButton
              icon="chevron-forward"
              accessibilityLabel="Open"
              onPress={() => toast.info('Trailing action pressed')}
            />
          </View>
        </Card>
      </ShowcaseSection>

      <ShowcaseSection title="Badges" subtitle="Domain statuses map onto semantic tones">
        <StatusRow label="ORDER" statuses={ORDER_STATUSES} />
        <StatusRow label="PAYMENT" statuses={PAYMENT_STATUSES} />
        <StatusRow label="INVENTORY" statuses={STOCK_STATUSES} />
        <StatusRow label="RETURN" statuses={RETURN_STATUSES} />
        <View style={styles.wrap}>
          <Badge label="Soft" tone="success" variant="soft" />
          <Badge label="Solid" tone="success" variant="solid" />
          <Badge label="Outline" tone="success" variant="outline" />
          <Badge label="Neutral" />
        </View>
      </ShowcaseSection>

      <ShowcaseSection title="Chips" subtitle="Selectable filters and removable tags">
        <View style={styles.wrap}>
          {['all', 'active', 'archived'].map((option) => (
            <Chip
              key={option}
              label={option.charAt(0).toUpperCase() + option.slice(1)}
              selected={filter === option}
              onPress={() => setFilter(option)}
            />
          ))}
          <Chip label="Dhaka" tone="info" onRemove={() => toast.info('Filter chip removed')} />
          <Chip label="Static tag" tone="warning" />
        </View>
      </ShowcaseSection>

      <ShowcaseSection title="Lists" subtitle="One row language for every future list">
        <Card padded={false}>
          <ListItem
            title="Order #1024"
            subtitle="Nabila Rahman - 3 items"
            meta="07 Oct 2026, 16:30"
            leading={{ icon: 'cart-outline' }}
            status={{ label: 'Processing', tone: resolveStatusTone('Processing') }}
            trailing={<Text variant="bodyMedium">{formatCurrency(4500)}</Text>}
            onPress={() => toast.info('Row pressed')}
            divider
          />
          <ListItem
            title="Ayesha Khan"
            subtitle="Customer since 2024"
            leading={{ initials: 'AK' }}
            status={{ label: 'Active', tone: 'success' }}
            onPress={() => toast.info('Row pressed')}
            divider
          />
          <ListItem
            title="Rahim Stores"
            subtitle="Supplier"
            meta="2 open purchases"
            leading={{ icon: 'business-outline' }}
            onPress={() => toast.info('Row pressed')}
          />
        </Card>
        <View style={styles.wrap}>
          <Avatar name="Self Aura" size="sm" />
          <Avatar name="Nabila Rahman" size="md" />
          <Avatar name="Ayesha Khan" size="lg" status="success" />
        </View>
      </ShowcaseSection>

      <ShowcaseSection title="States" subtitle="Loading -> success -> empty -> error">
        <Text variant="caption" tone="muted">
          Loading (list skeleton)
        </Text>
        <LoadingState rows={3} />
        <Text variant="caption" tone="muted">
          Loading (compact spinner)
        </Text>
        <LoadingState variant="spinner" label="Refreshing" />
        <EmptyState
          icon="cart-outline"
          title="No orders yet"
          description="Orders will appear here when customers place them."
          actionLabel="Create order"
          onAction={() => toast.info('Showcase only - no action')}
        />
        <ErrorState
          message="Please try again."
          onRetry={() => toast.info('Retried (showcase only)')}
        />
      </ShowcaseSection>

      <ShowcaseSection title="Feedback" subtitle="Toasts for results, dialog for decisions">
        <View style={styles.wrap}>
          <Button
            title="Success"
            variant="success"
            size="sm"
            onPress={() => toast.success('Product saved successfully')}
          />
          <Button
            title="Error"
            variant="danger"
            size="sm"
            onPress={() => toast.error('Payment verification failed')}
          />
          <Button
            title="Warning"
            variant="outline"
            size="sm"
            onPress={() => toast.warning('Stock is running low')}
          />
          <Button
            title="Info"
            variant="ghost"
            size="sm"
            onPress={() => toast.info('Report is being generated')}
          />
        </View>
        <View style={styles.wrap}>
          <Button title="Open dialog" variant="outline" onPress={() => setDialogOpen(true)} />
          <Button title="Open bottom sheet" variant="outline" onPress={() => setSheetOpen(true)} />
        </View>
      </ShowcaseSection>

      <ShowcaseSection
        title="Header pattern"
        subtitle="Dashboard variant - Home tab renders it through AppHeader"
      >
        <Card padded={false}>
          <View style={styles.headerDemo}>
            <View style={styles.statText}>
              <Text variant="caption" tone="muted">
                Good morning
              </Text>
              <Text variant="h2">Self Aura</Text>
            </View>
            <IconButton
              icon="notifications-outline"
              accessibilityLabel="Notifications"
              filled
              onPress={() => toast.info('No new notifications')}
            />
            <Avatar name="Aura Admin" size="sm" status="success" />
          </View>
        </Card>
        <Text variant="caption" tone="muted">
          Bottom navigation: the live tab bar below this screen (soft active pill, hairline border,
          5 tabs max - the rest lives behind More).
        </Text>
      </ShowcaseSection>

      <ShowcaseSection
        title="Navigation (dev)"
        subtitle="Typed ID params - details fetch by ID, never whole objects"
      >
        <View style={styles.wrap}>
          <Button
            title="Order details"
            variant="outline"
            size="sm"
            onPress={() =>
              router.push({ pathname: '/orders/[orderId]', params: { orderId: '1024' } })
            }
          />
          <Button
            title="Product details"
            variant="outline"
            size="sm"
            onPress={() =>
              router.push({ pathname: '/products/[productId]', params: { productId: '1024' } })
            }
          />
          <Button
            title="Edit product"
            variant="outline"
            size="sm"
            onPress={() =>
              router.push({
                pathname: '/products/[productId]/edit',
                params: { productId: '1024' },
              })
            }
          />
          <Button
            title="New product"
            variant="outline"
            size="sm"
            onPress={() => router.push('/products/new')}
          />
          <Button
            title="Customer details"
            variant="outline"
            size="sm"
            onPress={() =>
              router.push({
                pathname: '/customers/[customerId]',
                params: { customerId: '1024' },
              })
            }
          />
          <Button
            title="Notifications"
            variant="outline"
            size="sm"
            onPress={() => router.push('/notifications')}
          />
          <Button
            title="Profile"
            variant="outline"
            size="sm"
            onPress={() => router.push('/profile')}
          />
        </View>
        <Text variant="caption" tone="muted">
          Each push lands on a placeholder route; Android back retraces the exact stack (Edit →
          Details → List).
        </Text>
      </ShowcaseSection>

      <Dialog
        visible={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Discard changes?"
        message="Your edits will not be saved."
        secondaryAction={{ label: 'Cancel' }}
        primaryAction={{
          label: 'Discard',
          variant: 'danger',
          loading: confirming,
          onPress: confirmDiscard,
        }}
      />

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Sheet actions">
        <View style={styles.block}>
          <ListItem
            title="First option"
            leading={{ icon: 'document-outline' }}
            onPress={() => {
              setSheetOpen(false);
              toast.info('First option chosen');
            }}
            divider
          />
          <ListItem
            title="Second option"
            leading={{ icon: 'share-outline' }}
            onPress={() => {
              setSheetOpen(false);
              toast.info('Second option chosen');
            }}
          />
          <Button title="Close" variant="ghost" onPress={() => setSheetOpen(false)} />
        </View>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  block: {
    gap: spacing.md,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '47%',
  },
  swatchChip: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.4)',
  },
  swatchText: {
    flex: 1,
  },
  specimen: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'baseline',
  },
  specimenName: {
    width: 76,
  },
  specimenSample: {
    flex: 1,
  },
  tokenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'transparent',
  },
  spacingBar: {
    height: 16,
    borderRadius: 4,
  },
  tokenColumn: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  radiusBox: {
    width: 48,
    height: 48,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  elevationBox: {
    width: 64,
    height: 48,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statText: {
    flex: 1,
    gap: 2,
  },
  statusRow: {
    gap: spacing.xs,
  },
  headerDemo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
});
