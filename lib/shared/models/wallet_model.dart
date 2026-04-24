class WalletModel {
  final String id;
  final String name;
  final String address;
  final List<String> mnemonic;
  final bool isBackedUp;
  final DateTime createdAt;
  final bool isDefault;

  const WalletModel({
    required this.id,
    required this.name,
    required this.address,
    required this.mnemonic,
    this.isBackedUp = false,
    required this.createdAt,
    this.isDefault = false,
  });

  String get shortenedAddress {
    if (address.length < 10) return address;
    return '${address.substring(0, 6)}...${address.substring(address.length - 4)}';
  }

  WalletModel copyWith({
    String? id,
    String? name,
    String? address,
    List<String>? mnemonic,
    bool? isBackedUp,
    DateTime? createdAt,
    bool? isDefault,
  }) {
    return WalletModel(
      id: id ?? this.id,
      name: name ?? this.name,
      address: address ?? this.address,
      mnemonic: mnemonic ?? this.mnemonic,
      isBackedUp: isBackedUp ?? this.isBackedUp,
      createdAt: createdAt ?? this.createdAt,
      isDefault: isDefault ?? this.isDefault,
    );
  }
}
