import { handleMarketsRequest, handleOptionsRequest } from "../src/server/market-api";

export function GET(request: Request) {
  return handleMarketsRequest(request);
}

export function OPTIONS() {
  return handleOptionsRequest();
}
