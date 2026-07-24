import assert from "node:assert/strict";

async function main() {
  process.env.EXPO_PUBLIC_WALLET_MODE = "visual-demo";
  const ledger = await import("../src/services/wallet-ledger");
  const { parseWalletQr } = await import("../src/lib/wallet-qr");
  const { sanitizeStoredWalletPreferences } = await import("../src/lib/wallet-preferences");
  const { looksLikeRegisteredWalletAddress } = await import("../src/lib/wallet-addresses");
  const { canonicalWalletNetwork, findAssetVariant, walletNetworkName, walletNetworksMatch } = await import("../src/lib/wallet-networks");

  const savedAddress = "0x1111111111111111111111111111111111111111";
  const sanitizedPreferences = sanitizeStoredWalletPreferences({
    trustedHandle: "legacy-owner",
    addressBook: [
      { id: "addr-2", name: "Legacy placeholder", network: "Ethereum", address: "0x123...789" },
      { id: "user-contact", name: "Saved contact", network: "Ethereum", address: savedAddress },
    ],
  });
  assert.equal("trustedHandle" in sanitizedPreferences, false, "legacy bundled identity must not survive preference migration");
  assert.deepEqual(sanitizedPreferences.addressBook, [{ id: "user-contact", name: "Saved contact", network: "Ethereum", address: savedAddress }], "legacy placeholder contacts must be removed without deleting user contacts");

  assert.deepEqual(parseWalletQr("trust-testnet://receive?address=demo_eth_receiver123&network=ethereum&asset=USDT&amount=12.5"), {
    recipient: "demo_eth_receiver123",
    asset: "USDT",
    amount: "12.5",
    network: "ethereum",
    kind: "send",
  });
  assert.equal(parseWalletQr("trustdemo://receive?address=demo_btc_receiver123&network=bitcoin").network, "bitcoin", "saved legacy receive QR payloads must remain readable");
  assert.equal(parseWalletQr("bitcoin:bc1qexampleaddress?amount=1.25").amount, "1.25");
  assert.throws(() => parseWalletQr("bad qr"), /Trust Wallet receive QR/);

  const initial = await ledger.getPortfolio();
  const sender = initial.wallets[0];
  assert.ok(sender, "a primary wallet must exist");
  assert.equal(initial.assets.length, 17, "the transfer registry must expose all 17 supported assets");
  const balancesBeforeSampleHistory = balanceSnapshot(initial);
  const initialHistory = await ledger.listTransfers();
  const senderSampleHistory = initialHistory.filter((item) => item.simulated_history && (item.from_wallet_id === sender.id || item.to_wallet_id === sender.id));
  assert.equal(senderSampleHistory.length, 500, "every wallet must start with 500 balance-neutral sample history rows");
  assert.equal(senderSampleHistory.filter((item) => item.direction === "incoming").length, 250, "sample history must contain more than 200 received rows");
  assert.equal(senderSampleHistory.filter((item) => item.direction === "outgoing").length, 250, "sample history must contain more than 200 sent rows");
  assert.equal(new Set(senderSampleHistory.map((item) => item.id)).size, 500, "sample history IDs must be unique");
  assert.ok(new Set(senderSampleHistory.map((item) => item.asset_code)).size >= 10, "sample history must rotate across realistic assets and networks");
  assert.deepEqual(balanceSnapshot(await ledger.getPortfolio()), balancesBeforeSampleHistory, "display-only sample history must never change balances");
  assert.equal((await ledger.listTransfers()).filter((item) => item.simulated_history && (item.from_wallet_id === sender.id || item.to_wallet_id === sender.id)).length, 500, "sample history generation must be idempotent");
  assert.equal(canonicalWalletNetwork("BNB Smart Chain"), "bsc");
  assert.equal(walletNetworkName("bsc"), "BNB Smart Chain");
  assert.equal(walletNetworksMatch("ETH", "Ethereum"), true);
  assert.equal(canonicalWalletNetwork("Arbitrum One"), "arbitrum");
  assert.equal(canonicalWalletNetwork("Avalanche C-Chain"), "avalanchec");
  assert.equal(canonicalWalletNetwork("OP Mainnet"), "optimism");
  assert.equal(findAssetVariant(initial.assets, "USDT", "BNB Smart Chain")?.code, "bsc:USDT", "asset selection must preserve the requested network variant");
  assert.equal(findAssetVariant(initial.assets, "ethereum-usdt", "BNB Smart Chain"), undefined, "an exact asset ID must never silently cross networks");
  assert.equal(findAssetVariant(initial.assets, "USDT", "BNB Smart Chain")?.code, "bsc:USDT", "QR return by symbol and network must select the exact compatible variant");
  assert.equal(ledger.looksLikeRecipientAddress("0x1111111111111111111111111111111111111111", "ethereum"), true);
  assert.equal(ledger.looksLikeRecipientAddress("0x2222222222222222222222222222222222222222", "bsc"), true);
  assert.equal(ledger.looksLikeRecipientAddress("0x2222222222222222222222222222222222222222", "arbitrum"), true);
  assert.equal(ledger.looksLikeRecipientAddress("0x2222222222222222222222222222222222222222", "avalanche c-chain"), true);
  assert.equal(ledger.looksLikeRecipientAddress("0x2222222222222222222222222222222222222222", "base"), true);
  assert.equal(ledger.looksLikeRecipientAddress("0x2222222222222222222222222222222222222222", "op mainnet"), true);
  assert.equal(ledger.looksLikeRecipientAddress("0x2222222222222222222222222222222222222222", "polygon"), true);
  assert.equal(ledger.looksLikeRecipientAddress("bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", "bitcoin"), true);
  assert.equal(ledger.looksLikeRecipientAddress("11111111111111111111111111111111", "solana"), true);
  assert.equal(ledger.looksLikeRecipientAddress("T111111111111111111111111111111111", "tron"), true);
  assert.equal(ledger.looksLikeRecipientAddress("0x1234", "ethereum"), false);
  assert.equal(looksLikeRegisteredWalletAddress("demo:base:0123456789abcdef01234567", "base"), true);
  assert.equal(looksLikeRegisteredWalletAddress("demo:base:0123456789abcdef01234567", "ethereum"), false);
  assert.equal(ledger.looksLikeRecipientAddress("demo:base:0123456789abcdef01234567", "base"), false, "registered addresses must resolve internally and never fall through as external destinations");
  const usdcNetworks = initial.assets
    .filter((asset) => asset.symbol === "USDC")
    .map((asset) => canonicalWalletNetwork(asset.network_slug ?? asset.network))
    .sort();
  assert.deepEqual(
    usdcNetworks,
    ["arbitrum", "avalanchec", "base", "ethereum", "optimism", "polygon", "solana"],
    "USDC must expose the seven researched destination networks exactly",
  );

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

  const externalAddress = "0x3333333333333333333333333333333333333333";
  const externalAmount = "1.25";
  const externalAmountUnits = BigInt(ledger.decimalToBaseUnits(externalAmount, usdt.decimals));
  const senderBeforeExternal = balanceUnits(await ledger.getPortfolio(), sender.id, usdt.id);
  const sinkBeforeExternal = BigInt(ledger.getVisualExternalSettlementUnits(usdt.id));
  const externalRequest = {
    fromWalletId: sender.id,
    recipient: externalAddress,
    assetId: usdt.id,
    amount: externalAmount,
    note: "External settlement",
    idempotencyKey: "contract-external-usdt",
  };
  const externalTransfer = await ledger.sendDemoTransfer(externalRequest);
  const externalReplay = await ledger.sendDemoTransfer(externalRequest);
  assert.equal(externalReplay.transaction_id, externalTransfer.transaction_id, "external transfer retries must return the original receipt");
  assert.equal(externalTransfer.transfer?.direction, "outgoing");
  assert.equal(externalTransfer.transfer?.to_wallet_id, null);
  assert.equal(externalTransfer.transfer?.counterparty_display_name, "External wallet");
  assert.equal(externalTransfer.transfer?.counterparty_address, externalAddress);
  assert.equal(senderBeforeExternal - balanceUnits(await ledger.getPortfolio(), sender.id, usdt.id), externalAmountUnits, "external sender debit must be exact");
  assert.equal(BigInt(ledger.getVisualExternalSettlementUnits(usdt.id)) - sinkBeforeExternal, externalAmountUnits, "external settlement credit must match the sender debit");

  await assert.rejects(ledger.archiveWallet(recipient.id), /Move all balances/);
  await ledger.archiveWallet(disposable.id);

  const activity = await ledger.listTransfers();
  for (const transactionId of [...fundingReceipts, ...transferReceipts]) {
    assert.equal(activity.filter((item) => item.transaction_id === transactionId).length, 1, `activity must contain one row for ${transactionId}`);
  }
  assert.equal(new Set(activity.map((item) => item.transaction_id)).size, activity.length, "activity transaction IDs must be unique");

  const usd = initial.assets.find((asset) => asset.code === "demo:USD");
  assert.ok(usd, "Demo USD must exist");
  const historyStartBalance = balanceUnits(await ledger.getPortfolio(), sender.id, usd.id);
  const historyStartSink = BigInt(ledger.getVisualExternalSettlementUnits(usd.id));
  for (let index = 0; index < ledger.MAX_ACTIVITY_ITEMS; index += 1) {
    await ledger.sendDemoTransfer({
      fromWalletId: sender.id,
      recipient: "demo_external_history_sink",
      assetId: usd.id,
      amount: "0.01",
      idempotencyKey: `contract-history-${index.toString().padStart(3, "0")}`,
    });
  }
  const longHistory = await ledger.listTransfers();
  const historyUnits = BigInt(ledger.MAX_ACTIVITY_ITEMS);
  const generatedHistory = longHistory.filter((item) => item.id.startsWith("visual-transfer-") && item.counterparty_address === "demo_external_history_sink");
  assert.ok(longHistory.length >= ledger.MAX_ACTIVITY_ITEMS, "the client must retain at least 500 activity records");
  assert.equal(generatedHistory.length, ledger.MAX_ACTIVITY_ITEMS, "the latest 500 records for the sender wallet must remain available");
  assert.equal(generatedHistory.every((item) => item.from_wallet_id === sender.id), true, "the 500-item activity test must remain attributable to the sender wallet");
  assert.equal(historyStartBalance - balanceUnits(await ledger.getPortfolio(), sender.id, usd.id), historyUnits, "500 external sends must debit exactly 500 cents");
  assert.equal(BigInt(ledger.getVisualExternalSettlementUnits(usd.id)) - historyStartSink, historyUnits, "500 external sends must credit exactly 500 cents to settlement");

  console.log("Wallet contract OK: 3 wallets, 17 assets, 500 balance-neutral history rows (250 received/250 sent), seven-network USDC, billion-scale funding, registered and external address transfers, exact conservation, replay safety, validation, archive guards, and 500-item live activity.");
}

function balanceUnits(portfolio: Awaited<ReturnType<typeof import("../src/services/wallet-ledger")["getPortfolio"]>>, walletId: string, assetId: string) {
  const value = portfolio.wallets.find((wallet) => wallet.id === walletId)?.balances.find((balance) => balance.asset_id === assetId)?.available_units ?? "0";
  return BigInt(value);
}

function balanceSnapshot(portfolio: Awaited<ReturnType<typeof import("../src/services/wallet-ledger")["getPortfolio"]>>) {
  return portfolio.wallets.flatMap((wallet) => wallet.balances.map((balance) => ({
    walletId: wallet.id,
    assetId: balance.asset_id,
    postedUnits: balance.posted_units,
    heldUnits: balance.held_units,
    availableUnits: balance.available_units,
  }))).sort((left, right) => `${left.walletId}:${left.assetId}`.localeCompare(`${right.walletId}:${right.assetId}`));
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
