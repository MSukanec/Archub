import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, TrendingUp, Users, Paperclip, DollarSign, CheckSquare, Calendar } from 'lucide-react';

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  siteLogs: any[];
  movements: any[];
  tasks: any[];
  attendees: any[];
  files: any[];
  onItemClick: (type: string, item: any) => void;
}

export default function DayDetailModal({
  isOpen,
  onClose,
  date,
  siteLogs,
  movements,
  tasks,
  attendees,
  files,
  onItemClick
}: DayDetailModalProps) {
  const dateObj = new Date(date + 'T12:00:00'); // Usar mediodía para evitar problemas de zona horaria
  const formattedDate = dateObj.toString() !== 'Invalid Date' 
    ? format(dateObj, 'EEEE, d \'de\' MMMM \'de\' yyyy', { locale: es })
    : date;

  const getTypeConfig = (type: string) => {
    const configs: Record<string, { icon: any; color: string; label: string }> = {
      sitelog: { icon: FileText, color: 'bg-blue-500/10 text-blue-600 border-blue-200', label: 'Bitácora' },
      movement: { icon: DollarSign, color: 'bg-green-500/10 text-green-600 border-green-200', label: 'Movimiento' },
      task: { icon: CheckSquare, color: 'bg-purple-500/10 text-purple-600 border-purple-200', label: 'Tarea' },
      attendee: { icon: Users, color: 'bg-orange-500/10 text-orange-600 border-orange-200', label: 'Asistente' },
      file: { icon: Paperclip, color: 'bg-gray-500/10 text-gray-600 border-gray-200', label: 'Archivo' }
    };
    return configs[type] || configs.file;
  };

  const getUserInitials = (item: any) => {
    // Priorizar datos del autor desde la relación de la base de datos
    if (item.author?.first_name && item.author?.last_name) {
      return `${item.author.first_name.charAt(0)}${item.author.last_name.charAt(0)}`.toUpperCase();
    }
    
    // Fallback a campos directos si existen
    if (item.first_name && item.last_name) {
      return `${item.first_name.charAt(0)}${item.last_name.charAt(0)}`.toUpperCase();
    }
    
    // Fallback a nombre completo si existe
    if (item.author_name) {
      const names = item.author_name.split(' ');
      return names.length > 1 ? `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase() : names[0].charAt(0).toUpperCase();
    }
    
    return 'U';
  };

  const getAuthorName = (item: any) => {
    // Priorizar datos del autor desde la relación de la base de datos
    if (item.author?.first_name && item.author?.last_name) {
      return `${item.author.first_name} ${item.author.last_name}`;
    }
    
    // Fallback a campos directos si existen
    if (item.first_name && item.last_name) {
      return `${item.first_name} ${item.last_name}`;
    }
    
    // Fallback a nombre completo si existe
    if (item.author_name) {
      return item.author_name;
    }
    
    return 'Usuario';
  };

  const allItems = [
    ...(siteLogs || []).map(log => ({ 
      type: 'sitelog', 
      item: log, 
      title: log.description || log.comments || 'Registro de bitácora',
      subtitle: log.weather ? `Clima: ${log.weather}` : '',
      author: getAuthorName(log)
    })),
    ...(movements || []).map(movement => ({ 
      type: 'movement', 
      item: movement, 
      title: movement.description || 'Movimiento financiero',
      subtitle: `$${movement.amount?.toLocaleString() || '0'}`,
      author: getAuthorName(movement)
    })),
    ...(tasks || []).map(task => ({ 
      type: 'task', 
      item: task, 
      title: task.name || 'Tarea',
      subtitle: task.quantity ? `Cantidad: ${task.quantity}` : '',
      author: getAuthorName(task)
    })),
    ...(attendees || []).map(attendee => ({ 
      type: 'attendee', 
      item: attendee, 
      title: attendee.name || 'Asistente',
      subtitle: attendee.role || 'Trabajador',
      author: getAuthorName(attendee)
    })),
    ...(files || []).map(file => ({ 
      type: 'file', 
      item: file, 
      title: file.name || 'Archivo',
      subtitle: file.description || 'Sin descripción',
      author: getAuthorName(file)
    }))
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground capitalize">
                {formattedDate}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {allItems.length} {allItems.length === 1 ? 'evento' : 'eventos'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {allItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                No hay eventos para este día
              </p>
            </div>
          ) : (
            allItems.map((entry, index) => {
              const config = getTypeConfig(entry.type);
              const Icon = config.icon;
              const userInitials = getUserInitials(entry.item);
              
              return (
                <Button
                  key={`${entry.type}-${index}`}
                  variant="ghost"
                  className="w-full justify-start p-4 h-auto text-left hover:bg-accent/50 border border-transparent hover:border-border transition-all duration-200"
                  onClick={() => {
                    onItemClick(entry.type, entry.item);
                    onClose();
                  }}
                >
                  <div className="flex items-start gap-4 w-full">
                    <div className={`p-2 rounded-lg ${config.color} flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {entry.title}
                          </h4>
                          {entry.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">
                              {entry.subtitle}
                            </p>
                          )}
                        </div>
                        
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {config.label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {entry.author}
                        </span>
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}