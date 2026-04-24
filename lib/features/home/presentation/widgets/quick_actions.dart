import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';

class QuickActions extends StatelessWidget {
  const QuickActions({super.key});

  @override
  Widget build(BuildContext context) {
    final actions = [
      _ActionItem(
        icon: Icons.arrow_upward,
        label: 'Send',
        onTap: () => context.push('/home/send'),
      ),
      _ActionItem(
        icon: Icons.arrow_downward,
        label: 'Receive',
        onTap: () => context.push('/home/receive'),
      ),
      _ActionItem(
        icon: Icons.credit_card,
        label: 'Buy',
        onTap: () {},
      ),
      _ActionItem(
        icon: Icons.swap_horiz,
        label: 'Swap',
        onTap: () => context.go('/swap'),
      ),
      _ActionItem(
        icon: Icons.star,
        label: 'Earn',
        onTap: () => context.go('/earn'),
      ),
    ];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: actions.asMap().entries.map((entry) {
          final index = entry.key;
          final action = entry.value;
          return _buildActionButton(context, action, index);
        }).toList(),
      ),
    );
  }

  Widget _buildActionButton(BuildContext context, _ActionItem action, int index) {
    return GestureDetector(
      onTap: action.onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppColors.accentGreen.withOpacity(0.15),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              action.icon,
              color: AppColors.accentGreen,
              size: 24,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            action.label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w500,
                ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: (300 + index * 100).ms, duration: 400.ms)
        .scale(
          begin: const Offset(0.8, 0.8),
          end: const Offset(1, 1),
          delay: (300 + index * 100).ms,
          duration: 400.ms,
          curve: Curves.easeOutBack,
        );
  }
}

class _ActionItem {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ActionItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });
}
