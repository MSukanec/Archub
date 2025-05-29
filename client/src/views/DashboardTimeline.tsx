import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Clock, Users, DollarSign, FileText, Target, Plus, Minus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUserContextStore } from '@/stores/userContextStore';

interface TimelineEvent {
  id: string;
  date: Date;
  type: 'sitelog' | 'movement' | 'task' | 'milestone';
  title: string;
  description?: string;
  amount?: number;
  currency?: string;
  icon: React.ComponentType<any>;
  color: string;
}

type TimelineMode = 'hours' | 'days' | 'weeks' | 'months';

interface TimelineNode {
  date: Date;
  events: TimelineEvent[];
  position: number;
}

export default function DashboardTimeline() {
  const [timelineMode, setTimelineMode] = useState<TimelineMode>('days');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isMouseNearEdge, setIsMouseNearEdge] = useState<'left' | 'right' | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  
  const { projectId, organizationId } = useUserContextStore();

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
        .order('date', { ascending: true });

      // Get movements
      const { data: movements } = await supabase
        .from('site_movements')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: true });

      // Convert to timeline events
      const events: TimelineEvent[] = [];

      siteLogs?.forEach(log => {
        events.push({
          id: `sitelog-${log.id}`,
          date: new Date(log.date),
          type: 'sitelog',
          title: 'Bitácora de Obra',
          description: log.description,
          icon: FileText,
          color: '#FF4D1C'
        });
      });

      movements?.forEach(movement => {
        events.push({
          id: `movement-${movement.id}`,
          date: new Date(movement.date),
          type: 'movement',
          title: 'Movimiento',
          description: movement.description,
          amount: movement.amount,
          currency: movement.currency,
          icon: DollarSign,
          color: '#10B981'
        });
      });

      // Add some demo events around today for visualization
      const today = new Date();
      events.push({
        id: 'demo-1',
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        type: 'sitelog',
        title: 'Inicio de Obra',
        description: 'Comienzo de trabajos de demolición',
        icon: FileText,
        color: '#FF4D1C'
      });

      events.push({
        id: 'demo-2',
        date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), // Yesterday
        type: 'task',
        title: 'Instalación Eléctrica',
        description: 'Finalización de canalizaciones',
        icon: Target,
        color: '#8B5CF6'
      });

      events.push({
        id: 'demo-3',
        date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        type: 'movement',
        title: 'Pago Materiales',
        description: 'Compra de cemento y arena',
        amount: 150000,
        currency: 'ARS',
        icon: DollarSign,
        color: '#10B981'
      });

      events.push({
        id: 'demo-4',
        date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        type: 'milestone',
        title: 'Revisión Cliente',
        description: 'Inspección de avance de obra',
        icon: Users,
        color: '#F59E0B'
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

  // Center timeline on today when component mounts
  useEffect(() => {
    if (timelineRef.current) {
      // Center the timeline on "today" (position 0 in our coordinate system)
      const centerPosition = timelineRef.current.scrollWidth / 2 - timelineRef.current.clientWidth / 2;
      timelineRef.current.scrollLeft = centerPosition;
      setScrollPosition(centerPosition);
    }
  }, [timelineNodes, timelineMode]);

  // Auto-scroll when mouse is near edges
  useEffect(() => {
    if (!isMouseNearEdge) return;

    const scroll = () => {
      const scrollAmount = isMouseNearEdge === 'right' ? 8 : -8; // Increased speed
      if (timelineRef.current) {
        const newPosition = timelineRef.current.scrollLeft + scrollAmount;
        timelineRef.current.scrollLeft = newPosition;
        setScrollPosition(newPosition);
      }
      animationRef.current = requestAnimationFrame(scroll);
    };

    animationRef.current = requestAnimationFrame(scroll);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isMouseNearEdge]);

  // Handle mouse movement for edge detection
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const edgeThreshold = 100;

    if (x < edgeThreshold) {
      setIsMouseNearEdge('left');
    } else if (x > rect.width - edgeThreshold) {
      setIsMouseNearEdge('right');
    } else {
      setIsMouseNearEdge(null);
    }
  };

  const handleMouseLeave = () => {
    setIsMouseNearEdge(null);
  };

  // Format date based on timeline mode
  const formatDate = (date: Date) => {
    switch (timelineMode) {
      case 'hours':
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      case 'days':
        return date.getDate().toString();
      case 'weeks':
        return `S${Math.ceil(date.getDate() / 7)}`;
      case 'months':
        return date.toLocaleDateString('es-ES', { month: 'short' });
      default:
        return '';
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
    <div className="h-screen w-full bg-background overflow-hidden flex flex-col">
      {/* Minimal top controls */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[9999]">
        <div className="bg-card/80 backdrop-blur-sm rounded-full px-6 py-2 border border-border/50 shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTimelineMode(prev => {
                const modes: TimelineMode[] = ['hours', 'days', 'weeks', 'months'];
                const currentIndex = modes.indexOf(prev);
                return modes[Math.max(0, currentIndex - 1)];
              })}
              className="w-8 h-8 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors"
              disabled={timelineMode === 'hours'}
            >
              <Minus className="w-4 h-4" />
            </button>
            
            <span className="text-sm font-medium min-w-[60px] text-center">
              {getTimelineModeLabel()}
            </span>
            
            <button
              onClick={() => setTimelineMode(prev => {
                const modes: TimelineMode[] = ['hours', 'days', 'weeks', 'months'];
                const currentIndex = modes.indexOf(prev);
                return modes[Math.min(modes.length - 1, currentIndex + 1)];
              })}
              className="w-8 h-8 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors"
              disabled={timelineMode === 'months'}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Infinite horizontal timeline */}
      <div 
        ref={timelineRef}
        className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ 
          scrollBehavior: 'auto',
          cursor: isMouseNearEdge ? (isMouseNearEdge === 'right' ? 'e-resize' : 'w-resize') : 'default'
        }}
      >
        <div className="relative h-full" style={{ width: '18000px', minWidth: '100vw' }}>
          {/* Vertical current date line */}
          <div 
            className="absolute top-0 bottom-0 w-px bg-primary z-20"
            style={{ left: '50%' }}
          />
          
          {/* Horizontal timeline line */}
          <div 
            className="absolute left-0 right-0 h-px bg-border z-10"
            style={{ top: '50%' }}
          />

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
              {/* Date labels - top and bottom */}
              <div className="absolute top-2 text-xs font-medium text-foreground/50">
                {formatDate(node.date)}
              </div>
              <div className="absolute bottom-2 text-xs font-medium text-foreground/50">
                {formatDate(node.date)}
              </div>

              {/* Events positioned by type */}
              <div className="relative">
                {/* Group events by type */}
                {(() => {
                  const eventsByType = {
                    sitelog: node.events.filter(e => e.type === 'sitelog'),
                    movement: node.events.filter(e => e.type === 'movement'),
                    task: node.events.filter(e => e.type === 'task'),
                    milestone: node.events.filter(e => e.type === 'milestone')
                  };

                  const getEventPosition = (type: string) => {
                    switch (type) {
                      case 'sitelog': return { top: '-40px' }; // 10% arriba del timeline
                      case 'movement': return { top: '40px' }; // 10% debajo del timeline
                      case 'task': return { top: '80px' }; // 20% debajo del timeline
                      case 'milestone': return { top: '120px' }; // 30% debajo del timeline
                      default: return { top: '0px' };
                    }
                  };

                  return Object.entries(eventsByType).map(([type, events]) => {
                    if (events.length === 0) return null;

                    const firstEvent = events[0];
                    const Icon = firstEvent.icon;

                    return (
                      <div
                        key={type}
                        className="absolute left-1/2 transform -translate-x-1/2"
                        style={getEventPosition(type)}
                      >
                        <div className="group relative">
                          {/* Large event indicator */}
                          <div 
                            className="w-10 h-10 rounded-full border-3 border-background shadow-lg flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 relative"
                            style={{ backgroundColor: firstEvent.color }}
                          >
                            <Icon className="w-5 h-5 text-white" />
                            
                            {/* Badge for multiple events */}
                            {events.length > 1 && (
                              <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-background">
                                <span className="text-[10px] text-white font-bold">
                                  {events.length}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Hover tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-30">
                            <div className="bg-card border border-border rounded-lg shadow-xl p-3 min-w-[200px]">
                              <div className="text-xs text-muted-foreground mb-1">
                                {node.date.toLocaleDateString('es-ES')}
                              </div>
                              {events.slice(0, 3).map((event, eventIndex) => (
                                <div key={eventIndex} className="flex items-center gap-2 mb-1 last:mb-0">
                                  <event.icon className="w-3 h-3" style={{ color: event.color }} />
                                  <span className="text-xs font-medium">{event.title}</span>
                                  {event.amount && (
                                    <span className="text-xs text-muted-foreground">
                                      ${event.amount.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              ))}
                              {events.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{events.length - 3} más
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

          {/* Today indicator */}
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 z-20"
            style={{ left: '50%' }}
          >
            <div className="w-6 h-6 rounded-full bg-primary border-4 border-background shadow-lg flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-primary">
              Hoy
            </div>
          </div>
        </div>
      </div>

      {/* Gradient edges for scroll indication */}
      <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
    </div>
  );
}