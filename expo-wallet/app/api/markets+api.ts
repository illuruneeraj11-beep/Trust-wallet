import { handleMarketsRequest, handleOptionsRequest } from "@/server/market-api";

export function OPTIONS() {
  return handleOptionsRequest();
}

export function GET(request: Request) {
  return handleMarketsRequest(request);
}
