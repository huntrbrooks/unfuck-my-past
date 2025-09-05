import { NextRequest, NextResponse } from 'next/server'
import { WeatherService } from '@/lib/weather-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { latitude, longitude } = body

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Location coordinates required' }, { status: 400 })
    }

    const weatherService = new WeatherService()
    const weatherData = await weatherService.getWeatherData(latitude, longitude)
    const insight = weatherService.generateWeatherInsight(weatherData, { tone: 'neutral', engagement: 'passive' })

    return NextResponse.json({
      weatherData,
      insight
    })

  } catch (error) {
    console.error('Error getting weather data:', error)
    return NextResponse.json(
      { error: 'Failed to get weather data' },
      { status: 500 }
    )
  }
}
