import { BarChart3, Users, Building, Calendar } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1e1e1e] border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Proyectos Activos</p>
              <p className="text-2xl font-bold text-foreground">12</p>
            </div>
            <Building className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-[#1e1e1e] border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Presupuesto Total</p>
              <p className="text-2xl font-bold text-foreground">$2.4M</p>
            </div>
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-[#1e1e1e] border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Miembros del Equipo</p>
              <p className="text-2xl font-bold text-foreground">28</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-[#1e1e1e] border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tareas Pendientes</p>
              <p className="text-2xl font-bold text-foreground">45</p>
            </div>
            <Calendar className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1e1e1e] border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Resumen de Actividad</h3>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Aquí se mostrará un resumen de la actividad reciente de todos los proyectos.
            </p>
          </div>
        </div>
        
        <div className="bg-[#1e1e1e] border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Proyectos Prioritarios</h3>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Lista de proyectos que requieren atención inmediata.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}