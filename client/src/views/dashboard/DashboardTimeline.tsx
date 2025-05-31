import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Home, FolderKanban, FileText, DollarSign, Target, Users, Calendar, Wrench, ClipboardList, MessageSquare } from 'lucide-react';
import CircularButton from '@/components/ui/CircularButton';
import { useNavigationStore } from '@/stores/navigationStore';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';

type TimelineMode = 'hours' | 'days' | 'weeks' | 'months';

interface TimelineEvent {
  id: string;
  date: Date;
  type: 'sitelog' | 'task' | 'movement' | 'milestone' | 'calendar';
  title: string;
  description?: string;
  amount?: number;
  currency?: string;
  time?: string;
  location?: string;
  eventType?: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface TimelineNode {
  date: Date;
  events: TimelineEvent[];
  position: number;
}

// Helper functions for event type icons and labels
const getEventTypeIcon = (eventType: string) => {
  switch (eventType?.toLowerCase()) {
    case 'task':
    case 'tarea':
      return <Wrench className="w-3 h-3" />;
    case 'meeting':
    case 'reunión':
      return <Users className="w-3 h-3" />;
    case 'reminder':
    case 'recordatorio':
      return <ClipboardList className="w-3 h-3" />;
    case 'appointment':
    case 'cita':
      return <Calendar className="w-3 h-3" />;
    default:
      return <MessageSquare className="w-3 h-3" />;
  }
};

const getEventTypeLabel = (eventType: string) => {
  switch (eventType?.toLowerCase()) {
    case 'task':
      return 'Tarea';
    case 'meeting':
      return 'Reunión';
    case 'reminder':
      return 'Recordatorio';
    case 'appointment':
      return 'Cita';
    default:
      return eventType;
  }
};

function DashboardTimeline() {
  const [timelineMode, setTimelineMode] = useState<TimelineMode>('days');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [sidebarButtonPositions, setSidebarButtonPositions] = useState<Record<string, number>>({});
  const [hoveredEvent, setHoveredEvent] = useState<TimelineEvent | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Days per page based on mode
  const getDaysPerPage = () => {
    switch (timelineMode) {
      case 'hours': return 1;
      case 'days': return 7;
      case 'weeks': return 28; // 4 weeks
      case 'months': return 90; // ~3 months
      default: return 7;
    }
  };
  
  const { projectId, organizationId } = useUserContextStore();
  const { setView, setSection, currentSection } = useNavigationStore();

  // Fetch timeline data
  const { data: timelineData = [] } = useQuery({
    queryKey: ['/api/timeline-events', projectId, organizationId],
    queryFn: async () => {
      if (!projectId || !organizationId) return [];
      
      // Get site logs
      const { data: siteLogs } = await supabase
        .from('site_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('log_date', { ascending: true });

      // Get movements
      const { data: movements } = await supabase
        .from('site_movements')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      // Get calendar events
      const { data: calendarEvents } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('organization_id', organizationId)
        .order('date', { ascending: true });

      // Convert to timeline events
      const events: TimelineEvent[] = [];

      siteLogs?.forEach(log => {
        events.push({
          id: `sitelog-${log.id}`,
          date: new Date(log.log_date),
          type: 'sitelog',
          title: 'Bitácora de Obra',
          description: log.comments || log.description,
          icon: FileText,
          color: '#FF4D1C'
        });
      });

      movements?.forEach(movement => {
        events.push({
          id: `movement-${movement.id}`,
          date: new Date(movement.created_at),
          type: 'movement',
          title: 'Movimiento',
          description: movement.description,
          amount: movement.amount,
          currency: movement.currency,
          icon: DollarSign,
          color: '#10B981'
        });
      });

      calendarEvents?.forEach(event => {
        // Combinar fecha y hora del evento
        const eventDateTime = new Date(`${event.date}T${event.time}`);
        
        events.push({
          id: `calendar-${event.id}`,
          date: eventDateTime,
          type: 'calendar',
          title: event.title,
          description: event.description,
          time: event.time,
          location: event.location,
          eventType: event.type,
          icon: Calendar,
          color: '#6366F1'
        });
      });

      return events.sort((a, b) => a.date.getTime() - b.date.getTime());
    },
    enabled: !!projectId && !!organizationId,
  });

  // Generate timeline nodes based on mode
  const generateTimelineNodes = useCallback((): TimelineNode[] => {
    const nodes: TimelineNode[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    
    for (let i = -60; i <= 60; i++) { // 120 total units, centered on today
      const nodeDate = new Date(today);
      
      switch (timelineMode) {
        case 'hours':
          nodeDate.setHours(today.getHours() + i);
          break;
        case 'days':
          nodeDate.setDate(today.getDate() + i);
          break;
        case 'weeks':
          nodeDate.setDate(today.getDate() + (i * 7));
          break;
        case 'months':
          nodeDate.setMonth(today.getMonth() + i);
          break;
      }

      // Filter events for this time period
      const nodeEvents = timelineData.filter(event => {
        const eventDate = new Date(event.date);
        switch (timelineMode) {
          case 'hours':
            return eventDate.getHours() === nodeDate.getHours() && 
                   eventDate.toDateString() === nodeDate.toDateString();
          case 'days':
            return eventDate.toDateString() === nodeDate.toDateString();
          case 'weeks':
            const weekStart = new Date(nodeDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return eventDate >= weekStart && eventDate <= weekEnd;
          case 'months':
            return eventDate.getMonth() === nodeDate.getMonth() && 
                   eventDate.getFullYear() === nodeDate.getFullYear();
          default:
            return false;
        }
      });

      nodes.push({
        date: nodeDate,
        events: nodeEvents,
        position: i * 150 // 150px spacing between nodes for better spacing
      });
    }

    return nodes;
  }, [timelineData, timelineMode]);

  const timelineNodes = generateTimelineNodes();

  // Measure sidebar button positions
  useEffect(() => {
    const measureButtonPositions = () => {
      const positions: Record<string, number> = {};
      
      // Find all sidebar buttons by their data attributes or classes
      const sidebarButtons = document.querySelectorAll('[data-section]');
      
      sidebarButtons.forEach((button) => {
        const section = button.getAttribute('data-section');
        if (section) {
          const rect = button.getBoundingClientRect();
          const centerY = rect.top + rect.height / 2;
          positions[section] = centerY;
        }
      });
      
      console.log('Sidebar button positions:', positions);
      setSidebarButtonPositions(positions);
    };

    // Measure on mount and resize
    measureButtonPositions();
    window.addEventListener('resize', measureButtonPositions);
    
    return () => window.removeEventListener('resize', measureButtonPositions);
  }, []);

  // Center timeline on today when component mounts
  useEffect(() => {
    if (timelineRef.current && timelineNodes.length > 0) {
      // Find today's position in the timeline
      const today = new Date();
      const todayNode = timelineNodes.find(node => {
        const nodeDate = new Date(node.date);
        return nodeDate.toDateString() === today.toDateString();
      });
      
      if (todayNode) {
        // Center on today's actual position
        const centerPosition = 9000 + todayNode.position - (timelineRef.current.clientWidth / 2);
        timelineRef.current.scrollLeft = centerPosition;
      } else {
        // Fallback to center of timeline
        const centerPosition = 9000 - (timelineRef.current.clientWidth / 2);
        timelineRef.current.scrollLeft = centerPosition;
      }
    }
  }, [timelineNodes, timelineMode]);

  // Format date based on timeline mode
  const formatDate = (date: Date) => {
    switch (timelineMode) {
      case 'hours':
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      case 'days':
        return {
          dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase(),
          dayNumber: date.getDate().toString()
        };
      case 'weeks':
        return {
          dayName: 'SEM',
          dayNumber: `${Math.ceil(date.getDate() / 7)}`
        };
      case 'months':
        return {
          dayName: date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase(),
          dayNumber: date.getFullYear().toString().slice(-2)
        };
      default:
        return { dayName: '', dayNumber: '' };
    }
  };

  const getTimelineModeLabel = () => {
    switch (timelineMode) {
      case 'hours': return 'Horas';
      case 'days': return 'Días';
      case 'weeks': return 'Semanas';
      case 'months': return 'Meses';
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-background overflow-hidden">
      {/* HOY button at top */}
      <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 z-[60]">
        <button
          onClick={() => {
            const today = new Date();
            setCurrentDate(today);
            
            // Find and center on today's position
            if (timelineRef.current && timelineNodes.length > 0) {
              const todayNode = timelineNodes.find(node => {
                const nodeDate = new Date(node.date);
                return nodeDate.toDateString() === today.toDateString();
              });

              if (todayNode) {
                const centerPosition = 9000 + todayNode.position - (timelineRef.current.clientWidth / 2);
                timelineRef.current.scrollLeft = centerPosition;
              } else {
                const centerPosition = 9000 - (timelineRef.current.clientWidth / 2);
                timelineRef.current.scrollLeft = centerPosition;
              }
            }
          }}
          className="h-[60px] w-[60px] rounded-full bg-[#e1e1e1] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-95 flex items-center justify-center group"
        >
          <span className="text-sm font-medium text-[#919191]">HOY</span>
        </button>
      </div>
      
      {/* Timeline controls with mode display */}
      <div className="absolute bottom-2.5 left-1/2 transform -translate-x-1/2 z-[60]">
        <div className="bg-card/80 backdrop-blur-sm rounded-full px-3 py-1 border border-border/50 shadow-lg">
          <div className="flex items-center gap-2">
            {/* Zoom out button */}
            <button
              onClick={() => {
                const modes: TimelineMode[] = ['hours', 'days', 'weeks', 'months'];
                const currentIndex = modes.indexOf(timelineMode);
                if (currentIndex < modes.length - 1) {
                  setTimelineMode(modes[currentIndex + 1]);
                }
              }}
              className="w-8 h-8 rounded-full bg-[#e1e1e1] hover:bg-[#8fc700] transition-colors group flex items-center justify-center"
            >
              <span className="text-lg font-bold text-[#919191] group-hover:text-white">-</span>
            </button>
            
            {/* Mode label */}
            <span className="text-sm font-medium text-[#919191] px-2">
              {getTimelineModeLabel()}
            </span>
            
            {/* Zoom in button */}
            <button
              onClick={() => {
                const modes: TimelineMode[] = ['hours', 'days', 'weeks', 'months'];
                const currentIndex = modes.indexOf(timelineMode);
                if (currentIndex > 0) {
                  setTimelineMode(modes[currentIndex - 1]);
                }
              }}
              className="w-8 h-8 rounded-full bg-[#e1e1e1] hover:bg-[#8fc700] transition-colors group flex items-center justify-center"
            >
              <span className="text-lg font-bold text-[#919191] group-hover:text-white">+</span>
            </button>
          </div>
        </div>
      </div>

      {/* Events card in bottom right */}
      {(() => {
        const today = new Date();
        const todayStr = today.toDateString();
        
        // Filter events for current project only
        const projectEvents = timelineData.filter(event => {
          // Since timelineData is already filtered by projectId in the query, all events should be from current project
          return true;
        });
        
        // Get today's events from current project
        const todayEvents = projectEvents.filter(event => 
          new Date(event.date).toDateString() === todayStr
        );
        
        // Get upcoming events in next 2 days from current project
        const upcomingEvents = projectEvents.filter(event => {
          const eventDate = new Date(event.date);
          const daysDiff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff > 0 && daysDiff <= 2;
        }).slice(0, 3);
        
        return (
          <div className="absolute bottom-4 right-4 z-[60]">
            {/* Detailed event info card */}
            {hoveredEvent && (
              <div className="bg-[#e1e1e1] border border-[#919191]/20 rounded-lg shadow-lg p-4 min-w-[280px] max-w-[320px] mb-4 animate-in slide-in-from-right-2 fade-in duration-300">
                <h3 className="text-sm font-semibold text-[#919191] mb-3">INFORMACIÓN DEL EVENTO</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <hoveredEvent.icon className="w-4 h-4 text-[#919191]" strokeWidth={1.5} />
                    <div className="text-sm font-medium text-[#919191]">{hoveredEvent.title}</div>
                  </div>
                  {hoveredEvent.description && (
                    <div className="text-xs text-[#919191]/70">
                      <span className="font-medium">Descripción:</span> {hoveredEvent.description}
                    </div>
                  )}
                  <div className="text-xs text-[#919191]/70">
                    <span className="font-medium">Fecha:</span> {hoveredEvent.date.toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                    {hoveredEvent.time && `, ${hoveredEvent.time}`}
                  </div>
                  {hoveredEvent.location && (
                    <div className="text-xs text-[#919191]/70">
                      <span className="font-medium">Ubicación:</span> {hoveredEvent.location}
                    </div>
                  )}
                  {hoveredEvent.eventType && (
                    <div className="text-xs text-[#919191]/70 flex items-center gap-2">
                      <span className="font-medium">Tipo:</span> 
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-[#919191]/10 text-[#919191]">
                        {getEventTypeIcon(hoveredEvent.eventType)}
                        {getEventTypeLabel(hoveredEvent.eventType)}
                      </span>
                    </div>
                  )}
                  {hoveredEvent.amount && (
                    <div className="text-xs text-[#919191]/70">
                      <span className="font-medium">Monto:</span> ${hoveredEvent.amount.toLocaleString()} {hoveredEvent.currency}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="bg-[#e1e1e1] border border-[#919191]/20 rounded-lg shadow-lg p-4 min-w-[280px] max-w-[320px]">
              {todayEvents.length > 0 ? (
                <>
                  <h3 className="text-sm font-semibold text-[#919191] mb-3">EVENTOS DE HOY</h3>
                  <div className="space-y-2">
                    {todayEvents.slice(0, 3).map((event, index) => (
                      <button
                        key={event.id}
                        onClick={() => console.log('Today event clicked:', event)}
                        className="w-full bg-white/50 border border-[#919191]/10 rounded-lg p-3 hover:bg-[#8fc700]/10 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <event.icon className="w-4 h-4 text-[#919191]" strokeWidth={1.5} />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-[#919191]">{event.title}</div>
                            <div className="text-xs text-[#919191]/70">
                              {event.description && event.description.length > 30 
                                ? `${event.description.substring(0, 30)}...` 
                                : event.description}
                            </div>
                            {event.amount && (
                              <div className="text-xs text-[#919191]/70 mt-1">
                                ${event.amount.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                    {todayEvents.length > 3 && (
                      <div className="text-xs text-[#919191]/70 text-center pt-2">
                        +{todayEvents.length - 3} eventos más
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-[#919191] mb-3">PRÓXIMOS EVENTOS</h3>
                  {upcomingEvents.length > 0 ? (
                    <div className="space-y-2">
                      {upcomingEvents.map((event, index) => (
                        <button
                          key={event.id}
                          onClick={() => console.log('Upcoming event clicked:', event)}
                          className="w-full bg-white/50 border border-[#919191]/10 rounded-lg p-3 hover:bg-[#8fc700]/10 transition-colors cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2">
                            <event.icon className="w-4 h-4 text-[#919191]" strokeWidth={1.5} />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-[#919191]">{event.title}</div>
                              <div className="text-xs text-[#919191]/70">
                                {new Date(event.date).toLocaleDateString('es-ES')}
                              </div>
                              <div className="text-xs text-[#919191]/70">
                                {event.description && event.description.length > 25 
                                  ? `${event.description.substring(0, 25)}...` 
                                  : event.description}
                              </div>
                              {event.amount && (
                                <div className="text-xs text-[#919191]/70 mt-1">
                                  ${event.amount.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-[#919191]/70 text-center py-4">
                      No hay eventos próximos
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })()}





      {/* Infinite horizontal timeline */}
      <div 
        ref={timelineRef}
        className="absolute inset-0 overflow-x-auto overflow-y-hidden scrollbar-hide"
        style={{ 
          scrollBehavior: 'auto',
          zIndex: 1
        }}
      >
        <div className="relative h-full" style={{ width: '18000px', minWidth: '100vw' }}>
          {/* Timeline nodes */}
          {timelineNodes.map((node, index) => (
            <div
              key={index}
              className="absolute flex flex-col items-center"
              style={{ 
                left: `calc(50% + ${node.position}px)`,
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            >
              {/* Subtle vertical separator line between time periods */}
              {index < timelineNodes.length - 1 && (
                <div 
                  className="absolute w-px bg-gray-400/80 z-10"
                  style={{
                    top: '-50vh',
                    bottom: '-50vh',
                    right: '-75px', // Position between this node and the next one
                    transform: 'translateX(50%)'
                  }}
                />
              )}



              {/* Date label positioned aligned with plan button - engraved text effect */}
              <div 
                className="absolute flex items-center text-center z-30 pointer-events-none"
                style={{
                  bottom: sidebarButtonPositions.profile ? `${window.innerHeight - sidebarButtonPositions.profile + 50}px` : '100px', // Aligned with plan button area
                  left: '0',
                  transform: 'translateX(-50%)'
                }}
              >
                <div 
                  className="text-sm font-medium text-gray-600"
                  style={{
                    textShadow: '1px 1px 2px rgba(255,255,255,0.8), -1px -1px 1px rgba(0,0,0,0.1)',
                    color: '#8b8b8b'
                  }}
                >
                  {timelineMode === 'days' || timelineMode === 'weeks' || timelineMode === 'months' ? 
                    `${(formatDate(node.date) as any).dayName} ${(formatDate(node.date) as any).dayNumber}` :
                    formatDate(node.date)
                  }
                </div>
              </div>

              {/* Events positioned by type */}
              <div className="relative">
                {/* Group events by type */}
                {(() => {
                  const eventsByType = {
                    sitelog: node.events.filter(e => e.type === 'sitelog'),     // Bitácora line
                    calendar: node.events.filter(e => e.type === 'calendar'),   // Agenda line (calendar events)
                    task: node.events.filter(e => e.type === 'task'),           // Agenda line (tasks)
                    movement: node.events.filter(e => e.type === 'movement'),   // Finanzas line
                    milestone: node.events.filter(e => e.type === 'milestone')  // Presupuestos line
                  };

                  const getEventPosition = (type: string) => {
                    switch (type) {
                      case 'sitelog': 
                        if (sidebarButtonPositions.sitelog) {
                          const timelineNodeCenter = window.innerHeight / 2;
                          const offset = sidebarButtonPositions.sitelog - timelineNodeCenter;
                          return offset;
                        }
                        return -64;
                      case 'task':
                        return sidebarButtonPositions.contacts 
                          ? sidebarButtonPositions.contacts - (window.innerHeight / 2)
                          : 0;
                      case 'calendar':
                        return sidebarButtonPositions.contacts 
                          ? sidebarButtonPositions.contacts - (window.innerHeight / 2)
                          : 0;
                      case 'movement':
                        return sidebarButtonPositions.movements 
                          ? sidebarButtonPositions.movements - (window.innerHeight / 2)
                          : 64;
                      case 'milestone':
                        return sidebarButtonPositions.budgets 
                          ? sidebarButtonPositions.budgets - (window.innerHeight / 2)
                          : 128;
                      default:
                        return 0;
                    }
                  };

                  return Object.entries(eventsByType).map(([type, events]) => {
                    if (events.length === 0) return null;

                    const firstEvent = events[0];
                    const Icon = firstEvent.icon;

                    return (
                      <div
                        key={type}
                        className="absolute"
                        style={{
                          left: '0',
                          top: `${getEventPosition(type)}px`,
                          transform: 'translate(-50%, -50%)',
                          zIndex: 150
                        }}
                      >
                        <div className="group relative" style={{ zIndex: 150 }}>
                          {/* Event indicator */}
                          <div 
                            className="w-10 h-10 rounded-full bg-[#e1e1e1] shadow-lg flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 relative opacity-100"
                            style={{ zIndex: 150, backgroundColor: '#e1e1e1' }}
                            onMouseEnter={() => setHoveredEvent(events[0])}
                            onMouseLeave={() => setHoveredEvent(null)}
                          >
                            <Icon className="w-5 h-5 text-[#919191]" strokeWidth={1.5} />
                            
                            {/* Badge for multiple events */}
                            {events.length > 1 && (
                              <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                                <span className="text-xs text-white font-bold">
                                  {events.length}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Hover cards */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto" style={{ zIndex: 200 }}>
                            {/* Invisible bridge to prevent hover loss */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-full h-2"></div>
                            <div className="flex flex-col gap-2">
                              {events.slice(0, 3).map((event, eventIndex) => (
                                <button
                                  key={eventIndex}
                                  onClick={() => {
                                    console.log('Event card clicked:', event);
                                  }}
                                  className="bg-[#e1e1e1] border border-[#919191]/20 rounded-lg shadow-lg p-2 min-w-[180px] hover:bg-[#8fc700]/10 transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <event.icon className="w-4 h-4 text-[#919191]" />
                                    <div className="flex-1 text-left">
                                      <div className="text-xs font-medium text-[#919191]">{event.title}</div>
                                      <div className="text-xs text-[#919191]/70 truncate">
                                        {event.description && event.description.length > 20 
                                          ? `${event.description.substring(0, 20)}...` 
                                          : event.description}
                                      </div>
                                      {event.time && (
                                        <div className="text-xs text-[#919191]/70">
                                          Hora: {event.time}
                                        </div>
                                      )}
                                      {event.location && (
                                        <div className="text-xs text-[#919191]/70 truncate">
                                          📍 {event.location}
                                        </div>
                                      )}
                                      {event.eventType && (
                                        <div className="text-xs text-[#919191]/70 capitalize">
                                          {event.eventType}
                                        </div>
                                      )}
                                      {event.amount && (
                                        <div className="text-xs text-[#919191]/70">
                                          ${event.amount.toLocaleString()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              ))}
                              {events.length > 3 && (
                                <div className="text-xs text-[#919191]/70 text-center px-2">
                                  +{events.length - 3} eventos más
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>



    </div>
  );
}

export default DashboardTimeline;