import assert from "node:assert/strict";

async function main() {
  process.env.EXPO_PUBLIC_WALLET_MODE = "visual-demo";
  const ledger = await import("../src/services/wallet-ledger");
  const { parseWalletQr } = await import("../src/lib/wallet-qr");

  assert.deepEqual(parseWalletQr("trust-testnet://receive?address=demo_eth_receiver123&network=ethereum&asset=USDT&amount=12.5"), {
    recipient: "demo_eth_receiver123",
    asset: "USDT",
    amount: "12.5",
    network: "ethereum",
    kind: "send",
  });
  assert.equal(parseWalletQr("trustdemo://receive?address=demo_btc_receiver123&network=bitcoin").network, "bitcoin", "saved legacy receive QR payloads must remain readable");
  assert.equal(parseWalletQr("bitcoin:bc1qexampleaddress?amount=1.25").amount, "1.25");
  assert.throws(() => parseWalletQr("bad qr"), /Trust Wallet Testnet QR/);

  const initial = await ledger.getPortfolio();
  const sender = initial.wallets[0];
  assert.ok(sender, "a primary wallet must exist");
  assert.equal(initial.assets.length, 12, "the transfer registry must expose all 12 supported testnet assets");

  const walletKey = "contract-wallet-create";
  const recipient = await ledger.createWallet("Savings", walletKey);
  const disposable = await ledger.createWallet("Disposable", "contract-wallet-disposable");
  const recipientReplay = await ledger.createWallet("Savings", walletKey);
  assert.equal(recipientReplay.id, recipient.id, "wallet creation replay must return the original wallet even after another wallet exists");

  const fundingReceipts: string[] = [];
  const transferReceipts: string[] = [];
  for (const asset of initial.assets) {
    const fundingAmount = asset.decimals >= 18 ? "1000000" : "1000000000";
    const fundingKey = `contract-fund-${asset.id}`;
    const funding = await ledger.fundDemoWallet({ walletId: sender.id, assetId: asset.id, amount: fundingAmount, idempotencyKey: fundingKey });
    const fundingReplay = await ledger.fundDemoWallet({ walletId: sender.id, assetId: asset.id, amount: fundingAmount, idempotencyKey: fundingKey });
    assert.equal(fundingReplay.transaction_id, funding.transaction_id, `${asset.code} funding retries must not post twice`);
    fundingReceipts.push(funding.transaction_id);

    const destinationAddress = (await ledger.getPortfolio()).wallets.find((wallet) => wallet.id === recipient.id)?.addresses
      .find((address) => address.network_slug === asset.network_slug)?.address;
    assert.ok(destinationAddress, `${asset.network_name} recipient address must exist`);

    const amount = asset.decimals ? "7.1" : "7";
    const amountUnits = BigInt(ledger.decimalToBaseUnits(amount, asset.decimals));
    const before = await ledger.getPortfolio();
    const senderBefore = balanceUnits(before, sender.id, asset.id);
    const recipientBefore = balanceUnits(before, recipient.id, asset.id);
    const transferKey = `contract-transfer-${asset.id}`;
    const request = { fromWalletId: sender.id, recipient: destinationAddress, assetId: asset.id, amount, note: `Move ${asset.code}`, idempotencyKey: transferKey };
    const transfer = await ledger.sendDemoTransfer(request);
    const transferReplay = await ledger.sendDemoTransfer(request);
    assert.equal(transferReplay.transaction_id, transfer.transaction_id, `${asset.code} transfer retries must not post twice`);
    transferReceipts.push(transfer.transaction_id);

    const after = await ledger.getPortfolio();
    const senderAfter = balanceUnits(after, sender.id, asset.id);
    const recipientAfter = balanceUnits(after, recipient.id, asset.id);
    assert.equal(senderBefore - senderAfter, amountUnits, `${asset.code} sender debit must be exact`);
    assert.equal(recipientAfter - recipientBefore, amountUnits, `${asset.code} recipient credit must be exact`);
    assert.equal(senderBefore + recipientBefore, senderAfter + recipientAfter, `${asset.code} transfer must conserve units`);
  }

  const usdt = initial.assets.find((asset) => asset.code === "ethereum:USDT");
  assert.ok(usdt, "Ethereum USDT must exist");
  const beforeFailures = await ledger.getPortfolio();
  const senderUsdtBefore = balanceUnits(beforeFailures, sender.id, usdt.id);
  const senderUsdtAddress = beforeFailures.wallets.find((wallet) => wallet.id === sender.id)?.addresses.find((address) => address.network_slug === usdt.network_slug)?.address;
  const recipientBitcoinAddress = beforeFailures.wallets.find((wallet) => wallet.id === recipient.id)?.addresses.find((address) => address.network_slug === "bitcoin")?.address;
  assert.ok(senderUsdtAddress);
  assert.ok(recipientBitcoinAddress);

  await assert.rejects(ledger.sendDemoTransfer({ fromWalletId: sender.id, recipient: senderUsdtAddress, assetId: usdt.id, amount: "1", idempotencyKey: "contract-self" }), /different destination wallet/);
  await assert.rejects(ledger.sendDemoTransfer({ fromWalletId: sender.id, recipient: recipientBitcoinAddress, assetId: usdt.id, amount: "1", idempotencyKey: "contract-wrong-network" }), /Ethereum address/);
  await assert.rejects(ledger.sendDemoTransfer({ fromWalletId: sender.id, recipient: "not-an-address", assetId: usdt.id, amount: "1", idempotencyKey: "contract-invalid-recipient" }), /valid Ethereum address/);
  await assert.rejects(ledger.sendDemoTransfer({ fromWalletId: sender.id, recipient: recipient.id, assetId: usdt.id, amount: "0", idempotencyKey: "contract-zero" }), /greater than zero/);
  await assert.rejects(ledger.sendDemoTransfer({ fromWalletId: sender.id, recipient: recipient.id, assetId: usdt.id, amount: "-1", idempotencyKey: "contract-negative" }), /positive decimal amount/);
  await assert.rejects(ledger.sendDemoTransfer({ fromWalletId: sender.id, recipient: recipient.id, assetId: usdt.id, amount: "0.0000001", idempotencyKey: "contract-precision" }), /at most 6 decimal places/);

  const current = await ledger.getPortfolio();
  const overdraftUnits = balanceUnits(current, sender.id, usdt.id) + 1n;
  await assert.rejects(ledger.sendDemoTransfer({ fromWalletId: sender.id, recipient: recipient.id, assetId: usdt.id, amount: ledger.baseUnitsToDecimal(overdraftUnits.toString(), usdt.decimals), idempotencyKey: "contract-overdraft" }), /Insufficient balance/);
  assert.equal(balanceUnits(await ledger.getPortfolio(), sender.id, usdt.id), senderUsdtBefore, "failed transfers must not change the sender balance");

  await assert.rejects(ledger.fundDemoWallet({ walletId: sender.id, assetId: usdt.id, amount: "2", idempotencyKey: `contract-fund-${usdt.id}` }), /different transaction/);
  await assert.rejects(ledger.sendDemoTransfer({ fromWalletId: sender.id, recipient: recipient.id, assetId: usdt.id, amount: "8", note: `Move ${usdt.code}`, idempotencyKey: `contract-transfer-${usdt.id}` }), /different transaction/);
  await assert.rejects(ledger.archiveWallet(recipient.id), /Move all balances/);
  await ledger.archiveWallet(disposable.id);

  const activity = await ledger.listTransfers();
  for (const transactionId of [...fundingReceipts, ...transferReceipts]) {
    assert.equal(activity.filter((item) => item.transaction_id === transactionId).length, 1, `activity must contain one row for ${transactionId}`);
  }
  assert.equal(new Set(activity.map((item) => item.transaction_id)).size, activity.length, "activity transaction IDs must be unique");

  console.log("Wallet contract OK: 3 wallets, 12 assets, billion-scale funding, address transfers, exact conservation, replay safety, validation, and archive guards.");
}

function balanceUnits(portfolio: Awaited<ReturnType<typeof import("../src/services/wallet-ledger")["getPortfolio"]>>, walletId: string, assetId: string) {
  const value = portfolio.wallets.find((wallet) => wallet.id === walletId)?.balances.find((balance) => balance.asset_id === assetId)?.available_units ?? "0";
  return BigInt(value);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
