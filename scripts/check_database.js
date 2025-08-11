#!/usr/bin/env node

/**
 * Quick database check script to see current state
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
    console.error('❌ No Supabase key found in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log('🔍 Checking database connection and current state...');
    console.log(`📍 URL: ${supabaseUrl}`);
    
    try {
        // Check connection
        const { count: healthCheck, error: healthError } = await supabase
            .from('categories')
            .select('*', { count: 'exact' });
        
        if (healthError) {
            console.error('❌ Database connection failed:', healthError.message);
            return;
        }
        
        console.log('✅ Database connection successful');
        
        // Check categories
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('*');
        
        if (catError) {
            console.error('❌ Error fetching categories:', catError.message);
        } else {
            console.log(`📊 Categories in database: ${categories?.length || 0}`);
            if (categories && categories.length > 0) {
                categories.forEach(cat => {
                    console.log(`   - ${cat.name} (ID: ${cat.id})`);
                });
            }
        }
        
        // Check sections
        const { data: sections, error: sectError } = await supabase
            .from('sections')
            .select('*');
        
        if (sectError) {
            console.error('❌ Error fetching sections:', sectError.message);
        } else {
            console.log(`📊 Sections in database: ${sections?.length || 0}`);
        }
        
        // Check questions
        const { count: questionCount, error: qError } = await supabase
            .from('questions')
            .select('*', { count: 'exact' });
        
        if (qError) {
            console.error('❌ Error fetching questions:', qError.message);
        } else {
            console.log(`📊 Questions in database: ${questionCount || 0}`);
        }
        
        // Check question options
        const { count: optionCount, error: oError } = await supabase
            .from('question_options')
            .select('*', { count: 'exact' });
        
        if (oError) {
            console.error('❌ Error fetching question options:', oError.message);
        } else {
            console.log(`📊 Question options in database: ${optionCount || 0}`);
        }
        
        // Summary comparison
        console.log('\n📈 Summary:');
        console.log(`   JSON files contain: 916 questions total`);
        console.log(`   Database contains:  ${questionCount || 0} questions`);
        console.log(`   Difference:         ${916 - (questionCount || 0)} questions missing`);
        
        if ((questionCount || 0) < 916) {
            console.log('\n⚠️  Database has fewer questions than JSON files!');
            console.log('   This explains the discrepancy in the application.');
            console.log('   Need to run import script to load all questions.');
        }
        
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    }
}

checkDatabase();