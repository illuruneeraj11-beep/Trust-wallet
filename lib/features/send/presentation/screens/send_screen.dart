import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/models/token_model.dart';
import '../../../../shared/providers/wallet_provider.dart';
import '../widgets/token_selector.dart';
import '../widgets/address_input.dart';
import '../widgets/amount_input.dart';

class SendScreen extends ConsumerStatefulWidget {
  const SendScreen({super.key});

  @override
  ConsumerState<SendScreen> createState() => _SendScreenState();
}

class _SendScreenState extends ConsumerState<SendScreen> {
  int _currentStep = 0;
  TokenModel? _selectedToken;
  String _recipientAddress = '';
  double _amount = 0;

  @override
  Widget build(BuildContext context) {
    final tokens = ref.watch(tokensProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(_getStepTitle()),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: _buildStep(tokens),
        ),
      ),
    );
  }

  String _getStepTitle() {
    switch (_currentStep) {
      case 0:
        return 'Select Token';
      case 1:
        return 'Enter Address';
      case 2:
        return 'Enter Amount';
      case 3:
        return 'Review';
      case 4:
        return 'Confirm';
      default:
        return 'Send';
    }
  }

  Widget _buildStep(List<TokenModel> tokens) {
    switch (_currentStep) {
      case 0:
        return TokenSelector(
          tokens: tokens,
          selectedToken: _selectedToken,
          onTokenSelected: (token) {
            setState(() {
              _selectedToken = token;
              _currentStep = 1;
            });
          },
        );
      case 1:
        return AddressInput(
          onAddressEntered: (address) {
            setState(() {
              _recipientAddress = address;
              _currentStep = 2;
            });
          },
          onQrScan: () {
            setState(() {
              _recipientAddress = '0x742d35Cc6634C0532925a3b8D4e6D3b6e8d3e8F9';
              _currentStep = 2;
            });
          },
        );
      case 2:
        return AmountInput(
          token: _selectedToken!,
          onAmountEntered: (amount) {
            setState(() {
              _amount = amount;
              _currentStep = 3;
            });
          },
        );
      case 3:
        return _buildReviewStep();
      case 4:
        return _buildConfirmStep();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildReviewStep() {
    final currencyFormat = NumberFormat.currency(symbol: '\$', decimalDigits: 2);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Review Transaction',
          style: Theme.of(context).textTheme.headlineSmall,
        )
            .animate()
            .fadeIn(duration: 400.ms),
        const SizedBox(height: 24),
        _buildReviewItem('From', 'My Wallet', '0x742d...e8F9'),
        _buildReviewItem('To', 'Recipient', '${_recipientAddress.substring(0, 6)}...${_recipientAddress.substring(_recipientAddress.length - 4)}'),
        _buildReviewItem('Token', _selectedToken!.name, _selectedToken!.symbol),
        _buildReviewItem('Amount', '${_amount.toStringAsFixed(_amount < 1 ? 6 : 4)} ${_selectedToken!.symbol}', currencyFormat.format(_amount * _selectedToken!.price)),
        _buildReviewItem('Network Fee', '0.001 ETH', '\$2.50'),
        const Divider(color: AppColors.border),
        _buildReviewItem('Total', '', currencyFormat.format(_amount * _selectedToken!.price + 2.50), isTotal: true),
        const Spacer(),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              setState(() => _currentStep = 4);
            },
            child: const Text('Confirm'),
          ),
        )
            .animate()
            .fadeIn(delay: 400.ms, duration: 400.ms),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: () {
              setState(() => _currentStep = 2);
            },
            child: const Text('Edit'),
          ),
        ),
      ],
    );
  }

  Widget _buildReviewItem(String label, String value, String subValue, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
                if (value.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    value,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                  ),
                ],
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                subValue,
                style: isTotal
                    ? Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.accentGreen,
                        )
                    : Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildConfirmStep() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            color: AppColors.accentGreen.withOpacity(0.15),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.check,
            size: 64,
            color: AppColors.accentGreen,
          ),
        )
            .animate()
            .scale(
              begin: const Offset(0.5, 0.5),
              end: const Offset(1, 1),
              duration: 600.ms,
              curve: Curves.easeOutBack,
            ),
        const SizedBox(height: 32),
        Text(
          'Transaction Sent!',
          style: Theme.of(context).textTheme.headlineSmall,
        )
            .animate()
            .fadeIn(delay: 300.ms, duration: 400.ms),
        const SizedBox(height: 12),
        Text(
          'Your transaction has been submitted to the network',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
        )
            .animate()
            .fadeIn(delay: 400.ms, duration: 400.ms),
        const SizedBox(height: 32),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.elevatedSurface,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Image.network(
                    _selectedToken!.iconUrl,
                    errorBuilder: (context, error, stackTrace) {
                      return const Icon(Icons.monetization_on, size: 20);
                    },
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${_amount.toStringAsFixed(_amount < 1 ? 6 : 4)} ${_selectedToken!.symbol}',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    Text(
                      'To: ${_recipientAddress.substring(0, 6)}...${_recipientAddress.substring(_recipientAddress.length - 4)}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        )
            .animate()
            .fadeIn(delay: 500.ms, duration: 400.ms)
            .slideY(begin: 0.2, end: 0, delay: 500.ms, duration: 400.ms),
        const Spacer(),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => context.pop(),
            child: const Text('Done'),
          ),
        ),
      ],
    );
  }
}
