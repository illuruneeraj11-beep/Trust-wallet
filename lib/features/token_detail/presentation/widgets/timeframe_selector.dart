import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class TimeframeSelector extends StatelessWidget {
  final String selectedTimeframe;
  final Function(String) onTimeframeChanged;

  const TimeframeSelector({
    super.key,
    required this.selectedTimeframe,
    required this.onTimeframeChanged,
  });

  @override
  Widget build(BuildContext context) {
    final timeframes = ['1H', '1D', '1W', '1M', '1Y', 'All'];

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: timeframes.map((timeframe) {
        final isSelected = timeframe == selectedTimeframe;
        return GestureDetector(
          onTap: () => onTimeframeChanged(timeframe),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: isSelected ? AppColors.accentGreen : Colors.transparent,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              timeframe,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: isSelected ? AppColors.background : AppColors.textSecondary,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
