// Starts a LocalTunnel and writes the URL to tunnel-url.txt
// Uses TUNNEL_PORT or PORT, default 3000. Auto-retries on errors.

const fs = require('fs')
const path = require('path')

async function startTunnel(port) {
  const lt = await import('localtunnel')
  const subdomain = `unfuckmypast-${Math.random().toString(36).slice(2, 8)}`
  const tunnel = await lt.default({ port, subdomain, host: 'https://loca.lt' })
  const url = tunnel.url
  const outPath = path.resolve(process.cwd(), 'tunnel-url.txt')
  try { fs.writeFileSync(outPath, url, 'utf8') } catch {}
  console.log(`Tunnel ready: ${url}`)
  tunnel.on('close', () => console.log('Tunnel closed'))
  tunnel.on('error', (e) => console.error('Tunnel error:', e?.message || e))
}

async function main() {
  const port = Number(process.env.TUNNEL_PORT || process.env.PORT || 3000)
  let attempts = 0
  const maxAttempts = 5
  while (attempts < maxAttempts) {
    try {
      await startTunnel(port)
      return
    } catch (e) {
      attempts += 1
      const delay = Math.min(1000 * Math.pow(2, attempts), 15000)
      console.warn(`Tunnel attempt ${attempts} failed: ${e?.message || e}. Retrying in ${delay}ms...`)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  console.error('Failed to start tunnel after multiple attempts.')
  process.exit(1)
}

main().catch((err) => {
  console.error('Failed to start tunnel:', err?.message || err)
  process.exit(1)
})


