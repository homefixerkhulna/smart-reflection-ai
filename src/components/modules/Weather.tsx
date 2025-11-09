import { Cloud, CloudRain, Sun, Wind, MapPin, Loader2, AlertCircle } from "lucide-react";
import { useWeather } from "@/hooks/useWeather";

export const Weather = () => {
  const { weather, loading, error } = useWeather();

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'sun': return <Sun className="w-12 h-12" />;
      case 'rain': return <CloudRain className="w-12 h-12" />;
      default: return <Cloud className="w-12 h-12" />;
    }
  };

  const getOpenWeatherIcon = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">Weather data unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      {error && (
        <div className="text-xs text-muted-foreground flex items-center space-x-1 mb-2">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-primary">
            {getWeatherIcon(weather.icon)}
          </div>
          <div>
            <div className="text-5xl font-light">{weather.temp}°</div>
            <div className="text-sm text-muted-foreground">{weather.condition}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
        <MapPin className="w-3 h-3" />
        <span>{weather.location}</span>
      </div>
      
      <div className="flex space-x-6 text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Wind className="w-4 h-4" />
          <span>{weather.wind} km/h</span>
        </div>
        <div>Humidity {weather.humidity}%</div>
      </div>

      {/* Hourly Forecast */}
      <div className="pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground mb-3">Hourly Forecast</div>
        <div className="flex space-x-4 overflow-x-auto">
          {weather.hourlyForecast.map((hour, index) => (
            <div key={index} className="flex flex-col items-center space-y-1 min-w-[60px]">
              <div className="text-xs text-muted-foreground">{hour.time}</div>
              <img 
                src={getOpenWeatherIcon(hour.icon)} 
                alt="weather" 
                className="w-8 h-8"
              />
              <div className="text-sm font-medium">{hour.temp}°</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
