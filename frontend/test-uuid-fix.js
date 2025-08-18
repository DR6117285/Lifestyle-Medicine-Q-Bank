import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUuidFix() {
  try {
    console.log('🔍 Testing UUID fix for quiz session creation...\n');
    
    // Generate a proper UUID for the user
    const userId = randomUUID();
    console.log('🆔 Generated UUID:', userId);
    
    // Test creating a quiz session with proper UUID
    const sessionData = {
      user_id: userId,
      session_type: 'timed',
      section_id: null,
      total_questions: 150,
      time_limit: 240,
      score: 0
    };
    
    console.log('📝 Creating session with data:', sessionData);
    
    const { data, error } = await supabase
      .from('quiz_sessions')
      .insert(sessionData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Session creation failed:', error);
      return;
    }
    
    console.log('✅ Session created successfully:', data);
    
    // Now test fetching questions
    console.log('\n📚 Testing question fetch...');
    
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        section_id,
        question_text,
        correct_answer,
        question_options (
          id,
          question_id,
          option_key,
          option_text
        )
      `)
      .limit(5);
    
    if (questionsError) {
      console.error('❌ Questions fetch failed:', questionsError);
      return;
    }
    
    console.log(`✅ Questions fetched successfully: ${questions.length} questions`);
    console.log('First question:', {
      id: questions[0].id,
      text: questions[0].question_text.substring(0, 80) + '...',
      options: questions[0].question_options.length
    });
    
    console.log('\n🎉 UUID fix successful! The issue was user_id format.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUuidFix();