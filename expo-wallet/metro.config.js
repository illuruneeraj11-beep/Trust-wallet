const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
let marketCache = "{}";

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return async (req, res, next) => {
      if (req.url && req.url.startsWith("/api/markets")) {
        const requestUrl = new URL(req.url, "http://localhost");
        const ids = requestUrl.searchParams.get("ids") || "bitcoin,ethereum,binancecoin,solana";
        const target = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;

        try {
          const response = await fetch(target, { headers: { accept: "application/json" } });
          const body = await response.text();
          if (response.ok) {
            marketCache = body;
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.end(response.ok ? body : marketCache);
          return;
        } catch {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.end(marketCache);
          return;
        }
      }

      return middleware(req, res, next);
    };
  },
};

module.exports = config;
