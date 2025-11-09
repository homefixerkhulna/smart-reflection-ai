import { useState, useEffect } from "react";

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
  icon: string;
  location: string;
  hourlyForecast: HourlyForecast[];
}

interface HourlyForecast {
  time: string;
  temp: number;
  icon: string;
}

// Replace with your OpenWeatherMap API key
// Get one free at: https://openweathermap.org/api
const OPENWEATHER_API_KEY = "YOUR_API_KEY_HERE";

export const useWeather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        if (OPENWEATHER_API_KEY === "YOUR_API_KEY_HERE") {
          // Use mock data if no API key
          setWeather({
            temp: 22,
            condition: 'Partly Cloudy',
            humidity: 65,
            wind: 12,
            icon: 'cloud',
            location: 'Demo Location',
            hourlyForecast: [
              { time: '14:00', temp: 23, icon: '02d' },
              { time: '15:00', temp: 24, icon: '01d' },
              { time: '16:00', temp: 25, icon: '01d' },
              { time: '17:00', temp: 23, icon: '02d' },
              { time: '18:00', temp: 21, icon: '03d' },
            ]
          });
          setError("Add your OpenWeatherMap API key to see real data");
          setLoading(false);
          return;
        }

        // Fetch current weather
        const currentWeatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
        );
        
        if (!currentWeatherResponse.ok) {
          throw new Error('Failed to fetch weather data');
        }

        const currentData = await currentWeatherResponse.json();

        // Fetch hourly forecast
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
        );

        if (!forecastResponse.ok) {
          throw new Error('Failed to fetch forecast data');
        }

        const forecastData = await forecastResponse.json();

        // Process hourly forecast (take next 5 hours)
        const hourlyForecast: HourlyForecast[] = forecastData.list
          .slice(0, 5)
          .map((item: any) => ({
            time: new Date(item.dt * 1000).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            }),
            temp: Math.round(item.main.temp),
            icon: item.weather[0].icon,
          }));

        const weatherIcon = mapOpenWeatherIcon(currentData.weather[0].icon);

        setWeather({
          temp: Math.round(currentData.main.temp),
          condition: currentData.weather[0].main,
          humidity: currentData.main.humidity,
          wind: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
          icon: weatherIcon,
          location: currentData.name,
          hourlyForecast,
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch weather');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.error('Location error:', err);
          // Fallback to a default location (London)
          fetchWeather(51.5074, -0.1278);
        }
      );
    } else {
      // Fallback to default location
      fetchWeather(51.5074, -0.1278);
    }
  }, []);

  return { weather, loading, error };
};

// Map OpenWeatherMap icon codes to our simplified icons
const mapOpenWeatherIcon = (iconCode: string): string => {
  const code = iconCode.slice(0, 2);
  switch (code) {
    case '01': return 'sun';
    case '09':
    case '10': return 'rain';
    case '02':
    case '03':
    case '04':
    default: return 'cloud';
  }
};
