-- Replace the two legacy placeholder identifiers with Circle's published
-- native USDC mainnet identifiers. These are display/catalog metadata only;
-- the simulated ledger never signs or broadcasts blockchain transactions.

set lock_timeout = '5s';
set statement_timeout = '30s';

update demo_ledger.assets a
set contract_identifier = requested.contract_identifier
from (
  values
    (
      'ethereum',
      'erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    ),
    (
      'solana',
      'spl:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    )
) as requested(network_slug, contract_identifier)
join demo_ledger.networks n on n.slug = requested.network_slug
where a.network_id = n.id
  and a.symbol = 'USDC';
