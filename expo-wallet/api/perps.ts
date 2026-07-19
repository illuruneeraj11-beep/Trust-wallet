import { handleOptionsRequest, handlePerpsRequest } from "../src/server/market-api";

export function GET(request: Request) {
  return handlePerpsRequest(request);
}

export function OPTIONS() {
  return handleOptionsRequest();
}
