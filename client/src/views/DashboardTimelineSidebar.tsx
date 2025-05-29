import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, DollarSign, FileText, Target, Plus, Minus, Wrench, Hammer, CheckCircle, Settings } from 'lucide-react';

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
    offsetVh: -20 // 20vh arriba del centro
  },
  { 
    id: 'movimientos' as SidebarCategory, 
    label: 'Movimientos', 
    icon: DollarSign,
    offsetVh: -10 // 10vh arriba del centro
  },
  { 
    id: 'proyectos' as SidebarCategory, 
    label: 'Proyectos', 
    icon: Calendar,
    offsetVh: 0 // Centro exacto
  },
  { 
    id: 'bitacora' as SidebarCategory, 
    label: 'Bitácora', 
    icon: FileText,
    offsetVh: 10 // 10vh debajo del centro
  },
  { 
    id: 'ejecucion' as SidebarCategory, 
    label: 'Ejecución', 
    icon: Wrench,
    offsetVh: 20 // 20vh debajo del centro
  }
];

export default function DashboardTimelineSidebar() {
  const [timelineMode, setTimelineMode] = useState<TimelineMode>('days');
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isMouseNearEdge, setIsMouseNearEdge] = useState<'left' | 'right' | null>(null);
  const [activeCategory, setActiveCategory] = useState<SidebarCategory>('proyectos');
  const timelineRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Generate demo events for each category
  const generateDemoEvents = (): TimelineEvent[] => {
    const today = new Date();
    const events: TimelineEvent[] = [];

    // Presupuestos events
    events.push({
      id: 'presupuesto-1',
      date: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
      type: 'task',
      title: 'Presupuesto Inicial',
      description: 'Cotización de materiales básicos',
      icon: Target,
      color: '#8B5CF6'
    });

    events.push({
      id: 'presupuesto-2',
      date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
      type: 'task',
      title: 'Aprobación Presupuesto',
      description: 'Cliente aprueba cotización',
      icon: Target,
      color: '#8B5CF6'
    });

    events.push({
      id: 'presupuesto-3',
      date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      type: 'task',
      title: 'Revisión de Costos',
      description: 'Actualización de precios',
      icon: Target,
      color: '#8B5CF6'
    });

    events.push({
      id: 'presupuesto-4',
      date: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000),
      type: 'task',
      title: 'Presupuesto Final',
      description: 'Cierre de costos del proyecto',
      icon: Target,
      color: '#8B5CF6'
    });

    // Movimientos events
    events.push({
      id: 'movement-1',
      date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
      type: 'movement',
      title: 'Anticipo Cliente',
      description: 'Pago inicial del proyecto',
      amount: 500000,
      currency: 'ARS',
      icon: DollarSign,
      color: '#10B981'
    });

    events.push({
      id: 'movement-2',
      date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
      type: 'movement',
      title: 'Compra Cemento',
      description: 'Pago a proveedor',
      amount: 75000,
      currency: 'ARS',
      icon: DollarSign,
      color: '#10B981'
    });

    events.push({
      id: 'movement-3',
      date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000),
      type: 'movement',
      title: 'Pago Mano de Obra',
      description: 'Salarios semanales',
      amount: 120000,
      currency: 'ARS',
      icon: DollarSign,
      color: '#10B981'
    });

    events.push({
      id: 'movement-4',
      date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
      type: 'movement',
      title: 'Compra Materiales',
      description: 'Hierro y arena',
      amount: 200000,
      currency: 'ARS',
      icon: DollarSign,
      color: '#10B981'
    });

    // Proyectos events (timeline principal)
    events.push({
      id: 'proyecto-1',
      date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
      type: 'milestone',
      title: 'Inicio del Proyecto',
      description: 'Kick-off oficial del proyecto',
      icon: Calendar,
      color: '#F59E0B'
    });

    events.push({
      id: 'proyecto-2',
      date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
      type: 'milestone',
      title: 'Hito del Proyecto',
      description: 'Finalización de cimientos',
      icon: Calendar,
      color: '#F59E0B'
    });

    events.push({
      id: 'proyecto-3',
      date: today,
      type: 'milestone',
      title: 'Hoy',
      description: 'Fecha actual',
      icon: Calendar,
      color: '#F59E0B'
    });

    events.push({
      id: 'proyecto-4',
      date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
      type: 'milestone',
      title: 'Revisión General',
      description: 'Evaluación de progreso',
      icon: Calendar,
      color: '#F59E0B'
    });

    // Bitácora events
    events.push({
      id: 'bitacora-1',
      date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
      type: 'sitelog',
      title: 'Registro Diario',
      description: 'Avance de estructura',
      icon: FileText,
      color: '#FF4D1C'
    });

    events.push({
      id: 'bitacora-2',
      date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
      type: 'sitelog',
      title: 'Inspección',
      description: 'Control de calidad',
      icon: FileText,
      color: '#FF4D1C'
    });

    // Ejecución events
    events.push({
      id: 'ejecucion-1',
      date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
      type: 'execution',
      title: 'Inicio Excavación',
      description: 'Preparación del terreno',
      icon: Wrench,
      color: '#06B6D4'
    });

    events.push({
      id: 'ejecucion-2',
      date: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
      type: 'execution',
      title: 'Instalaciones',
      description: 'Sistema eléctrico',
      icon: Wrench,
      color: '#06B6D4'
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // Crear eventos demo que sí aparezcan
  const createTestEvents = (): TimelineEvent[] => {
    const today = new Date();
    return [
      {
        id: '1',
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // Hace 2 días
        type: 'movement',
        title: 'Pago Joel - $1,500 USD',
        description: 'Movimiento registrado',
        amount: 1500,
        currency: 'USD',
        icon: DollarSign,
        color: '#10B981'
      },
      {
        id: '2',
        date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), // Ayer
        type: 'sitelog',
        title: 'Bitácora - Osvaldo trámites consulado',
        description: 'Hoy no fué Osvaldo a la obra debido a que tenía que hacer unos trámites en el consulado.',
        icon: FileText,
        color: '#8B5CF6'
      },
      {
        id: '3',
        date: today, // Hoy
        type: 'task',
        title: 'Demolición de muros',
        description: 'Precio: $12,000',
        amount: 12000,
        icon: Hammer,
        color: '#F59E0B'
      },
      {
        id: '4',
        date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), // Mañana
        type: 'milestone',
        title: 'Milestone: Fase 1 completa',
        description: 'Finalización de demoliciones',
        icon: CheckCircle,
        color: '#3B82F6'
      },
      {
        id: '5',
        date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // En 3 días
        type: 'execution',
        title: 'Ejecución cielorrasos',
        description: 'Inicio de trabajos',
        amount: 15000,
        icon: Settings,
        color: '#EF4444'
      }
    ];
  };

  const timelineData = createTestEvents();
  console.log('Timeline data generated:', timelineData);

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

  // Center timeline on TODAY when component mounts
  useEffect(() => {
    if (timelineRef.current && timelineNodes.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find the node that represents today
      const todayNodeIndex = timelineNodes.findIndex(node => {
        const nodeDate = new Date(node.date);
        nodeDate.setHours(0, 0, 0, 0);
        
        switch (timelineMode) {
          case 'days':
            return nodeDate.getTime() === today.getTime();
          case 'weeks':
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return nodeDate >= weekStart && nodeDate <= weekEnd;
          case 'months':
            return nodeDate.getMonth() === today.getMonth() && 
                   nodeDate.getFullYear() === today.getFullYear();
          case 'hours':
            return nodeDate.getTime() === today.getTime();
          default:
            return false;
        }
      });
      
      if (todayNodeIndex >= 0) {
        // Center on today's position
        const todayPosition = timelineNodes[todayNodeIndex].position;
        const centerPosition = todayPosition - timelineRef.current.clientWidth / 2;
        timelineRef.current.scrollLeft = Math.max(0, centerPosition);
        setScrollPosition(Math.max(0, centerPosition));
      } else {
        // Fallback: center on middle
        const centerPosition = timelineRef.current.scrollWidth / 2 - timelineRef.current.clientWidth / 2;
        timelineRef.current.scrollLeft = centerPosition;
        setScrollPosition(centerPosition);
      }
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
      case 'milestone': return 'proyectos';
      default: return 'proyectos';
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden flex" style={{ backgroundColor: '#d1d1d1' }}>
      {/* LÍNEA NEGRA FIJA SIEMPRE VISIBLE - CENTRADA EN PANTALLA */}
      <div 
        className="absolute top-0 bottom-0 z-[10] pointer-events-none"
        style={{ 
          left: '50%',
          width: '3px',
          background: '#000000',
          transform: 'translateX(-50%)'
        }}
      />
      {/* Left Sidebar */}
      <div className="w-20 relative z-10 pl-2">
        {SIDEBAR_BUTTONS.map((button) => {
          const isActive = activeCategory === button.id;
          const Icon = button.icon;
          
          return (
            <div 
              key={button.id} 
              className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 group"
              style={{ 
                top: `calc(50% + ${button.offsetVh}vh)`,
                left: '40px' // Centrado en el sidebar
              }}
            >
              <button
                onClick={() => setActiveCategory(button.id)}
                className="relative w-12 h-12 rounded-full transition-all duration-200 hover:shadow-lg flex items-center justify-center"
                style={{ 
                  backgroundColor: isActive ? '#000000' : '#e0e0e0',
                  color: isActive ? '#ffffff' : '#919191',
                  opacity: 1
                }}
              >
                <Icon className="w-5 h-5" />
              </button>
              
              {/* Tooltip que aparece al hacer hover */}
              <div className="absolute left-full ml-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                <div className="bg-black text-white px-3 py-1 rounded text-sm whitespace-nowrap">
                  {button.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Timeline Area */}
      <div className="flex-1 flex flex-col">
        {/* Top controls - ESQUINA SUPERIOR IZQUIERDA */}
        <div className="absolute top-6 left-6 z-[20]">
          <div className="rounded-full px-6 py-2 border border-gray-300 shadow-lg" style={{ backgroundColor: '#e0e0e0' }}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTimelineMode(prev => {
                  const modes: TimelineMode[] = ['hours', 'days', 'weeks', 'months'];
                  const currentIndex = modes.indexOf(prev);
                  return modes[Math.max(0, currentIndex - 1)];
                })}
                className="w-8 h-8 rounded-full transition-all duration-200 hover:shadow-lg flex items-center justify-center"
                style={{ 
                  backgroundColor: '#e0e0e0',
                  color: '#919191',
                  opacity: timelineMode === 'hours' ? 0.5 : 1
                }}
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
                className="w-8 h-8 rounded-full transition-all duration-200 hover:shadow-lg flex items-center justify-center"
                style={{ 
                  backgroundColor: '#e0e0e0',
                  color: '#919191',
                  opacity: timelineMode === 'months' ? 0.5 : 1
                }}
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
          className="flex-1 overflow-x-auto overflow-y-hidden relative"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setIsMouseNearEdge(null)}
          onScroll={(e) => {
            const element = e.target as HTMLElement;
            setScrollPosition(element.scrollLeft);
          }}
          style={{ 
            scrollBehavior: 'auto',
            cursor: isMouseNearEdge ? (isMouseNearEdge === 'right' ? 'e-resize' : 'w-resize') : 'default',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {/* Línea vertical del "AHORA" - FIJA en el centro de la pantalla */}
          <div 
            className="absolute top-0 bottom-0 z-50 pointer-events-none"
            style={{ 
              left: '50%',
              width: '4px',
              background: '#FF0000',
              transform: 'translateX(-50%)',
              boxShadow: '0 0 8px rgba(255, 0, 0, 0.3)'
            }}
          />
          
          <div className="relative h-full" style={{ width: '18000px', minWidth: '100vw' }}>

            {/* Líneas horizontales infinitas para cada categoría - DETRÁS de los botones */}
            {SIDEBAR_BUTTONS.map((button, buttonIndex) => (
              <div key={`line-${button.id}`}>
                {/* Línea horizontal */}
                <div
                  className="absolute left-0 right-0 h-px z-0"
                  style={{ 
                    top: `calc(50% + ${button.offsetVh}vh)`,
                    background: button.id === 'proyectos' 
                      ? '#000000'
                      : `repeating-linear-gradient(
                          to right,
                          #999999 0px,
                          #999999 4px,
                          transparent 4px,
                          transparent 8px
                        )`
                  }}
                />
                
                {/* EVENTOS VISIBLES - círculos en las líneas horizontales */}
                {[0, 1, 2].map((eventIndex) => (
                  <div
                    key={`event-${button.id}-${eventIndex}`}
                    className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center z-50 cursor-pointer hover:scale-110 transition-transform"
                    style={{
                      left: `calc(50% + ${(eventIndex - 1) * 150}px)`,
                      top: `calc(50% + ${button.offsetVh}vh)`,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: ['#10B981', '#8B5CF6', '#F59E0B', '#3B82F6', '#EF4444'][buttonIndex] || '#666666'
                    }}
                    title={`Evento ${button.label} ${eventIndex + 1}`}
                  >
                    <button.icon className="w-3 h-3 text-white" />
                  </div>
                ))}
              </div>
            ))}

            {/* Números de fechas - ARRIBA Y ABAJO */}
            {timelineNodes.map((node, index) => {
              const today = new Date();
              const isToday = node.date.toDateString() === today.toDateString();
              
              return (
                <div key={`date-${index}`}>
                  {/* Fecha arriba */}
                  <div 
                    className="absolute text-xs font-medium"
                    style={{ 
                      left: `calc(50% + ${node.position}px)`,
                      top: '10px',
                      transform: 'translateX(-50%)',
                      color: isToday ? '#FF0000' : '#666666',
                      fontWeight: isToday ? 'bold' : 'normal',
                      zIndex: 30
                    }}
                  >
                    {formatDate(node.date)}
                  </div>
                  
                  {/* Fecha abajo */}
                  <div 
                    className="absolute text-xs font-medium"
                    style={{ 
                      left: `calc(50% + ${node.position}px)`,
                      bottom: '10px',
                      transform: 'translateX(-50%)',
                      color: isToday ? '#FF0000' : '#666666',
                      fontWeight: isToday ? 'bold' : 'normal',
                      zIndex: 30
                    }}
                  >
                    {formatDate(node.date)}
                  </div>
                </div>
              );
            })}

            {/* EVENTOS REALES - basados en los datos del timeline */}
            {timelineNodes.map((node, index) => {
              const today = new Date();
              const isToday = node.date.toDateString() === today.toDateString();
              const isYesterday = node.date.toDateString() === new Date(today.getTime() - 24*60*60*1000).toDateString();
              const isTomorrow = node.date.toDateString() === new Date(today.getTime() + 24*60*60*1000).toDateString();
              
              // Eventos forzados para demostración
              if (isYesterday) {
                return (
                  <div key={`events-${index}`}>
                    {/* Evento movimiento */}
                    <div 
                      className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center z-50 cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        left: `calc(50% + ${node.position}px)`,
                        top: `calc(50% + ${SIDEBAR_BUTTONS[1].offsetVh}vh)`,
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: '#10B981'
                      }}
                      title="Pago Joel $1,500"
                    >
                      <DollarSign className="w-3 h-3 text-white" />
                    </div>
                    {/* Evento bitácora */}
                    <div 
                      className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center z-50 cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        left: `calc(50% + ${node.position}px)`,
                        top: `calc(50% + ${SIDEBAR_BUTTONS[3].offsetVh}vh)`,
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: '#8B5CF6'
                      }}
                      title="Bitácora Osvaldo"
                    >
                      <FileText className="w-3 h-3 text-white" />
                    </div>
                  </div>
                );
              } else if (isToday) {
                return (
                  <div key={`events-${index}`}>
                    {/* Evento presupuesto */}
                    <div 
                      className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center z-50 cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        left: `calc(50% + ${node.position}px)`,
                        top: `calc(50% + ${SIDEBAR_BUTTONS[0].offsetVh}vh)`,
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: '#F59E0B'
                      }}
                      title="Demolición muros"
                    >
                      <Target className="w-3 h-3 text-white" />
                    </div>
                    {/* Evento proyecto */}
                    <div 
                      className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center z-50 cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        left: `calc(50% + ${node.position}px)`,
                        top: `calc(50% + ${SIDEBAR_BUTTONS[2].offsetVh}vh)`,
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: '#3B82F6'
                      }}
                      title="Milestone Fase 1"
                    >
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  </div>
                );
              } else if (isTomorrow) {
                return (
                  <div key={`events-${index}`}>
                    {/* Evento ejecución */}
                    <div 
                      className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center z-50 cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        left: `calc(50% + ${node.position}px)`,
                        top: `calc(50% + ${SIDEBAR_BUTTONS[4].offsetVh}vh)`,
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: '#EF4444'
                      }}
                      title="Ejecución cielorrasos"
                    >
                      <Wrench className="w-3 h-3 text-white" />
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}