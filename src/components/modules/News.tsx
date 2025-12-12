import { Newspaper } from "lucide-react";
import { useEffect, useState } from "react";
interface Article {
  title: string;
}
export const News = () => {
  const [newsItems, setNewsItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('https://newsdata.io/api/1/news?apikey=pub_de74b49bafb24c0881863626c23948f0&country=bd');
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        const data = await response.json();
        const articles: Article[] = data.results || [];
        setNewsItems(articles.map(article => article.title));
        setLoading(false);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
        setLoading(false);
      }
    };
    fetchNews();
  }, []);
  useEffect(() => {
    if (newsItems.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % newsItems.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [newsItems]);
  return <div className="glass rounded-2xl p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Newspaper className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-primary text-sm">Latest News</h3>
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed h-12 flex items-center">
        {loading ? <p>Loading news...</p> : error ? <p className="text-red-500">{error}</p> : newsItems.length > 0 ? <p key={currentIndex} className="animate-in fade-in duration-500 text-primary-foreground text-lg">
            {newsItems[currentIndex]}
          </p> : <p>No news available.</p>}
      </div>
    </div>;
};