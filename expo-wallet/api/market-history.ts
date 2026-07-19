import { handleMarketHistoryRequest, handleOptionsRequest } from "../src/server/market-api";

export function GET(request: Request) {
  return handleMarketHistoryRequest(request);
}

export function OPTIONS() {
  return handleOptionsRequest();
}
