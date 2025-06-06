import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useRef, useState } from 'react';
import DayCard from './DayCard';
import { Skeleton } from "../ui/skeleton";

interface DayEvent {
  date: string;
  siteLogs: any[];
  movements: any[];
  tasks: any[];
  attendees: any[];
  files: any[];
}

interface TimelineWorkspaceProps {
  weekEvents: DayEvent[];
  weekDays: Date[];
  isLoading: boolean;
  onDayClick: (dayEvent: DayEvent) => void;
}

export default function TimelineWorkspace({ 
  weekEvents, 
  weekDays, 
  isLoading, 
  onDayClick 
}: TimelineWorkspaceProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isLeftHovered, setIsLeftHovered] = useState(false);
  const [isRightHovered, setIsRightHovered] = useState(false);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Centrar automáticamente el día actual cuando se carga
  useEffect(() => {
    if (!isLoading && scrollContainerRef.current) {
      const todayIndex = weekDays.findIndex(day => 
        format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      );
      
      if (todayIndex !== -1) {
        const cardWidth = 192; // w-48 = 192px
        const gap = 16; // gap-4 = 16px
        const scrollPosition = todayIndex * (cardWidth + gap) - (scrollContainerRef.current.clientWidth / 2) + (cardWidth / 2);
        
        scrollContainerRef.current.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    }
  }, [weekDays, isLoading]);

  const scrollTimeline = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  const startAutoScroll = (direction: 'left' | 'right') => {
    if (scrollIntervalRef.current) return;
    
    scrollIntervalRef.current = setInterval(() => {
      if (scrollContainerRef.current) {
        const scrollAmount = 2;
        const currentScroll = scrollContainerRef.current.scrollLeft;
        const newScroll = direction === 'left' 
          ? currentScroll - scrollAmount 
          : currentScroll + scrollAmount;
        
        scrollContainerRef.current.scrollLeft = newScroll;
      }
    }, 16);
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-[#1e1e1e] border border-border rounded-lg p-6">
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Crear un mapa para acceso rápido a eventos por fecha
  const eventsByDate = weekEvents.reduce((acc, event) => {
    acc[event.date] = event;
    return acc;
  }, {} as Record<string, DayEvent>);

  return (
    <div className="bg-[#1e1e1e] border border-border rounded-lg overflow-hidden">
      {/* Horizontal Scrollable Timeline */}
      <div className="relative">
        {/* Left Navigation Button */}
        <button
          onClick={() => scrollTimeline('left')}
          onMouseEnter={() => {
            setIsLeftHovered(true);
            startAutoScroll('left');
          }}
          onMouseLeave={() => {
            setIsLeftHovered(false);
            stopAutoScroll();
          }}
          className="absolute left-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-r from-[#1e1e1e] to-transparent flex items-center justify-center hover:from-[#282828] transition-colors"
        >
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right Navigation Button */}
        <button
          onClick={() => scrollTimeline('right')}
          onMouseEnter={() => {
            setIsRightHovered(true);
            startAutoScroll('right');
          }}
          onMouseLeave={() => {
            setIsRightHovered(false);
            stopAutoScroll();
          }}
          className="absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-[#1e1e1e] to-transparent flex items-center justify-center hover:from-[#282828] transition-colors"
        >
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div ref={scrollContainerRef} className="overflow-x-auto px-6 py-6 scrollbar-hide">
          <div className="flex gap-4 min-w-max">
            {weekDays.map((day, index) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEvent = eventsByDate[dateKey] || {
                date: dateKey,
                siteLogs: [],
                movements: [],
                tasks: [],
                attendees: [],
                files: []
              };

              return (
                <div key={dateKey} className="flex-shrink-0 w-48">
                  {/* Day Header */}
                  <div className="text-center mb-4">
                    <div className="text-sm font-medium text-muted-foreground uppercase">
                      {format(day, 'EEE', { locale: es })}
                    </div>
                    <div className="text-2xl font-bold text-foreground mt-1">
                      {format(day, 'dd')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(day, 'MMM', { locale: es })}
                    </div>
                  </div>

                  {/* Day Card */}
                  <DayCard
                    dayEvent={dayEvent}
                    isToday={format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
                    onClick={() => onDayClick(dayEvent)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pb-6">
        <div className="pt-4 border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Bitácora</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Movimientos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Tareas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Archivos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Asistentes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}