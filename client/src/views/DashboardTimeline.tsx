import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Clock, Users, DollarSign, FileText, Target, Plus, Minus, FolderOpen, Contact, FolderKanban } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUserContextStore } from '@/stores/userContextStore';
import { useNavigationStore } from '@/stores/navigationStore';
import CircularButton from '@/components/ui/CircularButton';

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
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [sidebarButtonPositions, setSidebarButtonPositions] = useState<Record<string, number>>({});
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
        // Find today's page index for pagination
        const todayIndex = timelineNodes.findIndex(node => {
          const nodeDate = new Date(node.date);
          return nodeDate.toDateString() === new Date().toDateString();
        });
        if (todayIndex !== -1) {
          setCurrentPageIndex(Math.floor(todayIndex / getDaysPerPage()));
        }
      }
    }
  }, [timelineNodes, timelineMode]);



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
    <div className="fixed inset-0 w-screen h-screen bg-background overflow-hidden z-0">
      {/* Proyectos button at top */}
      <div className="fixed top-2.5 left-1/2 transform -translate-x-1/2 z-[9999]">
        <CircularButton
          icon={FolderKanban}
          isActive={currentSection === 'projects'}
          onClick={() => setSection('projects')}
          label="Proyectos"
        />
      </div>

      {/* Timeline controls at bottom */}
      <div className="fixed bottom-2.5 left-1/2 transform -translate-x-1/2 z-[9999]">
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
            
            {/* HOY button */}
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
                    // Find today's page index
                    const todayIndex = timelineNodes.findIndex(node => {
                      const nodeDate = new Date(node.date);
                      return nodeDate.toDateString() === today.toDateString();
                    });
                    if (todayIndex !== -1) {
                      setCurrentPageIndex(Math.floor(todayIndex / getDaysPerPage()));
                    }
                  }
                }
              }}
              className="px-3 py-1 rounded-full bg-[#e1e1e1] hover:bg-[#8fc700] transition-colors group"
            >
              <span className="text-sm font-medium text-[#919191] group-hover:text-white">HOY</span>
            </button>
            
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

      {/* Infinite horizontal timeline */}
      <div 
        ref={timelineRef}
        className="absolute inset-0 overflow-x-auto overflow-y-hidden scrollbar-hide z-0"
        style={{ 
          scrollBehavior: 'auto'
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
              {/* Date labels - aligned with dashboard and profile buttons */}
              <div 
                className="fixed text-xs font-medium text-foreground/25"
                style={{
                  top: '60px', // Aligned with dashboard button
                  left: `calc(50% + ${node.position}px)`,
                  transform: 'translateX(-50%)'
                }}
              >
                {formatDate(node.date)}
              </div>
              <div 
                className="fixed text-xs font-medium text-foreground/25"
                style={{
                  bottom: '60px', // Aligned with profile button
                  left: `calc(50% + ${node.position}px)`,
                  transform: 'translateX(-50%)'
                }}
              >
                {formatDate(node.date)}
              </div>

              {/* Events positioned by type */}
              <div className="relative">
                {/* Group events by type */}
                {(() => {
                  const eventsByType = {
                    sitelog: node.events.filter(e => e.type === 'sitelog'),     // Bitácora line
                    task: node.events.filter(e => e.type === 'task'),           // Agenda line  
                    movement: node.events.filter(e => e.type === 'movement'),   // Finanzas line
                    milestone: node.events.filter(e => e.type === 'milestone')  // Presupuestos line
                  };

                  const getEventPosition = (type: string) => {
                    // Position events to align exactly with their corresponding sidebar button centers
                    // Convert absolute sidebar button position to relative position within the timeline node
                    
                    switch (type) {
                      case 'sitelog': 
                        if (sidebarButtonPositions.sitelog) {
                          // Calculate offset from the timeline node center (which is at 50vh)
                          const timelineNodeCenter = window.innerHeight / 2;
                          const offset = sidebarButtonPositions.sitelog - timelineNodeCenter;
                          return { top: `${offset}px` };
                        }
                        return { top: '-64px' };
                      case 'contacts': 
                        if (sidebarButtonPositions.contacts) {
                          const timelineNodeCenter = window.innerHeight / 2;
                          const offset = sidebarButtonPositions.contacts - timelineNodeCenter;
                          return { top: `${offset}px` };
                        }
                        return { top: '0px' };
                      case 'movement': 
                        if (sidebarButtonPositions.movements) {
                          const timelineNodeCenter = window.innerHeight / 2;
                          const offset = sidebarButtonPositions.movements - timelineNodeCenter;
                          return { top: `${offset}px` };
                        }
                        return { top: '64px' };
                      case 'milestone': 
                        if (sidebarButtonPositions.budgets) {
                          const timelineNodeCenter = window.innerHeight / 2;
                          const offset = sidebarButtonPositions.budgets - timelineNodeCenter;
                          return { top: `${offset}px` };
                        }
                        return { top: '128px' };
                      default: return { top: '0px' };
                    }
                  };

                  return Object.entries(eventsByType).map(([type, events]) => {
                    if (events.length === 0) return null;

                    const firstEvent = events[0];
                    const Icon = firstEvent.icon;

                    // Calculate position relative to the timeline node center to align with horizontal lines
                    const getEventTop = () => {
                      const timelineNodeCenter = window.innerHeight / 2; // Timeline nodes are centered vertically
                      
                      switch (type) {
                        case 'sitelog':
                          return sidebarButtonPositions.sitelog 
                            ? `${sidebarButtonPositions.sitelog - timelineNodeCenter - 20}px`  // -20px to center the 40px event
                            : '-64px';
                        case 'task':
                          return sidebarButtonPositions.agenda 
                            ? `${sidebarButtonPositions.agenda - timelineNodeCenter - 20}px`
                            : '0px';
                        case 'movement':
                          return sidebarButtonPositions.movements 
                            ? `${sidebarButtonPositions.movements - timelineNodeCenter - 20}px`
                            : '64px';
                        case 'milestone':
                          return sidebarButtonPositions.budgets 
                            ? `${sidebarButtonPositions.budgets - timelineNodeCenter - 20}px`
                            : '128px';
                        default:
                          return '0px';
                      }
                    };

                    return (
                      <div
                        key={type}
                        className="absolute left-1/2 transform -translate-x-1/2 z-20"
                        style={{
                          top: getEventTop()
                        }}
                      >
                        <div className="group relative">
                          {/* Large event indicator */}
                          <div 
                            className="w-10 h-10 rounded-full border-2 border-[#919191] bg-[#e1e1e1] shadow-lg flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 relative"
                          >
                            <Icon className="w-5 h-5 text-[#919191]" />
                            
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


        </div>
      </div>

      {/* Five horizontal timeline lines - dynamically positioned based on sidebar button measurements */}
      {Object.keys(sidebarButtonPositions).length > 0 && (
        <>
          {/* Line 1 - Organization */}
          {sidebarButtonPositions.organization && (
            <div 
              className="fixed left-0 right-0 h-px bg-border z-10 pointer-events-none"
              style={{ 
                top: `${sidebarButtonPositions.organization}px`
              }}
            />
          )}
          
          {/* Line 2 - Bitácora */}
          {sidebarButtonPositions.sitelog && (
            <div 
              className="fixed left-0 right-0 h-px bg-border z-10 pointer-events-none"
              style={{ 
                top: `${sidebarButtonPositions.sitelog}px`
              }}
            />
          )}
          
          {/* Line 3 - Agenda */}
          {sidebarButtonPositions.contacts && (
            <div 
              className="fixed left-0 right-0 h-px bg-border z-10 pointer-events-none"
              style={{ 
                top: `${sidebarButtonPositions.contacts}px`
              }}
            />
          )}
          
          {/* Line 4 - Finanzas */}
          {sidebarButtonPositions.movements && (
            <div 
              className="fixed left-0 right-0 h-px bg-border z-10 pointer-events-none"
              style={{ 
                top: `${sidebarButtonPositions.movements}px`
              }}
            />
          )}
          
          {/* Line 5 - Presupuestos */}
          {sidebarButtonPositions.budgets && (
            <div 
              className="fixed left-0 right-0 h-px bg-border z-10 pointer-events-none"
              style={{ 
                top: `${sidebarButtonPositions.budgets}px`
              }}
            />
          )}
        </>
      )}

      {/* Fixed "HOY" marker - perfectly centered vertical line only */}
      <div 
        className="fixed z-40 pointer-events-none"
        style={{
          left: '50%',
          top: '0',
          width: '1px',
          height: '100vh',
          backgroundColor: 'black',
          transform: 'translateX(-50%)' // Perfect centering
        }}
      ></div>

    </div>
  );
}