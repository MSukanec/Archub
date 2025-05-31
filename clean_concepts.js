import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanAndFixConcepts() {
  console.log('Starting to clean movement concepts...');

  // First, get all existing concepts to see what we have
  const { data: allConcepts, error: fetchError } = await supabase
    .from('movement_concepts')
    .select('*')
    .order('parent_id');

  if (fetchError) {
    console.error('Error fetching concepts:', fetchError);
    return;
  }

  console.log('Current concepts:');
  allConcepts.forEach(concept => {
    console.log(`- ${concept.name} (ID: ${concept.id}, Parent: ${concept.parent_id})`);
  });

  // Delete old/duplicate concepts - keeping only the ones we want
  const conceptsToDelete = allConcepts.filter(concept => 
    !['Ingresos', 'Egresos', 'Ajustes'].includes(concept.name) ||
    (concept.parent_id === null && ['Egreso', 'Ingreso', 'Ajuste'].includes(concept.name))
  );

  console.log('\nDeleting old/duplicate concepts...');
  for (const concept of conceptsToDelete) {
    const { error } = await supabase
      .from('movement_concepts')
      .delete()
      .eq('id', concept.id);
    
    if (error) {
      console.error(`Error deleting concept ${concept.name}:`, error);
    } else {
      console.log(`✓ Deleted: ${concept.name}`);
    }
  }

  console.log('✅ Cleanup completed!');
}

cleanAndFixConcepts().catch(console.error);