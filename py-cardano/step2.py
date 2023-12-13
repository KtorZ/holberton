from pycardano import Address, BlockFrostChainContext
import os
import sys

context = BlockFrostChainContext(
    project_id=os.environ["BLOCKFROST_PROJECT_ID"],
    base_url="https://cardano-preview.blockfrost.io/api/",
)

with open(sys.argv[1] + "/me.addr", "r") as f:
  print(context.utxos(Address.from_primitive(f.read().strip())))
