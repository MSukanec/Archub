import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, GripVertical, FolderOpen, Folder, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { taskCategoriesService, TaskCategory, CreateTaskCategoryData } from '@/lib/taskCategoriesService';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskCategoryData) => void;
  category?: TaskCategory | null;
  parentCategory?: TaskCategory | null;
  isSubmitting: boolean;
}

function CategoryModal({ isOpen, onClose, onSubmit, category, parentCategory, isSubmitting }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    code: category?.code || '',
    name: category?.name || '',
    parent_id: parentCategory?.id || category?.parent_id || null,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {category ? 'Editar Categoría' : 'Nueva Categoría'}
            {parentCategory && (
              <div className="text-sm text-muted-foreground mt-1">
                Subcategoría de: {parentCategory.name}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ej: A, AD, RF"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre de la categoría"
                required
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

interface CategoryItemProps {
  category: TaskCategory;
  level: number;
  onEdit: (category: TaskCategory) => void;
  onDelete: (category: TaskCategory) => void;
  onAddChild: (parent: TaskCategory) => void;
}

function CategoryItem({ category, level, onEdit, onDelete, onAddChild }: CategoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  const getIcon = () => {
    if (level === 0) return <FolderOpen className="w-4 h-4 text-blue-500" />;
    if (level === 1) return <Folder className="w-4 h-4 text-green-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const getBadgeColor = () => {
    if (level === 0) return "bg-blue-100 text-blue-800";
    if (level === 1) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-1">
      <div 
        className={`flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 group ${
          level > 0 ? 'ml-' + (level * 6) : ''
        }`}
        style={{ marginLeft: level * 24 }}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
        
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-4 h-4 flex items-center justify-center hover:bg-accent rounded"
          >
            {isExpanded ? '−' : '+'}
          </button>
        )}
        
        {!hasChildren && <div className="w-4" />}
        
        {getIcon()}
        
        <Badge variant="secondary" className={getBadgeColor()}>
          {category.code}
        </Badge>
        
        <span className="flex-1 text-sm font-medium">{category.name}</span>
        
        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAddChild(category)}
            className="h-6 w-6 p-0"
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(category)}
            className="h-6 w-6 p-0"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(category)}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {isExpanded && hasChildren && (
        <div>
          {category.children!.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminCategories() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TaskCategory | null>(null);
  const [parentCategory, setParentCategory] = useState<TaskCategory | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['task-categories'],
    queryFn: taskCategoriesService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: taskCategoriesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] });
      setIsModalOpen(false);
      setEditingCategory(null);
      setParentCategory(null);
      toast({
        title: 'Categoría creada',
        description: 'La categoría se ha creado correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al crear la categoría',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateTaskCategoryData> }) =>
      taskCategoriesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] });
      setIsModalOpen(false);
      setEditingCategory(null);
      setParentCategory(null);
      toast({
        title: 'Categoría actualizada',
        description: 'La categoría se ha actualizado correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar la categoría',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: taskCategoriesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] });
      toast({
        title: 'Categoría eliminada',
        description: 'La categoría se ha eliminado correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar la categoría',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: CreateTaskCategoryData) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (category: TaskCategory) => {
    setEditingCategory(category);
    setParentCategory(null);
    setIsModalOpen(true);
  };

  const handleDelete = (category: TaskCategory) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      deleteMutation.mutate(category.id);
    }
  };

  const handleAddChild = (parent: TaskCategory) => {
    setParentCategory(parent);
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleAddRoot = () => {
    setParentCategory(null);
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gestión de Categorías</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-accent rounded"></div>
          <div className="h-64 bg-accent rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Categorías</h1>
        <Button onClick={handleAddRoot}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría Principal
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar categorías..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Estructura de Categorías
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay categorías disponibles
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCategories.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  level={0}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddChild={handleAddChild}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
          setParentCategory(null);
        }}
        onSubmit={handleSubmit}
        category={editingCategory}
        parentCategory={parentCategory}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}