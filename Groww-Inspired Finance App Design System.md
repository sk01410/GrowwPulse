# Finance App — Groww-Inspired UI/UX Design System

## 1. Design Direction

Design the application with a **modern Indian fintech aesthetic inspired by Groww**.

The interface should feel:

- Clean
- Minimal
- Trustworthy
- Modern
- Mobile-first
- Data-focused
- Beginner-friendly
- Fast and lightweight
- Spacious rather than dense
- Easy to scan at a glance

Do **not** create a pixel-for-pixel copy of Groww. Do not reproduce Groww's logos, proprietary illustrations, exact layouts, or branding. Instead, adopt the general UX philosophy:

> Simple financial products + minimal visual noise + strong typography + generous whitespace + clear green action states.

The final UI should look like a premium Indian investment/wealth-management application.

---

# 2. Color System

Use CSS variables/design tokens rather than hardcoding colors throughout the application.

## Primary Brand

```css
--color-primary: #00B386;
--color-primary-dark: #009B75;
--color-primary-light: #E8F8F3;
--color-primary-subtle: #F3FBF8;
```

The primary green should be used for:

- Primary CTAs
- Positive returns
- Selected states
- Active navigation
- Success indicators
- Investment actions
- Important interactive elements

Do not overuse green. Most of the interface should remain neutral.

---

# 3. Neutral Colors

```css
--color-background: #FFFFFF;
--color-surface: #FFFFFF;
--color-surface-secondary: #F8F9FA;
--color-surface-tertiary: #F3F4F6;

--color-border: #E5E7EB;
--color-border-light: #F0F1F2;

--color-text-primary: #1F2937;
--color-text-secondary: #6B7280;
--color-text-tertiary: #9CA3AF;
--color-text-disabled: #D1D5DB;
```

The application should primarily use:

- White backgrounds
- Dark charcoal text
- Light gray borders
- Subtle gray surfaces

Avoid excessive shadows and gradients.

---

# 4. Financial Semantic Colors

Use semantic colors consistently.

```css
--color-positive: #00A878;
--color-positive-bg: #EAF8F3;

--color-negative: #EB5757;
--color-negative-bg: #FDECEC;

--color-warning: #F59E0B;
--color-warning-bg: #FFF7E6;

--color-info: #3B82F6;
--color-info-bg: #EFF6FF;
```

### Rules

Positive financial performance:

```text
+₹2,450
+12.45%
```

Use green.

Negative performance:

```text
-₹850
-3.21%
```

Use red.

Do not use red for generic errors unless there is an actual error.

Do not use green for every interactive element. Green should retain semantic importance.

---

# 5. Dark Mode

If dark mode is implemented, use a true fintech dark theme rather than simply inverting colors.

```css
--dark-background: #0F1115;
--dark-surface: #171A21;
--dark-surface-secondary: #1D2129;

--dark-border: #2A2F38;

--dark-text-primary: #F5F7FA;
--dark-text-secondary: #9CA3AF;
--dark-text-tertiary: #6B7280;

--dark-primary: #00C896;
--dark-positive: #00C896;
--dark-negative: #FF6B6B;
```

Avoid pure black `#000000` for the entire application.

---

# 6. Typography

Use a clean modern sans-serif.

Preferred font stack:

```css
font-family:
  Inter,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Typography should be highly legible and numbers should be visually prominent.

## Type Scale

```text
Display:       32px / 40px / 700
Heading 1:     28px / 36px / 700
Heading 2:     24px / 32px / 700
Heading 3:     20px / 28px / 600

Body Large:    17px / 26px / 400
Body:          15px / 22px / 400
Body Small:    13px / 20px / 400

Label:         12px / 16px / 500
Caption:       11px / 16px / 400
```

Use font-weight:

```text
400 — regular
500 — medium
600 — semibold
700 — bold
```

Do not use extremely bold typography everywhere.

---

# 7. Financial Numbers

Financial numbers should receive stronger visual hierarchy than labels.

Example:

```text
Portfolio Value
₹8,42,350
```

The value should be significantly larger than the label.

Example:

```text
Today's Return

+₹2,430
+0.29%
```

Use:

- Large font
- Semibold/bold
- Tabular numbers if available
- Green/red semantic coloring

Use Indian number formatting:

```text
₹1,25,000
₹12,45,890
₹1,02,35,450
```

---

# 8. Spacing System

Use an 8px spacing system.

```text
4px   — micro spacing
8px   — tight spacing
12px  — small spacing
16px  — standard spacing
24px  — section spacing
32px  — large spacing
40px  — major section spacing
48px  — page-level spacing
64px  — hero/major separation
```

Prefer whitespace over borders.

The interface should feel spacious.

---

# 9. Border Radius

Use soft but restrained rounding.

```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;
--radius-xl: 18px;
--radius-pill: 999px;
```

Recommended:

- Inputs: 8–10px
- Buttons: 8–10px
- Cards: 12–16px
- Pills: fully rounded

Avoid excessively rounded "bubble" UI.

---

# 10. Shadows

Use extremely subtle shadows.

```css
--shadow-sm:
  0 1px 3px rgba(0, 0, 0, 0.05);

--shadow-md:
  0 4px 12px rgba(0, 0, 0, 0.06);

--shadow-lg:
  0 8px 24px rgba(0, 0, 0, 0.08);
```

Most cards should work without shadows.

Prefer:

```text
white surface
+
subtle border
+
spacing
```

over heavy drop shadows.

---

# 11. Layout Philosophy

Use a clean hierarchy.

A typical finance dashboard should follow:

```text
Header
   ↓
Portfolio Summary
   ↓
Performance / Chart
   ↓
Quick Actions
   ↓
Holdings
   ↓
Watchlist
   ↓
Insights / Recommendations
```

Do not put too many components above the fold.

The most important financial information should be immediately visible.

---

# 12. Cards

Cards should be simple.

Example:

```text
┌─────────────────────────────────┐
│ Portfolio Value                  │
│                                 │
│ ₹8,42,350                       │
│                                 │
│ +₹12,450  +1.49%                │
│                                 │
│        Performance Chart        │
└─────────────────────────────────┘
```

Card rules:

- White background
- 1px subtle border
- 12–16px radius
- 16–24px internal padding
- Minimal shadow
- Strong typography hierarchy

Avoid putting every individual piece of information inside its own card.

---

# 13. Buttons

Primary button:

```css
background: var(--color-primary);
color: #FFFFFF;
border-radius: 8px;
font-weight: 600;
```

Example:

```text
Invest Now
Buy
Add Money
Start SIP
```

Secondary button:

```text
white background
dark text
subtle border
```

Tertiary action:

```text
transparent background
primary/secondary text
```

Buttons should generally be compact and professional rather than oversized.

---

# 14. Inputs

Inputs should be:

- White
- Clearly bordered
- 44–48px high
- 8–10px radius
- Easy to tap on mobile

Example:

```text
┌──────────────────────────────┐
│ 🔍 Search stocks, funds...   │
└──────────────────────────────┘
```

Focus state:

```css
border-color: var(--color-primary);
box-shadow: 0 0 0 3px var(--color-primary-light);
```

---

# 15. Navigation

For mobile:

```text
Home
Stocks
Mutual Funds
Portfolio
Profile
```

Use a simple bottom navigation.

Active item:

- Primary green
- Slightly stronger typography
- Minimal indicator

Inactive items:

- Gray
- Reduced visual weight

Do not use excessive icons or decorative navigation elements.

---

# 16. Charts

Charts are extremely important for a finance application.

Use:

- Minimal gridlines
- Clean axes
- Rounded line curves where appropriate
- Green for positive performance
- Red for negative performance
- Minimal labels
- Interactive tooltips
- Time-range selectors

Example:

```text
1D   1W   1M   1Y   5Y   MAX
```

Selected period:

```text
background: var(--color-primary-light)
color: var(--color-primary)
```

Charts should communicate information immediately rather than look decorative.

---

# 17. Stock / Asset List

Example:

```text
Apple Inc.
AAPL
$241.38

+2.41%
```

Layout:

```text
[Logo]  Asset Name              Price
        Ticker                  Return
```

Use strong alignment for financial values.

Prices should be right-aligned.

Returns should use semantic colors.

---

# 18. Portfolio UI

Portfolio should prioritize:

```text
Total Investment
Current Value
Total Returns
Today's Returns
```

Example:

```text
Portfolio

₹8,42,350

Invested
₹7,20,000

Returns
+₹1,22,350  +16.99%

Today's Returns
+₹2,430  +0.29%
```

Do not overwhelm the user with metrics.

---

# 19. Quick Actions

Use compact actions such as:

```text
Add Money
Buy
Sell
SIP
Withdraw
```

Use simple line icons.

Avoid large colorful illustrations for basic financial actions.

---

# 20. Search Experience

Search should feel extremely fast and prominent.

Support:

```text
Search stocks
Search mutual funds
Search ETFs
Search companies
Search by ticker
```

Search results should display:

```text
Company
Ticker
Current Price
Daily Change
```

Provide recent searches and watchlist actions where appropriate.

---

# 21. Empty States

Do not use large cartoon illustrations.

Prefer:

```text
No investments yet

Start building your portfolio by
exploring stocks and mutual funds.

[Explore Investments]
```

Minimal illustration or icon is acceptable.

---

# 22. Loading States

Use skeleton loaders rather than spinners whenever possible.

Example:

```text
████████████
████████
████████████████
```

Skeletons should use a subtle neutral gray.

---

# 23. Microinteractions

Animations should be fast and subtle.

Recommended:

```text
150–200ms — button/hover transitions
200–300ms — cards/modals
300–400ms — page transitions
```

Use:

```css
transition:
  background-color 180ms ease,
  border-color 180ms ease,
  transform 180ms ease,
  opacity 180ms ease;
```

Avoid:

- Excessive bouncing
- Large transitions
- Parallax
- Decorative animations
- Slow page transitions

Finance applications should feel stable and trustworthy.

---

# 24. Icons

Use one consistent icon library throughout the application.

Recommended style:

- Outline icons
- 20–24px
- Consistent stroke width
- Simple geometry

Do not mix multiple icon styles.

---

# 25. Mobile-First UX

The application should be designed mobile-first.

Minimum touch target:

```text
44 × 44px
```

Important actions should be reachable with one hand.

Use:

```text
16px horizontal page padding
```

on mobile.

Desktop layouts can expand to:

```text
max-width: 1200–1280px
```

with centered content.

---

# 26. Desktop Layout

On desktop:

```text
┌──────────┬──────────────────────────────────┐
│          │                                  │
│ Sidebar  │          Main Content            │
│          │                                  │
│ Home     │ Portfolio                        │
│ Stocks   │                                  │
│ Funds    │ Charts                            │
│ Orders   │ Holdings                          │
│ Profile  │                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

Keep the sidebar minimal.

Do not turn the desktop version into a dense trading terminal.

The product should retain the simplicity of a consumer investment application.

---

# 27. Responsive Breakpoints

Use:

```text
Mobile:     < 640px
Tablet:     640–1024px
Desktop:    1024–1440px
Large:      > 1440px
```

Components should adapt rather than simply shrink.

For example:

Desktop:

```text
Portfolio | Performance | Holdings
```

Mobile:

```text
Portfolio
Performance

Holdings
```

---

# 28. UX Principles

Follow these principles throughout the application:

### 1. Simplicity

Every screen should have one obvious primary purpose.

### 2. Hierarchy

The most important financial information should visually dominate.

### 3. Trust

Avoid aggressive animations, excessive colors, and gamification.

### 4. Transparency

Show fees, returns, investment values, and important information clearly.

### 5. Progressive Disclosure

Do not expose advanced information until the user needs it.

### 6. Consistency

The same action should look and behave the same everywhere.

### 7. Accessibility

Maintain sufficient contrast and clear interaction states.

---

# 29. Overall Visual Ratio

Use approximately:

```text
70% — white / neutral surfaces
20% — gray typography and borders
8%  — primary green
2%  — semantic colors / accents
```

The interface should NOT look entirely green.

Green should act as a strategic accent.

---

# 30. Component Design Rules

Every new component must follow the existing design tokens.

Do not introduce arbitrary:

```text
colors
font sizes
border radii
shadows
spacing values
```

unless there is a strong design reason.

Use the existing tokens first.

Create reusable components:

```text
Button
Card
Input
SearchBar
AssetCard
PortfolioCard
PerformanceChart
HoldingRow
WatchlistRow
BottomNavigation
Sidebar
Modal
Tabs
Badge
Skeleton
EmptyState
Toast
```

---

# 31. Final Design Goal

The final application should give the user the impression:

> "This is a polished, trustworthy Indian fintech application that is extremely easy to use."

The visual language should be **Groww-inspired in simplicity and usability**, but the application must maintain its own branding, component structure, content, and visual identity.

Prioritize:

**Clarity > Decoration**

**Usability > Complexity**

**Whitespace > Visual Noise**

**Information Hierarchy > More Components**

**Trust > Gamification**

**Consistency > One-off Designs**
