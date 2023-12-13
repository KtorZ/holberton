import {
  Kupmios,
  Lucid,
  fromHex,
  Data,
  toHex,
} from "https://deno.land/x/lucid/mod.ts"
import * as cbor from "https://deno.land/x/cbor@v1.4.1/index.js";

const METADATA_LABEL = 42

const lucid = await Lucid.new(
  new Kupmios(Deno.env.get("KUPO_URL"), Deno.env.get("OGMIOS_URL")),
  Deno.env.get("NETWORK"),
)

lucid.selectWalletFromPrivateKey(await Deno.readTextFile("./my.sk"))

const scriptRef = {
  type: "PlutusV2",
  script: toHex(cbor.encode(fromHex(`59010601000032323232323232323232322223253330083371e6eb8cc014c01c00520004890d48656c6c6f2c20576f726c642100149858cc020c94ccc020cdc3a400000226464a66601e60220042930a99806249334c6973742f5475706c652f436f6e73747220636f6e7461696e73206d6f7265206974656d73207468616e2065787065637465640016375c601e002600e0062a660149212b436f6e73747220696e64657820646964206e6f74206d6174636820616e7920747970652076617269616e740016300a37540040046600200290001111199980319b8700100300c233330050053370000890011807000801001118031baa0015734ae6d5ce2ab9d5573caae7d5d0aba201`))),
}

console.log(scriptRef)

const tx = await lucid
  .newTx()
  .payToAddressWithData(
    "addr_test1wrzqlyffcf5yq3htqge9h9k29zv6d7ny0rqam6d4c5eqdfgg0h7yw",
    {
      inline: Data.void(),
      scriptRef,
    },
    {
      lovelace: 14000000n
    }
  )
  .complete()

const signedTx = await tx
  .sign()
  .complete()

console.log(signedTx);

const txHash = await signedTx.submit()

console.log(`Transaction submitted successfully: ${txHash}`)
