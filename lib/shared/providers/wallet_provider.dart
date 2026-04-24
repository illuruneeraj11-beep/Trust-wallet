import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/wallet_model.dart';
import '../models/token_model.dart';
import '../models/nft_model.dart';

final currentWalletProvider = StateNotifierProvider<WalletNotifier, WalletState>((ref) {
  return WalletNotifier();
});

class WalletState {
  final WalletModel? currentWallet;
  final List<WalletModel> wallets;
  final bool isLoading;
  final String? error;

  const WalletState({
    this.currentWallet,
    this.wallets = const [],
    this.isLoading = false,
    this.error,
  });

  WalletState copyWith({
    WalletModel? currentWallet,
    List<WalletModel>? wallets,
    bool? isLoading,
    String? error,
  }) {
    return WalletState(
      currentWallet: currentWallet ?? this.currentWallet,
      wallets: wallets ?? this.wallets,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

class WalletNotifier extends StateNotifier<WalletState> {
  WalletNotifier() : super(const WalletState()) {
    _initializeMockWallet();
  }

  void _initializeMockWallet() {
    final mockWallet = WalletModel(
      id: 'wallet_1',
      name: 'My Main Wallet',
      address: '0x742d35Cc6634C0532925a3b8D4e6D3b6e8d3e8F9',
      mnemonic: [
        'abandon', 'ability', 'able', 'about', 'above', 'absent',
        'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident'
      ],
      isBackedUp: true,
      createdAt: DateTime.now().subtract(const Duration(days: 30)),
      isDefault: true,
    );

    state = WalletState(
      currentWallet: mockWallet,
      wallets: [mockWallet],
    );
  }

  Future<void> createWallet(String name) async {
    state = state.copyWith(isLoading: true);
    await Future.delayed(const Duration(seconds: 1));

    final newWallet = WalletModel(
      id: 'wallet_${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      address: '0x${DateTime.now().millisecondsSinceEpoch.toRadixString(16).padLeft(40, '0')}',
      mnemonic: _generateMockMnemonic(),
      isBackedUp: false,
      createdAt: DateTime.now(),
    );

    state = state.copyWith(
      wallets: [...state.wallets, newWallet],
      isLoading: false,
    );
  }

  Future<void> importWallet(String name, String mnemonic) async {
    state = state.copyWith(isLoading: true);
    await Future.delayed(const Duration(seconds: 1));

    final newWallet = WalletModel(
      id: 'wallet_${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      address: '0x${DateTime.now().millisecondsSinceEpoch.toRadixString(16).padLeft(40, '0')}',
      mnemonic: mnemonic.split(' '),
      isBackedUp: true,
      createdAt: DateTime.now(),
    );

    state = state.copyWith(
      wallets: [...state.wallets, newWallet],
      isLoading: false,
    );
  }

  void switchWallet(String walletId) {
    final wallet = state.wallets.firstWhere((w) => w.id == walletId);
    state = state.copyWith(currentWallet: wallet);
  }

  List<String> _generateMockMnemonic() {
    final words = [
      'apple', 'banana', 'cherry', 'date', 'elderberry', 'fig',
      'grape', 'honeydew', 'kiwi', 'lemon', 'mango', 'nectarine',
      'orange', 'papaya', 'quince', 'raspberry', 'strawberry', 'tangerine'
    ];
    return words.take(12).toList();
  }
}

final tokensProvider = Provider<List<TokenModel>>((ref) {
  return _mockTokens;
});

final nftsProvider = Provider<List<NftModel>>((ref) {
  return _mockNfts;
});

final totalBalanceProvider = Provider<double>((ref) {
  final tokens = ref.watch(tokensProvider);
  return tokens.fold(0, (sum, token) => sum + token.totalValue);
});

final portfolioChangeProvider = Provider<double>((ref) {
  return 2.34;
});

final _mockTokens = [
  TokenModel(
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    iconUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    balance: 0.45,
    price: 67432.50,
    priceChange24h: 3.2,
    chartData: _generateMockChartData(),
    network: 'Bitcoin',
    decimals: 8,
    description: 'The first decentralized cryptocurrency',
  ),
  TokenModel(
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    balance: 2.34,
    price: 3456.78,
    priceChange24h: -1.5,
    chartData: _generateMockChartData(),
    network: 'Ethereum',
    contractAddress: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    description: 'Decentralized platform for smart contracts',
  ),
  TokenModel(
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    iconUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    balance: 45.67,
    price: 142.35,
    priceChange24h: 5.8,
    chartData: _generateMockChartData(),
    network: 'Solana',
    decimals: 9,
    description: 'High-performance blockchain',
  ),
  TokenModel(
    id: 'tether',
    name: 'Tether',
    symbol: 'USDT',
    iconUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    balance: 2345.67,
    price: 1.00,
    priceChange24h: 0.01,
    chartData: _generateMockChartData(basePrice: 1.0, volatility: 0.002),
    network: 'Ethereum',
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    description: 'USD pegged stablecoin',
  ),
  TokenModel(
    id: 'bnb',
    name: 'BNB',
    symbol: 'BNB',
    iconUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    balance: 12.34,
    price: 567.89,
    priceChange24h: 1.2,
    chartData: _generateMockChartData(),
    network: 'BSC',
    decimals: 18,
    description: 'Binance ecosystem token',
  ),
  TokenModel(
    id: 'dogecoin',
    name: 'Dogecoin',
    symbol: 'DOGE',
    iconUrl: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png',
    balance: 12345.67,
    price: 0.089,
    priceChange24h: -2.3,
    chartData: _generateMockChartData(),
    network: 'Dogecoin',
    decimals: 8,
    description: 'The meme cryptocurrency',
  ),
  TokenModel(
    id: 'cardano',
    name: 'Cardano',
    symbol: 'ADA',
    iconUrl: 'https://cryptologos.cc/logos/cardano-ada-logo.png',
    balance: 5678.90,
    price: 0.45,
    priceChange24h: 4.5,
    chartData: _generateMockChartData(),
    network: 'Cardano',
    decimals: 6,
    description: 'Proof-of-stake blockchain platform',
  ),
  TokenModel(
    id: 'polkadot',
    name: 'Polkadot',
    symbol: 'DOT',
    iconUrl: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png',
    balance: 234.56,
    price: 7.23,
    priceChange24h: -0.8,
    chartData: _generateMockChartData(),
    network: 'Polkadot',
    decimals: 10,
    description: 'Multi-chain protocol',
  ),
  TokenModel(
    id: 'pepe',
    name: 'Pepe',
    symbol: 'PEPE',
    iconUrl: 'https://cryptologos.cc/logos/pepe-pepe-logo.png',
    balance: 1234567890.12,
    price: 0.00000123,
    priceChange24h: 15.7,
    chartData: _generateMockChartData(),
    network: 'Ethereum',
    contractAddress: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
    decimals: 18,
    isVerified: true,
    description: 'Meme coin based on Pepe the Frog',
  ),
  TokenModel(
    id: 'chainlink',
    name: 'Chainlink',
    symbol: 'LINK',
    iconUrl: 'https://cryptologos.cc/logos/chainlink-link-logo.png',
    balance: 123.45,
    price: 14.67,
    priceChange24h: 2.1,
    chartData: _generateMockChartData(),
    network: 'Ethereum',
    contractAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    decimals: 18,
    description: 'Decentralized oracle network',
  ),
  TokenModel(
    id: 'uniswap',
    name: 'Uniswap',
    symbol: 'UNI',
    iconUrl: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    balance: 78.90,
    price: 8.45,
    priceChange24h: -3.2,
    chartData: _generateMockChartData(),
    network: 'Ethereum',
    contractAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    decimals: 18,
    description: 'Decentralized exchange protocol',
  ),
  TokenModel(
    id: 'shib',
    name: 'Shiba Inu',
    symbol: 'SHIB',
    iconUrl: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.png',
    balance: 4567890123.45,
    price: 0.0000189,
    priceChange24h: 8.9,
    chartData: _generateMockChartData(),
    network: 'Ethereum',
    contractAddress: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
    decimals: 18,
    isVerified: true,
    description: 'Dogecoin killer meme token',
  ),
];

final _mockNfts = [
  NftModel(
    id: 'nft_1',
    name: 'Bored Ape #1234',
    collection: 'Bored Ape Yacht Club',
    imageUrl: 'https://i.seadn.io/gae/0A0C8_\_J72zI6jVdD9J1gE5F5X7j6G1h2I3j4K5l6M7n8O9p0Q1r2S3t4U5v6W7x8Y9z0A1',
    network: 'Ethereum',
    contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
    tokenId: '1234',
    floorPrice: 45.5,
    description: 'A bored ape with a cool hat',
  ),
  NftModel(
    id: 'nft_2',
    name: 'CryptoPunk #5678',
    collection: 'CryptoPunks',
    imageUrl: 'https://i.seadn.io/gae/1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3',
    network: 'Ethereum',
    contractAddress: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
    tokenId: '5678',
    floorPrice: 65.0,
    description: 'A pixelated punk avatar',
  ),
  NftModel(
    id: 'nft_3',
    name: 'Doodle #9999',
    collection: 'Doodles',
    imageUrl: 'https://i.seadn.io/gae/2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4',
    network: 'Ethereum',
    contractAddress: '0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e',
    tokenId: '9999',
    floorPrice: 5.2,
    description: 'A colorful doodle character',
  ),
  NftModel(
    id: 'nft_4',
    name: 'Azuki #7777',
    collection: 'Azuki',
    imageUrl: 'https://i.seadn.io/gae/3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5',
    network: 'Ethereum',
    contractAddress: '0xED5AF388653567Af2F388E6224dC7C4b3241C544',
    tokenId: '7777',
    floorPrice: 12.8,
    description: 'An anime-inspired Azuki character',
  ),
];

List<ChartPoint> _generateMockChartData({double basePrice = 100, double volatility = 0.05}) {
  final now = DateTime.now();
  final points = <ChartPoint>[];
  var price = basePrice;

  for (int i = 30; i >= 0; i--) {
    final change = (price * volatility * (i % 3 == 0 ? 0.02 : -0.01));
    price += change;
    points.add(ChartPoint(
      time: now.subtract(Duration(days: i)),
      price: price,
    ));
  }

  return points;
}
