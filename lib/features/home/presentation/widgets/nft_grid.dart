import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/models/nft_model.dart';

class NftGrid extends StatelessWidget {
  const NftGrid({super.key});

  @override
  Widget build(BuildContext context) {
    final mockNfts = [
      NftModel(
        id: '1',
        name: 'Bored Ape #1234',
        collection: 'BAYC',
        imageUrl: '',
        network: 'ETH',
        floorPrice: 45.5,
      ),
      NftModel(
        id: '2',
        name: 'CryptoPunk #5678',
        collection: 'CryptoPunks',
        imageUrl: '',
        network: 'ETH',
        floorPrice: 65.0,
      ),
      NftModel(
        id: '3',
        name: 'Doodle #999',
        collection: 'Doodles',
        imageUrl: '',
        network: 'ETH',
        floorPrice: 5.2,
      ),
      NftModel(
        id: '4',
        name: 'Azuki #777',
        collection: 'Azuki',
        imageUrl: '',
        network: 'ETH',
        floorPrice: 12.8,
      ),
    ];

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.8,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: mockNfts.length,
      itemBuilder: (context, index) {
        final nft = mockNfts[index];
        return _NftCard(nft: nft)
            .animate()
            .fadeIn(delay: (index * 100).ms, duration: 400.ms)
            .scale(
              begin: const Offset(0.9, 0.9),
              end: const Offset(1, 1),
              delay: (index * 100).ms,
              duration: 400.ms,
            );
      },
    );
  }
}

class _NftCard extends StatelessWidget {
  final NftModel nft;

  const _NftCard({required this.nft});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.elevatedSurface,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(16),
                ),
              ),
              child: Center(
                child: Icon(
                  Icons.image,
                  size: 48,
                  color: AppColors.textSecondary.withOpacity(0.5),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  nft.collection,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  nft.name,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      Icons.local_offer_outlined,
                      size: 14,
                      color: AppColors.accentGreen,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${nft.floorPrice} ETH',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.accentGreen,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
