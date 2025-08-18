const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuestionLoad() {
  try {
    console.log('🔍 Testing question loading functionality...\n');
    
    // 1. Test basic connection
    console.log('1. Testing basic database connection...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);
    
    if (catError) {
      console.error('❌ Database connection failed:', catError.message);
      return;
    }
    console.log('✅ Database connection successful');
    
    // 2. Count total questions
    console.log('\n2. Counting total questions...');
    const { count, error: countError } = await supabase
      .from('questions')
      .select('id', { count: 'exact' });
    
    if (countError) {
      console.error('❌ Failed to count questions:', countError.message);
      return;
    }
    
    console.log(`✅ Total questions in database: ${count}`);
    
    if (count === 0) {
      console.error('❌ No questions found in database!');
      console.log('\n🔧 Debugging steps:');
      console.log('   1. Check if questions were imported properly');
      console.log('   2. Run the import script: npm run import-questions');
      console.log('   3. Check the supabase/migrations folder for migration files');
      return;
    }
    
    // 3. Test fetching questions with proper joins
    console.log('\n3. Testing question fetch with options...');
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
      .limit(5);
    
    if (questionsError) {
      console.error('❌ Failed to fetch questions:', questionsError.message);
      return;
    }
    
    console.log(`✅ Successfully fetched ${questions.length} questions`);
    
    // 4. Check if questions have options
    console.log('\n4. Analyzing question structure...');
    let questionsWithOptions = 0;
    let questionsWithoutOptions = 0;
    
    questions.forEach((q, index) => {
      const hasOptions = q.question_options && q.question_options.length > 0;
      if (hasOptions) {
        questionsWithOptions++;
      } else {
        questionsWithoutOptions++;
      }
      
      if (index === 0) {
        console.log('\nSample question:', {
          id: q.id,
          text: q.question_text?.substring(0, 80) + '...',
          options_count: q.question_options?.length || 0,
          correct_answer: q.correct_answer
        });
      }
    });
    
    console.log(`✅ Questions with options: ${questionsWithOptions}`);
    console.log(`⚠️  Questions without options: ${questionsWithoutOptions}`);
    
    // 5. Test sections
    console.log('\n5. Testing sections...');
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('id, name, category_id')
      .limit(10);
    
    if (sectionsError) {
      console.error('❌ Failed to fetch sections:', sectionsError.message);
    } else {
      console.log(`✅ Found ${sections.length} sections`);
      sections.forEach(section => {
        console.log(`   - ${section.name} (ID: ${section.id})`);
      });
    }
    
    // 6. Simulate the exact QuizService call for timed exam
    console.log('\n6. Testing LMQB timed exam question fetch...');
    try {
      // This mimics the fetchWeightedExamQuestions logic
      const { count: totalQuestions } = await supabase
        .from('questions')
        .select('id', { count: 'exact' });
        
      if (totalQuestions === 0) {
        throw new Error('No questions available in the database');
      }
      
      console.log(`✅ LMQB exam simulation: ${totalQuestions} questions available`);
      
      // Test section weights lookup
      const { data: allSections } = await supabase
        .from('sections')
        .select('id, name');
        
      console.log(`✅ Found ${allSections.length} sections for weight matching`);
      
      // Check for key sections
      const sectionWeights = {
        "Introduction to Lifestyle Medicine": 4, 
        "Fundamentals of Health Behavior Change": 10,
        "Nutrition Science Assessment and Prescription Guidelines": 26
      };
      
      let foundSections = 0;
      Object.keys(sectionWeights).forEach(sectionName => {
        const found = allSections.find(s => s.name === sectionName);
        if (found) {
          foundSections++;
          console.log(`   ✅ Found: "${sectionName}"`);
        } else {
          console.log(`   ❌ Missing: "${sectionName}"`);
        }
      });
      
      if (foundSections === 0) {
        console.log('⚠️  No weighted sections found - will fall back to regular question fetch');
      }
      
    } catch (examError) {
      console.error('❌ LMQB exam simulation failed:', examError.message);
    }
    
    console.log('\n🎉 Question loading test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testQuestionLoad();