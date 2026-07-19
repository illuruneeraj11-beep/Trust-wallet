import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1, viewport-fit=cover" name="viewport" />
        <meta content="noindex, nofollow, noarchive" name="robots" />
        <meta content="#ffffff" name="theme-color" />
        <meta content="Trust Wallet Testnet environment" name="description" />
        <title>Trust Wallet Testnet</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `html, body { background: #f2f2f4; } body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
