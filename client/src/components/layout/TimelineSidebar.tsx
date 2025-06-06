import React from 'react';
import { FileText, DollarSign, Calculator, Target, FolderOpen } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TimelineSidebarProps {
  className?: string;
}

const sidebarItems = [
  {
    id: 'bitacora',
    icon: FileText,
    label: 'Bitácora',
    color: '#FF4D1C',
    position: 'top-10%', // 10% arriba del timeline
  },
  {
    id: 'proyectos',
    icon: FolderOpen,
    label: 'Proyectos',
    color: '#6B7280',
    position: 'center', // En línea con el timeline
  },
  {
    id: 'movimientos',
    icon: DollarSign,
    label: 'Movimientos',
    color: '#10B981',
    position: 'bottom-10%', // 10% debajo del timeline
  },
  {
    id: 'presupuestos',
    icon: Calculator,
    label: 'Presupuestos',
    color: '#8B5CF6',
    position: 'bottom-20%', // 20% debajo del timeline
  },
  {
    id: 'tareas',
    icon: Target,
    label: 'Tareas',
    color: '#F59E0B',
    position: 'bottom-30%', // 30% debajo del timeline (inventado por ahora)
  },
];

export default function TimelineSidebar({ className }: TimelineSidebarProps) {
  const getPositionStyle = (position: string) => {
    switch (position) {
      case 'top-10%':
        return { top: '40%' }; // 50% - 10% = 40%
      case 'center':
        return { top: '50%' }; // En el centro (línea del timeline)
      case 'bottom-10%':
        return { top: '60%' }; // 50% + 10% = 60%
      case 'bottom-20%':
        return { top: '70%' }; // 50% + 20% = 70%
      case 'bottom-30%':
        return { top: '80%' }; // 50% + 30% = 80%
      default:
        return { top: '50%' };
    }
  };

  return (
    <>
      {/* Sidebar with circular buttons */}
      <div className={cn(
        "fixed left-0 top-0 w-16 h-screen bg-[#1a1a1a] flex flex-col items-center z-50",
        className
      )}>
        {/* Logo/Brand area */}
        <div className="h-16 w-16 flex items-center justify-center border-b border-border/20">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">M</span>
          </div>
        </div>

        {/* Circular navigation buttons */}
        <div className="relative flex-1 w-full">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                style={getPositionStyle(item.position)}
              >
                <button
                  className="group relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg border-2 border-background"
                  style={{ backgroundColor: item.color }}
                >
                  <Icon className="w-5 h-5 text-white" />
                  
                  {/* Tooltip */}
                  <div className="absolute left-full ml-3 px-2 py-1 bg-surface-secondary border border-border rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    <span className="text-xs font-medium text-foreground">{item.label}</span>
                  </div>

                  {/* Horizontal line extending to the right */}
                  <div 
                    className="absolute left-full w-screen opacity-30 pointer-events-none"
                    style={{ backgroundColor: item.color }}
                  />
                  
                  {/* Dotted line for non-center items */}
                  {item.position !== 'center' && (
                    <div 
                      className="absolute left-full w-screen opacity-20 pointer-events-none"
                      style={{ 
                        backgroundColor: item.color,
                        backgroundImage: `linear-gradient(to right, ${item.color} 50%, transparent 50%)`,
                        backgroundSize: '8px 1px'
                      }}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* User profile at bottom */}
        <div className="h-16 w-16 flex items-center justify-center border-t border-border/20">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-foreground">MS</span>
          </div>
        </div>
      </div>

      {/* Push content to the right */}
      <div className="ml-16" />
    </>
  );
}