import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export const Compliments = () => {
  const compliments = [
    "You're looking radiant today!",
    "Your skin is glowing beautifully",
    "You have a wonderful smile",
    "Your confidence is inspiring",
    "You're taking great care of yourself",
  ];

  const [currentCompliment, setCurrentCompliment] = useState(
    compliments[Math.floor(Math.random() * compliments.length)]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCompliment(compliments[Math.floor(Math.random() * compliments.length)]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center space-x-3 glass-strong rounded-2xl p-6 glow">
      <Sparkles className="w-6 h-6 text-primary flex-shrink-0" />
      <p className="text-lg font-light italic">{currentCompliment}</p>
    </div>
  );
};
