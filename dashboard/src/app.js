const API_URL = "https://kupo-faithful-priority-kc9tx9.us1.demeter.run";

const PLAYER_NAMES = "players.json";

const STRATEGY_CONTROL = "control";
const STRATEGY_FATE = "fate";
const METADATA_LABEL = 42;

const TOTAL_REWARDS = 100;
const MAX_CONTROL = 50;
const SPLITTING_FACTOR = 1;

function getPlayers(playerNames) {
  return fetch(`${API_URL}/matches?order=oldest_first&created_after=35721000`)
    .then(res => res.json())
    .then(results => {
      const utxos = new Map();
      results.forEach(result => utxos.set(result.address, result))
      return utxos
    })
    .then(utxos => Promise.all(playerNames.map(p => {
      const utxo = utxos.get(p.address);

      if (utxo != null) {
        const slot = utxo.created_at.slot_no;
        const blockIndex = utxo.transaction_index;

        return fetch(`${API_URL}/metadata/${slot}?transaction_id=${utxo.transaction_id}`)
          .then(res => res.json())
          .then(metadata => {
            const labels = (metadata[0] || {}).schema || {};
            const metadatum = parseMetadatum(labels[METADATA_LABEL]);

            if (typeof metadatum === "object" && metadatum != null) {
              const { strategy, percentage } = metadatum;
              if (isValidStrategy(strategy) && isValidPercentage(percentage)) {
                return { ...p, choice: { strategy, slot, blockIndex, percentage } };
              }
            }

            return p;
          })
      }

      return Promise.resolve(p);
    })))
    .catch(e => {
      console.warn(e);
      return [];
    });

  function isValidStrategy(strategy) {
    return strategy === STRATEGY_FATE || strategy === STRATEGY_CONTROL
  }

  function isValidPercentage(percentage) {
    if (percentage === undefined) {
      return true
    }
    return Number.isSafeInteger(percentage) && percentage > 0 && percentage <= 100;
  }
}

function parseMetadatum(schema) {
  if (typeof schema === "object" && schema != null) {
    if (schema.hasOwnProperty("int") && typeof schema.int === "number") {
      return schema.int;
    }

    if (schema.hasOwnProperty("string") && typeof schema.string === "string") {
      return schema.string;
    }

    if (schema.hasOwnProperty("bytes") && typeof schema.bytes === "string") {
      return Uint8Array.from(schema.bytes.match(/(.{2})/g).map(x => Number.parseInt(x, 16)));
    }

    if (schema.hasOwnProperty("list") && Array.isArray(schema.list)) {
      return schema.list.map(parseMetadatum);
    }

    if (schema.hasOwnProperty("map") && Array.isArray(schema.map)) {
      return schema.map.reduce((obj, kv) => {
        const k = parseMetadatum(kv.k);
        const v = parseMetadatum(kv.v);

        // NOTE: This silently ignore metadata with non-JSON-compatible keys,
        // but for the sake of this program, this is fine.
        if (typeof k === "string" || typeof k === "int") {
          obj[k] = v;
        }

        return obj;
      }, {});
    }
  }

  return null
}

function mkLeaderboard(players) {
  const { fate, control, other } = splitByStrategy(players);

  const haveAbusedControl = totalControl(control) > MAX_CONTROL;

  const scores = [];

  const totalControlRewards = control.reduce((total, p) => {
    const score = haveAbusedControl ? 0 : Math.floor(TOTAL_REWARDS * p.choice.percentage / 100);
    scores.push({ ...p, score });
    return total += score;
  }, 0)

  const n = fate.length;
  const d = fateDenominator(n);
  const availableFateRewards = TOTAL_REWARDS - totalControlRewards;
  fate.sort(byAscendingDate).forEach((p, i) => {
    const score = Math.floor(availableFateRewards * Math.pow(i + 1, SPLITTING_FACTOR) / d);
    scores.push({ ...p, score });
  });

  other.forEach(p => scores.push({ ...p, score: null }));

  return scores.sort(byDescendingScore).map(({ name, address, score }, ix) => {
    return { name, address, score, rank: ix + 1 };
  });

  function splitByStrategy(ps) {
    return ps.reduce((groups, p) => {
      const strategy = (p.choice || {}).strategy;

      if (strategy === STRATEGY_FATE) {
        groups.fate.push(p);
      } else if (strategy === STRATEGY_CONTROL) {
        groups.control.push(p);
      } else {
        groups.other.push(p);
      }

      return groups;
    }, { fate: [], control: [], other: [] })
  }

  function fateDenominator(n, splittingFactor = SPLITTING_FACTOR) {
    let denominator = 0;
    for (let i = 1; i <= n; i += 1) {
      denominator += Math.pow(i, splittingFactor);
    }
    return denominator
  }

  function totalControl(ps) {
    return ps.reduce((total, p) => {
      if (p.choice != null && p.choice.strategy === STRATEGY_CONTROL) {
        total += p.choice.percentage;
      }
      return total;
    }, 0);
  }

  function byDescendingScore(a, b) {
    if (a.score === b.score) {
      return byAscendingDate(a, b);
    } else {
      return b.score - a.score;
    }
  }

  function byAscendingDate(a, b) {
    if (a.choice == null) {
      return -1;
    }

    if (b.choice == null) {
      return 1;
    }

    if (a.choice.slot === b.choice.slot) {
      return a.choice.blockIndex - b.choice.blockIndex;
    } else {
      return a.choice.slot - b.choice.slot;
    }
  }
}

function viewPlayer({ name, address, score, rank }) {
  const hasPlayed = score !== null;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = feather.icons[hasPlayed ? "check-circle" : "x-circle"].toSvg();
  const icon = wrapper.childNodes[0];
  icon.classList.add(hasPlayed ? "text-green-500" : "text-red-500");
  icon.style = 'margin-left: auto';

  let medal = '';
  if (rank === 1) {
    medal = 'bg-yellow-300 text-white shadow-sm'
  } else if (rank === 2) {
    medal = 'bg-zinc-400 text-white shadow-sm'
  } else if (rank === 3) {
    medal = 'bg-amber-800 text-white shadow-sm'
  }

  const el = document.createElement("article");
  el.innerHTML = `<label class="px-6 py-3 rounded-full ${medal} text-base">${hasPlayed ? rank : '-'}</label>
    <div class="flex flex-col">
      <h3 class="text-base">${name} <span class="hidden text-xs md:inline-block lg:text-sm">(${address})</span></h3>
      <span class="${hasPlayed ? '' : 'hidden'} text-xs text-gray-500">${score} ${score === 1 ? "pt" : "pts" }</span>
    </div>`;
  el.className = "flex items-center gap-x-8";
  el.appendChild(icon);

  return el;
}

function viewLeaderboard(domElement, playerNames) {
  return getPlayers(playerNames)
    .then(players => {
      domElement.replaceChildren(...mkLeaderboard(players).map(viewPlayer));
    })
    .catch(console.warn);
}

function withPlayerNames(cb) {
  fetch(PLAYER_NAMES, {cache: "no-cache"})
    .then(res => res.json())
    .then(cb, (e) => {
      console.warn('withPlayerNames', e);
      cb([]);
    });
}

window.app = function app(domElement) {
  withPlayerNames(playerNames => {
    viewLeaderboard(domElement, playerNames)
      .then(() => setTimeout(() => app(domElement), 5000));
  });
}
