const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = url.searchParams.get("ids") ?? "bitcoin,ethereum,binancecoin,solana";
  const target = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;

  try {
    const response = await fetch(target, {
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      return Response.json({ error: `CoinGecko responded ${response.status}` }, { status: response.status, headers: corsHeaders });
    }

    return Response.json(await response.json(), {
      headers: {
        ...corsHeaders,
        "Cache-Control": "s-maxage=45, stale-while-revalidate=120",
      },
    });
  } catch {
    return Response.json({ error: "Unable to fetch market data" }, { status: 502, headers: corsHeaders });
  }
}
