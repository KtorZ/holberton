from pycardano import (
    Address,
    AlonzoMetadata,
    AuxiliaryData,
    BlockFrostChainContext,
    Metadata,
    PaymentSigningKey,
    TransactionBuilder,
    TransactionOutput
)
import os
import sys

context = BlockFrostChainContext(
    project_id=os.environ["BLOCKFROST_PROJECT_ID"],
    base_url="https://cardano-preview.blockfrost.io/api/",
)

with open(sys.argv[1] + "/me.addr", "r") as f:
  address = Address.from_primitive(f.read())

builder = TransactionBuilder(context)

builder.add_input_address(address)

try:
  builder.auxiliary_data = AuxiliaryData(AlonzoMetadata(metadata=Metadata({
    42: {
      "strategy": "control",
      "percentage": int(sys.argv[2])
    }
  })))
  print("Strategy: control (" + sys.argv[2] + "%)")
except IndexError:
  builder.auxiliary_data = AuxiliaryData(AlonzoMetadata(metadata=Metadata({
    42: {
      "strategy": "fate"
    }
  })))
  print("Strategy: fate")

sk = PaymentSigningKey.load(sys.argv[1] + "/me.sk")

transaction = builder.build_and_sign([sk], change_address=address)

print("Transaction ID: " + str(transaction.id))

context.submit_tx(transaction)
