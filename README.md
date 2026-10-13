# Self Aura Management App (Mobile)

Cross-platform mobile client for the Self Aura management system, built with
**Expo (React Native + TypeScript)**. It talks to the **same backend and API
contracts as the web app** (`self_aura_backend` + `self_aura_frontend`) - no
new endpoints, no duplicated business logic, no local mock data.

> **Status: Step 18 - Payments management complete.** On top of the earlier
> steps (API layer, sign-in, permissions, Dashboard, and the Operations modules
> with server-side search/filters/sort/pagination and backend-validated
> writes), the mobile app now covers Orders (details, status updates +
> cancellation), Customers (search/status filter/sort, backend-computed
> statistics, forms and deactivation), Categories (forms, soft deactivation and
> thumbnail/banner media), Products (server-driven list, create/edit forms with
> backend-authoritative duplicate-SKU 409s, detail sections and full image/video
> media management through the backend media API), Inventory (stock views and
> backend-validated adjustments), Suppliers (directory with search/filter/sort,
> forms and deactivation), Purchases (purchase orders with the draft ->
> receive/cancel workflow) and Expenses (server-driven list, category manager,
> backend-computed summary, forms, confirmed soft delete). Step 18 adds the
> **Payments** module in its own `payments` stack (More > Finance): a
> server-driven ledger list (search across payment/reference/order number,
> method + status + type + date-range filters, 8 sort options, infinite
> pagination, pull-to-refresh) with the backend-computed summary
> (`GET /payments/summary`) shown for `payments.view`, details that render the
> payment, manual bKash/Nagad verification lifecycle, refund context, the
> related order (loaded through the Orders module), customer, notes and audit,
> plus backend-authoritative actions: record a payment against a searched
> order, edit, refund, cancel, and manual-payment **verify/reject** (a
> transaction id is never treated as verified client-side - only the backend's
> `payments.verify`/`payments.reject` decide). Payment records, numbers,
> statuses, ledger math and refundable limits all come from the backend; the
> app never fabricates payment data or recalculates totals. Payment settings
> (`GET/PATCH /settings/payments`) belong to the Settings module's architecture
> and are intentionally not duplicated here. Other business modules remain
> placeholders (see [Roadmap](#roadmap-step-19)).

## Stack

| Concern       | Choice                                                            |
| ------------- | ----------------------------------------------------------------- |
| Runtime       | Expo SDK 57 (React Native 0.86, React 19.2)                       |
| Language      | TypeScript ~6.0, `strict` + `noUnusedLocals`                      |
| Navigation    | Expo Router 57 (file-based, typed routes)                         |
| Server state  | TanStack Query v5                                                 |
| Local/session | `expo-secure-store` (JWT) + AsyncStorage (user cache, theme mode) |
| Styling       | React Native `StyleSheet` driven by design tokens (no web CSS)    |
| Icons         | Ionicons via `@expo/vector-icons`                                 |
| Lint / format | ESLint 9 (`eslint-config-expo`) + Prettier                        |

Runs in **Expo Go** - no custom native modules are used.

## Getting started

```bash
cd self_aura_app
npm install            # or: npm ci
cp .env.example .env   # then set EXPO_PUBLIC_API_URL for your environment
npx expo start         # dev server; scan the QR code with Expo Go
```

Scripts: `npm start`, `npm run android`, `npm run ios`, `npm run lint`,
`npm run typecheck`, `npm run format`.

### Configuring the API URL

The app reads `EXPO_PUBLIC_API_URL` (must include the `/api` prefix) from
`.env` via `src/config/env.ts`:

| Environment      | Value                                     |
| ---------------- | ----------------------------------------- |
| iOS simulator    | `http://localhost:5000/api`               |
| Android emulator | `http://10.0.2.2:5000/api` (host machine) |
| Physical device  | `http://<your-LAN-IP>:5000/api`           |

`EXPO_PUBLIC_*` values are inlined into the **public** JS bundle. They are not
secrets: never put JWT secrets, DB credentials, Cloudinary/payment keys, or
anything from `self_aura_backend/.env` into this app's environment files.

## Architecture

```
src/
  app/                  # Expo Router routes ONLY (every file = a screen)
    _layout.tsx         # providers + protected root navigator + splash gate
    (auth)/             # unauthenticated stack (real sign-in form)
    (main)/             # authenticated stack
      _layout.tsx       # pushes: (tabs), categories, inventory, suppliers,
                        #         purchases, expenses, module/[key],
                        #         notifications, profile
      notifications.tsx # notification centre placeholder (header bell)
      profile.tsx       # profile placeholder (More > Account)
      categories/       #   categories stack (More > Operations):
        index.tsx       #   list (alphabetical; backend has no search/filter)
        new.tsx         #   create (name + description; lands in edit for media)
        [categoryId]/   #   details (overview + image preview + actions)
          index.tsx     #   deactivate is confirmed, backend soft delete
          edit.tsx      #   edit form + isActive + thumbnail/banner managers
      inventory/        #   inventory stack (More > Operations): list + per-product
                        #   stock detail + history + backend-validated adjustment
      suppliers/        #   suppliers stack (More > Operations): list + details +
                        #   create/edit (backend soft deactivation)
      purchases/        #   purchases stack (More > Operations): server-driven list
                        #   + details + create/edit + receive/cancel workflow
      expenses/         #   expenses stack (More > Operations):
        index.tsx       #   list (search, category/method/date filters, 8 sorts,
                        #   infinite pagination, pull-to-refresh, summary strip)
        categories.tsx  #   expense-category manager (create/edit/deactivate)
        new.tsx         #   record-expense form (date picker, category selector)
        [expenseId]/    #   details (overview/description/notes/audit + actions)
          index.tsx     #   confirmed soft delete
          edit.tsx      #   edit form
      (tabs)/           # bottom tabs, each feature owns a nested stack:
        index.tsx       #   Home = Dashboard (permission-gated, TanStack Query)
        orders/         #   _layout (stack) + index (list) + [orderId] (details)
        products/       #   Products stack (server-driven list + forms + detail):
          index.tsx     #   list (search name/SKU/description, category + status
                        #   filters, 8 sorts, infinite pagination, pull-to-refresh)
          new.tsx       #   create (lands in edit for media when products.edit)
          [productId]/  #   details (overview/pricing/inventory/images + actions)
            index.tsx   #   deactivate = backend soft delete, confirmed via dialog
            edit.tsx    #   edit form + isActive + image/video media managers
        customers/      #   _layout (stack) + index (list) + new (create form)
        customers/[customerId]/index   # customer details
        customers/[customerId]/edit    # edit form
        more.tsx        #   grouped module catalog + account + appearance
        design-system.tsx # dev-only showcase (hidden from the tab bar)
      module/[key].tsx  # generic route behind every module entry
  api/                  # the app's single HTTP layer
    client.ts           # envelope, Bearer, timeout, 401, dev-only logging,
                        # JSON methods + multipart `upload()` (FormData)
    errors.ts           # ApiError kinds (+ backend code), getErrorMessage
    types.ts            # wire contract (envelope, pagination, ApiError)
    health.ts/utils.ts  # connectivity + dev helpers
    endpoints.ts        # endpoint scaffold
  components/
    ui/                 # Text, Button, Input, SearchInput, Select, DateField,
                        # Checkbox, Switch, Radio, Card, Badge, Chip, Divider,
                        # IconButton, Avatar, ListItem, SectionHeader, Skeleton,
                        # Dialog, BottomSheet (+ shared press-feedback helper)
    layout/             # Screen (safe area/keyboard/footer/pull-to-refresh),
                        # AppHeader, Container
    feedback/           # LoadingIndicator, LoadingState, EmptyState, ErrorState
    common/             # ModulePlaceholder, FeaturePlaceholder (temporary),
                        # PermissionGate / AnyPermissionGate / AllPermissionGate
  config/env.ts         # public runtime config (EXPO_PUBLIC_*)
  constants/            # app-wide constants (ROLES, PAGINATION)
  features/
    auth/               # session storage abstraction (SecureStore + cache)
    categories/         # categories types + service + TanStack Query hooks +
                        # labels + card/skeleton/form + media managers
                        # (thumbnail & banner: upload/replace/remove/alt via
                        # the backend media API) + detail sections + preview
    customers/          # customers types + service + TanStack Query hooks +
                        # labels + list/detail/order-history/statistics/form
                        # components (create/edit + deactivate actions)
    products/           # products types + service + TanStack Query hooks +
                        # labels + server-driven list (search/filters/sorts/
                        # pagination) + create/edit form + detail sections
                        # (overview/pricing/inventory/images) + image/video
                        # media managers (upload/reorder/primary/alt/remove
                        # via the backend media API) + full-screen preview
    inventory/          # inventory types + service + TanStack Query hooks +
                        # labels + list/detail/stock-history + adjustment form
    suppliers/          # suppliers types + service + TanStack Query hooks +
                        # labels + list/detail/form + deactivation
    purchases/          # purchases types + service + TanStack Query hooks +
                        # labels + list/detail/form + receive/cancel actions
    expenses/           # expenses types + services (expenses + categories) +
                        # TanStack Query hooks + labels + list card/skeleton/
                        # detail sections/summary + create/edit form + filters
                        # sheet + category manager dialog (Step 17)
    payments/           # payments types + service + TanStack Query hooks +
                        # labels + list card/skeleton/summary + filters sheet +
                        # create/edit form + order picker + detail sections +
                        # verify/reject/refund/cancel dialogs (Step 18)
    dashboard/          # dashboard types + service + TanStack Query hooks +
                        # section components (KPIs, sales trend, recent
                        # orders, low stock, skeleton)
    orders/             # orders types + service + TanStack Query hooks +
                        # labels/tone maps + list/detail sections (cards,
                        # filters sheet, skeletons, actions)
  hooks/                # usePermissions (Step 7) + useDebouncedValue (search)
  navigation/           # module catalog + tabs + RootNavigator
  providers/            # SafeArea/Query/Theme/Toast/Auth providers
  store/                # TanStack Query queryClient
  theme/                # design tokens (colors light/dark, type, spacing,
                        # radius, elevation) + semantic status tones
  types/                # cross-cutting types (IconName, PermissionKey, ...)
  utils/                # format, validation, color helpers
```

### Navigation

- Expo Router file-based routes; route groups `(auth)` / `(main)` are split by
  `Stack.Protected` guards in `src/navigation/RootNavigator.tsx`. Guard flips
  (login/logout/401) redirect automatically - no manual bookkeeping.
- `src/navigation/modules.ts` mirrors the web sidebar
  (`self_aura_frontend/src/constants/navigation.ts`): same groups, labels and
  **permission keys**. Visibility is UX-only; the backend stays the
  authorization source of truth (a stale grant surfaces as a 403, never a
  silent allow).
- 5 bottom tabs max (platform guidance). Everything else, inventory included,
  is one tap away on the **More** tab, which lists all permitted modules and
  routes implemented modules to their dedicated stack (`module.route`) while
  the rest keep the shared `/module/[key]` placeholder.

### Feature modules (convention)

- Features are created **on demand**: `src/features/<name>/` appears only when
  that feature is actually built - never pre-created empty folders. Today
  `auth` (session), `dashboard`, `orders`, `customers`, `categories`,
  `products`, `inventory`, `suppliers`, `purchases`, `expenses` and `payments`
  exist.
- A feature owns its API calls (`api/`), UI (`components/`), hooks (`hooks/`),
  types (`types.ts`) and client-side validation, and exports through a single
  `index.ts`.
- Endpoint paths live **next to the feature that calls them** - there is
  deliberately no central endpoint list that can drift.
- Route files in `src/app/` stay thin: they compose feature components/hooks;
  business logic never lives in a route file.

### State & server-state rules

- **Server state:** TanStack Query only.
  - Screens use query hooks; they never call the API client directly.
  - Defaults: `staleTime` 30 s, `gcTime` 5 min; mutations invalidate queries
    instead of hand-patching cached copies.
  - Retries: up to 2 attempts - never for `cancelled` or any 4xx.
  - `QueryProvider` bridges `AppState` to the query `focusManager`, so
    returning to the foreground refetches queries that went stale
    (the mobile equivalent of the web client's refetch-on-focus).
- **Session:** `AuthProvider` (status/user/permissions, global 401 handler,
  `setSession`/`signOut` ready for the real login flow).
- **Theme:** `ThemeProvider` with `light | dark | system` + persisted
  preference (AsyncStorage). Components consume tokens via `useTheme()` - colors
  are never hardcoded in components.
- **Everything else:** component state (forms, dialogs, filters). No Redux.

### Auth & permission boundary

- **Sign-in:** `POST /auth/login` (`{ username, password }`) -> `setSession`
  (`src/app/(auth)/login.tsx`); the plaintext password never leaves the form -
  it is never stored or logged.
- **Session restore:** on launch the cached token/user load immediately and
  `GET /auth/me` revalidates them - a 401 clears the session, any other error
  falls back to the cached user (offline-tolerant). `signOut()` also clears the
  TanStack Query cache so a second account never sees the first one's data.
- JWT is stored in `expo-secure-store`, the cached user in AsyncStorage
  (`src/features/auth/sessionStorage.ts`); an in-memory token mirror feeds the
  API client's `Authorization: Bearer` header.
- Backend auth routes: `register / login / me / change-password /
bootstrap-owner / bootstrap-status`. **There is no forgot-password
  endpoint**, so do not design one.
- The **navigation boundary**: `RootNavigator` splits the route tree into
  `(main)` (authenticated shell, guarded by `Stack.Protected`) and `(auth)`
  (sign-in, guarded by the ABSENCE of a session). Login/logout/401 flips
  redirect automatically - no manual bookkeeping.
- **Permission infrastructure (Step 7):** `usePermissions()` /
  `useHasPermission()` (`src/hooks/usePermissions.ts`) plus the reusable
  `PermissionGate` / `AnyPermissionGate` / `AllPermissionGate` components
  (`src/components/common/PermissionGate.tsx`). Tab and More visibility use the
  same permission keys as the web sidebar. **There is no role -> permission
  mapping in the app** - keys come from the backend catalog; checks are
  UX-only, and the backend re-checks every request (a stale grant surfaces as
  `kind: 'authorization'` 403, never a silent allow).

## Navigation architecture (Expo Router)

```
App launch
  └─ _layout: SplashScreen.preventAutoHide -> providers -> RootNavigator
       ├─ isLoading: splash stays up (native) / loading frame (web)
       ├─ (auth)  Stack.Protected !isSignedIn   login
       └─ (main)  Stack.Protected  isSignedIn
            ├─ (tabs)  5 permission-filtered tabs
            │    ├─ index     Home  (Dashboard: permission-gated reports)
            │    ├─ orders    Stack: /orders            -> /orders/[orderId]
            │    ├─ products  Stack: /products          -> /products/new
            │    │                                     -> /products/[productId]
            │    │                                     -> /products/[productId]/edit
            │    ├─ customers Stack: /customers         -> /customers/[customerId]
            │    ├─ more      grouped module catalog + Account + Appearance
            │    └─ design-system (dev-only, href: null)
            └─ pushed above the tabs:
                 /categories         Categories stack (More > Operations)
                 /categories/new                     -> create form
                 /categories/[categoryId]            -> details
                 /categories/[categoryId]/edit       -> form + media
                 /module/[key]   every unimplemented catalog module (native header)
                 /notifications  header bell target
                 /profile        More > Account
```

- **Guards, not redirects:** `Stack.Protected` (Expo Router) removes a whole
  route group from history when its guard flips, so a 401 anywhere (or a
  logout) lands on login automatically and signing in lands on the shell - no
  manual `router.replace()` bookkeeping.
- **Feature stacks:** Orders, Products, Customers and (pushed, from More)
  Categories each own a nested headerless `Stack`; every screen renders the
  shared `AppHeader` (`onBack={() => router.back()}`) so Android's hardware
  back always retraces the visible chain (Edit -> Details -> List) and never
  exits the app unexpectedly.
- **Typed ID params only:** detail routes take `/orders/[orderId]`,
  `/products/[productId]`, `/customers/[customerId]`,
  `/categories/[categoryId]` - `router.push({ pathname, params })` passes the
  ID, screens fetch by ID; whole objects are never pushed through navigation
  (stale-data guard).
- **Permission-aware entries (UX-only):** tabs are filtered by
  `canAccessTab`, More tiles by `canAccessModule`; the keys mirror the
  backend catalog and there is **no role -> permission mapping in the app**
  (rule 5). Tab-owned modules (Home/Orders/Products/Customers) omit
  `group` and never repeat inside More.
- **More screen:** `SectionHeader` + `Card` + a 2-column tile grid per
  section (Operations / Finance / Delivery / Customer / Administration /
  Account), each tile = tinted icon + title + short description. Never a
  giant flat list. Tiles for implemented modules carry a `route`
  (`module.route`), so Categories pushes its own stack instead of the
  generic placeholder.
- **Startup/splash:** native splash is held until session restore + first
  frame of the correct route group (`RootNavigator` hides it), so the login
  screen never flashes on cold start.
- **Deep linking (prepared, not delivered):** `app.json` declares the
  `selfaura` scheme and every route above is a real path, so
  `selfaura://orders/123` will resolve once the feature exists - no
  architecture change will be needed. This is a foundation only; link
  handling/UI entry points are not built yet.

## Architecture & Development Rules

1. **One source of truth: the existing backend.** This app is a second client
   of `self_aura_backend`. Never invent endpoints, duplicate business logic,
   add local mock data, or modify `self_aura_backend` / `self_aura_frontend`.
   Contracts come from backend source and the web client only.
2. **Feature modules are created on demand.** Business code lives in
   `src/features/<feature>/` and appears only when the feature is built - no
   empty placeholder folders, no speculative files. Routes stay thin in
   `src/app/`.
3. **One API client.** All HTTP goes through `src/api/client.ts` (envelope
   parsing, Bearer header, 15 s timeout, global 401 handling, error
   normalization, dev-only logging). Features never call `fetch` themselves and
   never hardcode a host - the base URL comes from `src/config/env.ts`.
4. **Server state belongs to TanStack Query, the session to AuthProvider,
   everything else to component state.** No server data in a global store;
   mutations invalidate queries instead of patching copies.
5. **The backend is the authorization authority.** `canAccess()` /
   `PermissionKey` only shape UX (visible tabs, disabled buttons) - never
   treat them as a security boundary; every API result is server-checked.
6. **Types follow their owner.** Wire shapes in `src/api/types.ts`, session
   types in `features/auth`, business models next to their feature,
   cross-cutting primitives (`IconName`, `PermissionKey`, `PaginationParams`)
   in `src/types`. One concept = one definition; never type fields that have
   not been verified against the contract.
7. **Failures are classified and contained.** Every request failure is an
   `ApiError` with a `kind` (table below). UI renders text only through
   `getErrorMessage()`; backend 5xx output is never shown in production; logs
   are dev-only and metadata-only (method/endpoint/status/kind - no tokens,
   headers, or bodies).
8. **Every data screen follows loading -> success -> empty -> error.** Each
   state uses the dedicated feedback component; the error state always offers
   a retry; "no data yet" and "no results found" stay visually distinct.
9. **Forms are plain controlled state + local validation; backend validation
   is authoritative.** `useState` + a local `validate()` composed from
   `src/utils/validation.ts`, field errors through `Input error=...`; on
   submit the server's `ApiError.errors` overrides client predictions. No
   form library.
10. **Formatting goes through shared utilities.** Currency, numbers, and dates
    are rendered only via `src/utils/format.ts` (see conventions below),
    verified byte-identical to the web client. No ad-hoc `.toFixed()` or date
    math in screens.
11. **Mobile-first layout and accessibility.** No hardcoded screen sizes -
    flex layouts + `spacing` tokens, `Screen` for safe areas
    (`keyboardAvoiding` on form screens), 44 pt minimum touch targets
    (invisible `hitSlop` where the visual is smaller), every input gets an
    accessible name from its label, field errors are announced
    (`accessibilityLiveRegion`), and meaning is never conveyed by color alone.
12. **Performance foundations.** Intl formatters are created once and reused;
    long lists must use `FlatList` (never `ScrollView` + `.map()`); queries
    refetch on foreground via the AppState bridge; keep heavy work out of
    render paths and keep unbuilt features out of the bundle.
13. **Dependencies are audited, not accumulated.** Expo-managed only
    (`npx expo install`), Expo Go compatible (no custom native modules), and
    every dependency must justify itself (table below).
14. **The design system is the single source of visual truth.** Colors,
    typography, spacing, radius and elevation come from `src/theme` tokens -
    never raw hex/px values in screens. UI is composed from
    `src/components`; a new screen that needs a new visual primitive extends
    the library instead of styling one-off markup. Status colors map to
    semantic tones (`resolveStatusTone`/feature mappers), never to ad-hoc
    per-feature hues.

## Design system

The visual language of every future screen. Rules live in
[Architecture & Development Rules](#architecture--development-rules) rule 14;
this section is the reference.

### Theme architecture

- **Tokens** live in `src/theme/`:
  - `tokens.ts` - semantic colors (light + dark), spacing, radius, control
    heights, typography scale, icon sizes, elevation, `createTheme()`.
  - `status.ts` - `StatusTone` + `resolveStatusTone()` (keyword fallback that
    maps labels like `Pending`/`Out of stock` to tones; features declare
    precise mappings next to their own status definitions).
- **`ThemeProvider`** resolves `light | dark | system`, persists the
  preference in AsyncStorage (a small non-sensitive value), and starts in
  `system` until hydration so the first frame already follows the device -
  the native splash covers that window (no theme flash).
- Components read everything through `useTheme()` (`theme.colors.*`,
  `theme.shadows.*`, ...). Nothing imports `lightColors`/`darkColors`
  directly, so switching mode re-renders the whole tree correctly.
- `expo-status-bar` follows the **resolved** mode (a forced light theme keeps
  dark status-bar icons even on a dark device).

### Color tokens

Palette = the web app's brand colors (`self_aura_frontend/src/app/globals.css`)
adapted for mobile. Semantic names only:

| Group    | Tokens                                                                          |
| -------- | ------------------------------------------------------------------------------- |
| Surfaces | `background`, `surface`, `surfaceElevated`, `surfaceMuted`, `border`, `overlay` |
| Primary  | `primary`, `primaryPressed`, `primarySoft`, `primaryOnSoft`, `onPrimary`        |
| Status   | `success` / `warning` / `danger` / `info`, each with `*Soft` + `*OnSoft`        |
| On-color | `onPrimary`, `onWarning` (dark ink on solid warning, like the web)              |
| Text     | `text`, `textSecondary`, `textMuted`, `textDisabled`                            |
| Icons    | `icon`, `iconMuted`                                                             |

Soft pairs are _designed_, not transparent overlays: light mode uses 50-level
tints with 700-level text (>= 4.5:1 contrast), dark mode uses deep desaturated
tints with 300-level text, so badges/chips stay readable in both modes.

### Typography

One scale, semantic variants, rendered only through `<Text variant=...>`:

| Variant      | Size/Line | Weight | Use                                  |
| ------------ | --------- | ------ | ------------------------------------ |
| `display`    | 28/34     | 700    | hero numbers                         |
| `h1`         | 24/30     | 700    | page headings                        |
| `h2`         | 20/26     | 700    | screen titles (dashboard header)     |
| `h3`         | 18/24     | 600    | section/state headings               |
| `title`      | 17/22     | 600    | feature header titles, list emphasis |
| `subtitle`   | 15/21     | 500    | secondary headings                   |
| `body`       | 15/21     | 400    | default reading text                 |
| `bodyMedium` | 15/21     | 500    | emphasised rows/values               |
| `bodySmall`  | 13/18     | 400    | supporting lines                     |
| `caption`    | 12/16     | 400    | metadata                             |
| `label`      | 12/16     | 600    | field labels, badges, chips          |
| `button`     | 15/20     | 600    | button titles                        |
| `numeric`    | 20/26     | 700    | stats/prices - **tabular-nums**      |

System fonts only (no custom font downloads). `Text` also takes `tone`
(default/secondary/muted/inverse/primary/success/warning/danger/info),
`weight` and `align`.

### Spacing, radius, control heights, elevation

- **Spacing** (4pt grid): `xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 20`,
  `xxl 24`, `xxxl 32` (`xxl`/`xxxl` are the readable spellings of 2xl/3xl -
  JS identifiers cannot start with a digit).
- **Radius**: `sm 8`, `md 12` (controls), `lg 16` (cards), `xl 24`
  (sheets/dialogs), `pill 999`.
- **Control heights**: `sm 36`, `md 44`, `lg 52` (buttons & fields share the
  ladder; `MIN_TOUCH_TARGET` = 44 with invisible `hitSlop` where visuals are
  smaller).
- **Elevation**: `sm` cards / `md` sticky bars & sheets / `lg` dialogs, with
  per-mode values - dark mode uses a much quieter shadow and lets the
  `border` token carry structure.

### Components (`src/components`)

- **layout/** - `Screen` (safe area, scroll/fixed, `keyboardAvoiding`,
  optional pinned `footer`), `AppHeader` (`dashboard` + `feature` variants:
  title/subtitle/back/actions - never feature-specific copy), `Container`.
- **ui/** - `Text`, `Button` (primary/secondary/outline/ghost/danger/success;
  sm/md/lg; pressed/disabled/loading), `IconButton`, `Input` (label,
  required, error, helper, secure toggle, leading icon, clear, multiline),
  `SearchInput`, `Select` (bottom-sheet picker), `Checkbox`, `Switch`,
  `Radio`, `Card` (optional `onPress`), `Badge` (tone x soft/solid/outline),
  `Chip` (selectable/removable), `Divider`, `Avatar`, `ListItem`
  (leading/title/subtitle/meta/status/trailing/chevron/divider),
  `SectionHeader`, `Skeleton`, `Dialog`, `BottomSheet`, plus the shared
  `pressFeedback()` touch-response helper.
- **feedback/** - `LoadingIndicator`, `LoadingState` (list skeletons or
  compact spinner), `EmptyState`, `ErrorState`, and the `ToastProvider` /
  `useToast()` system (single banner, tone icons, auto-dismiss, tap to
  dismiss, `accessibilityLiveRegion` - polite, assertive for errors).
- Everything is plain React Native + core `Modal`/`Animated`: **zero new
  dependencies** were added for the design system.

### Navigation styling

- **Bottom tab bar**: surface background + hairline top border, quiet labels
  (11/600), active state = soft primary pill behind the icon (no heavy
  highlight blocks), permission-filtered 5 tabs, safe-area aware.
- **Headers**: `AppHeader` handles the top inset itself (render `Screen`
  with the default `safeTop={false}` when a header is present). Root tab
  screens use `dashboard`/`feature` without `onBack`; nested screens pass
  `onBack={() => router.back()}` - there is no per-screen custom header.
- **More / module navigation**: grouped `SectionHeader` + `Card` holding a
  2-column tile grid (`tinted icon + title + description`), one card per
  section - Operations, Finance, Delivery, Customer, Administration,
  Account - permission-filtered per tile.

### Showcase

`src/app/(main)/(tabs)/design-system.tsx` - a dev-only screen (linked from
**More > Development**, registered with `href: null` so it renders inside the
real tab shell without becoming a tab) that validates colors, typography,
spacing/radius/elevation, buttons, inputs, cards, badges, chips, lists,
states, toasts, dialog, bottom sheet, both header patterns and a
**Navigation (dev)** section that pushes the placeholder routes with typed
ID params - all with **static data only**. Remove it by deleting the route,
its `Tabs.Screen` entry in `(tabs)/_layout.tsx`, and the link in
`more.tsx`.

## Error handling

`ApiError.kind` is the single branching key for retry, copy, and recovery:

| `kind`           | Trigger                             | What the UI shows                                | Auto-retried    |
| ---------------- | ----------------------------------- | ------------------------------------------------ | --------------- |
| `network`        | no response (offline/refused/DNS)   | offline message                                  | yes (up to 2)   |
| `timeout`        | request exceeded the 15 s deadline  | timeout message                                  | yes (up to 2)   |
| `cancelled`      | caller aborted (unmount/navigation) | not displayed                                    | never           |
| `authentication` | 401                                 | session-expired message (session is cleared)     | never           |
| `authorization`  | 403                                 | permission-denied message                        | never           |
| `validation`     | 400 / 409 / 422                     | backend message + `ApiError.errors` per field    | never           |
| `notFound`       | 404                                 | not-found message                                | never           |
| `server`         | 5xx                                 | generic message in production (real text in dev) | yes (up to 2)   |
| `unexpected`     | anything else                       | generic message in production (real text in dev) | only if not 4xx |

- `getErrorMessage(error)` (`src/api/errors.ts`) is the only way UI surfaces
  turn a thrown value into text - it never leaks stack traces or raw server
  output in production.
- Forms read field-level messages from `ApiError.errors[path]` (the client
  folds the backend's `details`/`errors` payloads into one field-keyed map).
- `logApiError` runs in `__DEV__` only and logs method, endpoint, status, kind
  and message - never tokens or bodies.

## Screen states

1. **loading** -> `LoadingState` (list skeletons by default, compact spinner
   variant for small in-place refreshes).
2. **success (data)** -> content.
3. **success (empty)** -> `EmptyState`; wording distinguishes a genuinely
   empty resource from filtered-out "no results".
4. **error** -> `ErrorState` with `getErrorMessage(error)` and a **retry**
   action.

`isPending` / `isError` / `data` come from TanStack Query - screens do not
track fetch flags by hand. Transient action results use `useToast()`;
destructive confirmations use `Dialog`.

## Forms

- Plain controlled inputs (`useState` per field or one values object) - the
  same pattern the web forms use. No react-hook-form / zod / yup / formik:
  the backend's zod validation is the authority, and a client schema would
  duplicate it.
- A local `validate()` composes shared validators from
  `src/utils/validation.ts` (`required`, `minLength`, `maxLength`, `email`,
  `matches`) via `validateField(...)`, producing per-field messages rendered
  through `Input error=...`.
- Errors clear when the field changes; non-field failures (401, network) show
  as a form-level message from `getErrorMessage`.
- On submit failure, `ApiError.errors[path]` is mapped onto the fields - the
  server's verdict always overrides the client's prediction.

## Formatting conventions

| Data      | Output                          | Notes                                             |
| --------- | ------------------------------- | ------------------------------------------------- |
| Currency  | `১,২৩৪.৫৳` (integers: `১,২৩৪৳`) | bn-BD, Bengali digits, Indian grouping            |
| Zero      | `৳0`                            | deliberate quirk mirrored from the web client     |
| Compact   | `৳1.2M`                         | for dashboard tiles/statistics                    |
| Number    | `১২,৩৪,৫৬৭`                     | bn-BD grouping                                    |
| Date      | `07 Oct 2026`                   | local time; en-GB style (`Sept`, kept for parity) |
| Date+time | `07 Oct 2026, 16:30`            | local time, 24-hour clock                         |
| Invalid   | `—`                             | instead of the web's `Invalid Date`               |

- Currency/number formatting uses `Intl.NumberFormat` - Hermes exposes the
  platform ICU on Android and iOS, so `bn-BD` matches the browsers the web
  app renders in. Formatters are constructed once (Intl locale matching is
  expensive on Hermes).
- Dates are formatted manually so output is deterministic across OS/CLDR
  versions.
- Parity with `self_aura_frontend/src/lib/currency.ts` and `dateUtils.ts` was
  verified with an 800-case comparison script (every day of 2026 plus currency
  edge cases): identical output.

## Dependencies and why each one exists

**Steps 3 and 4 added no dependencies**: the entire design system (toast,
dialog, bottom sheet, skeletons, switch wrapper) and the full navigation
architecture (feature stacks, grouped More tiles) are built from React
Native core (`Modal`, `Animated`, `Switch`, `ScrollView`, `Pressable`) +
Expo Router + existing packages. Step 11 added exactly one new dependency:
`expo-image-picker` (bundled in Expo Go) for the category media fields - the
product image/video pickers in Step 12 reuse that same package, so Step 12
added no dependencies at all. The Operations modules that followed (inventory,
suppliers, purchases, expenses) added none either: Step 17's expense date
picker (`DateField`) is composed from the existing `BottomSheet`/`IconButton`
primitives rather than a native date-picker module, keeping Expo Go
compatibility intact; the Step 18 payments module also added no dependencies
(it reuses the same `DateField`, `BottomSheet`, `Dialog` and `Select`
primitives, and its order picker queries the existing Orders module).

| Dependency                                                                                         | Why                                                                                                 |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `expo`, `expo-constants`, `expo-font`, `expo-linking`, `expo-splash-screen`, `expo-status-bar`     | Expo SDK runtime: config, Ionicons fonts, router linking, auth-aware splash, theme-aware status bar |
| `expo-router` (+ `react-native-screens`, `react-native-safe-area-context`)                         | File-based navigation shell; both native packages are hard requirements of Expo Router              |
| `react`, `react-native`, `react-dom`                                                               | Runtime (SDK-pinned). `react-dom` is a declared **peer of `expo`** (web/static targets) - required  |
| `expo-secure-store`                                                                                | JWT storage in Keychain/Keystore                                                                    |
| `@react-native-async-storage/async-storage`                                                        | Non-sensitive caches (user snapshot, theme mode)                                                    |
| `@tanstack/react-query`                                                                            | Server-state caching, retry, refetch-on-foreground                                                  |
| `@expo/vector-icons`                                                                               | Ionicons glyph set bundled with Expo                                                                |
| `expo-image-picker`                                                                                | System photo/video picker for category and product media files (Steps 11-12; bundled in Expo Go)    |
| `eslint`, `eslint-config-expo`, `eslint-config-prettier`, `prettier`, `typescript`, `@types/react` | Strict typing, linting, formatting (dev-only)                                                       |

Deliberately **not** added: form libraries (rule 9), Redux/Zustand (rule 4),
an i18n framework (UI copy is English like the web admin; formatting is
locale-aware through `src/utils/format.ts`), and anything requiring a
development build (Expo Go compatibility is a constraint).

## Relationship to the existing app

- `self_aura_backend` - the only backend; this app is a second client of it.
- `self_aura_frontend` - source of the API envelope/error contract, auth
  semantics, permission keys, navigation structure, formatting output and
  color palette.
- Neither of those projects is modified by this app.

## Validation

```bash
npx tsc --noEmit   # strict TypeScript
npx expo lint      # ESLint (also: npx eslint .)
npx expo-doctor    # dependency/config health
npx expo start     # dev server + bundling
```

## Roadmap (Step 19)

1. **Ledger, Reports and the remaining modules** (shipping, promotions,
   settings, ...) one by one, replacing `ModulePlaceholder` /
   `FeaturePlaceholder` with real screens composed from the design system in
   `src/components` and backed by TanStack Query. Each module that lands gets
   a `route` in `src/navigation/modules.ts` so its More tile pushes the real
   stack instead of the generic `/module/[key]` fallback. Reports stay
   read-only and render backend-computed figures. Payments settings
   (`GET/PATCH /settings/payments`) remain part of the Settings module's
   architecture - not duplicated inside Payments.
2. **Orders hardening (optional):** as backend endpoints appear (e.g. a status
   history), replace the date-only status section with a real timeline - never
   fabricate one client-side.
3. **Per-customer statistics (blocked):** the backend exposes no per-customer
   totals (only `GET /reports/customers` business-wide totals), so customer
   detail shows the backend-provided order count + last order date derived
   from `GET /orders?customer=…`. Add richer per-customer figures only when a
   backend endpoint provides them.

> **Note for `10.0.2.2` users:** Android emulator reaches your host machine's
> `localhost` as `10.0.2.2` - see `.env.example`.
#   s e l f - a u r a - a p p  
 