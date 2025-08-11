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

async function debugQuestions() {
    try {
        console.log('🔍 Debugging question discrepancy...');
        
        // Get all questions from database with their question_ids
        const { data: dbQuestions, error } = await supabase
            .from('questions')
            .select('id, original_json')
            .order('id');
        
        if (error) {
            console.error('Error fetching questions:', error);
            return;
        }
        
        console.log(`📊 Found ${dbQuestions?.length || 0} questions in database`);
        
        // Extract question_ids from database
        const dbQuestionIds = new Set();
        const questionsByFile = {};
        
        for (const q of dbQuestions || []) {
            const originalJson = q.original_json;
            if (originalJson && originalJson.question_id) {
                dbQuestionIds.add(originalJson.question_id);
                
                // Group by section for analysis
                const section = originalJson.section || 'Unknown';
                if (!questionsByFile[section]) {
                    questionsByFile[section] = [];
                }
                questionsByFile[section].push(originalJson.question_id);
            }
        }
        
        console.log(`📊 Unique question IDs in database: ${dbQuestionIds.size}`);
        
        // Read all JSON files and collect question_ids
        const questionsDir = path.join(__dirname, '../data/questions');
        const files = await fs.readdir(questionsDir);
        const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'q_check.py');
        
        const allFileQuestionIds = new Set();
        let totalFileQuestions = 0;
        
        for (const file of jsonFiles) {
            const filePath = path.join(questionsDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const questions = JSON.parse(content);
            
            console.log(`📄 ${file}: ${questions.length} questions`);
            totalFileQuestions += questions.length;
            
            for (const q of questions) {
                if (q.question_id) {
                    if (allFileQuestionIds.has(q.question_id)) {
                        console.log(`⚠️  Duplicate question_id found: ${q.question_id} in ${file}`);
                    }
                    allFileQuestionIds.add(q.question_id);
                }
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`   Total questions in JSON files: ${totalFileQuestions}`);
        console.log(`   Unique question_ids in JSON files: ${allFileQuestionIds.size}`);
        console.log(`   Questions in database: ${dbQuestions?.length || 0}`);
        console.log(`   Unique question_ids in database: ${dbQuestionIds.size}`);
        
        // Find missing question_ids
        const missingFromDb = [];
        for (const qid of allFileQuestionIds) {
            if (!dbQuestionIds.has(qid)) {
                missingFromDb.push(qid);
            }
        }
        
        if (missingFromDb.length > 0) {
            console.log(`\n❌ Missing question_ids from database:`);
            missingFromDb.forEach(qid => console.log(`   - ${qid}`));
        } else {
            console.log(`\n✅ All question_ids from JSON files are in database`);
        }
        
        // Check for questions without question_ids
        let questionsWithoutIds = 0;
        for (const file of jsonFiles) {
            const filePath = path.join(questionsDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const questions = JSON.parse(content);
            
            for (const q of questions) {
                if (!q.question_id) {
                    questionsWithoutIds++;
                    console.log(`⚠️  Question without ID in ${file}: "${q.question_text?.substring(0, 50)}..."`);
                }
            }
        }
        
        if (questionsWithoutIds > 0) {
            console.log(`\n⚠️  Found ${questionsWithoutIds} questions without question_id`);
            console.log(`   This could explain the discrepancy - questions without IDs might be skipped or duplicated`);
        }
        
    } catch (error) {
        console.error('Debug failed:', error);
    }
}

debugQuestions();