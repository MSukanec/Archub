import React from 'react';
import { 
  Home, 
  DollarSign, 
  FileText, 
  Users, 
  FolderOpen 
} from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { cn } from '@/lib/utils';

interface SidebarButton {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  color: string;
  position: 'top' | 'center' | 'bottom';
  offset?: number; // Percentage from center
}

const sidebarButtons: SidebarButton[] = [
  {
    id: 'dashboard',
    icon: Home,
    label: 'Dashboard',
    color: '#FF4D1C',
    position: 'top',
    offset: -20 // 20% above center
  },
  {
    id: 'movements',
    icon: DollarSign,
    label: 'Movimientos',
    color: '#10B981',
    position: 'top',
    offset: -10 // 10% above center
  },
  {
    id: 'projects',
    icon: FolderOpen,
    label: 'Proyectos',
    color: '#8B5CF6',
    position: 'center',
    offset: 0 // Exactly at center, aligned with timeline
  },
  {
    id: 'sitelog',
    icon: FileText,
    label: 'Bitácoras',
    color: '#F59E0B',
    position: 'bottom',
    offset: 10 // 10% below center
  },
  {
    id: 'contacts',
    icon: Users,
    label: 'Contactos',
    color: '#EF4444',
    position: 'bottom',
    offset: 20 // 20% below center
  }
];

export default function CircularSidebar() {
  const { currentSection, setSection } = useNavigationStore();

  const handleButtonClick = (buttonId: string) => {
    setSection(buttonId as any);
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-20 bg-background border-r border-border z-50 flex flex-col items-center justify-center">
      {/* Horizontal timeline line that extends across the screen */}
      <div 
        className="absolute w-screen h-px bg-border/30 border-dashed"
        style={{ 
          left: '80px', // Start from the end of the sidebar
          top: '50%',
          borderTop: '1px dashed rgb(var(--border) / 0.3)'
        }}
      />
      
      {/* Sidebar buttons */}
      <div className="relative h-full w-full flex flex-col items-center justify-center">
        {sidebarButtons.map((button) => {
          const Icon = button.icon;
          const isActive = currentSection === button.id;
          
          // Calculate position based on screen height percentage
          const topPosition = button.position === 'center' 
            ? '50%' 
            : button.position === 'top'
              ? `calc(50% + ${button.offset}vh)`
              : `calc(50% + ${button.offset}vh)`;
          
          return (
            <button
              key={button.id}
              onClick={() => handleButtonClick(button.id)}
              className={cn(
                "absolute w-12 h-12 rounded-full border-2 border-background shadow-lg",
                "flex items-center justify-center transition-all duration-300 hover:scale-110",
                "group relative",
                isActive ? "scale-110 shadow-xl" : "hover:shadow-md"
              )}
              style={{
                backgroundColor: button.color,
                top: topPosition,
                transform: 'translateY(-50%)',
                zIndex: button.position === 'center' ? 60 : 50
              }}
              title={button.label}
            >
              <Icon className="w-6 h-6 text-white" />
              
              {/* Active indicator */}
              {isActive && (
                <div 
                  className="absolute -right-1 -top-1 w-4 h-4 rounded-full border-2 border-background"
                  style={{ backgroundColor: button.color }}
                />
              )}
              
              {/* Badge for event count (placeholder for now) */}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">3</span>
              </div>
              
              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-2 py-1 bg-card border border-border rounded-md text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                {button.label}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Connection line from center button to timeline */}
      <div 
        className="absolute w-6 h-px bg-border/50"
        style={{
          left: '60px', // From center button edge
          top: '50%',
          transform: 'translateY(-50%)'
        }}
      />
    </div>
  );
}