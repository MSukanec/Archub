import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addBasicConcepts() {
  console.log('Adding basic movement concepts...');

  // Check what concepts already exist
  const { data: existing } = await supabase
    .from('movement_concepts')
    .select('*');

  console.log('Existing concepts:', existing?.map(c => c.name) || []);

  // Only add if we don't have any parent concepts
  const parentConcepts = existing?.filter(c => c.parent_id === null) || [];
  
  if (parentConcepts.length === 0) {
    console.log('No parent concepts found, adding basic ones...');
    
    // Add basic parent types
    const { data: ingresoType } = await supabase
      .from('movement_concepts')
      .insert([{ name: 'Ingresos', parent_id: null }])
      .select()
      .single();

    const { data: egresoType } = await supabase
      .from('movement_concepts')
      .insert([{ name: 'Egresos', parent_id: null }])
      .select()
      .single();

    const { data: ajusteType } = await supabase
      .from('movement_concepts')
      .insert([{ name: 'Ajustes', parent_id: null }])
      .select()
      .single();

    if (ingresoType) {
      console.log('✓ Added Ingresos type');
      // Add basic income categories
      await supabase.from('movement_concepts').insert([
        { name: 'Pago de Cliente', parent_id: ingresoType.id },
        { name: 'Anticipo', parent_id: ingresoType.id }
      ]);
    }

    if (egresoType) {
      console.log('✓ Added Egresos type');
      // Add basic expense categories
      await supabase.from('movement_concepts').insert([
        { name: 'Materiales', parent_id: egresoType.id },
        { name: 'Mano de Obra', parent_id: egresoType.id }
      ]);
    }

    if (ajusteType) {
      console.log('✓ Added Ajustes type');
      // Add basic adjustment categories
      await supabase.from('movement_concepts').insert([
        { name: 'Corrección', parent_id: ajusteType.id }
      ]);
    }
  } else {
    console.log('Parent concepts already exist:', parentConcepts.map(c => c.name));
  }

  console.log('✅ Basic concepts setup completed!');
}

addBasicConcepts().catch(console.error);