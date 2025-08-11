#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findDuplicatesInDatabase() {
    try {
        console.log('🔍 Looking for duplicate questions in database...');
        
        // Get all questions from database
        const { data: dbQuestions, error } = await supabase
            .from('questions')
            .select('id, original_json, created_at')
            .order('created_at');
        
        if (error) {
            throw new Error(`Failed to fetch questions: ${error.message}`);
        }
        
        console.log(`📊 Found ${dbQuestions?.length || 0} questions in database`);
        
        // Group questions by question_id
        const questionMap = new Map();
        
        for (const dbQuestion of dbQuestions || []) {
            const questionId = dbQuestion.original_json?.question_id;
            
            if (questionId) {
                if (!questionMap.has(questionId)) {
                    questionMap.set(questionId, []);
                }
                questionMap.get(questionId).push(dbQuestion);
            } else {
                console.log(`⚠️  Question without ID: DB ID ${dbQuestion.id}`);
            }
        }
        
        // Find duplicates
        const duplicates = [];
        let totalDuplicateRecords = 0;
        
        for (const [questionId, records] of questionMap) {
            if (records.length > 1) {
                duplicates.push({ questionId, records });
                totalDuplicateRecords += records.length - 1; // Keep 1, delete the rest
                
                console.log(`\n❌ Duplicate question_id: ${questionId}`);
                records.forEach((record, index) => {
                    console.log(`   ${index === 0 ? '✅ KEEP' : '🗑️  DELETE'} DB ID: ${record.id}, Created: ${record.created_at}`);
                });
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`   Unique question_ids: ${questionMap.size}`);
        console.log(`   Duplicate question_ids: ${duplicates.length}`);
        console.log(`   Extra records to delete: ${totalDuplicateRecords}`);
        
        if (duplicates.length > 0) {
            console.log('\n🔄 Cleaning up duplicates...');
            
            const recordsToDelete = [];
            
            for (const { questionId, records } of duplicates) {
                // Keep the first (oldest) record, delete the rest
                for (let i = 1; i < records.length; i++) {
                    recordsToDelete.push(records[i].id);
                }
            }
            
            // Delete question options for duplicate records
            if (recordsToDelete.length > 0) {
                console.log(`🔄 Deleting options for ${recordsToDelete.length} duplicate questions...`);
                const { error: optionsError } = await supabase
                    .from('question_options')
                    .delete()
                    .in('question_id', recordsToDelete);
                
                if (optionsError) {
                    console.error('⚠️  Error deleting options:', optionsError.message);
                }
                
                console.log(`🔄 Deleting ${recordsToDelete.length} duplicate questions...`);
                const { error: questionsError } = await supabase
                    .from('questions')
                    .delete()
                    .in('id', recordsToDelete);
                
                if (questionsError) {
                    throw new Error(`Failed to delete duplicate questions: ${questionsError.message}`);
                }
                
                console.log(`✅ Deleted ${recordsToDelete.length} duplicate records`);
            }
            
            // Verify final count
            const { count: finalCount } = await supabase
                .from('questions')
                .select('*', { count: 'exact' });
            
            console.log(`\n🎉 Cleanup complete!`);
            console.log(`   Final question count: ${finalCount}`);
            console.log(`   Expected count: 916`);
            console.log(`   Match: ${finalCount === 916 ? '✅' : '❌'}`);
            
        } else {
            console.log('\n✅ No duplicates found in database');
        }
        
    } catch (error) {
        console.error('❌ Error finding duplicates:', error.message);
    }
}

findDuplicatesInDatabase();