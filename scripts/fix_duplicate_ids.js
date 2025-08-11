#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixDuplicateIds() {
    try {
        console.log('🔧 Fixing duplicate question_ids in JSON files...');
        
        const questionsDir = path.join(__dirname, '../data/questions');
        const files = await fs.readdir(questionsDir);
        const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'q_check.py');
        
        // Track all question_ids across all files
        const usedIds = new Set();
        let nextId = 1;
        let totalFixed = 0;
        
        for (const file of jsonFiles.sort()) {
            console.log(`📄 Processing ${file}...`);
            
            const filePath = path.join(questionsDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const questions = JSON.parse(content);
            
            let fileChanged = false;
            let fixedInFile = 0;
            
            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                
                // If question doesn't have an ID or has a duplicate ID, assign a new one
                if (!question.question_id || usedIds.has(question.question_id)) {
                    // Find next available ID
                    while (usedIds.has(nextId.toString().padStart(5, '0'))) {
                        nextId++;
                    }
                    
                    const newId = nextId.toString().padStart(5, '0');
                    const oldId = question.question_id;
                    
                    console.log(`   🔄 Question ${i + 1}: ${oldId || 'NO_ID'} → ${newId}`);
                    
                    question.question_id = newId;
                    usedIds.add(newId);
                    nextId++;
                    
                    fileChanged = true;
                    fixedInFile++;
                } else {
                    usedIds.add(question.question_id);
                }
            }
            
            if (fileChanged) {
                // Write back to file
                await fs.writeFile(filePath, JSON.stringify(questions, null, 2) + '\n', 'utf-8');
                console.log(`   ✅ Fixed ${fixedInFile} questions in ${file}`);
                totalFixed += fixedInFile;
            } else {
                console.log(`   ✅ No duplicates found in ${file}`);
            }
        }
        
        console.log(`\n🎉 Completed! Fixed ${totalFixed} duplicate/missing question_ids`);
        console.log(`📊 Total unique question_ids now: ${usedIds.size}`);
        
        if (totalFixed > 0) {
            console.log('\n⚠️  Remember to re-run the import script to update the database:');
            console.log('   cd /home/dr6117285/lmqb/scripts && node import-questions.js --update-existing');
        }
        
    } catch (error) {
        console.error('❌ Error fixing duplicate IDs:', error);
    }
}

fixDuplicateIds();