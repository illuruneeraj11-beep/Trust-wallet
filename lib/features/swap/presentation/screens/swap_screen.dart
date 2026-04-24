import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/models/token_model.dart';
import '../../../../shared/providers/wallet_provider.dart';
import '../widgets/swap_card.dart';
import '../widgets/slippage_settings.dart';

class SwapScreen extends ConsumerStatefulWidget {
  const SwapScreen({super.key});

  @override
  ConsumerState<SwapScreen> createState() => _SwapScreenState();
}

class _SwapScreenState extends ConsumerState<SwapScreen>
    with SingleTickerProviderStateMixin {
  TokenModel? _fromToken;
  TokenModel? _toToken;
  double _fromAmount = 0;
  double _toAmount = 0;
  double _slippage = 0.5;
  bool _isSwapping = false;
  bool _showSuccess = false;

  late AnimationController _flipController;

  @override
  void initState() {
    super.initState();
    _flipController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _flipController.dispose();
    super.dispose();
  }

  void _flipTokens() {
    _flipController.forward().then((_) {
      setState(() {
        final temp = _fromToken;
        _fromToken = _toToken;
        _toToken = temp;
        final tempAmount = _fromAmount;
        _fromAmount = _toAmount;
        _toAmount = tempAmount;
      });
      _flipController.reverse();
    });
  }

  void _calculateToAmount() {
    if (_fromToken != null && _toToken != null && _fromAmount > 0) {
      final rate = _fromToken!.price / _toToken!.price;
      _toAmount = _fromAmount * rate * (1 - _slippage / 100);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = ref.watch(tokensProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: _showSuccess ? _buildSuccessView() : _buildSwapView(tokens),
        ),
      ),
    );
  }

  Widget _buildSwapView(List<TokenModel> tokens) {
    return Column(
      children: [
        Text(
          'Swap',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 24),
        SwapCard(
          label: 'From',
          token: _fromToken ?? tokens.first,
          amount: _fromAmount,
          tokens: tokens,
          onTokenChanged: (token) {
            setState(() {
              _fromToken = token;
              _calculateToAmount();
            });
          },
          onAmountChanged: (amount) {
            setState(() {
              _fromAmount = amount;
              _calculateToAmount();
            });
          },
        ),
        const SizedBox(height: 8),
        _buildFlipButton(),
        const SizedBox(height: 8),
        SwapCard(
          label: 'To',
          token: _toToken ?? tokens[1],
          amount: _toAmount,
          tokens: tokens,
          onTokenChanged: (token) {
            setState(() {
              _toToken = token;
              _calculateToAmount();
            });
          },
          onAmountChanged: (amount) {
            setState(() {
              _toAmount = amount;
            });
          },
          isReadOnly: true,
        ),
        const SizedBox(height: 16),
        _buildRateInfo(),
        const SizedBox(height: 16),
        _buildSlippageRow(context),
        const Spacer(),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _fromAmount > 0 && !_isSwapping ? _performSwap : null,
            child: _isSwapping
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(AppColors.background),
                    ),
                  )
                : const Text('Preview Swap'),
          ),
        ),
        const SizedBox(height: 100),
      ],
    );
  }

  Widget _buildFlipButton() {
    return AnimatedBuilder(
      animation: _flipController,
      builder: (context, child) {
        return Transform.rotate(
          angle: _flipController.value * 3.14159,
          child: GestureDetector(
            onTap: _flipTokens,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: const Icon(
                Icons.swap_vert,
                color: AppColors.accentGreen,
                size: 24,
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildRateInfo() {
    if (_fromToken == null || _toToken == null || _fromAmount <= 0) {
      return const SizedBox.shrink();
    }

    final rate = _fromToken!.price / _toToken!.price;
    final currencyFormat = NumberFormat.currency(symbol: '\$', decimalDigits: 4);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          _buildRateRow('Rate', '1 ${_fromToken!.symbol} = ${rate.toStringAsFixed(6)} ${_toToken!.symbol}'),
          const SizedBox(height: 8),
          _buildRateRow('Price', currencyFormat.format(_fromToken!.price)),
          const SizedBox(height: 8),
          _buildRateRow('Network Fee', '\$2.50'),
        ],
      ),
    );
  }

  Widget _buildRateRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
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
    );
  }

  Widget _buildSlippageRow(BuildContext context) {
    return GestureDetector(
      onTap: () => _showSlippageModal(context),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.settings,
                  size: 18,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(width: 8),
                Text(
                  'Slippage Tolerance',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.accentGreen.withOpacity(0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                '${_slippage.toStringAsFixed(1)}%',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.accentGreen,
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessView() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            color: AppColors.accentGreen.withOpacity(0.15),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.check,
            size: 50,
            color: AppColors.accentGreen,
          ),
        )
            .animate()
            .scale(
              begin: const Offset(0.5, 0.5),
              end: const Offset(1, 1),
              duration: 500.ms,
              curve: Curves.easeOutBack,
            ),
        const SizedBox(height: 24),
        Text(
          'Swap Successful!',
          style: Theme.of(context).textTheme.headlineSmall,
        )
            .animate()
            .fadeIn(delay: 200.ms, duration: 400.ms),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              _buildSuccessRow(
                'From',
                '${_fromAmount.toStringAsFixed(4)} ${_fromToken?.symbol}',
                _fromToken?.iconUrl ?? '',
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Icon(Icons.arrow_downward, color: AppColors.textSecondary),
              ),
              _buildSuccessRow(
                'To',
                '${_toAmount.toStringAsFixed(4)} ${_toToken?.symbol}',
                _toToken?.iconUrl ?? '',
              ),
            ],
          ),
        )
            .animate()
            .fadeIn(delay: 400.ms, duration: 400.ms),
        const Spacer(),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              setState(() {
                _showSuccess = false;
                _fromAmount = 0;
                _toAmount = 0;
              });
            },
            child: const Text('Swap Again'),
          ),
        ),
        const SizedBox(height: 100),
      ],
    );
  }

  Widget _buildSuccessRow(String label, String value, String iconUrl) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: AppColors.elevatedSurface,
            borderRadius: BorderRadius.circular(18),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: Image.network(
              iconUrl,
              errorBuilder: (context, error, stackTrace) {
                return const Icon(Icons.monetization_on, size: 18);
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
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              Text(
                value,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showSlippageModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SlippageSettings(
          currentSlippage: _slippage,
          onSlippageChanged: (slippage) {
            setState(() {
              _slippage = slippage;
              _calculateToAmount();
            });
          },
        );
      },
    );
  }

  Future<void> _performSwap() async {
    setState(() => _isSwapping = true);
    await Future.delayed(const Duration(seconds: 2));
    setState(() {
      _isSwapping = false;
      _showSuccess = true;
    });
  }
}
