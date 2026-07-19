export class WalletAmountError extends Error {
  code: "INVALID_AMOUNT" | "TOO_MANY_DECIMALS" | "AMOUNT_TOO_LARGE";

  constructor(message: string, code: WalletAmountError["code"]) {
    super(message);
    this.name = "WalletAmountError";
    this.code = code;
  }
}

function normalizeIntegerString(value: string) {
  if (!/^-?\d+$/.test(value)) return "0";
  const negative = value.startsWith("-");
  const digits = (negative ? value.slice(1) : value).replace(/^0+(?=\d)/, "");
  return `${negative && digits !== "0" ? "-" : ""}${digits || "0"}`;
}

export function decimalToBaseUnits(amount: string, decimals: number) {
  const normalized = amount.trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
    throw new WalletAmountError("Enter a positive decimal amount without commas or exponent notation.", "INVALID_AMOUNT");
  }
  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > decimals) {
    throw new WalletAmountError(`This asset supports at most ${decimals} decimal places.`, "TOO_MANY_DECIMALS");
  }
  const units = `${whole}${fraction.padEnd(decimals, "0")}`.replace(/^0+(?=\d)/, "") || "0";
  if (units === "0") throw new WalletAmountError("Amount must be greater than zero.", "INVALID_AMOUNT");
  if (units.length > 60) throw new WalletAmountError("Amount is too large.", "AMOUNT_TOO_LARGE");
  return units;
}

export function baseUnitsToDecimal(amountUnits: string, decimals: number) {
  const normalized = normalizeIntegerString(amountUnits);
  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  if (decimals === 0) return `${negative ? "-" : ""}${unsigned}`;
  const padded = unsigned.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}
