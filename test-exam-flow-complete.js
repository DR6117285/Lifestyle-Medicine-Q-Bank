import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test the complete exam flow end-to-end
async function testCompleteExamFlow() {
  try {
    console.log('🚀 TESTING COMPLETE EXAM FLOW');
    console.log('=============================\n');
    
    // Step 1: Generate UUID like the ExamInterface does
    const effectiveUserId = crypto.randomUUID();
    console.log('✅ Step 1: Generated anonymous user UUID:', effectiveUserId);
    
    // Step 2: Create quiz session
    console.log('\n🔄 Step 2: Creating quiz session...');
    const sessionData = {
      user_id: effectiveUserId,
      session_type: 'timed',
      section_id: null,
      total_questions: 150,
      time_limit: 240,
      score: 0,
      is_anonymous: true
    };
    
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .insert(sessionData)
      .select()
      .single();
    
    if (sessionError) {
      console.error('❌ Session creation failed:', sessionError);
      return false;
    }
    
    console.log('✅ Step 2: Quiz session created successfully');
    console.log('   Session ID:', session.id);
    console.log('   User ID:', session.user_id);
    console.log('   Is Anonymous:', session.is_anonymous);
    
    // Step 3: Fetch questions for weighted exam
    console.log('\n🔄 Step 3: Fetching exam questions...');
    
    // First check if we have questions
    const { count, error: countError } = await supabase
      .from('questions')
      .select('id', { count: 'exact' });
    
    if (countError || count === 0) {
      console.error('❌ No questions available:', countError?.message || 'Count is 0');
      return false;
    }
    
    console.log(`✅ Step 3a: Found ${count} questions in database`);
    
    // Fetch a sample of questions with their options
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        section_id,
        question_text,
        correct_answer,
        rationale,
        question_options (
          id,
          question_id,
          option_key,
          option_text
        )
      `)
      .limit(10);
    
    if (questionsError) {
      console.error('❌ Questions fetch failed:', questionsError);
      return false;
    }
    
    if (!questions || questions.length === 0) {
      console.error('❌ No questions returned despite count > 0');
      return false;
    }
    
    console.log(`✅ Step 3b: Successfully fetched ${questions.length} sample questions`);
    
    // Validate question structure
    const sampleQuestion = questions[0];
    const hasValidStructure = sampleQuestion.question_text && 
                             sampleQuestion.correct_answer && 
                             sampleQuestion.question_options && 
                             sampleQuestion.question_options.length > 0;
    
    if (!hasValidStructure) {
      console.error('❌ Question structure validation failed');
      console.log('Sample question:', sampleQuestion);
      return false;
    }
    
    console.log('✅ Step 3c: Question structure is valid');
    console.log('   Sample question ID:', sampleQuestion.id);
    console.log('   Question text length:', sampleQuestion.question_text.length);
    console.log('   Number of options:', sampleQuestion.question_options.length);
    console.log('   Correct answer:', sampleQuestion.correct_answer);
    
    // Step 4: Test saving a quiz attempt
    console.log('\n🔄 Step 4: Testing quiz attempt creation...');
    
    const attemptData = {
      session_id: session.id,
      question_id: sampleQuestion.id,
      selected_answer: sampleQuestion.correct_answer,
      is_correct: true,
      time_taken: 45
    };
    
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert(attemptData)
      .select()
      .single();
    
    if (attemptError) {
      console.error('❌ Quiz attempt creation failed:', attemptError);
      return false;
    }
    
    console.log('✅ Step 4: Quiz attempt created successfully');
    console.log('   Attempt ID:', attempt.id);
    console.log('   Is Correct:', attempt.is_correct);
    
    // Step 5: Test completing the session
    console.log('\n🔄 Step 5: Testing session completion...');
    
    const { data: completedSession, error: completionError } = await supabase
      .from('quiz_sessions')
      .update({
        completed_at: new Date().toISOString(),
        score: 1
      })
      .eq('id', session.id)
      .select()
      .single();
    
    if (completionError) {
      console.error('❌ Session completion failed:', completionError);
      return false;
    }
    
    console.log('✅ Step 5: Session completed successfully');
    console.log('   Completed at:', completedSession.completed_at);
    console.log('   Final score:', completedSession.score);
    
    console.log('\n🎉 SUCCESS! All exam flow steps completed successfully');
    console.log('====================================================');
    console.log('✅ Anonymous user UUID generation');
    console.log('✅ Quiz session creation with RLS policies');
    console.log('✅ Question fetching with proper joins');
    console.log('✅ Quiz attempt creation and tracking');
    console.log('✅ Session completion and scoring');
    console.log('\nThe exam interface should now work properly at http://localhost:3001/exam');
    
    return true;
    
  } catch (error) {
    console.error('❌ COMPLETE EXAM FLOW TEST FAILED:', error);
    return false;
  }
}

testCompleteExamFlow();