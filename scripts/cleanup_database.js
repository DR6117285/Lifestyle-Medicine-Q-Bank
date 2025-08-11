#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDatabase() {
    try {
        console.log('🧹 Starting database cleanup...');
        
        // 1. Get all current question_ids from JSON files
        const questionsDir = path.join(__dirname, '../data/questions');
        const files = await fs.readdir(questionsDir);
        const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'q_check.py');
        
        const validQuestionIds = new Set();
        let totalJsonQuestions = 0;
        
        for (const file of jsonFiles) {
            const filePath = path.join(questionsDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const questions = JSON.parse(content);
            
            totalJsonQuestions += questions.length;
            
            for (const q of questions) {
                if (q.question_id) {
                    validQuestionIds.add(q.question_id);
                }
            }
        }
        
        console.log(`📊 Found ${totalJsonQuestions} questions in JSON files`);
        console.log(`📊 Found ${validQuestionIds.size} unique question_ids in JSON files`);
        
        // 2. Get all questions from database
        const { data: dbQuestions, error: fetchError } = await supabase
            .from('questions')
            .select('id, original_json');
        
        if (fetchError) {
            throw new Error(`Failed to fetch questions from database: ${fetchError.message}`);
        }
        
        console.log(`📊 Found ${dbQuestions?.length || 0} questions in database`);
        
        // 3. Find questions to delete (those not in current JSON files)
        const questionsToDelete = [];
        
        for (const dbQuestion of dbQuestions || []) {
            const originalJson = dbQuestion.original_json;
            const questionId = originalJson?.question_id;
            
            if (!questionId || !validQuestionIds.has(questionId)) {
                questionsToDelete.push(dbQuestion.id);
                console.log(`❌ Marking for deletion: DB ID ${dbQuestion.id}, question_id: ${questionId || 'NO_ID'}`);
            }
        }
        
        console.log(`\n🗑️  Found ${questionsToDelete.length} questions to delete from database`);
        
        if (questionsToDelete.length > 0) {
            // Delete question options first (foreign key constraint)
            console.log('🔄 Deleting question options...');
            const { error: optionsError } = await supabase
                .from('question_options')
                .delete()
                .in('question_id', questionsToDelete);
            
            if (optionsError) {
                throw new Error(`Failed to delete question options: ${optionsError.message}`);
            }
            
            // Delete questions
            console.log('🔄 Deleting questions...');
            const { error: questionsError } = await supabase
                .from('questions')
                .delete()
                .in('id', questionsToDelete);
            
            if (questionsError) {
                throw new Error(`Failed to delete questions: ${questionsError.message}`);
            }
            
            console.log(`✅ Deleted ${questionsToDelete.length} questions and their options`);
        }
        
        // 4. Verify final count
        const { count: finalCount, error: countError } = await supabase
            .from('questions')
            .select('*', { count: 'exact' });
        
        if (countError) {
            throw new Error(`Failed to get final count: ${countError.message}`);
        }
        
        console.log(`\n📈 Final Results:`);
        console.log(`   Questions in JSON files: ${totalJsonQuestions}`);
        console.log(`   Questions in database: ${finalCount || 0}`);
        console.log(`   Match: ${finalCount === totalJsonQuestions ? '✅' : '❌'}`);
        
        if (finalCount === totalJsonQuestions) {
            console.log('\n🎉 Database cleanup successful! Counts now match perfectly.');
        } else {
            console.log('\n⚠️  Counts still don\'t match. May need to re-run import script.');
        }
        
    } catch (error) {
        console.error('❌ Database cleanup failed:', error.message);
        throw error;
    }
}

cleanupDatabase();