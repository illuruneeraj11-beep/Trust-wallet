# Trust Wallet Demo

A premium, production-ready cryptocurrency wallet demo built with Flutter 3.24+. This app features a modern, Trust Wallet-inspired UI with smooth animations, dark theme, and complete mock data for demonstration purposes.

## Features

### Complete Wallet Experience
- **Onboarding Flow**: Animated splash screen, wallet creation/import, seed phrase backup, PIN setup
- **Home Screen**: Balance display with animated numbers, portfolio chart, quick actions, token/NFT tabs
- **Token Details**: Interactive price charts with multiple timeframes, holdings info, transaction history
- **Send/Receive**: Multi-step flows with QR codes, address validation, amount input with percentage buttons
- **Swap**: Token swapping with animated flip, slippage settings, preview and confirmation
- **Earn/Staking**: Staking opportunities with APY display, detailed modal views
- **Trending**: Market overview, trending tokens, category filters
- **Discover**: dApp browser with bookmarks, popular dApps grid
- **Settings**: Complete settings with wallet management, security, preferences

### Technical Highlights
- **Flutter 3.24+** with Material 3 design system
- **Riverpod** for state management
- **go_router** for navigation with bottom tabs and nested stacks
- **flutter_animate** for premium Reanimated-level smoothness
- **fl_chart** for interactive price charts
- **qr_flutter** for QR code generation
- **Google Fonts (Inter)** for consistent typography
- **Custom dark theme** with Trust Wallet-inspired color palette

## Getting Started

### Prerequisites
- Flutter SDK 3.24 or higher
- Dart SDK 3.0 or higher
- Android Studio / Xcode for emulators

### Installation

1. **Clone or extract the project**
   ```bash
   cd "trust wallet"
   ```

2. **Get dependencies**
   ```bash
   flutter pub get
   ```

3. **Run the app**
   ```bash
   flutter run
   ```

   Or specify a device:
   ```bash
   flutter run -d emulator-5554  # Android
   flutter run -d iphone         # iOS simulator
   ```

### Project Structure

```
lib/
├── core/
│   ├── routing/          # go_router configuration
│   └── theme/            # AppTheme with dark mode colors
├── features/
│   ├── onboarding/       # Splash, welcome, create/import wallet
│   ├── home/             # Wallet home, balance, tokens, NFTs
│   ├── token_detail/     # Token info, charts, transactions
│   ├── send/             # Send flow with steps
│   ├── receive/          # Receive with QR code
│   ├── swap/             # Token swapping
│   ├── earn/             # Staking opportunities
│   ├── trending/         # Market trends
│   ├── discover/         # dApp browser
│   └── settings/         # App settings
├── shared/
│   ├── models/           # Data models (Token, Wallet, NFT, Transaction)
│   └── providers/        # Riverpod providers with mock data
└── main.dart             # App entry point

assets/
├── mock/                 # Mock JSON data (optional)
├── svg/                  # SVG icons and logos
└── lottie/               # Lottie animations (optional)
```

## Design System

### Colors
- **Background**: `#0F1117`
- **Surface/Cards**: `#1A1F2E`
- **Text Primary**: `#FFFFFF`
- **Text Secondary**: `#A3A8B8`
- **Trust Blue**: `#2D9FFF`
- **Trust Green**: `#00D4A5`
- **Red (Negative)**: `#FF4D4D`
- **Border/Dividers**: `#2A3142`

### Typography
- Primary font: Inter (Google Fonts)
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

## Navigation

The app uses a 5-tab bottom navigation:
1. **Home** - Wallet overview and tokens
2. **Trending** - Market data and trending tokens
3. **Swap** - Token exchange
4. **Earn** - Staking opportunities
5. **Discover** - dApp browser and bookmarks

## Mock Data

All blockchain interactions are mocked. The app includes:
- 12+ tokens with realistic prices and balances
- Multiple wallets for switching
- Transaction history
- NFT gallery with mock items
- Staking opportunities with APY data
- Popular dApps for discovery

## Animations

Premium animations throughout:
- Splash screen logo animation
- Page transitions with spring curves
- List item stagger animations
- Balance number animations
- Token flip animation in swap
- Pull-to-refresh with custom indicator
- Modal spring animations

## Building for Production

### Android
```bash
flutter build apk --release
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

## Notes

- This is a **demo application** for educational purposes
- No real blockchain transactions are performed
- All data is mock data for demonstration
- The app is designed to look and feel like a premium crypto wallet
- Internet connection required for loading token icons from remote URLs

## Dependencies

See `pubspec.yaml` for the full list of dependencies. Key packages:
- `go_router` - Navigation
- `flutter_riverpod` - State management
- `fl_chart` - Charts
- `flutter_animate` - Animations
- `qr_flutter` - QR codes
- `google_fonts` - Typography
- `lottie` - Complex animations
- `intl` - Number/date formatting

## License

This project is for educational and demonstration purposes.
