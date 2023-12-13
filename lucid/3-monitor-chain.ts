import { sleep } from 'https://deno.land/x/sleep/mod.ts'
import { fetchJson } from "./utils.ts"

let lastFetchedSlot = null
while(true) {
  const matchesUrl = lastFetchedSlot == null
    ? `/matches`
    : `/matches?created_after=${lastFetchedSlot}`

  const matches = await fetchJson(matchesUrl)

  const results = await Promise.all(matches.map(async (match) => {
    const slotNo = match['created_at']['slot_no']

    const metadata = await fetchJson(`/metadata/${slotNo}?transaction_id=${match['transaction_id']}`)

    lastFetchedSlot = slotNo > lastFetchedSlot ? slotNo + 1 : lastFetchedSlot

    return {
      slotNo,
      metadata: metadata.length > 0
        ? metadata[0]['schema']
        : null,
      address: match['address']
    }
  }))

  results.reverse().forEach(result => {
    console.log(`slot: ${result.slotNo}`)
    console.log(`address: ${result.address}`)
    console.log(`metadata: ${JSON.stringify(result.metadata)}`)
    console.log()
  })

  // Sleep before looping, waiting for some slot to be created.
  await sleep(2)
}
