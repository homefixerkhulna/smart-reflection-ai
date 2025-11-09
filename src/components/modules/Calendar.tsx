import { Calendar as CalendarIcon } from "lucide-react";

export const Calendar = () => {
  // Mock data - in production, this would integrate with Google Calendar API
  const events = [
    { time: '09:00', title: 'Morning Skincare Routine', color: 'primary' },
    { time: '14:30', title: 'Dermatology Check-in', color: 'accent' },
    { time: '18:00', title: 'Evening Routine', color: 'primary' },
  ];

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <CalendarIcon className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-medium">Today's Schedule</h3>
      </div>
      <div className="space-y-3">
        {events.map((event, index) => (
          <div key={index} className="flex items-center space-x-3 group">
            <div className="text-sm text-muted-foreground w-14">{event.time}</div>
            <div className={`w-1 h-8 rounded-full bg-${event.color}`} />
            <div className="text-sm flex-1 group-hover:text-primary transition-colors">
              {event.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
