interface WeatherData {
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  location: string
  isDay: boolean
}

interface WeatherInsight {
  weatherSummary: string
  activityRecommendations: string
  environmentalAdaptations: string
  seasonalPractices: string
}

export class WeatherService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY || ''
  }

  async getWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
    try {
      if (!this.apiKey) {
        // Fallback weather data
        return {
          temperature: 22,
          condition: 'partly cloudy',
          humidity: 65,
          windSpeed: 10,
          location: 'Your Location',
          isDay: true
        }
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`
      )

      if (!response.ok) {
        throw new Error('Weather API request failed')
      }

      const data = await response.json()
      
      return {
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main.toLowerCase(),
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed),
        location: data.name,
        isDay: data.dt > data.sys.sunrise && data.dt < data.sys.sunset
      }
    } catch (error) {
      console.error('Error fetching weather data:', error)
      // Return fallback data
      return {
        temperature: 22,
        condition: 'partly cloudy',
        humidity: 65,
        windSpeed: 10,
        location: 'Your Location',
        isDay: true
      }
    }
  }

  generateWeatherInsight(weatherData: WeatherData, userPreferences: any): WeatherInsight {
    const { temperature, condition, humidity, windSpeed, isDay } = weatherData
    
    let activityRecommendations = ''
    let environmentalAdaptations = ''
    let seasonalPractices = ''

    // Temperature-based recommendations
    if (temperature < 10) {
      activityRecommendations = '• Consider indoor practices for warmth and comfort\n• Use blankets and warm clothing for outdoor activities\n• Focus on grounding and centering practices'
      environmentalAdaptations = '• Create a cozy indoor space with soft lighting\n• Use warm colors and comfortable seating\n• Consider using a space heater for comfort'
    } else if (temperature > 25) {
      activityRecommendations = '• Practice in the early morning or evening when cooler\n• Stay hydrated throughout your practice\n• Consider water-based or cooling practices'
      environmentalAdaptations = '• Find shaded outdoor areas\n• Use fans or air conditioning indoors\n• Wear light, breathable clothing'
    } else {
      activityRecommendations = '• Perfect temperature for both indoor and outdoor practice\n• Consider practicing in nature for grounding\n• Open windows for fresh air circulation'
      environmentalAdaptations = '• Adapt your space to your preference\n• Consider both indoor and outdoor options\n• Use natural lighting when possible'
    }

    // Condition-based recommendations
    if (condition.includes('rain') || condition.includes('drizzle')) {
      activityRecommendations += '\n• Rain creates a calming atmosphere for meditation\n• Use the sound of rain as background for practice\n• Consider water-based healing practices'
      environmentalAdaptations += '\n• Create a cozy indoor sanctuary\n• Use soft, warm lighting\n• Play gentle rain sounds if desired'
    } else if (condition.includes('sun') || condition.includes('clear')) {
      activityRecommendations += '\n• Sunshine provides natural vitamin D and energy\n• Consider outdoor practices for nature connection\n• Use sunlight for energizing practices'
      environmentalAdaptations += '\n• Find a sunny spot for energizing activities\n• Use natural light for uplifting practices\n• Consider outdoor meditation spots'
    } else if (condition.includes('cloud')) {
      activityRecommendations += '\n• Cloudy weather is perfect for introspective practices\n• Use the softer light for gentle healing work\n• Focus on inner reflection and contemplation'
      environmentalAdaptations += '\n• Create a soft, diffused lighting environment\n• Use gentle, calming colors\n• Perfect for deep inner work'
    }

    // Time of day considerations
    if (isDay) {
      activityRecommendations += '\n• Daytime energy is perfect for active practices\n• Use natural light for energizing activities\n• Consider movement-based healing practices'
    } else {
      activityRecommendations += '\n• Evening energy supports reflection and release\n• Use softer lighting for calming practices\n• Focus on winding down and preparation for rest'
    }

    // Seasonal practices (simplified - could be enhanced with actual season detection)
    const currentMonth = new Date().getMonth()
    if (currentMonth >= 2 && currentMonth <= 4) { // Spring
      seasonalPractices = '• Spring energy supports renewal and growth\n• Focus on new beginnings and fresh starts\n• Use spring flowers and fresh air in your practice'
    } else if (currentMonth >= 5 && currentMonth <= 7) { // Summer
      seasonalPractices = '• Summer energy supports vitality and expression\n• Focus on energy and outward movement\n• Use the sun\'s energy for empowerment practices'
    } else if (currentMonth >= 8 && currentMonth <= 10) { // Fall
      seasonalPractices = '• Fall energy supports letting go and release\n• Focus on gratitude and harvest of your growth\n• Use autumn colors and falling leaves in meditation'
    } else { // Winter
      seasonalPractices = '• Winter energy supports deep reflection and rest\n• Focus on inner wisdom and quiet strength\n• Use the quiet of winter for deep inner work'
    }

    const weatherSummary = `Current weather in ${weatherData.location}: ${temperature}°C, ${condition}, ${humidity}% humidity, ${windSpeed} km/h wind. ${isDay ? 'Daytime' : 'Evening'} conditions.`

    return {
      weatherSummary,
      activityRecommendations,
      environmentalAdaptations,
      seasonalPractices
    }
  }

  async getLocationAndWeather(): Promise<{ weatherData: WeatherData; insight: WeatherInsight } | null> {
    try {
      // This would be called from the client side with user permission
      // For now, we'll return null and handle this in the client
      return null
    } catch (error) {
      console.error('Error getting location and weather:', error)
      return null
    }
  }
}
