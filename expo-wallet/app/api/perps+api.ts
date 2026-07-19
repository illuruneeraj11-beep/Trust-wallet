import { handleOptionsRequest, handlePerpsRequest } from "@/server/market-api";

export function OPTIONS() {
  return handleOptionsRequest();
}

export function GET(request: Request) {
  return handlePerpsRequest(request);
}
