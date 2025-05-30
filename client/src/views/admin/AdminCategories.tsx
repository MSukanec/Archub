import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { FolderOpen, Search, Plus, Edit, Trash2, ChevronRight, ChevronDown, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AdminCategoriesModal from '@/components/modals/AdminCategoriesModal';

interface Category {
  id: string;
  name: string;
  code: string;
  parent_id: string | null;
  position: number;
  children?: Category[];
}

interface TreeNodeProps {
  category: Category;
  level: number;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
}

const TreeNode = ({ category, level, onEdit, onDelete, expandedNodes, onToggleExpand }: TreeNodeProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedNodes.has(category.id);
  const paddingLeft = level * 24 + 12;

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      <div 
        className="flex items-center gap-2 p-3 bg-white border-b border-gray-100 hover:bg-gray-50 group"
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => hasChildren && onToggleExpand(category.id)}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <div className="h-4 w-4" />
          )}
        </Button>

        {/* Category Info */}
        <div className="flex-1 flex items-center gap-3">
          <Badge variant="outline" className="font-mono text-xs bg-primary/10 text-primary border-primary/20">
            {category.code}
          </Badge>
          <span className="font-medium text-gray-900">{category.name}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category)}
            className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(category.id)}
            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {category.children!.map((child) => (
            <TreeNode
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const AdminCategories = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['/api/admin/task-categories'],
  });



  // Build tree structure
  const buildTree = (categories: any[]): Category[] => {
    // Map the data structure to our interface
    const mappedCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      code: cat.code,
      parent_id: cat.parent_id,
      position: parseInt(cat.position) || 0,
      children: [] as Category[]
    }));

    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // First pass: create map and initialize children arrays
    mappedCategories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Second pass: build tree structure
    mappedCategories.forEach(category => {
      const node = categoryMap.get(category.id)!;
      if (category.parent_id && categoryMap.has(category.parent_id)) {
        const parent = categoryMap.get(category.parent_id)!;
        parent.children!.push(node);
      } else {
        rootCategories.push(node);
      }
    });

    // Sort by position
    const sortByPosition = (items: Category[]) => {
      items.sort((a, b) => a.position - b.position);
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          sortByPosition(item.children);
        }
      });
    };

    sortByPosition(rootCategories);
    return rootCategories;
  };

  const treeData = buildTree(categories as Category[]);

  // Filter tree data
  const filteredTreeData = treeData.filter((category: any) => {
    const matchesSearch = (category.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (category.code || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = true;
    if (categoryFilter && categoryFilter !== 'all') {
      if (categoryFilter === 'root') {
        matchesCategory = !category.parent_id;
      } else {
        matchesCategory = category.parent_id === categoryFilter;
      }
    }
    
    return matchesSearch && matchesCategory;
  });

  // Get all category IDs for sortable context
  const getAllCategoryIds = (categories: Category[]): string[] => {
    const ids: string[] = [];
    const traverse = (cats: Category[]) => {
      cats.forEach(cat => {
        ids.push(cat.id);
        if (cat.children) {
          traverse(cat.children);
        }
      });
    };
    traverse(categories);
    return ids;
  };

  const sortableIds = getAllCategoryIds(filteredTreeData);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      try {
        // Update parent_id of the dragged item
        await apiRequest(`/api/admin/task-categories/${active.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            parent_id: over.id
          }),
        });

        // Refresh the data
        queryClient.invalidateQueries({ queryKey: ['/api/admin/task-categories'] });
        
        toast({
          title: "Éxito",
          description: "Categoría movida correctamente en la jerarquía.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo mover la categoría. Inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle expand/collapse
  const handleToggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Collapse all nodes
  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Expand all nodes
  const expandAll = () => {
    const allIds = getAllCategoryIds(treeData);
    setExpandedNodes(new Set(allIds));
  };

  // Handle edit
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = (categoryId: string) => {
    // Implement delete logic
    console.log('Delete category:', categoryId);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Gestión de Categorías
            </h1>
            <p className="text-sm text-muted-foreground">
              Organiza las categorías jerárquicamente
            </p>
          </div>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Categoría
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl shadow-md bg-card p-6 border-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px] bg-[#e1e1e1] border-[#919191]/20 rounded-xl">
              <SelectValue placeholder="Todas las Categorías" />
            </SelectTrigger>
            <SelectContent className="bg-[#e1e1e1] border-[#919191]/20">
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="root">Solo categorías padre</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expandir Todo
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Colapsar Todo
            </Button>
          </div>
        </div>
      </div>

      {/* Tree View */}
      <div className="rounded-2xl shadow-md bg-[#e1e1e1] border-0 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <div className="min-h-[400px] p-4">
              {filteredTreeData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No hay categorías
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Crea tu primera categoría para comenzar
                  </p>
                  <Button onClick={handleAddNew} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nueva Categoría
                  </Button>
                </div>
              ) : (
                filteredTreeData.map((category) => (
                  <TreeNode
                    key={category.id}
                    category={category}
                    level={0}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    expandedNodes={expandedNodes}
                    onToggleExpand={handleToggleExpand}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Modal */}
      <AdminCategoriesModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
      />
    </div>
  );
};

export default AdminCategories;