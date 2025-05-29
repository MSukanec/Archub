import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedMovementConcepts() {
  console.log('Starting to seed movement concepts...');

  // Insert parent types (let Supabase generate UUIDs)
  const parentTypes = [
    { name: 'Ingresos', parent_id: null },
    { name: 'Egresos', parent_id: null },
    { name: 'Ajustes', parent_id: null }
  ];

  const insertedTypes = {};
  
  for (const type of parentTypes) {
    const { data, error } = await supabase
      .from('movement_concepts')
      .insert([type])
      .select();
    
    if (error) {
      console.error(`Error inserting type ${type.name}:`, error);
    } else if (data && data[0]) {
      insertedTypes[type.name] = data[0].id;
      console.log(`✓ Inserted type: ${type.name} with ID: ${data[0].id}`);
    }
  }

  // Insert income categories
  const incomeCategories = [
    { name: 'Pago de Cliente', parent_id: insertedTypes['Ingresos'] },
    { name: 'Anticipo de Cliente', parent_id: insertedTypes['Ingresos'] },
    { name: 'Certificación', parent_id: insertedTypes['Ingresos'] },
    { name: 'Venta de Material', parent_id: insertedTypes['Ingresos'] }
  ];

  for (const category of incomeCategories) {
    if (category.parent_id) {
      const { data, error } = await supabase
        .from('movement_concepts')
        .insert([category])
        .select();
      
      if (error) {
        console.error(`Error inserting income category ${category.name}:`, error);
      } else {
        console.log(`✓ Inserted income category: ${category.name}`);
      }
    }
  }

  // Insert expense categories
  const expenseCategories = [
    { name: 'Materiales de Construcción', parent_id: insertedTypes['Egresos'] },
    { name: 'Mano de Obra', parent_id: insertedTypes['Egresos'] },
    { name: 'Herramientas y Equipos', parent_id: insertedTypes['Egresos'] },
    { name: 'Transporte', parent_id: insertedTypes['Egresos'] },
    { name: 'Servicios Profesionales', parent_id: insertedTypes['Egresos'] },
    { name: 'Gastos Generales', parent_id: insertedTypes['Egresos'] }
  ];

  for (const category of expenseCategories) {
    if (category.parent_id) {
      const { data, error } = await supabase
        .from('movement_concepts')
        .insert([category])
        .select();
      
      if (error) {
        console.error(`Error inserting expense category ${category.name}:`, error);
      } else {
        console.log(`✓ Inserted expense category: ${category.name}`);
      }
    }
  }

  // Insert adjustment categories
  const adjustmentCategories = [
    { name: 'Corrección de Error', parent_id: insertedTypes['Ajustes'] },
    { name: 'Ajuste de Inventario', parent_id: insertedTypes['Ajustes'] },
    { name: 'Diferencia de Cambio', parent_id: insertedTypes['Ajustes'] }
  ];

  for (const category of adjustmentCategories) {
    if (category.parent_id) {
      const { data, error } = await supabase
        .from('movement_concepts')
        .insert([category])
        .select();
      
      if (error) {
        console.error(`Error inserting adjustment category ${category.name}:`, error);
      } else {
        console.log(`✓ Inserted adjustment category: ${category.name}`);
      }
    }
  }

  console.log('✅ Movement concepts seeding completed!');
}

seedMovementConcepts().catch(console.error);