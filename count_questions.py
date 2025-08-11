#!/usr/bin/env python3

import json
import os
from pathlib import Path

def count_questions_in_file(filepath):
    """Count questions in a single JSON file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if isinstance(data, list):
            return len(data)
        elif isinstance(data, dict):
            # If it's a dictionary, look for common keys that might contain questions
            if 'questions' in data:
                return len(data['questions']) if isinstance(data['questions'], list) else 1
            else:
                return 1
        else:
            return 0
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return 0

def analyze_question_files():
    """Analyze all question files in the data/questions directory."""
    questions_dir = Path('/home/dr6117285/lmqb/data/questions')
    
    if not questions_dir.exists():
        print("Questions directory does not exist!")
        return
    
    total_questions = 0
    file_counts = {}
    
    # Get all JSON files
    json_files = list(questions_dir.glob('*.json'))
    
    print(f"Found {len(json_files)} JSON files in questions directory:")
    print("=" * 80)
    
    for json_file in sorted(json_files):
        if json_file.name == 'q_check.py':  # Skip non-JSON files
            continue
            
        question_count = count_questions_in_file(json_file)
        file_counts[json_file.name] = question_count
        total_questions += question_count
        
        print(f"{json_file.name:<60} {question_count:>5} questions")
    
    print("=" * 80)
    print(f"{'TOTAL QUESTIONS ACROSS ALL FILES:':<60} {total_questions:>5}")
    print("=" * 80)
    
    # Analyze by file type/category
    categories = {}
    for filename, count in file_counts.items():
        if filename.startswith('General -'):
            category = 'General'
        elif filename.startswith('Study-Tool Based -'):
            category = 'Study-Tool Based'
        elif filename.startswith('From Board Review Notes -'):
            category = 'From Board Review Notes'
        else:
            category = 'Other'
        
        if category not in categories:
            categories[category] = {'files': 0, 'questions': 0}
        
        categories[category]['files'] += 1
        categories[category]['questions'] += count
    
    print("\nBreakdown by category:")
    print("-" * 50)
    for category, data in categories.items():
        print(f"{category:<25} {data['files']:>3} files, {data['questions']:>5} questions")
    
    return total_questions, file_counts, categories

if __name__ == '__main__':
    analyze_question_files()