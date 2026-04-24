import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/providers/wallet_provider.dart';

class PortfolioChart extends ConsumerWidget {
  const PortfolioChart({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = ref.watch(tokensProvider);
    final totalBalance = ref.watch(totalBalanceProvider);

    final chartData = _generateChartData(tokens);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      height: 120,
      child: LineChart(
        LineChartData(
          gridData: const FlGridData(show: false),
          titlesData: const FlTitlesData(show: false),
          borderData: FlBorderData(show: false),
          minX: 0,
          maxX: chartData.length.toDouble() - 1,
          minY: chartData.isEmpty ? 0 : chartData.map((e) => e.y).reduce((a, b) => a < b ? a : b) * 0.95,
          maxY: chartData.isEmpty ? 100 : chartData.map((e) => e.y).reduce((a, b) => a > b ? a : b) * 1.05,
          lineBarsData: [
            LineChartBarData(
              spots: chartData,
              isCurved: true,
              color: AppColors.accentGreen,
              barWidth: 2,
              isStrokeCapRound: true,
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(
                show: true,
                color: AppColors.accentGreen.withOpacity(0.1),
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppColors.accentGreen.withOpacity(0.3),
                    AppColors.accentGreen.withOpacity(0.0),
                  ],
                ),
              ),
            ),
          ],
          lineTouchData: const LineTouchData(enabled: false),
        ),
      ),
    )
        .animate()
        .fadeIn(duration: 800.ms)
        .slideY(begin: 0.1, end: 0, duration: 800.ms);
  }

  List<FlSpot> _generateChartData(List tokens) {
    final List<FlSpot> spots = [];
    double baseValue = 12000;

    for (int i = 0; i < 30; i++) {
      final change = baseValue * 0.02 * (i % 2 == 0 ? 1 : -1) * (i % 3 == 0 ? 1.5 : 0.5);
      baseValue += change;
      spots.add(FlSpot(i.toDouble(), baseValue));
    }

    return spots;
  }
}
