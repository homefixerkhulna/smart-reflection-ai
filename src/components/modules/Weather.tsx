import { Cloud, CloudRain, Sun, Wind } from "lucide-react";

export const Weather = () => {
  // Mock data - in production, this would fetch from OpenWeatherMap API
  const weather = {
    temp: 22,
    condition: 'Partly Cloudy',
    humidity: 65,
    wind: 12,
    icon: 'cloud'
  };

  const getWeatherIcon = () => {
    switch (weather.icon) {
      case 'sun': return <Sun className="w-12 h-12" />;
      case 'rain': return <CloudRain className="w-12 h-12" />;
      default: return <Cloud className="w-12 h-12" />;
    }
  };

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <div className="text-primary">
          {getWeatherIcon()}
        </div>
        <div>
          <div className="text-5xl font-light">{weather.temp}°</div>
          <div className="text-sm text-muted-foreground">{weather.condition}</div>
        </div>
      </div>
      <div className="flex space-x-6 text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Wind className="w-4 h-4" />
          <span>{weather.wind} km/h</span>
        </div>
        <div>Humidity {weather.humidity}%</div>
      </div>
    </div>
  );
};
