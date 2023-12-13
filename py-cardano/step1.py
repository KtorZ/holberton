from pycardano import Address, Network, PaymentSigningKey, PaymentVerificationKey
import sys

signing_key = PaymentSigningKey.generate()
with open(sys.argv[1] + "/me.sk", "w") as f:
    f.write(str(signing_key))

verification_key = PaymentVerificationKey.from_signing_key(signing_key)

address = Address(payment_part=verification_key.hash(), network=Network.TESTNET)
with open(sys.argv[1] + "/me.addr", "w") as f:
    f.write(str(address))
