import { useState, useRef, useEffect } from 'react';
import { Target, DollarSign, BarChart3, FileText, Wrench, CheckCircle, Plus, Minus } from 'lucide-react';

type TimelineMode = 'hours' | 'days' | 'weeks' | 'months';

const SIDEBAR_BUTTONS = [
  { id: 'presupuestos', label: 'Presupuestos', icon: Target, offsetVh: -15 },
  { id: 'movimientos', label: 'Movimientos', icon: DollarSign, offsetVh: -7.5 },
  { id: 'proyectos', label: 'Proyectos', icon: BarChart3, offsetVh: 0 },
  { id: 'bitacora', label: 'Bitácora', icon: FileText, offsetVh: 7.5 },
  { id: 'ejecucion', label: 'Ejecución', icon: Wrench, offsetVh: 15 }
];

export default function DashboardTimelineSidebar() {
  const [timelineMode, setTimelineMode] = useState<TimelineMode>('days');
  const [activeCategory, setActiveCategory] = useState<string>('proyectos');
  const timelineRef = useRef<HTMLDivElement>(null);

  // Generar fechas para el timeline según el modo
  const today = new Date();
  const dates: { date: Date; position: number }[] = [];
  
  const getDateRange = () => {
    switch (timelineMode) {
      case 'hours':
        // 24 horas (desde -12 hasta +12)
        for (let i = -12; i <= 12; i++) {
          const date = new Date(today);
          date.setHours(today.getHours() + i);
          dates.push({
            date,
            position: i * 120 + 1500
          });
        }
        break;
      case 'weeks':
        // 12 semanas (desde -6 hasta +6)
        for (let i = -6; i <= 6; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + (i * 7));
          dates.push({
            date,
            position: i * 200 + 1500
          });
        }
        break;
      case 'months':
        // 12 meses (desde -6 hasta +6)
        for (let i = -6; i <= 6; i++) {
          const date = new Date(today);
          date.setMonth(today.getMonth() + i);
          dates.push({
            date,
            position: i * 250 + 1500
          });
        }
        break;
      default: // 'days'
        // 30 días (desde -15 hasta +15)
        for (let i = -15; i <= 15; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          dates.push({
            date,
            position: i * 150 + 1500
          });
        }
        break;
    }
  };
  
  getDateRange();

  const formatDate = (date: Date) => {
    switch (timelineMode) {
      case 'hours':
        return date.getHours().toString().padStart(2, '0') + ':00';
      case 'weeks':
        return `S${Math.ceil(date.getDate() / 7)}`;
      case 'months':
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                           'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return monthNames[date.getMonth()];
      default: // 'days'
        return date.getDate().toString();
    }
  };

  const getTimelineModeLabel = () => {
    switch (timelineMode) {
      case 'hours': return 'Horas';
      case 'days': return 'Días';
      case 'weeks': return 'Semanas';
      case 'months': return 'Meses';
      default: return 'Días';
    }
  };

  // Auto-scroll al centro cuando se monta el componente o cambia el modo
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollLeft = 1350; // Centrar en el día/hora/semana/mes actual
    }
  }, [timelineMode]); // Se ejecuta cuando cambia el modo del timeline

  // Eventos de ejemplo para demostrar funcionalidad
  const getEventsForDay = (dayOffset: number) => {
    if (dayOffset === -1) {
      return [
        { type: 'movimientos', title: 'Pago Joel $1,500', color: '#10B981', icon: DollarSign },
        { type: 'bitacora', title: 'Bitácora Osvaldo', color: '#8B5CF6', icon: FileText }
      ];
    } else if (dayOffset === 0) {
      return [
        { type: 'presupuestos', title: 'Demolición muros', color: '#F59E0B', icon: Target },
        { type: 'proyectos', title: 'Milestone Fase 1', color: '#3B82F6', icon: CheckCircle }
      ];
    } else if (dayOffset === 1) {
      return [
        { type: 'ejecucion', title: 'Ejecución cielorrasos', color: '#EF4444', icon: Wrench }
      ];
    }
    return [];
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden flex" style={{ backgroundColor: '#d1d1d1' }}>
      {/* LÍNEA NEGRA VERTICAL FIJA - CENTRO DE PANTALLA */}
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
        {SIDEBAR_BUTTONS.map((button, index) => {
          const isActive = activeCategory === button.id;
          const isMiddle = index === 2; // Botón de proyectos (centro)
          
          return (
            <div key={button.id} className="relative">
              {/* Botón del sidebar */}
              <div
                className="absolute group cursor-pointer"
                style={{
                  left: '24px',
                  top: `calc(50% + ${button.offsetVh}vh)`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => setActiveCategory(button.id)}
              >
                <div
                  className="w-12 h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 relative z-20"
                  style={{
                    backgroundColor: isActive ? '#000000' : '#e0e0e0'
                  }}
                >
                  <button.icon 
                    className="w-6 h-6" 
                    style={{ color: isActive ? 'white' : '#919191' }} 
                  />
                </div>

                {/* Tooltip en hover */}
                <div className="absolute left-full ml-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-30 pointer-events-none">
                  <div className="bg-white border border-gray-300 rounded-lg shadow-xl px-3 py-2 whitespace-nowrap">
                    <span className="text-sm font-medium text-black">{button.label}</span>
                  </div>
                </div>
              </div>

              {/* Línea horizontal punteada */}
              <div
                className="absolute z-[5]"
                style={{
                  left: '80px',
                  right: '0',
                  top: `calc(50% + ${button.offsetVh}vh)`,
                  height: '2px',
                  background: isMiddle 
                    ? '#000000'
                    : `repeating-linear-gradient(
                        to right,
                        #999999 0px,
                        #999999 8px,
                        transparent 8px,
                        transparent 16px
                      )`
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Main Timeline Area */}
      <div className="flex-1 flex flex-col">
        {/* Top controls - CENTRADO */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[20]">
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

        {/* Timeline Container con Scroll */}
        <div 
          ref={timelineRef}
          className="flex-1 overflow-x-auto overflow-y-hidden relative"
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: '#999999 transparent'
          }}
          onWheel={(e) => {
            if (timelineRef.current) {
              timelineRef.current.scrollLeft += e.deltaY;
              e.preventDefault();
            }
          }}
          onKeyDown={(e) => {
            if (timelineRef.current) {
              if (e.key === 'ArrowLeft') {
                timelineRef.current.scrollLeft -= 100;
                e.preventDefault();
              } else if (e.key === 'ArrowRight') {
                timelineRef.current.scrollLeft += 100;
                e.preventDefault();
              }
            }
          }}
          tabIndex={0}
        >
          {/* Contenedor interno amplio */}
          <div className="relative h-full" style={{ width: '3000px' }}>
            
            {/* Fechas arriba y abajo */}
            {dates.map((node, index) => {
              const isToday = node.date.toDateString() === today.toDateString();
              
              return (
                <div key={`date-${index}`}>
                  {/* Fecha arriba */}
                  <div 
                    className="absolute text-xs font-medium"
                    style={{ 
                      left: `${node.position}px`,
                      top: '10px',
                      transform: 'translateX(-50%)',
                      color: isToday ? '#FF0000' : '#AAAAAA',
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
                      left: `${node.position}px`,
                      bottom: '10px',
                      transform: 'translateX(-50%)',
                      color: isToday ? '#FF0000' : '#AAAAAA',
                      fontWeight: isToday ? 'bold' : 'normal',
                      zIndex: 30
                    }}
                  >
                    {formatDate(node.date)}
                  </div>
                </div>
              );
            })}

            {/* Eventos */}
            {dates.map((node, dayIndex) => {
              const dayOffset = dayIndex - 15; // Offset desde hoy (-15 a +15)
              const events = getEventsForDay(dayOffset);
              
              return (
                <div key={`events-${dayIndex}`}>
                  {events.map((event, eventIndex) => {
                    const button = SIDEBAR_BUTTONS.find(b => b.id === event.type);
                    if (!button) return null;

                    const EventIcon = event.icon;

                    return (
                      <div
                        key={`event-${dayIndex}-${eventIndex}`}
                        className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center z-50 cursor-pointer hover:scale-110 transition-transform"
                        style={{
                          left: `${node.position}px`,
                          top: `calc(50% + ${button.offsetVh}vh)`,
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: event.color
                        }}
                        title={event.title}
                      >
                        <EventIcon className="w-3 h-3 text-white" />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}