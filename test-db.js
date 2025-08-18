const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);
    
    if (catError) {
      console.error('❌ Categories error:', catError);
      return;
    }
    
    console.log('✅ Categories table accessible:', categories?.length || 0, 'records');
    
    // Test questions table
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id')
      .limit(10);
    
    if (qError) {
      console.error('❌ Questions error:', qError);
      return;
    }
    
    console.log('✅ Questions table accessible:', questions?.length || 0, 'records');
    
    // Test question with options
    const { data: questionWithOptions, error: qoError } = await supabase
      .from('questions')
      .select(`
        id,
        question_text,
        question_options (
          option_key,
          option_text
        )
      `)
      .limit(1)
      .single();
    
    if (qoError) {
      console.error('❌ Question with options error:', qoError);
      return;
    }
    
    console.log('✅ Question with options:', {
      id: questionWithOptions?.id,
      question: questionWithOptions?.question_text?.substring(0, 50) + '...',
      optionsCount: questionWithOptions?.question_options?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase();