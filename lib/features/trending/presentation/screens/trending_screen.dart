import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../../core/theme/app_theme.dart';

// ─── Data model ─────────────────────────────────────────────────────────────
class _Token {
  final String name;
  final String symbol;
  final String iconUrl;
  final String network;
  final String networkIconUrl;
  final double price;
  final double change24h;
  final String marketCap;
  final String volume;
  final List<double> sparkPoints;

  const _Token({
    required this.name,
    required this.symbol,
    required this.iconUrl,
    required this.network,
    required this.networkIconUrl,
    required this.price,
    required this.change24h,
    required this.marketCap,
    required this.volume,
    required this.sparkPoints,
  });
}

// ─── Top-card data model ────────────────────────────────────────────────────
class _TopCard {
  final String name;
  final String network;
  final double price;
  final double change24h;
  final List<double> spark;

  const _TopCard({
    required this.name,
    required this.network,
    required this.price,
    required this.change24h,
    required this.spark,
  });
}

// ─── Mock data ───────────────────────────────────────────────────────────────
final _topCards = [
  _TopCard(
    name: 'Ethereum',
    network: 'ETH',
    price: 2386.01,
    change24h: 2.03,
    spark: [2100, 2150, 2050, 2200, 2300, 2250, 2386],
  ),
  _TopCard(
    name: 'BNB Smar...',
    network: 'BSC',
    price: 641.85,
    change24h: 2.13,
    spark: [580, 590, 570, 610, 630, 620, 641],
  ),
  _TopCard(
    name: 'RaveDAO',
    network: 'ETH',
    price: 26.32,
    change24h: 37.47,
    spark: [15, 16, 17, 18, 22, 24, 26],
  ),
  _TopCard(
    name: 'Ether Gold',
    network: 'ETH',
    price: 4807.40,
    change24h: 0.82,
    spark: [4700, 4720, 4680, 4750, 4790, 4800, 4807],
  ),
];

final _listTokens = [
  _Token(
    name: 'LINK',
    symbol: 'LINK',
    iconUrl: 'https://cryptologos.cc/logos/chainlink-link-logo.png',
    network: 'ETH',
    networkIconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    price: 9.54,
    change24h: 0.60,
    marketCap: '\$6.94B MCap',
    volume: '\$678.24M',
    sparkPoints: [9.0, 9.1, 8.9, 9.2, 9.4, 9.3, 9.54],
  ),
  _Token(
    name: 'XAUt',
    symbol: 'XAUt',
    iconUrl: 'https://cryptologos.cc/logos/tether-gold-xaut-logo.png',
    network: 'ETH',
    networkIconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    price: 4807.40,
    change24h: 0.82,
    marketCap: '\$2.69B MCap',
    volume: '\$663.47M',
    sparkPoints: [4700, 4720, 4680, 4750, 4790, 4800, 4807],
  ),
  _Token(
    name: 'PAXG',
    symbol: 'PAXG',
    iconUrl: 'https://cryptologos.cc/logos/pax-gold-paxg-logo.png',
    network: 'ETH',
    networkIconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    price: 4810.99,
    change24h: 0.84,
    marketCap: '\$2.37B MCap',
    volume: '\$265.85M',
    sparkPoints: [4700, 4730, 4690, 4760, 4800, 4805, 4811],
  ),
  _Token(
    name: 'ASTER',
    symbol: 'ASTER',
    iconUrl: 'https://cryptologos.cc/logos/astar-astr-logo.png',
    network: 'ASTR',
    networkIconUrl: '',
    price: 0.6918,
    change24h: 1.60,
    marketCap: '\$1.72B MCap',
    volume: '\$170.55M Vol',
    sparkPoints: [0.62, 0.63, 0.61, 0.65, 0.67, 0.68, 0.69],
  ),
  _Token(
    name: 'DEXE',
    symbol: 'DEXE',
    iconUrl: 'https://cryptologos.cc/logos/dexe-dexe-logo.png',
    network: 'ETH',
    networkIconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    price: 13.39,
    change24h: 12.85,
    marketCap: '\$1.12B MCap',
    volume: '\$32.54M Vol',
    sparkPoints: [10.0, 10.5, 11.0, 11.5, 12.0, 12.8, 13.39],
  ),
  _Token(
    name: 'U',
    symbol: 'U',
    iconUrl: '',
    network: 'ETH',
    networkIconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    price: 0.9997,
    change24h: 0.00,
    marketCap: '\$1.03B MCap',
    volume: '\$434.46M',
    sparkPoints: [1.0, 1.0, 0.999, 1.0, 0.999, 1.0, 0.9997],
  ),
  _Token(
    name: 'GENIUS',
    symbol: 'GNUS',
    iconUrl: '',
    network: 'ETH',
    networkIconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    price: 0.8296,
    change24h: 0.26,
    marketCap: '\$0.98B MCap',
    volume: '\$52.12M',
    sparkPoints: [0.80, 0.81, 0.80, 0.82, 0.83, 0.82, 0.83],
  ),
];

// ─── Screen ──────────────────────────────────────────────────────────────────
class TrendingScreen extends StatefulWidget {
  const TrendingScreen({super.key});

  @override
  State<TrendingScreen> createState() => _TrendingScreenState();
}

class _TrendingScreenState extends State<TrendingScreen> {
  int _selectedFilter = 0; // 0=Hot tokens, 1=Top Gainers, 2=RWA

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // ── Title bar ──────────────────────────────────────────────────
            SliverToBoxAdapter(child: _buildTitleBar(context)),
            // ── Top traded 24h ────────────────────────────────────────────
            SliverToBoxAdapter(child: _buildTopTradedLabel(context)),
            SliverToBoxAdapter(child: _buildTopCards(context)),
            // ── Filter pills ──────────────────────────────────────────────
            SliverToBoxAdapter(child: _buildFilterPills(context)),
            // ── Dropdown filters ──────────────────────────────────────────
            SliverToBoxAdapter(child: _buildDropdownFilters(context)),
            // ── Token list ────────────────────────────────────────────────
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, i) => _TokenRow(token: _listTokens[i])
                    .animate()
                    .fadeIn(delay: (i * 60).ms, duration: 350.ms),
                childCount: _listTokens.length,
              ),
            ),
            const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
          ],
        ),
      ),
    );
  }

  // ── Title bar: "Trending" centered + search icon ─────────────────────────
  Widget _buildTitleBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
      child: Row(
        children: [
          const Expanded(
            child: Center(
              child: Text(
                'Trending',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.search, color: AppColors.textSecondary),
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  // ── "Top traded (24h)" label ─────────────────────────────────────────────
  Widget _buildTopTradedLabel(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: Text(
        'Top traded (24h)',
        style: TextStyle(
          color: AppColors.textPrimary,
          fontSize: 16,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  // ── Horizontal top-card row ───────────────────────────────────────────────
  Widget _buildTopCards(BuildContext context) {
    return SizedBox(
      height: 148,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.only(left: 16, right: 4),
        itemCount: _topCards.length,
        itemBuilder: (context, i) {
          final c = _topCards[i];
          return _TopTradedCard(card: c)
              .animate()
              .fadeIn(delay: (i * 80).ms, duration: 400.ms);
        },
      ),
    );
  }

  // ── Filter pills: ⭐ Hot tokens | Top Gainers | RWA | ... ────────────────
  Widget _buildFilterPills(BuildContext context) {
    final labels = ['Hot tokens', 'Top Gainers', 'RWA', 'New'];
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 16, 12, 0),
      child: Row(
        children: [
          // star icon pill
          GestureDetector(
            onTap: () {},
            child: Container(
              width: 38,
              height: 34,
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF252A3A),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(Icons.star_border_rounded,
                  size: 18, color: AppColors.textSecondary),
            ),
          ),
          ...labels.asMap().entries.map((e) {
            final isSelected = e.key == _selectedFilter;
            return GestureDetector(
              onTap: () => setState(() => _selectedFilter = e.key),
              child: Container(
                margin: const EdgeInsets.only(right: 8),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected
                      ? Colors.white
                      : const Color(0xFF252A3A),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  e.value,
                  style: TextStyle(
                    color: isSelected ? Colors.black : AppColors.textSecondary,
                    fontSize: 13,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  // ── Dropdown filter row ───────────────────────────────────────────────────
  Widget _buildDropdownFilters(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
      child: Row(
        children: [
          _DropdownChip(label: 'Network'),
          const SizedBox(width: 8),
          _DropdownChip(label: 'Market cap', showArrowDown: true),
          const SizedBox(width: 8),
          _DropdownChip(label: '24h'),
        ],
      ),
    );
  }
}

// ─── Top traded card widget ──────────────────────────────────────────────────
class _TopTradedCard extends StatelessWidget {
  final _TopCard card;
  const _TopTradedCard({required this.card});

  @override
  Widget build(BuildContext context) {
    final isPos = card.change24h >= 0;
    final color = isPos ? AppColors.accentGreen : AppColors.accentRed;
    final spots = card.spark
        .asMap()
        .entries
        .map((e) => FlSpot(e.key.toDouble(), e.value))
        .toList();

    return Container(
      width: 140,
      margin: const EdgeInsets.only(right: 10),
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
      decoration: BoxDecoration(
        color: const Color(0xFF1C2033),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Name + network icon
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  card.name,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  color: const Color(0xFF2A3142),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.link, size: 11,
                    color: AppColors.textSecondary),
              ),
            ],
          ),
          const SizedBox(height: 6),
          // Price
          Text(
            _fmtPrice(card.price),
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 2),
          // % change
          Text(
            '${isPos ? '+' : ''}${card.change24h.toStringAsFixed(2)}%',
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const Spacer(),
          // Sparkline
          SizedBox(
            height: 34,
            child: LineChart(
              LineChartData(
                gridData: const FlGridData(show: false),
                titlesData: const FlTitlesData(show: false),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    color: color,
                    barWidth: 1.5,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      color: color.withOpacity(0.12),
                    ),
                  ),
                ],
                lineTouchData: const LineTouchData(enabled: false),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _fmtPrice(double p) {
    if (p >= 1000) return '\$${p.toStringAsFixed(2)}';
    if (p >= 1) return '\$${p.toStringAsFixed(4)}';
    return '\$${p.toStringAsFixed(6)}';
  }
}

// ─── Token list row ──────────────────────────────────────────────────────────
class _TokenRow extends StatelessWidget {
  final _Token token;
  const _TokenRow({required this.token});

  @override
  Widget build(BuildContext context) {
    final isPos = token.change24h >= 0;
    final changeColor = isPos ? AppColors.accentGreen : AppColors.accentRed;
    final spots = token.sparkPoints
        .asMap()
        .entries
        .map((e) => FlSpot(e.key.toDouble(), e.value))
        .toList();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Color(0xFF1E2230), width: 0.5),
        ),
      ),
      child: Row(
        children: [
          // Token icon + network badge
          SizedBox(
            width: 44,
            height: 44,
            child: Stack(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFF252A3A),
                    shape: BoxShape.circle,
                  ),
                  child: ClipOval(
                    child: token.iconUrl.isNotEmpty
                        ? Image.network(
                            token.iconUrl,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Center(
                              child: Text(
                                token.symbol.isNotEmpty
                                    ? token.symbol[0]
                                    : '?',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                          )
                        : Center(
                            child: Text(
                              token.symbol.isNotEmpty ? token.symbol[0] : '?',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                fontSize: 16,
                              ),
                            ),
                          ),
                  ),
                ),
                // Network badge
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    width: 18,
                    height: 18,
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F1117),
                      shape: BoxShape.circle,
                      border: Border.all(
                          color: const Color(0xFF0F1117), width: 1.5),
                    ),
                    child: ClipOval(
                      child: token.networkIconUrl.isNotEmpty
                          ? Image.network(
                              token.networkIconUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const Icon(
                                  Icons.circle,
                                  size: 10,
                                  color: AppColors.textSecondary),
                            )
                          : Center(
                              child: Text(
                                token.network.isNotEmpty
                                    ? token.network[0]
                                    : '',
                                style: const TextStyle(
                                    fontSize: 8, color: Colors.white),
                              ),
                            ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Name + stats
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  token.name,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${token.marketCap} · ${token.volume}',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          // Price + sparkline + % change
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                _fmtPrice(token.price),
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 60,
                    height: 28,
                    child: LineChart(
                      LineChartData(
                        gridData: const FlGridData(show: false),
                        titlesData: const FlTitlesData(show: false),
                        borderData: FlBorderData(show: false),
                        lineBarsData: [
                          LineChartBarData(
                            spots: spots,
                            isCurved: true,
                            color: changeColor,
                            barWidth: 1.5,
                            dotData: const FlDotData(show: false),
                            belowBarData: BarAreaData(
                              show: true,
                              color: changeColor.withOpacity(0.1),
                            ),
                          ),
                        ],
                        lineTouchData: const LineTouchData(enabled: false),
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 3),
                    decoration: BoxDecoration(
                      color: changeColor.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${isPos ? '+' : ''}${token.change24h.toStringAsFixed(2)}%',
                      style: TextStyle(
                        color: changeColor,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _fmtPrice(double p) {
    if (p >= 1000) return '\$${p.toStringAsFixed(2)}';
    if (p >= 1) return '\$${p.toStringAsFixed(4)}';
    return '\$${p.toStringAsFixed(6)}';
  }
}

// ─── Dropdown chip ────────────────────────────────────────────────────────────
class _DropdownChip extends StatelessWidget {
  final String label;
  final bool showArrowDown;
  const _DropdownChip({required this.label, this.showArrowDown = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFF252A3A),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(width: 4),
          const Icon(Icons.keyboard_arrow_down,
              size: 16, color: AppColors.textSecondary),
        ],
      ),
    );
  }
}
