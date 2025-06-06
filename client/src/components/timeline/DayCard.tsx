import { cn } from '../../lib/utils';
import { ClipboardList, TrendingUp, Wrench, Image, Users } from 'lucide-react';

interface DayEvent {
  date: string;
  siteLogs: any[];
  movements: any[];
  tasks: any[];
  attendees: any[];
  files: any[];
}

interface DayCardProps {
  dayEvent: DayEvent;
  isToday: boolean;
  onClick: () => void;
}

export default function DayCard({ dayEvent, isToday, onClick }: DayCardProps) {
  const hasEvents = dayEvent.siteLogs.length > 0 || dayEvent.movements.length > 0 || 
                   dayEvent.tasks.length > 0 || dayEvent.attendees.length > 0 || 
                   dayEvent.files.length > 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "h-32 bg-[#141414] border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:bg-[#1a1a1a] hover:border-primary/50",
        isToday ? "border-primary/60 bg-[#1a1a1a]" : "border-border",
        hasEvents ? "hover:shadow-lg" : ""
      )}
    >
      {hasEvents ? (
        <div className="space-y-2">
          {/* Event Icons Row */}
          <div className="flex flex-wrap gap-1">
            {dayEvent.siteLogs.length > 0 && (
              <div className="flex items-center gap-1">
                <ClipboardList size={12} className="text-blue-400" />
                <span className="text-xs text-blue-400">{dayEvent.siteLogs.length}</span>
              </div>
            )}
            {dayEvent.movements.length > 0 && (
              <div className="flex items-center gap-1">
                <TrendingUp size={12} className="text-green-400" />
                <span className="text-xs text-green-400">{dayEvent.movements.length}</span>
              </div>
            )}
            {dayEvent.tasks.length > 0 && (
              <div className="flex items-center gap-1">
                <Wrench size={12} className="text-orange-400" />
                <span className="text-xs text-orange-400">{dayEvent.tasks.length}</span>
              </div>
            )}
            {dayEvent.files.length > 0 && (
              <div className="flex items-center gap-1">
                <Image size={12} className="text-purple-400" />
                <span className="text-xs text-purple-400">{dayEvent.files.length}</span>
              </div>
            )}
            {dayEvent.attendees.length > 0 && (
              <div className="flex items-center gap-1">
                <Users size={12} className="text-yellow-400" />
                <span className="text-xs text-yellow-400">{dayEvent.attendees.length}</span>
              </div>
            )}
          </div>

          {/* Event Summary */}
          <div className="space-y-1">
            {dayEvent.siteLogs.length > 0 && (
              <div className="text-xs text-muted-foreground truncate">
                📝 {dayEvent.siteLogs[0].weather_conditions || 'Bitácora registrada'}
              </div>
            )}
            {dayEvent.movements.length > 0 && (
              <div className="text-xs text-muted-foreground truncate">
                💸 ${dayEvent.movements.reduce((sum, m) => sum + (m.amount || 0), 0).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-xs text-muted-foreground/50 text-center">
            Sin eventos
          </div>
        </div>
      )}

      {/* Today Indicator */}
      {isToday && (
        <div className="absolute top-1 right-1">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
        </div>
      )}
    </div>
  );
}