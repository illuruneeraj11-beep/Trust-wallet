class NftModel {
  final String id;
  final String name;
  final String collection;
  final String imageUrl;
  final String network;
  final String? contractAddress;
  final String? tokenId;
  final double? floorPrice;
  final String? description;

  const NftModel({
    required this.id,
    required this.name,
    required this.collection,
    required this.imageUrl,
    required this.network,
    this.contractAddress,
    this.tokenId,
    this.floorPrice,
    this.description,
  });
}
