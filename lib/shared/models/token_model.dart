import 'package:flutter/material.dart';

class TokenModel {
  final String id;
  final String name;
  final String symbol;
  final String iconUrl;
  final double balance;
  final double price;
  final double priceChange24h;
  final List<ChartPoint> chartData;
  final String network;
  final String? contractAddress;
  final int decimals;
  final bool isVerified;
  final String? description;

  const TokenModel({
    required this.id,
    required this.name,
    required this.symbol,
    required this.iconUrl,
    required this.balance,
    required this.price,
    required this.priceChange24h,
    required this.chartData,
    required this.network,
    this.contractAddress,
    this.decimals = 18,
    this.isVerified = true,
    this.description,
  });

  double get totalValue => balance * price;

  TokenModel copyWith({
    String? id,
    String? name,
    String? symbol,
    String? iconUrl,
    double? balance,
    double? price,
    double? priceChange24h,
    List<ChartPoint>? chartData,
    String? network,
    String? contractAddress,
    int? decimals,
    bool? isVerified,
    String? description,
  }) {
    return TokenModel(
      id: id ?? this.id,
      name: name ?? this.name,
      symbol: symbol ?? this.symbol,
      iconUrl: iconUrl ?? this.iconUrl,
      balance: balance ?? this.balance,
      price: price ?? this.price,
      priceChange24h: priceChange24h ?? this.priceChange24h,
      chartData: chartData ?? this.chartData,
      network: network ?? this.network,
      contractAddress: contractAddress ?? this.contractAddress,
      decimals: decimals ?? this.decimals,
      isVerified: isVerified ?? this.isVerified,
      description: description ?? this.description,
    );
  }
}

class ChartPoint {
  final DateTime time;
  final double price;

  const ChartPoint({required this.time, required this.price});
}

class TransactionModel {
  final String id;
  final String tokenId;
  final TransactionType type;
  final double amount;
  final double valueUsd;
  final String fromAddress;
  final String toAddress;
  final DateTime timestamp;
  final TransactionStatus status;
  final String? txHash;
  final double? fee;

  const TransactionModel({
    required this.id,
    required this.tokenId,
    required this.type,
    required this.amount,
    required this.valueUsd,
    required this.fromAddress,
    required this.toAddress,
    required this.timestamp,
    required this.status,
    this.txHash,
    this.fee,
  });
}

enum TransactionType { send, receive, swap, buy, stake, unstake }

enum TransactionStatus { pending, completed, failed }

extension TransactionTypeX on TransactionType {
  String get label {
    switch (this) {
      case TransactionType.send:
        return 'Send';
      case TransactionType.receive:
        return 'Receive';
      case TransactionType.swap:
        return 'Swap';
      case TransactionType.buy:
        return 'Buy';
      case TransactionType.stake:
        return 'Stake';
      case TransactionType.unstake:
        return 'Unstake';
    }
  }

  IconData get icon {
    switch (this) {
      case TransactionType.send:
        return Icons.arrow_upward;
      case TransactionType.receive:
        return Icons.arrow_downward;
      case TransactionType.swap:
        return Icons.swap_horiz;
      case TransactionType.buy:
        return Icons.credit_card;
      case TransactionType.stake:
        return Icons.lock;
      case TransactionType.unstake:
        return Icons.lock_open;
    }
  }
}

extension TransactionStatusX on TransactionStatus {
  Color get color {
    switch (this) {
      case TransactionStatus.pending:
        return Colors.orange;
      case TransactionStatus.completed:
        return const Color(0xFF00D4A5);
      case TransactionStatus.failed:
        return const Color(0xFFFF4D4D);
    }
  }

  String get label {
    switch (this) {
      case TransactionStatus.pending:
        return 'Pending';
      case TransactionStatus.completed:
        return 'Completed';
      case TransactionStatus.failed:
        return 'Failed';
    }
  }
}
