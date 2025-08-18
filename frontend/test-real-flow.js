// Test the exact flow that happens in the browser
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Exact copy of QuizService.fetchQuestions for timed exam
async function testFetchQuestions() {
  console.log('🎯 TESTING FETCHQUESTIONS FOR TIMED EXAM');
  console.log('========================================');
  
  const settings = {
    mode: 'timed',
    questionCount: 150,
    timeLimit: 240
  };
  
  try {
    console.log('Settings:', settings);
    
    // Step 1: Check if this is LMQB exam (150 questions + timed)
    if (settings.questionCount === 150 && settings.mode === 'timed') {
      console.log('✅ Detected LMQB exam - using weighted approach');
      return await fetchWeightedExamQuestions();
    } else {
      console.log('Using regular question fetch');
      return await fetchRegularQuestions(settings.questionCount);
    }
    
  } catch (error) {
    console.error('❌ fetchQuestions failed:', error.message);
    throw error;
  }
}

async function fetchWeightedExamQuestions() {
  console.log('\n🏋️ WEIGHTED EXAM QUESTIONS FETCH');
  console.log('===============================');
  
  try {
    // Check if we have any questions at all
    const { count, error: countError } = await supabase
      .from('questions')
      .select('id', { count: 'exact' });
    
    if (countError) {
      console.error('❌ Count error:', countError);
      throw countError;
    }
    
    console.log(`✅ Total questions in DB: ${count}`);
    
    if (count === 0) {
      throw new Error('No questions available in the database');
    }
    
    // Get all sections
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('sections')
      .select('id, name');
    
    if (sectionsError) throw sectionsError;
    
    const sections = sectionsData || [];
    console.log(`✅ Found ${sections.length} sections`);
    
    const SECTION_WEIGHTS = {
      "Introduction to Lifestyle Medicine": 4, 
      "Fundamentals of Health Behavior Change": 10,
      "Key Clinical Processes in Lifestyle Medicine": 8, 
      "The Role of The Practitioners Health and Community Advocacy": 4, 
      "Nutrition Science Assessment and Prescription Guidelines": 26, 
      "Physical Activity Science and Prescription": 14, 
      "Emotional and Mental Health Assessment and Interventions": 10, 
      "Sleep Health Science and Interventions": 8, 
      "Managing Tobacco Cessation and other Toxic Exposures": 8, 
      "The Role of Connectedness and Positive Psychology": 8
    };
    
    const allQuestions = [];
    
    // Test the new improved logic from the FullStackDeveloper
    for (const [sectionName, weight] of Object.entries(SECTION_WEIGHTS)) {
      console.log(`\n🔍 Processing "${sectionName}" (weight: ${weight})`);
      
      // Find ALL sections with this name (handling duplicates)
      const sectionsWithName = sections.filter(s => s.name === sectionName);
      console.log(`   Found ${sectionsWithName.length} sections with this name`);
      
      let sectionQuestions = [];
      
      // Collect questions from ALL sections with this name
      for (const section of sectionsWithName) {
        console.log(`   Checking section ID ${section.id}...`);
        
        const { data, error } = await supabase
          .from('questions')
          .select(`
            id,
            section_id,
            original_json,
            question_text,
            correct_answer,
            rationale,
            difficulty_level,
            tags,
            created_at,
            updated_at,
            question_options (
              id,
              question_id,
              option_key,
              option_text
            )
          `)
          .eq('section_id', section.id)
          .limit(weight + 10); // Get extra for randomization
        
        if (error) {
          console.error(`   ❌ Error fetching from section ${section.id}:`, error);
          continue;
        }
        
        if (data && data.length > 0) {
          console.log(`   ✅ Found ${data.length} questions in section ${section.id}`);
          
          // Transform to match Question interface
          const transformedQuestions = data.map(item => ({
            ...item,
            options: item.question_options || []
          }));
          
          sectionQuestions.push(...transformedQuestions);
        } else {
          console.log(`   ⚠️ No questions in section ${section.id}`);
        }
      }
      
      if (sectionQuestions.length === 0) {
        console.log(`   ❌ No questions found for "${sectionName}"`);
        continue;
      }
      
      // Randomize and select required amount
      const shuffled = sectionQuestions.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, weight);
      
      console.log(`   ✅ Selected ${selected.length}/${sectionQuestions.length} questions`);
      allQuestions.push(...selected);
    }
    
    console.log(`\n🎯 WEIGHTED RESULT: ${allQuestions.length} questions collected`);
    
    // Check if we got enough questions
    if (allQuestions.length < 100) {
      console.log(`⚠️ Only ${allQuestions.length} questions from weighted approach`);
      console.log('Trying fallback...');
      
      const additionalQuestions = await fetchRegularQuestions(150);
      
      // Remove duplicates
      const existingIds = new Set(allQuestions.map(q => q.id));
      const nonDuplicates = additionalQuestions.filter(q => !existingIds.has(q.id));
      
      allQuestions.push(...nonDuplicates);
      console.log(`✅ Added ${nonDuplicates.length} additional questions`);
    }
    
    // Final shuffle
    const finalQuestions = allQuestions.sort(() => Math.random() - 0.5);
    const result = finalQuestions.slice(0, 150);
    
    console.log(`\n🏁 FINAL RESULT: ${result.length} questions ready`);
    
    if (result.length > 0) {
      console.log('✅ QUESTIONS SHOULD LOAD!');
      console.log(`Sample: ${result[0].question_text.substring(0, 80)}...`);
      console.log(`Options: ${result[0].options?.length || 0}`);
    } else {
      console.log('❌ NO QUESTIONS AVAILABLE');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Weighted fetch failed:', error);
    console.log('Falling back to regular fetch...');
    return await fetchRegularQuestions(150);
  }
}

async function fetchRegularQuestions(count) {
  console.log(`\n📋 REGULAR QUESTIONS FETCH (${count} requested)`);
  console.log('=========================================');
  
  try {
    // Check total count first
    const { count: totalCount, error: countError } = await supabase
      .from('questions')
      .select('id', { count: 'exact' });
    
    if (countError) throw countError;
    
    console.log(`✅ Total questions available: ${totalCount}`);
    
    if (totalCount === 0) {
      throw new Error('The database contains no questions');
    }
    
    // Fetch questions
    const { data, error } = await supabase
      .from('questions')
      .select(`
        id,
        section_id,
        original_json,
        question_text,
        correct_answer,
        rationale,
        difficulty_level,
        tags,
        created_at,
        updated_at,
        question_options (
          id,
          question_id,
          option_key,
          option_text
        )
      `)
      .order('id', { ascending: false })
      .limit(Math.min(count * 2, totalCount));
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      throw new Error('Unable to retrieve questions from the database');
    }
    
    // Transform data
    const questions = data.map(item => ({
      ...item,
      options: item.question_options || []
    }));
    
    // Randomize and limit
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, questions.length));
    
    console.log(`✅ Regular fetch: ${selected.length} questions selected`);
    
    return selected;
    
  } catch (error) {
    console.error('❌ Regular fetch failed:', error);
    throw error;
  }
}

// Test the createQuizSession flow
async function testCreateQuizSession() {
  console.log('\n🆔 TESTING QUIZ SESSION CREATION');
  console.log('===============================');
  
  try {
    // Simulate user creation (like in ExamInterface)
    const userId = 'test-user-' + Date.now();
    
    const settings = {
      mode: 'timed',
      questionCount: 150,
      timeLimit: 240
    };
    
    console.log('User ID:', userId);
    console.log('Settings:', settings);
    
    // Test session creation with fixed session type
    const sessionType = settings.mode === 'custom' ? 'random' : settings.mode;
    console.log('Session type:', sessionType);
    
    const sessionData = {
      user_id: userId,
      session_type: sessionType,
      section_id: null,
      total_questions: settings.questionCount,
      time_limit: settings.timeLimit || null,
      score: 0
    };
    
    const { data, error } = await supabase
      .from('quiz_sessions')
      .insert(sessionData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Session creation failed:', error);
      throw error;
    }
    
    console.log('✅ Session created:', data.id);
    return data;
    
  } catch (error) {
    console.error('❌ Session test failed:', error);
    throw error;
  }
}

// Run the complete flow
async function runCompleteTest() {
  console.log('🚀 COMPLETE TIMED EXAM FLOW TEST');
  console.log('================================');
  
  try {
    // Test 1: Session creation
    const session = await testCreateQuizSession();
    
    // Test 2: Question fetching
    const questions = await testFetchQuestions();
    
    console.log('\n🎉 COMPLETE TEST RESULTS:');
    console.log(`Session ID: ${session.id}`);
    console.log(`Questions loaded: ${questions.length}`);
    console.log(`Expected: 150`);
    
    if (questions.length > 0) {
      console.log('✅ TIMED EXAM SHOULD WORK!');
    } else {
      console.log('❌ TIMED EXAM WILL FAIL');
    }
    
  } catch (error) {
    console.error('❌ Complete test failed:', error);
  }
}

runCompleteTest();