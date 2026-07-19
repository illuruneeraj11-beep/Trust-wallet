import { useEffect, useState } from "react";
import {
  Image,
  type ImageSourcePropType,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { TrustBrandIcon, type TrustBrandIconName, TrustIcon } from "@/components/trust-icon";
import { useAppContext } from "@/context/app-context";

const TRUST_ASSET_ROOT = "https://raw.githubusercontent.com/trustwallet/assets/master";

const bundledTokens: Record<string, ImageSourcePropType> = {
  AAPL: require("../../assets/tokens/AAPL.png"),
  AAVE: require("../../assets/tokens/AAVE.png"),
  ADA: require("../../assets/tokens/ADA.png"),
  AERO: require("../../assets/tokens/AERO.png"),
  AETHWETH: require("../../assets/tokens/AETHWETH.png"),
  AKE: require("../../assets/tokens/AKE.png"),
  ALUMINIUM: require("../../assets/tokens/ALUMINIUM.png"),
  AMD: require("../../assets/tokens/AMD.png"),
  AMZN: require("../../assets/tokens/AMZN.png"),
  ASTER: require("../../assets/tokens/ASTER.png"),
  AVAX: require("../../assets/tokens/AVAX.png"),
  BNB: require("../../assets/tokens/BNB.png"),
  BB: require("../../assets/tokens/BB.png"),
  BROCCOLI: require("../../assets/tokens/BROCCOLI.png"),
  BTC: require("../../assets/tokens/BTC.png"),
  CAKE: require("../../assets/tokens/CAKE.png"),
  CASHCAT: require("../../assets/tokens/CASHCAT.png"),
  CL: require("../../assets/tokens/CL.png"),
  COIN: require("../../assets/tokens/COIN.png"),
  COINMARKETCAP: require("../../assets/tokens/COINMARKETCAP.png"),
  CORN: require("../../assets/tokens/CORN.png"),
  CRCL: require("../../assets/tokens/CRCL.png"),
  CRWV: require("../../assets/tokens/CRWV.png"),
  DEXE: require("../../assets/tokens/DEXE.png"),
  DOGE: require("../../assets/tokens/DOGE.png"),
  DRAM: require("../../assets/tokens/DRAM.png"),
  ESPORTS: require("../../assets/tokens/ESPORTS.png"),
  ETH: require("../../assets/tokens/ETH.png"),
  EWY: require("../../assets/tokens/EWY.png"),
  GOLD: require("../../assets/tokens/GOLD.png"),
  GOOGL: require("../../assets/tokens/GOOGL.png"),
  HYPE: require("../../assets/tokens/HYPE.png"),
  HLX: require("../../assets/tokens/HLX.png"),
  INTC: require("../../assets/tokens/INTC.png"),
  JUNO: require("../../assets/tokens/JUNO.png"),
  KPEPE: require("../../assets/tokens/KPEPE.png"),
  LINK: require("../../assets/tokens/LINK.png"),
  LIT: require("../../assets/tokens/LIT.png"),
  KSM: require("../../assets/tokens/KSM.png"),
  LTC: require("../../assets/tokens/LTC.png"),
  META: require("../../assets/tokens/META.png"),
  MRVL: require("../../assets/tokens/MRVL.png"),
  MSFT: require("../../assets/tokens/MSFT.png"),
  MSTR: require("../../assets/tokens/MSTR.png"),
  MU: require("../../assets/tokens/MU.png"),
  NATGAS: require("../../assets/tokens/NATGAS.png"),
  NBIS: require("../../assets/tokens/NBIS.png"),
  NVDA: require("../../assets/tokens/NVDA.png"),
  ONDO: require("../../assets/tokens/ONDO.png"),
  OPENAI: require("../../assets/tokens/OPENAI.png"),
  PAXG: require("../../assets/tokens/PAXG.png"),
  PALLADIUM: require("../../assets/tokens/PALLADIUM.png"),
  RIVER: require("../../assets/tokens/RIVER.png"),
  RTX: require("../../assets/tokens/RTX.png"),
  PEPE: require("../../assets/tokens/PEPE.png"),
  PUMP: require("../../assets/tokens/PUMP.png"),
  SKR: require("../../assets/tokens/SKR.png"),
  SOL: require("../../assets/tokens/SOL.png"),
  SILVER: require("../../assets/tokens/SILVER.png"),
  SKHX: require("../../assets/tokens/SKHX.png"),
  SKHY: require("../../assets/tokens/SKHY.png"),
  SMSN: require("../../assets/tokens/SMSN.png"),
  SNDK: require("../../assets/tokens/SNDK.png"),
  SP500: require("../../assets/tokens/SP500.png"),
  SPCX: require("../../assets/tokens/SPCX.png"),
  SUI: require("../../assets/tokens/SUI.png"),
  SYN: require("../../assets/tokens/SYN.png"),
  TRUMP: require("../../assets/tokens/TRUMP.png"),
  TST: require("../../assets/tokens/TST.png"),
  TRX: require("../../assets/tokens/TRX.png"),
  TSLA: require("../../assets/tokens/TSLA.png"),
  TWT: require("../../assets/tokens/TWT.png"),
  UNI: require("../../assets/tokens/UNI.png"),
  USDC: require("../../assets/tokens/USDC.png"),
  USDT: require("../../assets/tokens/USDT.png"),
  VVV: require("../../assets/tokens/VVV.png"),
  V: require("../../assets/tokens/V.png"),
  WHEAT: require("../../assets/tokens/WHEAT.png"),
  WLD: require("../../assets/tokens/WLD.png"),
  WSTETH: require("../../assets/tokens/WSTETH.png"),
  WHY: require("../../assets/tokens/WHY.png"),
  XAUT: require("../../assets/tokens/XAUT.png"),
  XAU: require("../../assets/tokens/XAU.png"),
  XCU: require("../../assets/tokens/XCU.png"),
  XPD: require("../../assets/tokens/XPD.png"),
  XPT: require("../../assets/tokens/XPT.png"),
  XRP: require("../../assets/tokens/XRP.png"),
  XYZ100: require("../../assets/tokens/XYZ100.png"),
  ZEC: require("../../assets/tokens/ZEC.png"),
};

const bundledDapps: Record<string, ImageSourcePropType> = {
  AAVE: require("../../assets/dapps/DAPP_Aave.png"),
  AERODROME: require("../../assets/dapps/DAPP_Aerodrome.png"),
  ANKR: require("../../assets/dapps/DAPP_Ankr.png"),
  ASTER: bundledTokens.ASTER,
  ASTERASBNB: require("../../assets/dapps/DAPP_Aster.png"),
  BALANCER: require("../../assets/dapps/DAPP_Balancer.png"),
  BENQISTAKEDAVAX: require("../../assets/dapps/DAPP_Benqi.png"),
  BEEFY: require("../../assets/dapps/DAPP_Beefy.png"),
  BLAZESTAKE: require("../../assets/dapps/DAPP_BlazeStake.png"),
  CONVEXFINANCE: require("../../assets/dapps/DAPP_Convex.png"),
  COMPOUND: require("../../assets/dapps/DAPP_Compound.png"),
  COINMARKETCAP: bundledTokens.COINMARKETCAP,
  EXTRAFINANCELEVERAGEFARMING: require("../../assets/dapps/DAPP_ExtraFi.png"),
  FLUIDDEX: require("../../assets/dapps/DAPP_Fluid.png"),
  FLUIDLITE: require("../../assets/dapps/DAPP_Fluid.png"),
  FRAXSWAP: require("../../assets/dapps/DAPP_Fraxswap.png"),
  FOURMEME: require("../../assets/dapps/DAPP_FourMeme.png"),
  INFRAREDFINANCE: require("../../assets/dapps/DAPP_Infrared.png"),
  INCEPTION: require("../../assets/dapps/DAPP_Inception.png"),
  JITO: require("../../assets/dapps/DAPP_Jito.png"),
  KAMINO: require("../../assets/dapps/DAPP_Kamino.png"),
  KODIAKISLANDS: require("../../assets/dapps/DAPP_Kodiak.png"),
  KALSHI: require("../../assets/dapps/DAPP_Kalshi.png"),
  LIDO: require("../../assets/dapps/DAPP_Lido.png"),
  LIDOIMPACTSTAKING: require("../../assets/dapps/DAPP_Lido.png"),
  LIQUIDCOLLECTIVE: require("../../assets/dapps/DAPP_LiquidCollective.png"),
  LULO: require("../../assets/dapps/DAPP_Lulo.png"),
  MARINADENATIVE: require("../../assets/dapps/DAPP_Marinade.png"),
  MERLINSWAP: require("../../assets/dapps/DAPP_MerlinSwap.png"),
  MYRIAD: require("../../assets/dapps/DAPP_Myriad.png"),
  ORIGAMIFINANCE: require("../../assets/dapps/DAPP_Origami.png"),
  PANCAKESWAP: require("../../assets/dapps/DAPP_PancakeSwap.png"),
  PANCAKESWAPAMMV1: require("../../assets/dapps/DAPP_PancakeSwap.png"),
  PANCAKESWAPPERPS: require("../../assets/dapps/DAPP_PancakeSwap.png"),
  PANCAKESWAPPREDICTION: require("../../assets/dapps/DAPP_PancakeSwap.png"),
  PENDLE: require("../../assets/dapps/DAPP_Pendle.png"),
  POLYMARKET: require("../../assets/dapps/DAPP_Polymarket.png"),
  PREDICTFUN: require("../../assets/dapps/DAPP_PredictFun.png"),
  RAYDIUM: require("../../assets/dapps/DAPP_Raydium.png"),
  RAYDIUMPERPS: require("../../assets/dapps/DAPP_Raydium.png"),
  RENZO: require("../../assets/dapps/DAPP_Renzo.png"),
  ROCKETPOOL: require("../../assets/dapps/DAPP_RocketPool.png"),
  SPARKSAVINGS: require("../../assets/dapps/DAPP_Spark.png"),
  STAKEE: require("../../assets/dapps/DAPP_Stakee.png"),
  STHYPE: require("../../assets/dapps/DAPP_stHYPE.png"),
  STONFI: require("../../assets/dapps/DAPP_STONfi.png"),
  SUNSWAPV3: require("../../assets/dapps/DAPP_SUNSwap.png"),
  SUPERFORM: require("../../assets/dapps/DAPP_Superform.png"),
  SYMBIOTIC: require("../../assets/dapps/DAPP_Symbiotic.png"),
  UNISWAP: require("../../assets/dapps/DAPP_Uniswap.png"),
  VENUS: require("../../assets/dapps/DAPP_Venus.png"),
  VENOFINANCE: require("../../assets/dapps/DAPP_Veno.png"),
  WHALESMARKET: require("../../assets/dapps/DAPP_WhalesMarket.png"),
  YEARN: require("../../assets/dapps/DAPP_Yearn.png"),
};

const bundledBrands: Record<string, ImageSourcePropType> = {
  BINANCE: require("../../assets/brands/binance.png"),
  GOOGLEPAY: require("../../assets/brands/google-pay.png"),
  MASTERCARD: require("../../assets/brands/mastercard.png"),
  TRUSTWALLET: require("../../assets/brands/trust-wallet-icon.png"),
  VISA: require("../../assets/brands/visa.png"),
  WALLETCONNECT: require("../../assets/brands/walletconnect.png"),
};

const bundledNetworks: Record<string, ImageSourcePropType> = {
  ARBITRUM: require("../../assets/networks/NETWORK_ARBITRUM.png"),
  AURORA: require("../../assets/networks/NETWORK_AURORA.png"),
  AVALANCHECCHAIN: require("../../assets/networks/NETWORK_AVALANCHECCHAIN.png"),
  BASE: require("../../assets/networks/NETWORK_BASE.png"),
  BITCOIN: require("../../assets/networks/NETWORK_BITCOIN.png"),
  BITCOINCASH: require("../../assets/networks/NETWORK_BITCOINCASH.png"),
  BLAST: require("../../assets/networks/NETWORK_BLAST.png"),
  BNBSMARTCHAIN: require("../../assets/networks/NETWORK_BNBSMARTCHAIN.png"),
  CELO: require("../../assets/networks/NETWORK_CELO.png"),
  COSMOS: require("../../assets/networks/NETWORK_COSMOS.png"),
  DOGECOIN: require("../../assets/networks/NETWORK_DOGECOIN.png"),
  ETHEREUM: require("../../assets/networks/NETWORK_ETHEREUM.png"),
  FANTOM: require("../../assets/networks/NETWORK_FANTOM.png"),
  HYPERLIQUID: require("../../assets/networks/NETWORK_HYPERLIQUID.png"),
  LINEA: require("../../assets/networks/NETWORK_LINEA.png"),
  LITECOIN: require("../../assets/networks/NETWORK_LITECOIN.png"),
  MEGAETH: require("../../assets/networks/NETWORK_MEGAETH.png"),
  MONAD: require("../../assets/networks/NETWORK_MONAD.png"),
  OPMAINNET: require("../../assets/networks/NETWORK_OPMAINNET.png"),
  PLASMA: require("../../assets/networks/NETWORK_PLASMA.png"),
  POLYGON: require("../../assets/networks/NETWORK_POLYGON.png"),
  ROBINHOODCHAIN: require("../../assets/networks/NETWORK_ROBINHOODCHAIN.png"),
  SCROLL: require("../../assets/networks/NETWORK_SCROLL.png"),
  SOLANA: require("../../assets/networks/NETWORK_SOLANA.png"),
  SONIC: require("../../assets/networks/NETWORK_SONIC.png"),
  SUI: require("../../assets/networks/NETWORK_SUI.png"),
  THORCHAIN: require("../../assets/networks/NETWORK_THORCHAIN.png"),
  TON: require("../../assets/networks/NETWORK_TON.png"),
  TRON: require("../../assets/networks/NETWORK_TRON.png"),
  XRP: require("../../assets/networks/NETWORK_XRP.png"),
  ZCASH: require("../../assets/networks/NETWORK_ZCASH.png"),
  ZKSYNCERA: require("../../assets/networks/NETWORK_ZKSYNCERA.png"),
};

// Native coins use the larger chain artwork bundled with the app. The token
// thumbnails below are useful for provider-specific assets, but several native
// coin files are only 96px exports and become visibly soft on high-density
// phones. Ethereum's current Trust Wallet mark matches CoinMarketCap's blue
// native-coin artwork, so load the 512px provider original instead.
const bundledNativeTokens: Record<string, ImageSourcePropType> = {
  AVAX: bundledNetworks.AVALANCHECCHAIN,
  BNB: bundledNetworks.BNBSMARTCHAIN,
  BTC: bundledNetworks.BITCOIN,
  DOGE: bundledNetworks.DOGECOIN,
  HYPE: bundledNetworks.HYPERLIQUID,
  LTC: bundledNetworks.LITECOIN,
  SOL: bundledNetworks.SOLANA,
  SUI: bundledNetworks.SUI,
  TRX: bundledNetworks.TRON,
  XRP: bundledNetworks.XRP,
  ZEC: bundledNetworks.ZCASH,
};

const nativeTokenUris: Record<string, string> = {
  BTC: `${TRUST_ASSET_ROOT}/blockchains/bitcoin/info/logo.png`,
  ETH: "https://s2.coinmarketcap.com/static/img/coins/128x128/1027.png",
};

const nativeTokenSlugs: Record<string, string> = {
  AVAX: "avalanchec",
  BCH: "bitcoincash",
  JUNO: "juno",
  KSM: "kusama",
  LTC: "litecoin",
  TON: "ton",
  TRX: "tron",
  ZEC: "zcash",
};

const contractTokenUris: Record<string, string> = {
  AAVE: `${TRUST_ASSET_ROOT}/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png`,
  ASTER: `${TRUST_ASSET_ROOT}/blockchains/smartchain/assets/0x000Ae314E2A2172a039B26378814C252734f556A/logo.png`,
  DEXE: `${TRUST_ASSET_ROOT}/blockchains/ethereum/assets/0xde4EE8057785A7e8e800Db58F9784845A5C2Cbd6/logo.png`,
  LINK: `${TRUST_ASSET_ROOT}/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png`,
  ONDO: `${TRUST_ASSET_ROOT}/blockchains/ethereum/assets/0xfAbA6f8e4a5E8Ab82F62fe7C39859FA577269BE3/logo.png`,
  PAXG: `${TRUST_ASSET_ROOT}/blockchains/ethereum/assets/0x45804880De22913dAFE09f4980848ECE6EcbAf78/logo.png`,
  PEPE: `${TRUST_ASSET_ROOT}/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png`,
  PUMP: `${TRUST_ASSET_ROOT}/blockchains/solana/assets/pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn/logo.png`,
  TRUMP: `${TRUST_ASSET_ROOT}/blockchains/solana/assets/6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN/logo.png`,
  TWT: `${TRUST_ASSET_ROOT}/blockchains/smartchain/assets/0x4B0F1812e5Df2A09796481Ff14017e6005508003/logo.png`,
  USDC: `${TRUST_ASSET_ROOT}/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48/logo.png`,
  USDT: `${TRUST_ASSET_ROOT}/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png`,
  XAUT: `${TRUST_ASSET_ROOT}/blockchains/ethereum/assets/0x68749665FF8D2d112Fa859AA293F07A622782F38/logo.png`,
};

const networkSlugs: Record<string, string> = {
  ATOM: "cosmos",
  ARB: "arbitrum",
  ARBITRUM: "arbitrum",
  AURORA: "aurora",
  AVALANCHE: "avalanchec",
  AVALANCHECCHAIN: "avalanchec",
  BASE: "base",
  BCH: "bitcoincash",
  BITCOIN: "bitcoin",
  BITCOINCASH: "bitcoincash",
  BLAST: "blast",
  BNB: "smartchain",
  BNBSMARTCHAIN: "smartchain",
  BTC: "bitcoin",
  CELO: "celo",
  COSMOS: "cosmos",
  DOGE: "doge",
  DOGECOIN: "doge",
  ETH: "ethereum",
  ETHEREUM: "ethereum",
  FANTOM: "fantom",
  FTM: "fantom",
  HYPEREVM: "hyperevm",
  HYPERLIQUID: "hyperevm",
  LINEA: "linea",
  LTC: "litecoin",
  LITECOIN: "litecoin",
  MEGAETH: "megaeth",
  MONAD: "monad",
  OP: "optimism",
  OPMAINNET: "optimism",
  OPTIMISM: "optimism",
  POLYGON: "polygon",
  PLASMA: "plasma",
  RIPPLE: "ripple",
  ROBINHOOD: "robinhoodchain",
  ROBINHOODCHAIN: "robinhoodchain",
  RUNE: "thorchain",
  SCROLL: "scroll",
  SMARTCHAIN: "smartchain",
  SOL: "solana",
  SOLANA: "solana",
  SONIC: "sonic",
  SUI: "sui",
  THORCHAIN: "thorchain",
  TON: "ton",
  TRON: "tron",
  TRX: "tron",
  XRP: "ripple",
  ZCASH: "zcash",
  ZEC: "zcash",
  ZKSYNC: "zksync",
  ZKSYNCERA: "zksync",
};

const dappUris: Record<string, string> = {
  AERODROME: `${TRUST_ASSET_ROOT}/dapps/aerodrome.finance.png`,
  BALANCER: "https://s2.coinmarketcap.com/static/img/coins/128x128/5728.png",
  FLUIDDEX: `${TRUST_ASSET_ROOT}/dapps/fluid.instadapp.io.png`,
  FRAXSWAP: `${TRUST_ASSET_ROOT}/dapps/app.frax.finance.png`,
  MYRIAD: `${TRUST_ASSET_ROOT}/dapps/myriad.markets.png`,
  POLYMARKET: `${TRUST_ASSET_ROOT}/dapps/polymarket.com.png`,
  PREDICTFUN: `${TRUST_ASSET_ROOT}/dapps/predict.fun.png`,
  RAYDIUM: `${TRUST_ASSET_ROOT}/dapps/raydium.io.png`,
  STONFI: "https://app.ston.fi/favicon-32x32.png",
  SUNSWAPV3: "https://sunswap.com/favicon-32x32.png",
  UNISWAP: `${TRUST_ASSET_ROOT}/dapps/app.uniswap.org.png`,
  WALLETCONNECT: "https://avatars.githubusercontent.com/u/37784886?s=200&v=4",
};

// These higher-resolution originals are present in the official Trust Wallet
// assets repository. Keep the bundled files as offline fallbacks.
const officialHighResolutionDappUris: Record<string, string> = {
  BALANCER: `${TRUST_ASSET_ROOT}/dapps/balancer.finance.png`,
  BEEFY: `${TRUST_ASSET_ROOT}/dapps/app.beefy.finance.png`,
  JITO: `${TRUST_ASSET_ROOT}/dapps/www.jito.network.png`,
};

type LogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

type TokenLogoProps = LogoProps & {
  symbol: string;
  network?: string;
  uri?: string | null;
};

export function TokenLogo({ symbol, network, uri, size = 48, style }: TokenLogoProps) {
  const key = normalizeKey(symbol);
  if (key === "USD") {
    return (
      <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#1f8f5f", alignItems: "center", justifyContent: "center" }, style]}>
        <TrustIcon color="#ffffff" name="currency-usd" size={Math.round(size * 0.62)} />
      </View>
    );
  }
  const nativeSlug = nativeTokenSlugs[key];
  const contractUri = contractTokenUris[key];
  const officialUri = contractUri
    ?? (nativeSlug ? `${TRUST_ASSET_ROOT}/blockchains/${nativeSlug}/info/logo.png` : undefined);
  const nativeUri = nativeTokenUris[key];
  const bundledSource = bundledNativeTokens[key] ?? (key === "ETH" ? bundledNetworks.ETHEREUM : bundledTokens[key]);
  const source = (nativeUri ? { uri: nativeUri } : undefined)
    ?? bundledNativeTokens[key]
    ?? bundledTokens[key]
    ?? (contractUri ? { uri: contractUri } : undefined)
    ?? (uri ? { uri } : officialUri ? { uri: officialUri } : undefined);
  const showNetworkBadge = network && !isNativeNetworkPair(key, normalizeKey(network));
  const badgeSize = Math.max(14, Math.round(size * 0.44));

  return (
    <View style={[{ width: size, height: size }, style]}>
      <LogoFrame fallbackSource={contractUri || nativeUri ? bundledSource : undefined} source={source} size={size} fallback="unavailable" />
      {showNetworkBadge ? (
        <View
          style={{
            position: "absolute",
            right: -2,
            bottom: -2,
            width: badgeSize,
            height: badgeSize,
            borderRadius: Math.round(badgeSize / 2),
            borderWidth: 2,
            borderColor: "#ffffff",
            backgroundColor: "#ffffff",
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <NetworkLogo network={network} size={badgeSize - 4} />
        </View>
      ) : null}
    </View>
  );
}

export function NetworkLogo({ network, size = 48, style }: LogoProps & { network: string }) {
  const key = normalizeKey(network);
  const canonicalKey = key === "BTC" ? "BITCOIN"
    : key === "ETH" ? "ETHEREUM"
      : key === "BNB" || key === "SMARTCHAIN" ? "BNBSMARTCHAIN"
        : key === "SOL" ? "SOLANA"
          : key === "TRX" ? "TRON"
            : key === "ZEC" ? "ZCASH"
              : key;
  const localSource = bundledNetworks[canonicalKey] ?? (key in { BTC: true, BITCOIN: true }
    ? bundledTokens.BTC
    : key in { ETH: true, ETHEREUM: true }
      ? bundledTokens.ETH
      : key in { BNB: true, BNBSMARTCHAIN: true, SMARTCHAIN: true }
        ? bundledTokens.BNB
        : key in { SOL: true, SOLANA: true }
          ? bundledTokens.SOL
          : undefined);
  const slug = networkSlugs[key];
  const ethereumUri = canonicalKey === "ETHEREUM" ? nativeTokenUris.ETH : undefined;
  const source = ethereumUri ? { uri: ethereumUri } : localSource ?? (slug ? { uri: `${TRUST_ASSET_ROOT}/blockchains/${slug}/info/logo.png` } : undefined);

  return (
    <View style={style}>
      <LogoFrame fallbackSource={ethereumUri ? localSource : undefined} source={source} size={size} radius={Math.round(size * 0.24)} fallback="unavailable" />
    </View>
  );
}

export function DappLogo({ name, size = 48, style }: LogoProps & { name: string }) {
  const key = normalizeKey(name);
  const uri = dappUris[key];
  const officialHighResolutionUri = officialHighResolutionDappUris[key];
  const bundledSource = bundledDapps[key];
  const source = officialHighResolutionUri ? { uri: officialHighResolutionUri } : bundledSource ?? (uri ? { uri } : undefined);

  return (
    <View style={style}>
      <LogoFrame fallbackSource={officialHighResolutionUri ? bundledSource : !bundledSource && uri ? undefined : bundledSource} source={source} size={size} radius={Math.round(size * 0.24)} fallback="web" />
    </View>
  );
}

export type BrandName =
  | "trust-wallet"
  | "binance"
  | "visa"
  | "mastercard"
  | "walletconnect"
  | "google-pay"
  | "hyperliquid"
  | "aster"
  | "coinbase";

const brandGlyphs: Partial<Record<BrandName, TrustBrandIconName>> = {
  visa: "visa",
  mastercard: "mastercard",
  "google-pay": "google-pay",
  coinbase: "coinbase",
};

const brandGlyphColors: Partial<Record<BrandName, string>> = {
  visa: "#1434cb",
  mastercard: "#eb001b",
  "google-pay": "#3c4043",
  coinbase: "#0052ff",
};

export function BrandLogo({ brand, size = 48, style }: LogoProps & { brand: BrandName }) {
  const bundledBrandSource = brand === "visa"
    ? bundledBrands.VISA
    : brand === "mastercard"
      ? bundledBrands.MASTERCARD
      : brand === "google-pay"
        ? bundledBrands.GOOGLEPAY
        : brand === "trust-wallet"
          ? bundledBrands.TRUSTWALLET
          : undefined;

  if (bundledBrandSource) {
    return (
      <View style={[{ minWidth: size, height: size, alignItems: "center", justifyContent: "center" }, style]}>
        <LogoFrame source={bundledBrandSource} size={size} radius={Math.round(size * 0.2)} fallback="unavailable" />
      </View>
    );
  }

  const brandGlyph = brandGlyphs[brand];
  if (brandGlyph) {
    return (
      <View style={[{ minWidth: size, height: size, alignItems: "center", justifyContent: "center" }, style]}>
        <TrustBrandIcon color={brandGlyphColors[brand] ?? "#202124"} name={brandGlyph} size={Math.round(size * 0.82)} />
      </View>
    );
  }

  const source: ImageSourcePropType | undefined = brand === "binance"
    ? bundledBrands.BINANCE
    : brand === "hyperliquid"
      ? bundledNetworks.HYPERLIQUID
      : brand === "aster"
        ? { uri: contractTokenUris.ASTER }
    : brand === "walletconnect"
            ? bundledBrands.WALLETCONNECT
            : undefined;

  return (
    <View style={style}>
      <LogoFrame
        fallbackSource={brand === "aster" ? bundledDapps.ASTERASBNB : undefined}
        source={source}
        size={size}
        radius={brand === "trust-wallet" ? Math.round(size / 2) : Math.round(size * 0.24)}
        resizeMode={brand === "trust-wallet" ? "cover" : "contain"}
        fallback={brand === "walletconnect" ? "wallet-connect" : "unavailable"}
      />
    </View>
  );
}

export type ProviderName = "hyperliquid" | "aster" | "coinmarketcap" | "polymarket" | "predict-fun" | "myriad";

const providerLabels: Record<ProviderName, string> = {
  hyperliquid: "Hyperliquid",
  aster: "Aster",
  coinmarketcap: "CoinMarketCap",
  polymarket: "Polymarket",
  "predict-fun": "Predict.fun",
  myriad: "Myriad",
};

export function ProviderBadge({
  provider,
  size = 24,
  label,
}: {
  provider: ProviderName;
  size?: number;
  label?: string;
}) {
  const { theme } = useAppContext();
  const providerLogo = provider === "hyperliquid" || provider === "aster"
    ? <BrandLogo brand={provider} size={size} />
    : provider === "coinmarketcap"
      ? <DappLogo name="CoinMarketCap" size={size} />
      : <DappLogo name={provider} size={size} />;

  return (
    <View
      style={{
        minHeight: size + 10,
        paddingHorizontal: 10,
        borderRadius: (size + 10) / 2,
        backgroundColor: theme.surface,
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
      }}
    >
      {providerLogo}
      <Text style={{ color: theme.text, fontSize: 12, fontWeight: "700" }}>{label ?? providerLabels[provider]}</Text>
    </View>
  );
}

function LogoFrame({
  source,
  fallbackSource,
  size,
  radius = Math.round(size / 2),
  resizeMode = "contain",
  fallback,
}: {
  source?: ImageSourcePropType;
  fallbackSource?: ImageSourcePropType;
  size: number;
  radius?: number;
  resizeMode?: "contain" | "cover";
  fallback: "unavailable" | "web" | "wallet-connect";
}) {
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  const sourceKey = getSourceKey(source);
  const fallbackSourceKey = getSourceKey(fallbackSource);
  const activeSource = primaryFailed ? fallbackSource : source;
  const failed = primaryFailed && (!fallbackSource || fallbackFailed);

  useEffect(() => {
    setPrimaryFailed(false);
    setFallbackFailed(false);
  }, [fallbackSourceKey, sourceKey]);

  const fallbackName = fallback === "web" ? "web" : fallback;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: activeSource && !failed ? "transparent" : "#f1f1f4",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {activeSource && !failed ? (
        <Image
          onError={() => {
            if (primaryFailed) setFallbackFailed(true);
            else setPrimaryFailed(true);
          }}
          resizeMode={resizeMode}
          source={activeSource}
          style={{ width: size, height: size }}
        />
      ) : (
        <TrustIcon color="#77777b" name={fallbackName} size={Math.round(size * 0.52)} />
      )}
    </View>
  );
}

function normalizeKey(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function isNativeNetworkPair(symbol: string, network: string) {
  if (symbol === network) return true;
  const nativeAliases: Record<string, string[]> = {
    ADA: ["CARDANO"],
    AVAX: ["AVALANCHE", "AVALANCHECCHAIN"],
    BCH: ["BITCOINCASH"],
    BNB: ["SMARTCHAIN", "BNBSMARTCHAIN"],
    BTC: ["BITCOIN"],
    DOGE: ["DOGECOIN"],
    ETH: ["ETHEREUM"],
    HYPE: ["HYPERLIQUID", "HYPEREVM"],
    LTC: ["LITECOIN"],
    SOL: ["SOLANA"],
    TRX: ["TRON"],
    XRP: ["RIPPLE"],
    ZEC: ["ZCASH"],
  };
  return nativeAliases[symbol]?.includes(network) ?? false;
}

function getSourceKey(source?: ImageSourcePropType) {
  if (typeof source === "number") return String(source);
  if (Array.isArray(source)) return source.map((entry) => entry.uri).join("|");
  if (source && "uri" in source) return source.uri ?? "";
  return "";
}
