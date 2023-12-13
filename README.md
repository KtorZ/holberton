# Workshop: introduction to the blockchain

## Part 1: Presentation (40 min)

[Introduction to the blockchain](https://slides.com/d/2sEv0PA/live)

## Part 2: Workshop (~3h)

> **Warning**: **Pre-requisites**
>
> - Python >= 3.7

### Overview (20min)

#### A blockchain-based coordination game

- We start the game with $N$ players and $R$ reward points. The goal of
  each player is to maximize their own rewards.

- Participants have to commit to one of two strategies:
  - **Fate**;
    In this strategy, players are ranked based on when they committed to
    their strategy. The first one to commit is ranked 1st, and so on. Rewards
    then follows a power law such that players are given diminishing rewards
    from the first to the last.

  - **Control**;
    In this strategy, players chose what portion of the remaining rewards they
    assign to themselves. Those chosing control will have priority over those
    who play _Fate_, and players chosing _Fate_ will receive rewards based
    on what's left.

- Also, if 'Control' players collectively assign to themselves more than
  50% of the total rewards, they are excluded from the game. Rewards are then
  split between 'Fate' players only.

- Players can change their decision as many times as they wish until the
  game is over.

- The game ends at the end of an agreed time period.

> **Note**
>
> In the Fate strategy, we'll split rewards using the following function:
>
> $R(rank) = \frac{N-rank}{\sum_{i=1..N} i}$
>
> So for example, for 4 players, the rewards distribution looks like this:
>
> | Rank | Rewards |
> | ---  | ---     |
> | 1st  | 40%     |
> | 2nd  | 30%     |
> | 3rd  | 20%     |
> | 4th  | 10%     |

### Playing the game (~2h)

#### Setting up PyCardano

To get started, we'll need to install PyCardano. Let's use a virtual environment for this to avoid potential clashes with the rest of the system.

```
python3 -m venv ./venv
source venv/bin/activate
pip install pycardano
```

#### Configure a blockchain provider

To connect to a blockchain network, one needs to run a node that connects to the peer-to-peer network. In this workshop, however, we'll use an external _blockchain provider_ which alleviates the burden of running the infrastructure ourselves. Blockchain providers are hosted services which are themselves connected to one or more node and provide entrypoints to the chain, often through higher level API.

In PyCardano's lingua, a blockchain provider is called a _context_. For this exercise, we'll use [Blockfrost][]. When needed, you can create a _context_ as follows:


```python
from pycardano import BlockFrostChainContext

context = BlockFrostChainContext(
    project_id="previewUGzz0EOUyKWXfnSYLsHSR9cjMnMpfuDz",
    base_url="https://cardano-preview.blockfrost.io/api/",
)
```

#### Step 1: Generate credentials

To play the game, you must first create a wallet; or said differently, generate credentials to receive funds and produce digital signatures. We'll PyCardano to create cryptographic credentials for the game as such:

```python
from pycardano import Address, Network, PaymentSigningKey

signing_key = PaymentSigningKey.generate()

verification_key = PaymentVerificationKey.from_signing_key(signing_key)

address = Address(payment_part=verification_key.hash(),
                  network=Network.TESTNET)
```

**Tasks**:

- [ ] Create one file `me.sk` with a freshly generated secret key.
- [ ] Create one file `me.addr` with an address identifying the secret key.

> **Hint**
>
> You can turn a signing_key and an address into a text-friendly representation by using `str`. For example `str(signing_key)`.

#### Step 2: Receive `tADA`

You'll need funds in order to submit transactions to the network. But worry not, we are only using a test network for this workshop. Once you have created your address, share it with the event organisers so they can allocate send funds to you. They will give you a transaction id which you can inspect on [CardanoScan][].

##### Tasks

- [ ] Request test funds from the event organisers.
- [ ] Monitor funds locked by your address using [CardanoScan][].
- [ ] **(Bonus)** Monitor funds locked by your address using [PyCardano][].


> **Hint**:
>
> To do it programmatically, you'll need to query your available unspent transaction outputs (UTxO). You can do this directly from a _context_.
> Note also that you can load your address as follows:
>
> ```python
> from pycardano import Address
>
> with open("me.addr", "r") as f:
>   address = Address.from_primitive(f.read())
> ```

#### Step 3 or 4: Commit to a strategy

Now is time to play the game and chose a strategy. The game is played by submitting a transaction to the network with some specific auxiliary data. On Cardano, auxiliary are associated with a label which is a non-negative number and some structured object.

> **Note**
>
> For this session, we'll use the label: `42`.

Using [PyCardano][], we can create metadata using JSON, and we will expect them in the following form:

- `{ "strategy": "fate" }`
- `{ "strategy": "control", "percentage": P }`, where `0 < P <= 100`

For example, one can create auxiliary data as follows:

```python
from pycardano import (
    AlonzoMetadata,
    AuxiliaryData,
    Metadata
)

auxiliary_data = AuxiliaryData(AlonzoMetadata(metadata=Metadata({
  42: {
    "strategy": "fate"
  }
})))
```

To build the transaction, have a look at [PyCardano's Transaction builder](https://pycardano.readthedocs.io/en/latest/guides/transaction.html?highlight=build_and_sign#id1).

Remember that the goal of the game is to maximize your own gain. Hence, you may want to monitor what others are doing before committing to anything. Note that you may still commit to a different strategy even after you played. The final state of the game will be determined precisely 2h after the beginning of the game.

Your last decision will be the one taken into consideration.

##### Tasks

- [ ] Commit to a strategy
- [ ] **(Bonus)** Change your strategy based on other players

#### Step 3 or 4: Watch the chain

To adjust and adapt your strategy, you will most likely want to watch the chain and monitor what other players are doing.

One way to this is to check on [CardanoScan / Metadata](https://preview.cardanoscan.io/metadata).
However, this isn't very practical as it requires manually checking and monitoring the page. So it's good for a quick sanity check, but you'll likely want to write a script of your own instead.

You may also use either [Blockfrost][] to monitor the chain.

With Blockfrost, you'll likely want to look at:

- The [transaction metadata content in JSON](https://docs.blockfrost.io/#tag/Cardano-Metadata/paths/~1metadata~1txs~1labels~1%7Blabel%7D/get) endpoint. Be careful that we aren't the only users of the chain, so others may be using the same metadata tag for other purposes!

##### Tasks

- [ ] Monitor other players choices
- [ ] **(Bonus)** Automate changes in your strategy. For example, automatically fire new transactions when you detect an opportunity. Remember that you can change your strategy until the very end.

### Results overview & discussions (30min)

#### View final leaderboard

The game ends after a fixed period of time, the blockchain ledger serves as final
arbitrage for strategies committed by each player. After a short break, we'll
collect final results and present the leaderboard to all participants.

#### Goals & key points

The game illustrates a coordination problem where actors need to coordinate in the presence of possible adversaries. It is in the best interest of all participants to end the game quickly. While the most rationale strategy is for everyone to quickly commit to a 'Fate' strategy, it is almost certain that at least one person will try to commit to a 'Control' strategy. Because it is hard to know what the final state of the game is since anyone can change their decision up until the very end, it makes it also hard to trust anyone.

This is meant to emphasize two things:

- Trust is very difficult to define and obtain in practice because self interest often gets in the way.

- Distributed systems are complex but powerful as they can be accessed and modified by everyone concurrently.

### Python Crash Course

#### Printing to stdout

```python
print("foo")
```

#### Writing a file to disk

```python
with open("filename.extension", "w") as f:
    f.write(foo)
```

#### Reading a file from disk

```python
with open("filename.extension", "r") as f:
   foo = f.read()
```

[CardanoScan]: https://preview.cardanoscan.io/
[PyCardano]: https://github.com/Python-Cardano/pycardano
[Blockfrost]: https://blockfrost.io
