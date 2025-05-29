import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Clock, Users, DollarSign, FileText, Target, Plus, Minus, Wrench } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUserContextStore } from '@/stores/userContextStore';

interface TimelineEvent {
  id: string;
  date: Date;
  type: 'sitelog' | 'movement' | 'task' | 'milestone' | 'execution';
  title: string;
  description?: string;
  amount?: number;
  currency?: string;
  icon: React.ComponentType<any>;
  color: string;
}

type TimelineMode = 'hours' | 'days' | 'weeks' | 'months';
type SidebarCategory = 'proyectos' | 'movimientos' | 'presupuestos' | 'bitacora' | 'ejecucion';

interface TimelineNode {
  date: Date;
  events: TimelineEvent[];
  position: number;
}

const SIDEBAR_BUTTONS = [
  { 
    id: 'presupuestos' as SidebarCategory, 
    label: 'Presupuestos', 
    icon: Target,
    offsetPercent: -10 // 5% arriba del timeline, luego 5% más arriba
  },
  { 
    id: 'movimientos' as SidebarCategory, 
    label: 'Movimientos', 
    icon: DollarSign,
    offsetPercent: -5 // 5% arriba del timeline
  },
  { 
    id: 'proyectos' as SidebarCategory, 
    label: 'Proyectos', 
    icon: Calendar,
    offsetPercent: 0 // Centro (timeline)
  },
  { 
    id: 'bitacora' as SidebarCategory, 
    label: 'Bitácora', 
    icon: FileText,
    offsetPercent: 5 // 5% debajo del timeline
  },
  { 
    id: 'ejecucion' as SidebarCategory, 
    label: 'Ejecución', 
    icon: Wrench,
    offsetPercent: 10 // 5% debajo del anterior
  }
];

export default function DashboardTimelineSidebar() {
  const [timelineMode, setTimelineMode] = useState<TimelineMode>('days');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isMouseNearEdge, setIsMouseNearEdge] = useState<'left' | 'right' | null>(null);
  const [activeCategory, setActiveCategory] = useState<SidebarCategory>('proyectos');
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
          description: log.comments,
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
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        type: 'sitelog',
        title: 'Inicio de Obra',
        description: 'Comienzo de trabajos de demolición',
        icon: FileText,
        color: '#FF4D1C'
      });

      events.push({
        id: 'demo-2',
        date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        type: 'task',
        title: 'Instalación Eléctrica',
        description: 'Finalización de canalizaciones',
        icon: Target,
        color: '#8B5CF6'
      });

      events.push({
        id: 'demo-3',
        date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000),
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
        date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
        type: 'execution',
        title: 'Avance de Obra',
        description: 'Finalización de estructura',
        icon: Wrench,
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
    today.setHours(0, 0, 0, 0);
    
    for (let i = -60; i <= 60; i++) {
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
        position: i * 150
      });
    }

    return nodes;
  }, [timelineData, timelineMode]);

  const timelineNodes = generateTimelineNodes();

  // Center timeline on today when component mounts
  useEffect(() => {
    if (timelineRef.current) {
      const centerPosition = timelineRef.current.scrollWidth / 2 - timelineRef.current.clientWidth / 2;
      timelineRef.current.scrollLeft = centerPosition;
      setScrollPosition(centerPosition);
    }
  }, [timelineNodes, timelineMode]);

  // Auto-scroll when mouse is near edges
  useEffect(() => {
    if (!isMouseNearEdge) return;

    const scroll = () => {
      const scrollAmount = isMouseNearEdge === 'right' ? 8 : -8;
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

  // Map event types to sidebar categories
  const getEventCategory = (eventType: string): SidebarCategory => {
    switch (eventType) {
      case 'movement': return 'movimientos';
      case 'task': return 'presupuestos';
      case 'sitelog': return 'bitacora';
      case 'execution': return 'ejecucion';
      default: return 'proyectos';
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden flex" style={{ backgroundColor: '#d1d1d1' }}>
      {/* Left Sidebar */}
      <div className="w-48 flex flex-col justify-center relative">
        <div className="flex flex-col items-center space-y-8">
          {SIDEBAR_BUTTONS.map((button) => {
            const isActive = activeCategory === button.id;
            const Icon = button.icon;
            
            return (
              <button
                key={button.id}
                onClick={() => setActiveCategory(button.id)}
                className="relative w-32 h-12 rounded-lg border border-gray-400 transition-all duration-200 hover:shadow-lg"
                style={{ 
                  backgroundColor: isActive ? '#000000' : '#e0e0e0',
                  color: isActive ? '#ffffff' : '#000000'
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{button.label}</span>
                </div>
                
                {/* Línea punteada que se extiende hacia la derecha */}
                <div 
                  className="absolute left-full top-1/2 w-12 h-px"
                  style={{
                    background: `repeating-linear-gradient(
                      to right,
                      ${isActive ? '#000000' : '#999999'} 0px,
                      ${isActive ? '#000000' : '#999999'} 4px,
                      transparent 4px,
                      transparent 8px
                    )`,
                    transform: 'translateY(-50%)'
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Timeline Area */}
      <div className="flex-1 flex flex-col">
        {/* Top controls */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-2 border border-gray-300 shadow-lg">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTimelineMode(prev => {
                  const modes: TimelineMode[] = ['hours', 'days', 'weeks', 'months'];
                  const currentIndex = modes.indexOf(prev);
                  return modes[Math.max(0, currentIndex - 1)];
                })}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                disabled={timelineMode === 'hours'}
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <span className="text-sm font-medium min-w-[60px] text-center text-black">
                {getTimelineModeLabel()}
              </span>
              
              <button
                onClick={() => setTimelineMode(prev => {
                  const modes: TimelineMode[] = ['hours', 'days', 'weeks', 'months'];
                  const currentIndex = modes.indexOf(prev);
                  return modes[Math.min(modes.length - 1, currentIndex + 1)];
                })}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                disabled={timelineMode === 'months'}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Timeline container */}
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
              className="absolute top-0 bottom-0 w-px bg-black z-20"
              style={{ left: '50%' }}
            />
            
            {/* Horizontal timeline lines for each category */}
            {SIDEBAR_BUTTONS.map((button) => (
              <div
                key={`line-${button.id}`}
                className="absolute left-0 right-0 h-px z-10"
                style={{ 
                  top: `calc(50% + ${button.offsetPercent}vh)`,
                  background: button.id === 'proyectos' 
                    ? '#000000' // Línea sólida para el timeline principal
                    : `repeating-linear-gradient(
                        to right,
                        #999999 0px,
                        #999999 6px,
                        transparent 6px,
                        transparent 12px
                      )`
                }}
              />
            ))}

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
                {/* Date label */}
                <div className="mb-8 text-xs font-medium" style={{ color: '#666666' }}>
                  {formatDate(node.date)}
                </div>

                {/* Events positioned by category */}
                <div className="relative">
                  {(() => {
                    const eventsByCategory = {
                      presupuestos: node.events.filter(e => getEventCategory(e.type) === 'presupuestos'),
                      movimientos: node.events.filter(e => getEventCategory(e.type) === 'movimientos'),
                      proyectos: node.events.filter(e => getEventCategory(e.type) === 'proyectos'),
                      bitacora: node.events.filter(e => getEventCategory(e.type) === 'bitacora'),
                      ejecucion: node.events.filter(e => getEventCategory(e.type) === 'ejecucion')
                    };

                    return SIDEBAR_BUTTONS.map((button) => {
                      const events = eventsByCategory[button.id];
                      if (events.length === 0) return null;

                      const firstEvent = events[0];
                      const Icon = firstEvent.icon;

                      return (
                        <div
                          key={button.id}
                          className="absolute left-1/2 transform -translate-x-1/2"
                          style={{ top: `${button.offsetPercent}vh` }}
                        >
                          <div className="group relative">
                            {/* Event indicator */}
                            <div 
                              className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 relative"
                              style={{ backgroundColor: firstEvent.color }}
                            >
                              <Icon className="w-4 h-4 text-white" />
                              
                              {/* Badge for multiple events */}
                              {events.length > 1 && (
                                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border border-white">
                                  <span className="text-[8px] text-white font-bold">
                                    {events.length}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Hover tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-30">
                              <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-3 min-w-[200px]">
                                <div className="text-xs text-gray-500 mb-1">
                                  {node.date.toLocaleDateString('es-ES')}
                                </div>
                                {events.slice(0, 3).map((event, eventIndex) => (
                                  <div key={eventIndex} className="flex items-center gap-2 mb-1 last:mb-0">
                                    <event.icon className="w-3 h-3" style={{ color: event.color }} />
                                    <span className="text-xs font-medium text-black">{event.title}</span>
                                    {event.amount && (
                                      <span className="text-xs text-gray-500">
                                        ${event.amount.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {events.length > 3 && (
                                  <div className="text-xs text-gray-500">
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
          </div>
        </div>
      </div>
    </div>
  );
}