import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../widgets/staking_card.dart';

class EarnScreen extends StatelessWidget {
  const EarnScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final stakingOptions = [
      StakingOption(
        token: 'Ethereum',
        symbol: 'ETH',
        iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        apy: 4.2,
        tvl: '\$2.4B',
        lockPeriod: 'No lock',
        minAmount: 0.1,
      ),
      StakingOption(
        token: 'Solana',
        symbol: 'SOL',
        iconUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
        apy: 6.8,
        tvl: '\$1.8B',
        lockPeriod: '2 days',
        minAmount: 1,
      ),
      StakingOption(
        token: 'BNB',
        symbol: 'BNB',
        iconUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
        apy: 3.5,
        tvl: '\$890M',
        lockPeriod: '7 days',
        minAmount: 0.5,
      ),
      StakingOption(
        token: 'Cardano',
        symbol: 'ADA',
        iconUrl: 'https://cryptologos.cc/logos/cardano-ada-logo.png',
        apy: 5.2,
        tvl: '\$650M',
        lockPeriod: 'No lock',
        minAmount: 100,
      ),
      StakingOption(
        token: 'Polkadot',
        symbol: 'DOT',
        iconUrl: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png',
        apy: 14.5,
        tvl: '\$320M',
        lockPeriod: '28 days',
        minAmount: 10,
      ),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: _buildHeader(context),
            ),
            SliverToBoxAdapter(
              child: _buildTotalEarnings(context),
            ),
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverToBoxAdapter(
                child: Text(
                  'Staking Opportunities',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final option = stakingOptions[index];
                    return StakingCard(
                      option: option,
                      onTap: () => _showStakingModal(context, option),
                    )
                        .animate()
                        .fadeIn(delay: (index * 100).ms, duration: 400.ms)
                        .slideY(begin: 0.2, end: 0, delay: (index * 100).ms, duration: 400.ms);
                  },
                  childCount: stakingOptions.length,
                ),
              ),
            ),
            const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Earn',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildTotalEarnings(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF1A1F2E),
            Color(0xFF0F1117),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Total Staked',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            '\$1,234.56',
            style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildEarningsStat(
                  context,
                  'Rewards Earned',
                  '\$45.23',
                  AppColors.accentGreen,
                ),
              ),
              Expanded(
                child: _buildEarningsStat(
                  context,
                  'Average APY',
                  '5.8%',
                  AppColors.accentBlue,
                ),
              ),
            ],
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(duration: 600.ms)
        .scale(
          begin: const Offset(0.95, 0.95),
          end: const Offset(1, 1),
          duration: 600.ms,
          curve: Curves.easeOutBack,
        );
  }

  Widget _buildEarningsStat(
    BuildContext context,
    String label,
    String value,
    Color color,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
                color: color,
              ),
        ),
      ],
    );
  }

  void _showStakingModal(BuildContext context, StakingOption option) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          minChildSize: 0.4,
          maxChildSize: 0.8,
          expand: false,
          builder: (context, scrollController) {
            return SafeArea(
              child: SingleChildScrollView(
                controller: scrollController,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppColors.border,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: AppColors.elevatedSurface,
                            borderRadius: BorderRadius.circular(28),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(28),
                            child: Image.network(
                              option.iconUrl,
                              errorBuilder: (context, error, stackTrace) {
                                return const Icon(Icons.monetization_on, size: 28);
                              },
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                option.token,
                                style: Theme.of(context).textTheme.headlineSmall,
                              ),
                              Text(
                                option.symbol,
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                      color: AppColors.textSecondary,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    _buildStakingDetail(
                      context,
                      'Annual Percentage Yield',
                      '${option.apy.toStringAsFixed(1)}%',
                      AppColors.accentGreen,
                    ),
                    _buildStakingDetail(
                      context,
                      'Total Value Locked',
                      option.tvl,
                      AppColors.textPrimary,
                    ),
                    _buildStakingDetail(
                      context,
                      'Lock Period',
                      option.lockPeriod,
                      AppColors.textPrimary,
                    ),
                    _buildStakingDetail(
                      context,
                      'Minimum Amount',
                      '${option.minAmount} ${option.symbol}',
                      AppColors.textPrimary,
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          _showStakingSuccess(context);
                        },
                        child: const Text('Stake Now'),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildStakingDetail(
    BuildContext context,
    String label,
    String value,
    Color valueColor,
  ) {
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
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: valueColor,
                ),
          ),
        ],
      ),
    );
  }

  void _showStakingSuccess(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: AppColors.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.accentGreen.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check,
                  size: 40,
                  color: AppColors.accentGreen,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Staking Successful!',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 12),
              Text(
                'Your tokens are now staked and earning rewards.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Done'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class StakingOption {
  final String token;
  final String symbol;
  final String iconUrl;
  final double apy;
  final String tvl;
  final String lockPeriod;
  final double minAmount;

  StakingOption({
    required this.token,
    required this.symbol,
    required this.iconUrl,
    required this.apy,
    required this.tvl,
    required this.lockPeriod,
    required this.minAmount,
  });
}
