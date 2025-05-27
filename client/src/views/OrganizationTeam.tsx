import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUserContextStore } from '@/stores/userContextStore';
import { useAuthStore } from '@/stores/authStore';
import { 
  Users, 
  Shield, 
  Eye, 
  Edit, 
  Trash2, 
  Crown, 
  User, 
  MoreVertical,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  joinedAt: string;
  lastActive: string;
  permissions: {
    projects: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
    };
    budgets: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
    };
    sitelog: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
    };
    movements: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
    };
    team: {
      view: boolean;
      invite: boolean;
      manage: boolean;
    };
    reports: {
      view: boolean;
      export: boolean;
    };
  };
}

const ROLE_CONFIG = {
  owner: { 
    icon: Crown, 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-500/10', 
    label: 'Propietario' 
  },
  admin: { 
    icon: Shield, 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/10', 
    label: 'Administrador' 
  },
  manager: { 
    icon: Settings, 
    color: 'text-green-400', 
    bgColor: 'bg-green-500/10', 
    label: 'Manager' 
  },
  member: { 
    icon: User, 
    color: 'text-gray-400', 
    bgColor: 'bg-gray-500/10', 
    label: 'Miembro' 
  },
};

export default function OrganizationTeam() {
  const { organizationId } = useUserContextStore();
  const { user: currentUser } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedMember, setExpandedMember] = useState<number | null>(null);

  // Fetch team members
  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ['/api/team-members', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      console.log('Fetching team members for organization:', organizationId);
      
      // For now, let's create a mock member based on current user to show the functionality
      const currentUserMember = {
        id: 1,
        firstName: currentUser?.firstName || 'Usuario',
        lastName: currentUser?.lastName || 'Actual',
        email: currentUser?.email || 'usuario@ejemplo.com',
        role: 'owner',
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        permissions: {
          projects: { view: true, create: true, edit: true, delete: true },
          budgets: { view: true, create: true, edit: true, delete: true },
          sitelog: { view: true, create: true, edit: true, delete: true },
          movements: { view: true, create: true, edit: true, delete: true },
          team: { view: true, invite: true, manage: true },
          reports: { view: true, export: true },
        }
      };

      // Add some example team members for demonstration
      const mockMembers = [
        currentUserMember,
        {
          id: 2,
          firstName: 'María',
          lastName: 'García',
          email: 'maria.garcia@ejemplo.com',
          role: 'admin',
          joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastActive: new Date().toISOString(),
          permissions: {
            projects: { view: true, create: true, edit: true, delete: false },
            budgets: { view: true, create: true, edit: true, delete: false },
            sitelog: { view: true, create: true, edit: true, delete: false },
            movements: { view: true, create: false, edit: false, delete: false },
            team: { view: true, invite: true, manage: false },
            reports: { view: true, export: true },
          }
        },
        {
          id: 3,
          firstName: 'Carlos',
          lastName: 'López',
          email: 'carlos.lopez@ejemplo.com',
          role: 'member',
          joinedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          lastActive: new Date().toISOString(),
          permissions: {
            projects: { view: true, create: false, edit: false, delete: false },
            budgets: { view: true, create: false, edit: false, delete: false },
            sitelog: { view: true, create: true, edit: true, delete: false },
            movements: { view: true, create: false, edit: false, delete: false },
            team: { view: true, invite: false, manage: false },
            reports: { view: true, export: false },
          }
        }
      ];

      console.log('Team members:', mockMembers);
      return mockMembers;
    },
    enabled: !!organizationId,
  });

  // Update member permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ memberId, permissions }: { memberId: number; permissions: any }) => {
      // This would update permissions in the database
      console.log('Updating permissions for member:', memberId, permissions);
    },
    onSuccess: () => {
      toast({
        title: 'Permisos actualizados',
        description: 'Los permisos del miembro han sido actualizados correctamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
    },
  });

  const getRoleConfig = (role: string) => {
    return ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.member;
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName || '';
    const last = lastName || '';
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isCurrentUserOwnerOrAdmin = () => {
    const currentMember = teamMembers.find(member => member.email === currentUser?.email);
    return currentMember?.role === 'owner' || currentMember?.role === 'admin';
  };

  const handlePermissionChange = (memberId: number, section: string, permission: string, checked: boolean) => {
    // Update permissions logic here
    console.log('Permission change:', { memberId, section, permission, checked });
  };

  const PermissionCheckbox = ({ 
    label, 
    checked, 
    onChange, 
    disabled = false 
  }: { 
    label: string; 
    checked: boolean; 
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  }) => (
    <div className="flex items-center space-x-2 py-1">
      <Checkbox 
        id={label}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="h-4 w-4"
      />
      <label 
        htmlFor={label} 
        className={`text-sm ${disabled ? 'text-muted-foreground' : 'text-foreground'} cursor-pointer`}
      >
        {label}
      </label>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipo</h1>
          <p className="text-muted-foreground">
            Gestiona los miembros y permisos de tu organización
          </p>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1e1e1e] border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-foreground">{teamMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e1e1e] border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-xl font-bold text-foreground">{teamMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e1e1e] border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Crown className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-xl font-bold text-foreground">
                  {teamMembers.filter(m => ['owner', 'admin'].includes(m.role)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e1e1e] border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Shield className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Con Permisos</p>
                <p className="text-xl font-bold text-foreground">{teamMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <div className="space-y-4">
        {teamMembers.map((member) => {
          const roleConfig = getRoleConfig(member.role);
          const RoleIcon = roleConfig.icon;
          const isExpanded = expandedMember === member.id;

          return (
            <Card key={member.id} className="bg-[#1e1e1e] border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.firstName} ${member.lastName}`} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(member.firstName, member.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground">
                          {member.firstName} {member.lastName}
                        </h3>
                        <Badge className={`${roleConfig.bgColor} ${roleConfig.color} border-0`}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Se unió {formatDate(member.joinedAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? 'Ocultar Permisos' : 'Ver Permisos'}
                    </Button>

                    {isCurrentUserOwnerOrAdmin() && member.role !== 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Rol
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar Permisos
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover del Equipo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Permissions Panel */}
                {isExpanded && (
                  <>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Projects Permissions */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                          Proyectos
                        </h4>
                        <div className="space-y-2 pl-4">
                          <PermissionCheckbox
                            label="Ver proyectos"
                            checked={member.permissions.projects.view}
                            onChange={(checked) => handlePermissionChange(member.id, 'projects', 'view', checked)}
                          />
                          <PermissionCheckbox
                            label="Crear proyectos"
                            checked={member.permissions.projects.create}
                            onChange={(checked) => handlePermissionChange(member.id, 'projects', 'create', checked)}
                          />
                          <PermissionCheckbox
                            label="Editar proyectos"
                            checked={member.permissions.projects.edit}
                            onChange={(checked) => handlePermissionChange(member.id, 'projects', 'edit', checked)}
                          />
                          <PermissionCheckbox
                            label="Eliminar proyectos"
                            checked={member.permissions.projects.delete}
                            onChange={(checked) => handlePermissionChange(member.id, 'projects', 'delete', checked)}
                          />
                        </div>
                      </div>

                      {/* Budgets Permissions */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          Presupuestos
                        </h4>
                        <div className="space-y-2 pl-4">
                          <PermissionCheckbox
                            label="Ver presupuestos"
                            checked={member.permissions.budgets.view}
                            onChange={(checked) => handlePermissionChange(member.id, 'budgets', 'view', checked)}
                          />
                          <PermissionCheckbox
                            label="Crear presupuestos"
                            checked={member.permissions.budgets.create}
                            onChange={(checked) => handlePermissionChange(member.id, 'budgets', 'create', checked)}
                          />
                          <PermissionCheckbox
                            label="Editar presupuestos"
                            checked={member.permissions.budgets.edit}
                            onChange={(checked) => handlePermissionChange(member.id, 'budgets', 'edit', checked)}
                          />
                          <PermissionCheckbox
                            label="Eliminar presupuestos"
                            checked={member.permissions.budgets.delete}
                            onChange={(checked) => handlePermissionChange(member.id, 'budgets', 'delete', checked)}
                          />
                        </div>
                      </div>

                      {/* Site Log Permissions */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                          Bitácora
                        </h4>
                        <div className="space-y-2 pl-4">
                          <PermissionCheckbox
                            label="Ver bitácora"
                            checked={member.permissions.sitelog.view}
                            onChange={(checked) => handlePermissionChange(member.id, 'sitelog', 'view', checked)}
                          />
                          <PermissionCheckbox
                            label="Crear entradas"
                            checked={member.permissions.sitelog.create}
                            onChange={(checked) => handlePermissionChange(member.id, 'sitelog', 'create', checked)}
                          />
                          <PermissionCheckbox
                            label="Editar entradas"
                            checked={member.permissions.sitelog.edit}
                            onChange={(checked) => handlePermissionChange(member.id, 'sitelog', 'edit', checked)}
                          />
                          <PermissionCheckbox
                            label="Eliminar entradas"
                            checked={member.permissions.sitelog.delete}
                            onChange={(checked) => handlePermissionChange(member.id, 'sitelog', 'delete', checked)}
                          />
                        </div>
                      </div>

                      {/* Financial Permissions */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                          Finanzas
                        </h4>
                        <div className="space-y-2 pl-4">
                          <PermissionCheckbox
                            label="Ver movimientos"
                            checked={member.permissions.movements.view}
                            onChange={(checked) => handlePermissionChange(member.id, 'movements', 'view', checked)}
                          />
                          <PermissionCheckbox
                            label="Crear movimientos"
                            checked={member.permissions.movements.create}
                            onChange={(checked) => handlePermissionChange(member.id, 'movements', 'create', checked)}
                          />
                          <PermissionCheckbox
                            label="Editar movimientos"
                            checked={member.permissions.movements.edit}
                            onChange={(checked) => handlePermissionChange(member.id, 'movements', 'edit', checked)}
                          />
                          <PermissionCheckbox
                            label="Eliminar movimientos"
                            checked={member.permissions.movements.delete}
                            onChange={(checked) => handlePermissionChange(member.id, 'movements', 'delete', checked)}
                          />
                        </div>
                      </div>

                      {/* Team Permissions */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                          Equipo
                        </h4>
                        <div className="space-y-2 pl-4">
                          <PermissionCheckbox
                            label="Ver equipo"
                            checked={member.permissions.team.view}
                            onChange={(checked) => handlePermissionChange(member.id, 'team', 'view', checked)}
                          />
                          <PermissionCheckbox
                            label="Invitar miembros"
                            checked={member.permissions.team.invite}
                            onChange={(checked) => handlePermissionChange(member.id, 'team', 'invite', checked)}
                          />
                          <PermissionCheckbox
                            label="Gestionar miembros"
                            checked={member.permissions.team.manage}
                            onChange={(checked) => handlePermissionChange(member.id, 'team', 'manage', checked)}
                          />
                        </div>
                      </div>

                      {/* Reports Permissions */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                          Reportes
                        </h4>
                        <div className="space-y-2 pl-4">
                          <PermissionCheckbox
                            label="Ver reportes"
                            checked={member.permissions.reports.view}
                            onChange={(checked) => handlePermissionChange(member.id, 'reports', 'view', checked)}
                          />
                          <PermissionCheckbox
                            label="Exportar reportes"
                            checked={member.permissions.reports.export}
                            onChange={(checked) => handlePermissionChange(member.id, 'reports', 'export', checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {teamMembers.length === 0 && (
        <Card className="bg-[#1e1e1e] border-border">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No hay miembros en el equipo
            </h3>
            <p className="text-muted-foreground mb-4">
              Comienza invitando a tu primer compañero de trabajo
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}