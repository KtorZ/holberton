import { Lucid } from "https://deno.land/x/lucid/mod.ts"
import { writeTextFile } from "./utils.ts"

const lucid = await Lucid.new(undefined, Deno.env.get("NETWORK"))

const secretKey = lucid.utils.generatePrivateKey()

await writeTextFile(
  "./my.sk",
  secretKey,
)

await writeTextFile(
  "./my.addr",
  await lucid
    .selectWalletFromPrivateKey(secretKey)
    .wallet
    .address(),
)
