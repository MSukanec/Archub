import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, TrendingUp, Users, Paperclip } from 'lucide-react';

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

  const allItems = [
    ...(siteLogs || []).map(log => ({ type: 'sitelog', item: log, icon: FileText, label: 'Bitácora', description: log.description || log.comments })),
    ...(movements || []).map(movement => ({ type: 'movement', item: movement, icon: TrendingUp, label: 'Movimiento', description: `${movement.description} - $${movement.amount}` })),
    ...(tasks || []).map(task => ({ type: 'task', item: task, icon: Users, label: 'Tarea', description: task.name })),
    ...(attendees || []).map(attendee => ({ type: 'attendee', item: attendee, icon: Users, label: 'Asistente', description: attendee.name })),
    ...(files || []).map(file => ({ type: 'file', item: file, icon: Paperclip, label: 'Archivo', description: file.name }))
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground capitalize">
            {formattedDate}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {allItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No hay eventos para este día
            </p>
          ) : (
            allItems.map((entry, index) => {
              const Icon = entry.icon;
              return (
                <Button
                  key={`${entry.type}-${index}`}
                  variant="ghost"
                  className="w-full justify-start p-3 h-auto text-left hover:bg-accent"
                  onClick={() => {
                    onItemClick(entry.type, entry.item);
                    onClose();
                  }}
                >
                  <div className="flex items-start gap-3 w-full">
                    <Icon className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        {entry.label}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {entry.description}
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