import { Newspaper } from "lucide-react";
import { useEffect, useState } from "react";

export const News = () => {
  // Mock data - in production, this would fetch from RSS feeds
  const newsItems = [
    "New study reveals benefits of daily sun protection",
    "Breakthrough in personalized skincare technology",
    "AI-powered dermatology shows 95% accuracy rate",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % newsItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Newspaper className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-medium">Latest News</h3>
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed h-12 flex items-center">
        <p className="animate-in fade-in duration-500" key={currentIndex}>
          {newsItems[currentIndex]}
        </p>
      </div>
    </div>
  );
};
