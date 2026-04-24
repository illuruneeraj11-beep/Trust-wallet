import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/token_model.dart';

final transactionsProvider = StateNotifierProvider<TransactionNotifier, List<TransactionModel>>((ref) {
  return TransactionNotifier();
});

class TransactionNotifier extends StateNotifier<List<TransactionModel>> {
  TransactionNotifier() : super(_mockTransactions);

  Future<void> addTransaction(TransactionModel transaction) async {
    state = [transaction, ...state];
  }

  List<TransactionModel> getTransactionsForToken(String tokenId) {
    return state.where((tx) => tx.tokenId == tokenId).toList();
  }
}

final _mockTransactions = [
  TransactionModel(
    id: 'tx_1',
    tokenId: 'bitcoin',
    type: TransactionType.receive,
    amount: 0.25,
    valueUsd: 16858.13,
    fromAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    toAddress: '0x742d35Cc6634C0532925a3b8D4e6D3b6e8d3e8F9',
    timestamp: DateTime.now().subtract(const Duration(hours: 2)),
    status: TransactionStatus.completed,
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    fee: 0.0001,
  ),
  TransactionModel(
    id: 'tx_2',
    tokenId: 'ethereum',
    type: TransactionType.send,
    amount: 0.5,
    valueUsd: 1728.39,
    fromAddress: '0x742d35Cc6634C0532925a3b8D4e6D3b6e8d3e8F9',
    toAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    timestamp: DateTime.now().subtract(const Duration(hours: 5)),
    status: TransactionStatus.completed,
    txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    fee: 0.002,
  ),
  TransactionModel(
    id: 'tx_3',
    tokenId: 'solana',
    type: TransactionType.swap,
    amount: 10,
    valueUsd: 1423.50,
    fromAddress: '0x742d35Cc6634C0532925a3b8D4e6D3b6e8d3e8F9',
    toAddress: '0xSOLANA_SWAPPED',
    timestamp: DateTime.now().subtract(const Duration(days: 1)),
    status: TransactionStatus.completed,
    txHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    fee: 0.0005,
  ),
  TransactionModel(
    id: 'tx_4',
    tokenId: 'tether',
    type: TransactionType.buy,
    amount: 500,
    valueUsd: 500.00,
    fromAddress: 'BANK_TRANSFER',
    toAddress: '0x742d35Cc6634C0532925a3b8D4e6D3b6e8d3e8F9',
    timestamp: DateTime.now().subtract(const Duration(days: 2)),
    status: TransactionStatus.completed,
    txHash: '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
    fee: 0.99,
  ),
  TransactionModel(
    id: 'tx_5',
    tokenId: 'dogecoin',
    type: TransactionType.receive,
    amount: 5000,
    valueUsd: 445.00,
    fromAddress: 'D5BjN6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F',
    toAddress: '0x742d35Cc6634C0532925a3b8D4e6D3b6e8d3e8F9',
    timestamp: DateTime.now().subtract(const Duration(days: 3)),
    status: TransactionStatus.completed,
    txHash: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
  ),
];
