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
    console.log('Fetching task categories...');
    
    try {
      // Try different query approaches to bypass 406 error
      let { data, error } = await supabase
        .from('task_categories')
        .select('*');
      
      if (error) {
        console.error('Error with full select, trying basic select:', error);
        // Try more basic query
        const result = await supabase
          .from('task_categories')
          .select('id, code, name, position, parent_id');
        data = result.data;
        error = result.error;
      }
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw new Error(`Error al cargar categorías: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        console.log('No categories found');
        return [];
      }
      
      console.log(`Found ${data.length} categories`);
      
      // Return sorted flat list for now to ensure it works
      const sortedData = data.sort((a, b) => a.position - b.position);
      console.log('Returning sorted data:', sortedData.length, 'categories');
      return sortedData;
      
    } catch (err) {
      console.error('Connection error:', err);
      // Log the actual error to understand what's happening
      console.error('Full error details:', JSON.stringify(err, null, 2));
      throw err; // Let the error bubble up to see what's causing it
    }
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
    console.log('Building tree with categories:', categories.length);
    
    try {
      // Create a map for quick lookup - using any to avoid type issues
      const categoryMap = new Map<number, any>();
      
      // Initialize all categories with empty children array
      categories.forEach(category => {
        categoryMap.set(category.id, { ...category, children: [] });
      });

      const rootCategories: any[] = [];

      // Build the tree structure
      categories.forEach(category => {
        const categoryWithChildren = categoryMap.get(category.id);
        
        if (category.parent_id === null || category.parent_id === undefined) {
          // This is a root category
          rootCategories.push(categoryWithChildren);
        } else {
          // This is a child category
          const parent = categoryMap.get(category.parent_id);
          if (parent) {
            parent.children.push(categoryWithChildren);
          } else {
            // Parent not found, treat as root
            rootCategories.push(categoryWithChildren);
          }
        }
      });

      // Sort by position at each level
      const sortByPosition = (items: any[]) => {
        items.sort((a, b) => a.position - b.position);
        items.forEach(item => {
          if (item.children && item.children.length > 0) {
            sortByPosition(item.children);
          }
        });
      };

      sortByPosition(rootCategories);
      console.log('Tree built successfully, returning:', rootCategories.length, 'root categories');
      return rootCategories;
    } catch (error) {
      console.error('Error building tree:', error);
      // If tree building fails, return flat sorted list
      return categories.sort((a, b) => a.position - b.position);
    }
  }
};