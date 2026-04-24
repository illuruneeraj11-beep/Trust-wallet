import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/models/token_model.dart';

class AmountInput extends StatefulWidget {
  final TokenModel token;
  final Function(double) onAmountEntered;

  const AmountInput({
    super.key,
    required this.token,
    required this.onAmountEntered,
  });

  @override
  State<AmountInput> createState() => _AmountInputState();
}

class _AmountInputState extends State<AmountInput> {
  final _controller = TextEditingController();
  double _amount = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(symbol: '\$', decimalDigits: 2);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Enter Amount',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 8),
        Text(
          'Available: ${widget.token.balance.toStringAsFixed(widget.token.balance < 1 ? 6 : 4)} ${widget.token.symbol}',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.elevatedSurface,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.network(
                        widget.token.iconUrl,
                        errorBuilder: (context, error, stackTrace) {
                          return const Icon(Icons.monetization_on, size: 16);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    widget.token.symbol,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _controller,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                decoration: InputDecoration(
                  hintText: '0.00',
                  hintStyle: Theme.of(context).textTheme.displaySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                  border: InputBorder.none,
                ),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*')),
                ],
                onChanged: (value) {
                  setState(() {
                    _amount = double.tryParse(value) ?? 0;
                  });
                },
              ),
              Text(
                currencyFormat.format(_amount * widget.token.price),
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _buildPercentageButton('25%', 0.25),
            _buildPercentageButton('50%', 0.5),
            _buildPercentageButton('75%', 0.75),
            _buildPercentageButton('MAX', 1.0, isMax: true),
          ],
        ),
        const Spacer(),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _amount > 0 && _amount <= widget.token.balance
                ? () => widget.onAmountEntered(_amount)
                : null,
            child: const Text('Continue'),
          ),
        ),
      ],
    );
  }

  Widget _buildPercentageButton(String label, double percentage, {bool isMax = false}) {
    return GestureDetector(
      onTap: () {
        final amount = widget.token.balance * percentage;
        _controller.text = amount.toStringAsFixed(widget.token.balance < 1 ? 6 : 4);
        setState(() => _amount = amount);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isMax ? AppColors.accentGreen.withOpacity(0.15) : AppColors.elevatedSurface,
          borderRadius: BorderRadius.circular(8),
          border: isMax
              ? Border.all(color: AppColors.accentGreen.withOpacity(0.5))
              : null,
        ),
        child: Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: isMax ? AppColors.accentGreen : AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
        ),
      ),
    );
  }
}
