import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Concept {
  id: string;
  name: string;
  parent_id: string | null;
  organization_id?: string;
}

export interface ConceptPath {
  parentId: string | null;
  conceptId: string;
  fullPath: string[];
}

export interface ConceptStructures {
  conceptsById: Map<string, Concept>;
  conceptsByParent: Map<string | null, Concept[]>;
  getConceptPath: (id: string) => string[];
  getConceptPathWithNames: (id: string) => { id: string; name: string }[];
  getChildConcepts: (parentId: string | null) => Concept[];
  getRootConcepts: () => Concept[];
}

export function useHierarchicalConcepts(table: string = 'movement_concepts', organizationId?: string): {
  data: ConceptStructures | null;
  isLoading: boolean;
  error: any;
} {
  const { data: concepts = [], isLoading, error } = useQuery({
    queryKey: ['hierarchical-concepts', table, organizationId],
    queryFn: async () => {
      let query = supabase
        .from(table)
        .select('*')
        .order('name');
      
      // Only filter by organization if organizationId is provided and table supports it
      if (organizationId && table !== 'movement_concepts') {
        query = query.eq('organization_id', organizationId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error(`Error fetching ${table}:`, error);
        throw error;
      }
      
      return data || [];
    },
    enabled: true,
  });

  const conceptStructures = useMemo((): ConceptStructures | null => {
    if (!concepts || concepts.length === 0) return null;

    // Create conceptsById Map
    const conceptsById = new Map<string, Concept>();
    concepts.forEach(concept => {
      conceptsById.set(concept.id, concept);
    });

    // Create conceptsByParent Map
    const conceptsByParent = new Map<string | null, Concept[]>();
    concepts.forEach(concept => {
      const parentId = concept.parent_id;
      if (!conceptsByParent.has(parentId)) {
        conceptsByParent.set(parentId, []);
      }
      conceptsByParent.get(parentId)!.push(concept);
    });

    // Utility function to get concept path (just IDs)
    const getConceptPath = (id: string): string[] => {
      const path: string[] = [];
      let currentId: string | null = id;

      while (currentId) {
        const concept = conceptsById.get(currentId);
        if (!concept) break;
        
        path.unshift(currentId);
        currentId = concept.parent_id;
      }

      return path;
    };

    // Utility function to get concept path with names
    const getConceptPathWithNames = (id: string): { id: string; name: string }[] => {
      const path: { id: string; name: string }[] = [];
      let currentId: string | null = id;

      while (currentId) {
        const concept = conceptsById.get(currentId);
        if (!concept) break;
        
        path.unshift({ id: currentId, name: concept.name });
        currentId = concept.parent_id;
      }

      return path;
    };

    // Utility function to get child concepts
    const getChildConcepts = (parentId: string | null): Concept[] => {
      return conceptsByParent.get(parentId) || [];
    };

    // Utility function to get root concepts (those with no parent)
    const getRootConcepts = (): Concept[] => {
      return getChildConcepts(null);
    };

    return {
      conceptsById,
      conceptsByParent,
      getConceptPath,
      getConceptPathWithNames,
      getChildConcepts,
      getRootConcepts,
    };
  }, [concepts]);

  return {
    data: conceptStructures,
    isLoading,
    error,
  };
}

// Utility function for setting hierarchical form values
export function setHierarchicalFormValues(
  form: any,
  conceptPath: string[],
  fieldNames: string[]
) {
  // Clear all fields first
  fieldNames.forEach(fieldName => {
    form.setValue(fieldName, '');
  });

  // Set values based on path length
  conceptPath.forEach((conceptId, index) => {
    if (index < fieldNames.length) {
      form.setValue(fieldNames[index], conceptId);
    }
  });
}

// Utility function to validate if a concept path is complete
export function isConceptPathComplete(
  conceptPath: string[],
  expectedLevels: number
): boolean {
  return conceptPath.length === expectedLevels;
}