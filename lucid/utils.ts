const KUPO_URL = Deno.env.get('KUPO_URL')

export async function writeTextFile(filepath: string, content: string | Buffer) {
  console.log(`Writing '${filepath}'...`)
  return Deno.writeTextFile(filepath, content)
}

export async function fetchJson(path: string, hostname: string = KUPO_URL): Promise<Object> {
  return fetch(`${hostname}${path}`).then(res => res.json())
}
