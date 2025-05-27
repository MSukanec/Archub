import { supabase } from './client/src/lib/supabase.js';

async function checkSiteLogsSchema() {
  try {
    console.log('Checking site_logs table schema...');
    
    // Get table structure
    const { data, error } = await supabase
      .from('site_logs')
      .select('*')
      .limit(0);
    
    if (error) {
      console.error('Error checking schema:', error);
    } else {
      console.log('Table exists and is accessible');
    }
    
    // Try to get one record to see structure
    const { data: sample, error: sampleError } = await supabase
      .from('site_logs')
      .select('*')
      .limit(1);
      
    if (sampleError) {
      console.error('Error getting sample:', sampleError);
    } else {
      console.log('Sample record:', sample);
    }
    
  } catch (err) {
    console.error('General error:', err);
  }
}

checkSiteLogsSchema();