import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/theme/app_theme.dart';

class AddressInput extends StatefulWidget {
  final Function(String) onAddressEntered;
  final VoidCallback onQrScan;

  const AddressInput({
    super.key,
    required this.onAddressEntered,
    required this.onQrScan,
  });

  @override
  State<AddressInput> createState() => _AddressInputState();
}

class _AddressInputState extends State<AddressInput> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Recipient Address',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 8),
        Text(
          'Enter the wallet address or scan QR code',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
        const SizedBox(height: 24),
        TextField(
          controller: _controller,
          decoration: InputDecoration(
            hintText: '0x...',
            suffixIcon: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.qr_code_scanner),
                  onPressed: widget.onQrScan,
                ),
                IconButton(
                  icon: const Icon(Icons.content_paste),
                  onPressed: () async {
                    final clipboard = await Clipboard.getData(Clipboard.kTextPlain);
                    if (clipboard?.text != null) {
                      _controller.text = clipboard!.text!;
                    }
                  },
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
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
                child: const Icon(Icons.history, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Recent Addresses',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '0x742d...e8F9',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: () {
                  _controller.text = '0x742d35Cc6634C0532925a3b8D4e6D3b6e8d3e8F9';
                },
                child: const Text('Select'),
              ),
            ],
          ),
        ),
        const Spacer(),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _controller.text.isNotEmpty
                ? () => widget.onAddressEntered(_controller.text)
                : null,
            child: const Text('Continue'),
          ),
        ),
      ],
    );
  }
}
