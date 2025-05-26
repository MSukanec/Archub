import { supabase } from './supabase';

export interface TaskCategory {
  id: number;
  code: string;
  name: string;
  position: number;
  parent_id: number | null;
  children?: TaskCategory[];
}

export interface CreateTaskCategoryData {
  code: string;
  name: string;
  parent_id?: number | null;
}

export const taskCategoriesService = {
  async getAll(): Promise<TaskCategory[]> {
    const { data, error } = await supabase
      .from('task_categories')
      .select('*')
      .order('position', { ascending: true });
    
    if (error) {
      console.error('Error fetching task categories:', error);
      throw new Error('Error al obtener las categorías');
    }
    
    return this.buildTree(data || []);
  },

  async create(categoryData: CreateTaskCategoryData): Promise<TaskCategory> {
    // Get the next position for this level
    const { data: maxPosition } = await supabase
      .from('task_categories')
      .select('position')
      .eq('parent_id', categoryData.parent_id || null)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const newPosition = maxPosition ? maxPosition.position + 1 : 1;

    const { data, error } = await supabase
      .from('task_categories')
      .insert([{
        code: categoryData.code,
        name: categoryData.name,
        parent_id: categoryData.parent_id || null,
        position: newPosition,
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating task category:', error);
      throw new Error('Error al crear la categoría');
    }
    
    return data;
  },

  async update(id: number, categoryData: Partial<CreateTaskCategoryData>): Promise<TaskCategory> {
    const { data, error } = await supabase
      .from('task_categories')
      .update({
        code: categoryData.code,
        name: categoryData.name,
        parent_id: categoryData.parent_id,
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating task category:', error);
      throw new Error('Error al actualizar la categoría');
    }
    
    return data;
  },

  async delete(id: number): Promise<void> {
    // First check if this category has children
    const { data: children } = await supabase
      .from('task_categories')
      .select('id')
      .eq('parent_id', id);

    if (children && children.length > 0) {
      throw new Error('No se puede eliminar una categoría que tiene subcategorías');
    }

    const { error } = await supabase
      .from('task_categories')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting task category:', error);
      throw new Error('Error al eliminar la categoría');
    }
  },

  async updatePositions(updates: { id: number; position: number; parent_id: number | null }[]): Promise<void> {
    // Update positions in batch
    const promises = updates.map(update => 
      supabase
        .from('task_categories')
        .update({ position: update.position, parent_id: update.parent_id })
        .eq('id', update.id)
    );

    const results = await Promise.all(promises);
    
    for (const result of results) {
      if (result.error) {
        console.error('Error updating positions:', result.error);
        throw new Error('Error al actualizar las posiciones');
      }
    }
  },

  // Helper function to build tree structure
  buildTree(categories: TaskCategory[]): TaskCategory[] {
    const categoryMap = new Map<number, TaskCategory>();
    const rootCategories: TaskCategory[] = [];

    // First pass: create map and initialize children arrays
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Second pass: build tree structure
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (category.parent_id === null) {
        rootCategories.push(categoryWithChildren);
      } else {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children!.push(categoryWithChildren);
        }
      }
    });

    return rootCategories;
  }
};