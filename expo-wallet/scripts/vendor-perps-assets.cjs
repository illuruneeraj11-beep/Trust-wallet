const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");

const outputDir = path.resolve(__dirname, "..", "assets", "tokens");

const assets = {
  AAPL: "https://app.trade.xyz/markets/aapl.svg",
  AKE: "https://s2.coinmarketcap.com/static/img/coins/200x200/38127.png",
  ALUMINIUM: "https://app.trade.xyz/markets/aluminium.svg",
  AMD: "https://app.trade.xyz/markets/amd.svg",
  AMZN: "https://app.trade.xyz/markets/amzn.svg",
  BB: "https://app.trade.xyz/markets/bb.svg",
  CASHCAT: "https://s2.coinmarketcap.com/static/img/coins/200x200/40809.png",
  CL: "https://app.trade.xyz/markets/cl.svg",
  COIN: "https://app.trade.xyz/markets/coin.svg",
  COINMARKETCAP: "https://s2.coinmarketcap.com/static/cloud/img/coinmarketcap_1.svg",
  CORN: "https://app.trade.xyz/markets/corn.svg",
  CRCL: "https://app.trade.xyz/markets/crcl.svg",
  CRWV: "https://app.trade.xyz/markets/crwv.svg",
  DRAM: "https://app.trade.xyz/markets/dram.svg",
  ESPORTS: "https://s2.coinmarketcap.com/static/img/coins/200x200/37414.png",
  EWY: "https://app.trade.xyz/markets/ewy.svg",
  GOLD: "https://app.trade.xyz/markets/gold.svg",
  GOOGL: "https://app.trade.xyz/markets/googl.svg",
  INTC: "https://app.trade.xyz/markets/intc.svg",
  META: "https://app.trade.xyz/markets/meta.svg",
  MRVL: "https://app.trade.xyz/markets/mrvl.svg",
  MSFT: "https://app.trade.xyz/markets/msft.svg",
  MSTR: "https://app.trade.xyz/markets/mstr.svg",
  MU: "https://app.trade.xyz/markets/mu.svg",
  NATGAS: "https://app.trade.xyz/markets/natgas.svg",
  NBIS: "https://app.trade.xyz/markets/nbis.svg",
  NVDA: "https://app.trade.xyz/markets/nvda.png",
  PALLADIUM: "https://app.trade.xyz/markets/palladium.svg",
  RTX: "https://www.google.com/s2/favicons?domain=rtx.com&sz=128",
  SILVER: "https://app.trade.xyz/markets/silver.svg",
  SKHX: "https://app.trade.xyz/markets/skhx.svg",
  SKHY: "https://app.trade.xyz/markets/skhy.svg",
  SMSN: "https://app.trade.xyz/markets/smsn.svg",
  SNDK: "https://app.trade.xyz/markets/sndk.svg",
  SP500: "https://app.trade.xyz/markets/sp500.svg",
  SPCX: "https://app.trade.xyz/markets/spcx.svg",
  TSLA: "https://app.trade.xyz/markets/tsla.png",
  WHEAT: "https://app.trade.xyz/markets/wheat.svg",
  WLD: "https://s2.coinmarketcap.com/static/img/coins/200x200/13502.png",
  XCU: "https://app.trade.xyz/markets/copper.svg",
  XPD: "https://app.trade.xyz/markets/palladium.svg",
  XPT: "https://app.trade.xyz/markets/platinum.svg",
  XYZ100: "https://app.trade.xyz/markets/100.png",
};

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  for (const [symbol, url] of Object.entries(assets)) {
    const response = await fetch(url, { headers: { "User-Agent": "Trust Wallet comparison asset vendor" } });
    if (!response.ok) throw new Error(`${symbol}: ${response.status} ${response.statusText}`);
    const input = Buffer.from(await response.arrayBuffer());
    await sharp(input)
      .resize(160, 160, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(outputDir, `${symbol}.png`));
    process.stdout.write(`${symbol}\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
