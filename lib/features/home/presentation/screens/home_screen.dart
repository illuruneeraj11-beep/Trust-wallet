import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      body: SafeArea(
        child: Column(
          children: [
            _buildTopBar(context),
            _buildTabBar(context),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildCryptoTab(context),
                  _buildWatchlistTab(context),
                  _buildNftsTab(context),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Top bar ──────────────────────────────────────────────────────────────
  Widget _buildTopBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
      child: Row(
        children: [
          // Settings gear with red dot
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.settings_outlined,
                    size: 26, color: AppColors.textSecondary),
                onPressed: () => context.push('/discover/settings'),
              ),
              Positioned(
                right: 10,
                top: 10,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: AppColors.accentRed,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
          // Centered balance
          Expanded(
            child: Center(
              child: Text(
                '\$0.00',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      fontSize: 20,
                    ),
              ),
            ),
          ),
          // Search + QR
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.search,
                    size: 26, color: AppColors.textSecondary),
                onPressed: () => _openSearch(context),
              ),
              IconButton(
                icon: const Icon(Icons.crop_free_rounded,
                    size: 26, color: AppColors.textSecondary),
                onPressed: () => context.push('/home/receive'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Tab bar: Crypto | Watchlist | NFTs | 🕐 | ⚙ ──────────────────────────
  Widget _buildTabBar(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Color(0xFF2A3142), width: 0.5),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: TabBar(
              controller: _tabController,
              isScrollable: false,
              indicatorColor: const Color(0xFF3048F4),
              indicatorWeight: 2.5,
              indicatorSize: TabBarIndicatorSize.label,
              labelColor: AppColors.textPrimary,
              unselectedLabelColor: AppColors.textSecondary,
              labelStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              unselectedLabelStyle:
                  const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              tabs: const [
                Tab(text: 'Crypto'),
                Tab(text: 'Watchlist'),
                Tab(text: 'NFTs'),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.history_outlined,
                size: 20, color: AppColors.textSecondary),
            onPressed: () => _openHistory(context),
          ),
          IconButton(
            icon: const Icon(Icons.tune_rounded,
                size: 20, color: AppColors.textSecondary),
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Filter controls coming soon')),
            ),
            padding: const EdgeInsets.only(right: 8),
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }

  // ── Crypto tab ───────────────────────────────────────────────────────────
  Widget _buildCryptoTab(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async => await Future.delayed(const Duration(seconds: 1)),
      color: AppColors.accentGreen,
      backgroundColor: AppColors.surface,
      child: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          const SizedBox(height: 16),
          _buildFundCard(context).animate().fadeIn(duration: 500.ms),
          const SizedBox(height: 24),
          _buildEarnSection(context).animate().fadeIn(delay: 100.ms, duration: 500.ms),
          const SizedBox(height: 24),
          _buildHistorySection(context).animate().fadeIn(delay: 200.ms, duration: 500.ms),
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  // Fund card (matches image 5 exactly)
  Widget _buildFundCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
      decoration: BoxDecoration(
        color: const Color(0xFF1C2033),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        children: [
          // 3D wallet illustration placeholder
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF4ECDC4), Color(0xFF2D9FFF), Color(0xFF00D4A5)],
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                const Icon(Icons.account_balance_wallet_rounded,
                    size: 40, color: Colors.white),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Fund your wallet to start\ntrading and earning',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                  height: 1.3,
                ),
          ),
          const SizedBox(height: 20),
          // Fund button — bright green pill
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () {},
              style: TextButton.styleFrom(
                backgroundColor: AppColors.accentGreen,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(50),
                ),
              ),
              child: const Text('Fund',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.black)),
            ),
          ),
          const SizedBox(height: 10),
          // Receive crypto button — dark green pill
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () => context.push('/home/receive'),
              style: TextButton.styleFrom(
                backgroundColor: AppColors.accentGreen.withOpacity(0.12),
                foregroundColor: AppColors.accentGreen,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(50),
                ),
              ),
              child: const Text('Receive crypto',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.accentGreen)),
            ),
          ),
        ],
      ),
    );
  }

  // Earn section with two APY cards
  Widget _buildEarnSection(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            GestureDetector(
              onTap: () {},
              child: Row(
                children: [
                  Text('Earn',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          )),
                  const SizedBox(width: 4),
                  const Icon(Icons.chevron_right,
                      color: AppColors.textSecondary, size: 22),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildApyCard(context, '⭐', 'STARS', 31.16)),
            const SizedBox(width: 12),
            Expanded(child: _buildApyCard(context, '✦', 'JUNO', 27.17)),
          ],
        ),
      ],
    );
  }

  Widget _buildApyCard(
      BuildContext context, String emoji, String token, double apy) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1C2033),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFF0F1117),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(emoji,
                  style: const TextStyle(fontSize: 20)),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Earn up to\n${apy.toStringAsFixed(2)}% APY',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                  height: 1.4,
                ),
          ),
          const SizedBox(height: 4),
          Text('on $token',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  )),
        ],
      ),
    );
  }

  // History section
  Widget _buildHistorySection(BuildContext context) {
    return GestureDetector(
      onTap: () => _openHistory(context),
      child: Row(
        children: [
          Text('History',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  )),
          const SizedBox(width: 4),
          const Icon(Icons.chevron_right,
              color: AppColors.textSecondary, size: 22),
        ],
      ),
    );
  }

  Widget _buildWatchlistTab(BuildContext context) {
    const watchlistTokens = [
      _WatchlistItem(symbol: 'BNB', marketCap: '\$4.01B', price: '\$634', change: '+0.70%', up: true),
      _WatchlistItem(symbol: 'BTC', marketCap: '\$47.7B', price: '\$76,223', change: '+1.26%', up: true),
      _WatchlistItem(symbol: 'ETH', marketCap: '\$24.9B', price: '\$2,360', change: '+0.75%', up: true),
      _WatchlistItem(symbol: 'SOL', marketCap: '\$5.99B', price: '\$86.8', change: '-0.82%', up: false),
    ];

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      children: [
        for (final token in watchlistTokens)
          _buildWatchlistTokenRow(context, token)
              .animate()
              .fadeIn(duration: 300.ms),
        const SizedBox(height: 12),
        Center(
          child: GestureDetector(
            onTap: () => _openSearch(context),
            child: const Text(
              '+ Add tokens',
              style: TextStyle(
                color: Color(0xFF3048F4),
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        _buildEarnSection(context),
        const SizedBox(height: 24),
        _buildHistorySection(context),
        const SizedBox(height: 100),
      ],
    );
  }

  Widget _buildNftsTab(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      children: [
        Container(
          padding: const EdgeInsets.symmetric(vertical: 24),
          decoration: BoxDecoration(
            color: const Color(0xFF1C2033),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              const Text('🃏', style: TextStyle(fontSize: 68)),
              const SizedBox(height: 12),
              Text(
                'Your NFTs will appear here.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.textSecondary,
                      fontSize: 20,
                      fontWeight: FontWeight.w500,
                    ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        _buildEarnSection(context),
        const SizedBox(height: 24),
        _buildHistorySection(context),
        const SizedBox(height: 100),
      ],
    );
  }

  Widget _buildWatchlistTokenRow(BuildContext context, _WatchlistItem token) {
    final logo = _tokenLogoEmoji[token.symbol] ?? '•';
    return GestureDetector(
      onTap: () => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Opened ${token.symbol}')),
      ),
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: const BoxDecoration(
                color: Color(0xFF0F1117),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(logo, style: const TextStyle(fontSize: 20)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(token.symbol,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontSize: 19,
                            fontWeight: FontWeight.w700,
                          )),
                  const SizedBox(height: 2),
                  Text(token.marketCap,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondary,
                            fontSize: 16,
                          )),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(token.price,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontSize: 19,
                          fontWeight: FontWeight.w600,
                        )),
                const SizedBox(height: 2),
                Text(
                  token.change,
                  style: TextStyle(
                    color: token.up ? const Color(0xFF00B87C) : const Color(0xFFEA3943),
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _openSearch(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const _MarketSearchScreen()),
    );
  }

  void _openHistory(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const _TransactionHistoryScreen()),
    );
  }
}

class _WatchlistItem {
  final String symbol;
  final String marketCap;
  final String price;
  final String change;
  final bool up;

  const _WatchlistItem({
    required this.symbol,
    required this.marketCap,
    required this.price,
    required this.change,
    required this.up,
  });
}

const Map<String, String> _tokenLogoEmoji = {
  'BTC': '₿',
  'ETH': 'Ξ',
  'SOL': 'S',
  'BNB': '⬢',
  'USDT': 'T',
  'USDC': '¢',
  'XRP': '✕',
  'DOGE': 'Ð',
  'ADA': 'A',
  'TRX': 'T',
  'AVAX': 'A',
  'DOT': '•',
  'LINK': 'L',
  'MATIC': 'M',
};

class _MarketSearchScreen extends StatefulWidget {
  const _MarketSearchScreen();

  @override
  State<_MarketSearchScreen> createState() => _MarketSearchScreenState();
}

class _MarketSearchScreenState extends State<_MarketSearchScreen> {
  final TextEditingController _controller = TextEditingController();

  static const List<_MarketToken> _tokens = [
    _MarketToken(symbol: 'BTC', name: 'Bitcoin', network: 'Bitcoin'),
    _MarketToken(symbol: 'ETH', name: 'Ethereum', network: 'Ethereum'),
    _MarketToken(symbol: 'USDT', name: 'Tether USD', network: 'Ethereum'),
    _MarketToken(symbol: 'USDC', name: 'USD Coin', network: 'Ethereum'),
    _MarketToken(symbol: 'BNB', name: 'BNB Smart Chain', network: 'BNB Smart Chain'),
    _MarketToken(symbol: 'SOL', name: 'Solana', network: 'Solana'),
    _MarketToken(symbol: 'XRP', name: 'XRP', network: 'XRP Ledger'),
    _MarketToken(symbol: 'ADA', name: 'Cardano', network: 'Cardano'),
    _MarketToken(symbol: 'DOGE', name: 'Dogecoin', network: 'Dogecoin'),
    _MarketToken(symbol: 'TRX', name: 'TRON', network: 'Tron'),
    _MarketToken(symbol: 'AVAX', name: 'Avalanche', network: 'Avalanche'),
    _MarketToken(symbol: 'DOT', name: 'Polkadot', network: 'Polkadot'),
    _MarketToken(symbol: 'LINK', name: 'Chainlink', network: 'Ethereum'),
    _MarketToken(symbol: 'MATIC', name: 'Polygon', network: 'Polygon'),
    _MarketToken(symbol: 'LTC', name: 'Litecoin', network: 'Litecoin'),
    _MarketToken(symbol: 'SHIB', name: 'Shiba Inu', network: 'Ethereum'),
    _MarketToken(symbol: 'UNI', name: 'Uniswap', network: 'Ethereum'),
    _MarketToken(symbol: 'ATOM', name: 'Cosmos', network: 'Cosmos'),
    _MarketToken(symbol: 'APT', name: 'Aptos', network: 'Aptos'),
    _MarketToken(symbol: 'ARB', name: 'Arbitrum', network: 'Arbitrum'),
  ];

  @override
  Widget build(BuildContext context) {
    final query = _controller.text.trim().toLowerCase();
    final visible = _tokens
        .where((t) =>
            query.isEmpty ||
            t.symbol.toLowerCase().contains(query) ||
            t.name.toLowerCase().contains(query))
        .toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 4),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, size: 26),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  const Expanded(
                    child: Center(
                      child: Text('Search',
                          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
                    ),
                  ),
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel',
                        style: TextStyle(
                          color: Color(0xFF3048F4),
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        )),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: TextField(
                controller: _controller,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  hintText: 'Search',
                  prefixIcon: const Icon(Icons.search),
                  filled: true,
                  fillColor: const Color(0xFF1C2033),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              height: 48,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                children: const [
                  _FilterCoin(text: 'All', selected: true),
                  SizedBox(width: 8),
                  _FilterCoin(text: 'BTC'),
                  SizedBox(width: 8),
                  _FilterCoin(text: 'ETH'),
                  SizedBox(width: 8),
                  _FilterCoin(text: 'SOL'),
                  SizedBox(width: 8),
                  _FilterCoin(text: 'BNB'),
                  SizedBox(width: 8),
                  _FilterCoin(text: 'XRP'),
                  SizedBox(width: 8),
                  _FilterCoin(text: 'ARB'),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 24),
                itemBuilder: (context, index) {
                  final t = visible[index];
                  return ListTile(
                    onTap: () => Navigator.of(context).pop(),
                    leading: CircleAvatar(
                      backgroundColor: const Color(0xFF1C2033),
                      child: Text(_tokenLogoEmoji[t.symbol] ?? t.symbol[0]),
                    ),
                    title: Row(
                      children: [
                        Text(t.symbol,
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1C2033),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(t.network,
                              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                        ),
                      ],
                    ),
                    subtitle: Text(t.name,
                        style: const TextStyle(fontSize: 18, color: AppColors.textSecondary)),
                    trailing: const Icon(Icons.star_border_rounded,
                        color: AppColors.textSecondary),
                  );
                },
                separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFF2A3142)),
                itemCount: visible.length,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterCoin extends StatelessWidget {
  final String text;
  final bool selected;

  const _FilterCoin({required this.text, this.selected = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: selected ? Colors.transparent : const Color(0xFF1C2033),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: selected ? const Color(0xFF3048F4) : Colors.transparent,
          width: 2,
        ),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: selected ? const Color(0xFF3048F4) : AppColors.textPrimary,
        ),
      ),
    );
  }
}

class _MarketToken {
  final String symbol;
  final String name;
  final String network;

  const _MarketToken({
    required this.symbol,
    required this.name,
    required this.network,
  });
}

class _TransactionHistoryScreen extends StatelessWidget {
  const _TransactionHistoryScreen();

  static const txs = [
    ('Sent ETH', '-0.245 ETH', '2m ago', true),
    ('Received USDT', '+1,250 USDT', '14m ago', false),
    ('Swap ETH → USDT', '0.500 ETH', '1h ago', false),
    ('Pending Send', '-120 USDT', 'just now', true),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, size: 26),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  const Expanded(
                    child: Text(
                      'Transaction History',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _chip('Filters ▼'),
                  const SizedBox(width: 10),
                  _chip('All Networks ▼'),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                itemBuilder: (context, i) {
                  final tx = txs[i];
                  return ListTile(
                    tileColor: const Color(0xFF1C2033),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    title: Text(tx.$1,
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text(tx.$3,
                        style: const TextStyle(color: AppColors.textSecondary)),
                    trailing: Text(
                      tx.$2,
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: tx.$4 ? const Color(0xFFEA3943) : const Color(0xFF00B87C),
                      ),
                    ),
                  );
                },
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemCount: txs.length,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _chip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF1C2033),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(text,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
    );
  }
}
