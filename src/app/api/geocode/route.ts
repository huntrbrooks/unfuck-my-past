import { NextRequest, NextResponse } from 'next/server'

function parseQueryAndCountry(rawQuery: string, rawCountry?: string) {
  let query = (rawQuery || '').trim()
  let country = (rawCountry || '').trim()

  const m1 = query.match(/^([A-Za-z]{2})\s+(\d{3,10})$/)
  const m2 = query.match(/^(\d{3,10})\s+([A-Za-z]{2})$/)
  if (!country && m1) {
    country = m1[1]
    query = m1[2]
  } else if (!country && m2) {
    country = m2[2]
    query = m2[1]
  }

  return { query, country }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawQuery = body?.query
    const rawCountry = body?.country

    if (!rawQuery || typeof rawQuery !== 'string') {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    const apiKey = process.env.WEATHER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Weather API key missing' }, { status: 500 })
    }

    let { query, country } = parseQueryAndCountry(rawQuery, rawCountry)
    const cc = (country || '').toUpperCase()

    const isNumeric = /^\d{3,10}$/.test(query)

    // Prefer ZIP geocoding when numeric query and 2-letter country provided
    if (isNumeric && cc.length === 2) {
      const zipUrl = `https://api.openweathermap.org/geo/1.0/zip?zip=${encodeURIComponent(query)},${cc}&appid=${apiKey}`
      const zipRes = await fetch(zipUrl)
      if (zipRes.ok) {
        const z = await zipRes.json()
        const latitude = z.lat
        const longitude = z.lon
        const name = [z.name, z.country].filter(Boolean).join(', ')
        return NextResponse.json({ latitude, longitude, name })
      }
      // Fallback to direct if ZIP fails
    }

    // Direct geocoding (city/state/country)
    const qParam = cc.length === 2 ? `${query},${cc}` : query
    const dirUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(qParam)}&limit=10&appid=${apiKey}`
    const res = await fetch(dirUrl)
    if (!res.ok) {
      return NextResponse.json({ error: 'Geocoding failed' }, { status: res.status })
    }
    const results = await res.json()
    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: 'No results' }, { status: 404 })
    }

    let picked = results[0]
    if (cc.length === 2) {
      const match = results.find((r: any) => (r.country || '').toUpperCase() === cc)
      if (match) picked = match
    }

    const latitude = picked.lat
    const longitude = picked.lon
    const name = [picked.name, picked.state, picked.country].filter(Boolean).join(', ')

    return NextResponse.json({ latitude, longitude, name })
  } catch (error) {
    console.error('Geocode error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
