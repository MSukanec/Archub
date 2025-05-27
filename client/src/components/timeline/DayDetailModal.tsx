import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, TrendingUp, Wrench, Image, Users, MapPin, Cloud } from 'lucide-react';

interface DayEvent {
  date: string;
  siteLogs: any[];
  movements: any[];
  tasks: any[];
  attendees: any[];
  files: any[];
}

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayEvent: DayEvent | null;
}

export default function DayDetailModal({ isOpen, onClose, dayEvent }: DayDetailModalProps) {
  if (!dayEvent) return null;

  const dayDate = new Date(dayEvent.date);
  const hasEvents = dayEvent.siteLogs.length > 0 || dayEvent.movements.length > 0 || 
                   dayEvent.tasks.length > 0 || dayEvent.attendees.length > 0 || 
                   dayEvent.files.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Detalles del {format(dayDate, 'EEEE, dd MMMM yyyy', { locale: es })}</span>
            {!hasEvents && <Badge variant="secondary">Sin eventos</Badge>}
          </DialogTitle>
        </DialogHeader>

        {!hasEvents ? (
          <div className="py-8 text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay eventos registrados para este día</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Site Logs Section */}
            {dayEvent.siteLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-blue-400" />
                    Bitácoras de Obra ({dayEvent.siteLogs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dayEvent.siteLogs.map((log, index) => (
                      <div key={index} className="bg-[#141414] p-4 rounded-lg border border-border">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">Bitácora #{index + 1}</span>
                            {log.weather_conditions && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Cloud className="h-3 w-3" />
                                {log.weather_conditions}
                              </Badge>
                            )}
                          </div>
                          {log.location && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {log.location}
                            </Badge>
                          )}
                        </div>
                        {log.notes && (
                          <p className="text-sm text-muted-foreground">{log.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Movements Section */}
            {dayEvent.movements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                    Movimientos Financieros ({dayEvent.movements.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dayEvent.movements.map((movement, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-[#141414] rounded-lg border border-border">
                        <div>
                          <div className="font-medium text-foreground">
                            {movement.description || 'Movimiento sin descripción'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {movement.type === 'income' ? 'Ingreso' : 'Egreso'}
                            {movement.category && ` • ${movement.category}`}
                          </div>
                        </div>
                        <div className={`font-bold ${movement.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                          {movement.type === 'income' ? '+' : '-'}${movement.amount?.toLocaleString() || '0'}
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-border">
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total del día:</span>
                        <span className="text-primary">
                          ${dayEvent.movements.reduce((sum, m) => {
                            return sum + (m.type === 'income' ? (m.amount || 0) : -(m.amount || 0));
                          }, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tasks Section */}
            {dayEvent.tasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-orange-400" />
                    Tareas Ejecutadas ({dayEvent.tasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dayEvent.tasks.map((task, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-[#141414] rounded border border-border">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-sm text-foreground">
                          {task.task_name || task.description || 'Tarea sin nombre'}
                        </span>
                        {task.quantity && (
                          <Badge variant="outline" className="ml-auto">
                            {task.quantity} {task.unit || 'unidades'}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attendees Section */}
            {dayEvent.attendees.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-yellow-400" />
                    Personal Presente ({dayEvent.attendees.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {dayEvent.attendees.map((attendee, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {attendee.name || 'Sin nombre'}
                        {attendee.role && ` - ${attendee.role}`}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Files Section */}
            {dayEvent.files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5 text-purple-400" />
                    Archivos y Fotos ({dayEvent.files.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {dayEvent.files.map((file, index) => (
                      <div key={index} className="bg-[#141414] p-3 rounded border border-border text-center">
                        <Image className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                        <div className="text-xs text-muted-foreground truncate">
                          {file.file_name || `Archivo ${index + 1}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}