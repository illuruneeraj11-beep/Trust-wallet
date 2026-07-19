import { Buffer } from "node:buffer";
import path from "node:path";
import { build, type Plugin } from "esbuild";

const root = process.cwd();
const aliases: Plugin = {
  name: "react-native-contract-aliases",
  setup(builder) {
    builder.onResolve({ filter: /^react-native$/ }, () => ({ path: path.join(root, "scripts/react-native-contract-shim.ts") }));
    builder.onResolve({ filter: /^@react-native\/async-storage\/async-storage$/ }, () => ({ path: path.join(root, "scripts/async-storage-contract-shim.ts") }));
    builder.onResolve({ filter: /^expo-secure-store$/ }, () => ({ path: path.join(root, "scripts/expo-secure-store-contract-shim.ts") }));
  },
};

async function main() {
  const result = await build({
    entryPoints: [path.join(root, "scripts/test-wallet-contract.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node20",
    plugins: [aliases],
    write: false,
  });

  const source = result.outputFiles[0]?.text;
  if (!source) throw new Error("Wallet contract bundle was not generated.");
  await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
