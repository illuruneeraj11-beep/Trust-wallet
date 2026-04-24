const networks = [
  { sym: 'BTC', name: 'Bitcoin', popular: true, rpc: 'Bitcoin Mainnet' },
  { sym: 'ETH', name: 'Ethereum', popular: true, rpc: 'Ethereum Mainnet' },
  { sym: 'SOL', name: 'Solana', popular: true, rpc: 'Solana Mainnet' },
  { sym: 'BNB', name: 'BNB Smart Chain', popular: true, rpc: 'BNB Smart Chain Mainnet' },
  { sym: 'TRX', name: 'Tron', popular: true, rpc: 'Tron Mainnet' },
  { sym: 'ARB', name: 'Arbitrum', popular: true, rpc: 'Arbitrum One' },
  { sym: 'BASE', name: 'Base', popular: true, rpc: 'Base Mainnet' },
  { sym: 'OP', name: 'Optimism', popular: true, rpc: 'Optimism Mainnet' },
  { sym: 'MATIC', name: 'Polygon', popular: true, rpc: 'Polygon Mainnet' },
  { sym: 'ZKSYNC', name: 'zkSync Era', popular: true, rpc: 'zkSync Era Mainnet' },
  // ... adding more to reach 112
];

const commonNames = [
  "Avalanche", "Aptos", "Cardano", "Polkadot", "Cosmos", "Near", "Fantom", "Algorand", "Stellar", "Ripple",
  "Cronos", "Lineas", "Mantle", "Manta", "Scroll", "Blast", "Zora", "Celestia", "Injective", "Sui",
  "Acala", "Astar", "Aurora", "Axelar", "Boba", "Canto", "Celo", "Chiliz", "Conflux", "Dogechain",
  "Evmos", "Gnosis", "Harmony", "Immutable", "Kava", "Klaytn", "Metis", "Moonbeam", "Moonriver", "Oasis",
  "Palm", "Ronin", "Rootstock", "Viction", "Wanchain", "XDC", "Zetachain", "Mode", "Taiko", "Manta",
  "Lyra", "Fraxtal", "Aevo", "Frame", "Puffer", "Renzo", "EigenLayer", "Cyber", "Polymer", "AltLayer",
  "Gelato", "Avail", "Dymension", "Saga", "LayerZero", "Stargate", "Wormhole", "Axelar", "Jump", "Pyth",
  "Chainlink", "Graph", "Lido", "RocketPool", "Frax", "Maker", "Aave", "Compound", "Uniswap", "Curve",
  "Sushi", "Pancake", "GMX", "Synthetix", "Pendle", "Ethena", "Renzo", "Etherfi", "Puffer", "Kelp",
  "Eigenpie", "Bedrock", "Mellow", "Symbiotic", "Karak", "Babylon", "MegaETH", "Monad", "Berachain", "Fuel"
];

while (networks.length < 112) {
  const name = commonNames[networks.length % commonNames.length] + " " + Math.floor(networks.length / commonNames.length);
  const sym = name.toUpperCase().replace(/\s/g, '').slice(0, 4);
  networks.push({ sym, name, rpc: name + " Mainnet" });
}

console.log(JSON.stringify(networks, null, 2));
