import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class NetworkSelector extends StatelessWidget {
  final String selectedNetwork;
  final Function(String) onNetworkChanged;

  const NetworkSelector({
    super.key,
    required this.selectedNetwork,
    required this.onNetworkChanged,
  });

  @override
  Widget build(BuildContext context) {
    final networks = [
      'Ethereum',
      'BSC',
      'Polygon',
      'Arbitrum',
      'Optimism',
      'Solana',
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Select Network',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: networks.map((network) {
              final isSelected = network == selectedNetwork;
              return GestureDetector(
                onTap: () => onNetworkChanged(network),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppColors.accentGreen
                        : AppColors.elevatedSurface,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    network,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: isSelected
                              ? AppColors.background
                              : AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
