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
        icon: Icons.swap_horiz,
        label: 'Swap',
        onTap: () => context.go('/swap'),
      ),
      _ActionItem(
        icon: Icons.add,
        label: 'Buy',
        onTap: () => ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Buy flow coming soon')),
        ),
      ),
    ];

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: const Color(0xFF1C2033),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Icon(
              action.icon,
              color: AppColors.textPrimary,
              size: 28,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            action.label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
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
