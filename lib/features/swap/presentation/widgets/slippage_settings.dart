import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class SlippageSettings extends StatefulWidget {
  final double currentSlippage;
  final Function(double) onSlippageChanged;

  const SlippageSettings({
    super.key,
    required this.currentSlippage,
    required this.onSlippageChanged,
  });

  @override
  State<SlippageSettings> createState() => _SlippageSettingsState();
}

class _SlippageSettingsState extends State<SlippageSettings> {
  late double _slippage;
  final _customController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _slippage = widget.currentSlippage;
  }

  @override
  Widget build(BuildContext context) {
    final presets = [0.1, 0.5, 1.0];

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Slippage Tolerance',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Your transaction will revert if the price changes unfavorably by more than this percentage.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              alignment: WrapAlignment.center,
              children: [
                ...presets.map((preset) {
                  final isSelected = _slippage == preset;
                  return GestureDetector(
                    onTap: () {
                      setState(() => _slippage = preset);
                      widget.onSlippageChanged(preset);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.accentGreen : AppColors.elevatedSurface,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${preset.toStringAsFixed(1)}%',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: isSelected ? AppColors.background : AppColors.textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ),
                  );
                }),
                SizedBox(
                  width: 100,
                  child: TextField(
                    controller: _customController,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    decoration: InputDecoration(
                      hintText: 'Custom',
                      suffixText: '%',
                      suffixStyle: Theme.of(context).textTheme.bodyMedium,
                      filled: true,
                      fillColor: AppColors.elevatedSurface,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    onChanged: (value) {
                      final custom = double.tryParse(value);
                      if (custom != null) {
                        setState(() => _slippage = custom);
                        widget.onSlippageChanged(custom);
                      }
                    },
                  ),
                ),
              ],
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
      ),
    );
  }
}
