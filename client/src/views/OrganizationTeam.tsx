import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, UserPlus, Settings, Mail, Calendar, Crown, Shield, User, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
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

const roleConfig = {
  owner: {
    label: 'Propietario',
    icon: Crown,
    bgColor: 'bg-amber-500/10',
    color: 'text-amber-600'
  },
  admin: {
    label: 'Administrador',
    icon: Shield,
    bgColor: 'bg-purple-500/10',
    color: 'text-purple-600'
  },
  member: {
    label: 'Miembro',
    icon: User,
    bgColor: 'bg-blue-500/10',
    color: 'text-blue-600'
  }
};

export default function OrganizationTeam() {
  const { organizationId } = useUserContextStore();
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();
      
      if (error) {
        console.error('Error fetching organization:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!organizationId,
    refetchOnWindowFocus: false,
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-[#e1e1e1]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Team Members Skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-[#e1e1e1]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No se encontró información de la organización</p>
      </div>
    );
  }

  // Mock team members data for now since it's not implemented in the backend
  const teamMembers = [
    {
      id: '1',
      firstName: 'Matias',
      lastName: 'Sukanec',
      email: 'lenga@gmail.com',
      role: 'owner' as const,
      joinedAt: '2025-05-26T21:36:17.711297+00:00',
      lastActive: '2025-05-29T15:16:01.678952Z',
      permissions: {
        projects: { view: true, create: true, edit: true, delete: true },
        budgets: { view: true, create: true, edit: true, delete: true },
        sitelog: { view: true, create: true, edit: true, delete: true },
        movements: { view: true, create: true, edit: true, delete: true },
        team: { view: true, invite: true, manage: true }
      }
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Equipo</h1>
            <p className="text-sm text-gray-600">
              Gestiona los miembros y permisos de tu organización
            </p>
          </div>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <UserPlus className="h-4 w-4 mr-2" />
          Invitar Miembro
        </Button>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-[#e1e1e1] border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-50">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Miembros</p>
                <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#e1e1e1] border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-50">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#e1e1e1] border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-50">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Administradores</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamMembers.filter(m => ['owner', 'admin'].includes(m.role)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#e1e1e1] border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-50">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Con Permisos</p>
                <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Miembros del Equipo</h2>
        
        {teamMembers.map((member) => {
          const config = roleConfig[member.role] || roleConfig.member;
          const RoleIcon = config.icon;
          const isExpanded = expandedMember === member.id;

          return (
            <Card key={member.id} className="bg-[#e1e1e1] border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.firstName} ${member.lastName}`} />
                      <AvatarFallback className="bg-green-50 text-primary font-medium">
                        {getInitials(member.firstName, member.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">
                          {member.firstName} {member.lastName}
                        </h3>
                        <Badge className={`${config.bgColor} ${config.color} border-0`}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
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
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                    >
                      Ver Permisos
                      <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Permissions */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-4">Permisos del Usuario</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(member.permissions).map(([category, perms]) => (
                        <div key={category} className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-700 capitalize">
                            {category === 'sitelog' ? 'Bitácora' : category}
                          </h5>
                          <div className="space-y-1">
                            {Object.entries(perms).map(([perm, hasPermission]) => (
                              <div key={perm} className="flex items-center gap-2 text-xs">
                                <div className={`w-2 h-2 rounded-full ${hasPermission ? 'bg-green-500' : 'bg-gray-300'}`} />
                                <span className={hasPermission ? 'text-gray-700' : 'text-gray-400'}>
                                  {perm === 'view' ? 'Ver' : 
                                   perm === 'create' ? 'Crear' :
                                   perm === 'edit' ? 'Editar' :
                                   perm === 'delete' ? 'Eliminar' :
                                   perm === 'invite' ? 'Invitar' :
                                   perm === 'manage' ? 'Gestionar' :
                                   perm === 'export' ? 'Exportar' : perm}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}