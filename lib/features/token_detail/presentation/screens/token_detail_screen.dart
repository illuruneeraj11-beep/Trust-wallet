import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/models/token_model.dart';
import '../../../../shared/providers/transaction_provider.dart';
import '../widgets/timeframe_selector.dart';

class TokenDetailScreen extends ConsumerStatefulWidget {
  final TokenModel token;

  const TokenDetailScreen({super.key, required this.token});

  @override
  ConsumerState<TokenDetailScreen> createState() => _TokenDetailScreenState();
}

class _TokenDetailScreenState extends ConsumerState<TokenDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedTimeframe = '1D';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final transactions = ref.watch(transactionsProvider);
    final tokenTransactions = transactions
        .where((tx) => tx.tokenId == widget.token.id)
        .toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildAppBar(context),
            Expanded(
              child: CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(
                    child: _buildTokenHeader(context),
                  ),
                  SliverToBoxAdapter(
                    child: _buildPriceChart(context),
                  ),
                  SliverToBoxAdapter(
                    child: _buildTabBar(context),
                  ),
                  SliverFillRemaining(
                    child: TabBarView(
                      controller: _tabController,
                      children: [
                        _buildHoldingsTab(context),
                        _buildTransactionsTab(context, tokenTransactions),
                        _buildAboutTab(context),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            _buildBottomActionBar(context),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
          const Spacer(),
          IconButton(
            icon: const Icon(Icons.star_border),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildTokenHeader(BuildContext context) {
    final isPositive = widget.token.priceChange24h >= 0;
    final currencyFormat = NumberFormat.currency(symbol: '\$', decimalDigits: 2);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppColors.elevatedSurface,
              borderRadius: BorderRadius.circular(32),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(32),
              child: Image.network(
                widget.token.iconUrl,
                width: 64,
                height: 64,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return const Icon(Icons.monetization_on, size: 32);
                },
              ),
            ),
          )
              .animate()
              .scale(duration: 400.ms, curve: Curves.easeOutBack),
          const SizedBox(height: 16),
          Text(
            widget.token.name,
            style: Theme.of(context).textTheme.headlineSmall,
          )
              .animate()
              .fadeIn(delay: 100.ms, duration: 400.ms),
          const SizedBox(height: 8),
          Text(
            currencyFormat.format(widget.token.price),
            style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          )
              .animate()
              .fadeIn(delay: 200.ms, duration: 400.ms),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: isPositive
                  ? AppColors.accentGreen.withOpacity(0.15)
                  : AppColors.accentRed.withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  isPositive ? Icons.arrow_upward : Icons.arrow_downward,
                  size: 14,
                  color: isPositive ? AppColors.accentGreen : AppColors.accentRed,
                ),
                const SizedBox(width: 4),
                Text(
                  '${isPositive ? '+' : ''}${widget.token.priceChange24h.toStringAsFixed(2)}%',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: isPositive ? AppColors.accentGreen : AppColors.accentRed,
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(width: 8),
                Text(
                  '24h',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ],
            ),
          )
              .animate()
              .fadeIn(delay: 300.ms, duration: 400.ms),
        ],
      ),
    );
  }

  Widget _buildPriceChart(BuildContext context) {
    final chartData = _generateChartData();

    return Container(
      margin: const EdgeInsets.all(16),
      height: 200,
      child: Column(
        children: [
          TimeframeSelector(
            selectedTimeframe: _selectedTimeframe,
            onTimeframeChanged: (timeframe) {
              setState(() => _selectedTimeframe = timeframe);
            },
          ),
          const SizedBox(height: 16),
          Expanded(
            child: LineChart(
              LineChartData(
                gridData: const FlGridData(show: false),
                titlesData: const FlTitlesData(show: false),
                borderData: FlBorderData(show: false),
                minX: 0,
                maxX: chartData.length.toDouble() - 1,
                minY: chartData.map((e) => e.y).reduce((a, b) => a < b ? a : b) * 0.98,
                maxY: chartData.map((e) => e.y).reduce((a, b) => a > b ? a : b) * 1.02,
                lineBarsData: [
                  LineChartBarData(
                    spots: chartData,
                    isCurved: true,
                    color: widget.token.priceChange24h >= 0
                        ? AppColors.accentGreen
                        : AppColors.accentRed,
                    barWidth: 2.5,
                    isStrokeCapRound: true,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          (widget.token.priceChange24h >= 0
                                  ? AppColors.accentGreen
                                  : AppColors.accentRed)
                              .withOpacity(0.3),
                          (widget.token.priceChange24h >= 0
                                  ? AppColors.accentGreen
                                  : AppColors.accentRed)
                              .withOpacity(0.0),
                        ],
                      ),
                    ),
                  ),
                ],
                lineTouchData: LineTouchData(
                  enabled: true,
                  touchTooltipData: LineTouchTooltipData(
                    tooltipRoundedRadius: 8,
                    tooltipPadding: const EdgeInsets.all(8),
                    getTooltipColor: (touchedSpot) => AppColors.surface,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<FlSpot> _generateChartData() {
    final List<FlSpot> spots = [];
    double basePrice = widget.token.price;

    final points = _selectedTimeframe == '1H' ? 24
        : _selectedTimeframe == '1D' ? 30
        : _selectedTimeframe == '1W' ? 50
        : _selectedTimeframe == '1M' ? 60
        : 100;

    for (int i = points; i >= 0; i--) {
      final change = basePrice * 0.01 * (i % 3 == 0 ? 1 : -1) * (i % 5 == 0 ? 1.5 : 0.5);
      basePrice += change;
      spots.add(FlSpot((points - i).toDouble(), basePrice));
    }

    return spots;
  }

  Widget _buildTabBar(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          color: AppColors.accentGreen,
          borderRadius: BorderRadius.circular(10),
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        labelColor: AppColors.background,
        unselectedLabelColor: AppColors.textSecondary,
        labelStyle: Theme.of(context).textTheme.labelLarge,
        unselectedLabelStyle: Theme.of(context).textTheme.bodyMedium,
        tabs: const [
          Tab(text: 'Holdings'),
          Tab(text: 'Transactions'),
          Tab(text: 'About'),
        ],
      ),
    );
  }

  Widget _buildHoldingsTab(BuildContext context) {
    final currencyFormat = NumberFormat.currency(symbol: '\$', decimalDigits: 2);

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildHoldingsCard(
            context,
            'Your Balance',
            '${widget.token.balance.toStringAsFixed(widget.token.balance < 1 ? 6 : 4)} ${widget.token.symbol}',
            currencyFormat.format(widget.token.totalValue),
          ),
          const SizedBox(height: 12),
          _buildHoldingsCard(
            context,
            'Network',
            widget.token.network,
            widget.token.contractAddress != null ? 'Token' : 'Native',
          ),
          if (widget.token.contractAddress != null) ...[
            const SizedBox(height: 12),
            _buildHoldingsCard(
              context,
              'Contract Address',
              '${widget.token.contractAddress!.substring(0, 6)}...${widget.token.contractAddress!.substring(widget.token.contractAddress!.length - 4)}',
              'Tap to copy',
              isCopyable: true,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildHoldingsCard(
    BuildContext context,
    String label,
    String value,
    String subValue, {
    bool isCopyable = false,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            subValue,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionsTab(BuildContext context, List transactions) {
    if (transactions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.receipt_long_outlined,
              size: 64,
              color: AppColors.textSecondary.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'No transactions yet',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: transactions.length,
      itemBuilder: (context, index) {
        final tx = transactions[index];
        return _buildTransactionItem(context, tx);
      },
    );
  }

  Widget _buildTransactionItem(BuildContext context, dynamic tx) {
    final isSend = tx.type == TransactionType.send;
    final currencyFormat = NumberFormat.currency(symbol: '\$', decimalDigits: 2);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: isSend
                  ? AppColors.accentRed.withOpacity(0.15)
                  : AppColors.accentGreen.withOpacity(0.15),
              borderRadius: BorderRadius.circular(22),
            ),
            child: Icon(
              tx.type.icon,
              color: isSend ? AppColors.accentRed : AppColors.accentGreen,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tx.type.label,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  _formatDate(tx.timestamp),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${isSend ? '-' : '+'}${currencyFormat.format(tx.valueUsd)}',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: isSend ? AppColors.accentRed : AppColors.accentGreen,
                    ),
              ),
              const SizedBox(height: 2),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: tx.status.color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  tx.status.label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: tx.status.color,
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays > 0) {
      return '${diff.inDays}d ago';
    } else if (diff.inHours > 0) {
      return '${diff.inHours}h ago';
    } else if (diff.inMinutes > 0) {
      return '${diff.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  Widget _buildAboutTab(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'About ${widget.token.name}',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 12),
          Text(
            widget.token.description ?? 'No description available.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
          ),
          const SizedBox(height: 24),
          _buildAboutItem(context, 'Symbol', widget.token.symbol),
          _buildAboutItem(context, 'Decimals', widget.token.decimals.toString()),
          _buildAboutItem(context, 'Network', widget.token.network),
          if (widget.token.contractAddress != null)
            _buildAboutItem(
              context,
              'Contract',
              '${widget.token.contractAddress!.substring(0, 10)}...${widget.token.contractAddress!.substring(widget.token.contractAddress!.length - 8)}',
            ),
        ],
      ),
    );
  }

  Widget _buildAboutItem(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomActionBar(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(
          top: BorderSide(color: AppColors.border),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: _buildActionButton(
                context,
                'Send',
                Icons.arrow_upward,
                () => context.push('/home/send'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildActionButton(
                context,
                'Receive',
                Icons.arrow_downward,
                () => context.push('/home/receive'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildActionButton(
                context,
                'Swap',
                Icons.swap_horiz,
                () => context.go('/swap'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildActionButton(
                context,
                'Buy',
                Icons.credit_card,
                () {},
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton(
    BuildContext context,
    String label,
    IconData icon,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.elevatedSurface,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 20, color: AppColors.accentGreen),
            const SizedBox(height: 4),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
