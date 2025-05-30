import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserContextStore } from '@/stores/userContextStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { projectsService } from '@/lib/projectsService';
import { supabase } from '@/lib/supabase';

export default function BudgetMaterials() {
  const { projectId } = useUserContextStore();
  const { setSection, setView } = useNavigationStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set navigation state when component mounts
  useEffect(() => {
    setSection('budgets');
    setView('materials');
  }, [setSection, setView]);

  // Listen for floating action button events
  useEffect(() => {
    const handleOpenCreateMaterialModal = () => {
      // TODO: Implement material creation modal
      toast({
        title: "Funcionalidad en desarrollo",
        description: "La gestión de materiales estará disponible próximamente.",
      });
    };

    window.addEventListener('openCreateMaterialModal', handleOpenCreateMaterialModal);
    
    return () => {
      window.removeEventListener('openCreateMaterialModal', handleOpenCreateMaterialModal);
    };
  }, [toast]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">Lista de Materiales</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona el inventario y materiales necesarios para el proyecto
          </p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => {
            toast({
              title: "Funcionalidad en desarrollo",
              description: "La gestión de materiales estará disponible próximamente.",
            });
          }}
        >
          <Plus className="h-4 w-4" />
          Agregar Material
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Inventario de Materiales</span>
            <Badge variant="secondary">Total: 0 materiales</Badge>
          </CardTitle>
          <CardDescription>
            Listado de todos los materiales disponibles para el proyecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No hay materiales registrados
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comienza agregando materiales para gestionar tu inventario
            </p>
            <Button 
              onClick={() => {
                toast({
                  title: "Funcionalidad en desarrollo",
                  description: "La gestión de materiales estará disponible próximamente.",
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Primer Material
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}