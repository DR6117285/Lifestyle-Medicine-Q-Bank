#!/usr/bin/env python3

import json
import os
from pathlib import Path
import re

def deep_analyze_file_structure(filepath):
    """Perform deep analysis of JSON file structure to find all questions."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        results = {
            'file_type': None,
            'structure': None,
            'questions_count': 0,
            'questions_found': [],
            'nested_questions': 0,
            'errors': []
        }
        
        if isinstance(data, list):
            results['file_type'] = 'list'
            results['structure'] = f'Array with {len(data)} items'
            
            for i, item in enumerate(data):
                if isinstance(item, dict):
                    # Check if this looks like a question
                    if 'question_text' in item or 'question' in item or 'text' in item:
                        results['questions_found'].append({
                            'index': i,
                            'question_id': item.get('question_id', 'N/A'),
                            'question_text_preview': str(item.get('question_text', item.get('question', item.get('text', 'N/A'))))[:100] + '...',
                            'has_options': 'options' in item,
                            'has_correct_answer': 'correct_answer' in item or 'answer' in item,
                            'all_keys': list(item.keys())
                        })
                        results['questions_count'] += 1
                    
                    # Look for nested questions
                    for key, value in item.items():
                        if isinstance(value, list):
                            for sub_item in value:
                                if isinstance(sub_item, dict) and ('question_text' in sub_item or 'question' in sub_item):
                                    results['nested_questions'] += 1
        
        elif isinstance(data, dict):
            results['file_type'] = 'dict'
            results['structure'] = f'Object with keys: {list(data.keys())}'
            
            # Look for questions in various possible locations
            if 'questions' in data:
                if isinstance(data['questions'], list):
                    results['questions_count'] = len(data['questions'])
                    for i, q in enumerate(data['questions'][:3]):  # Sample first 3
                        if isinstance(q, dict):
                            results['questions_found'].append({
                                'index': i,
                                'question_id': q.get('question_id', 'N/A'),
                                'question_text_preview': str(q.get('question_text', q.get('question', q.get('text', 'N/A'))))[:100] + '...',
                                'has_options': 'options' in q,
                                'has_correct_answer': 'correct_answer' in q or 'answer' in q,
                                'all_keys': list(q.keys())
                            })
                else:
                    results['questions_count'] = 1
            elif 'question_text' in data or 'question' in data:
                results['questions_count'] = 1
                results['questions_found'].append({
                    'index': 0,
                    'question_id': data.get('question_id', 'N/A'),
                    'question_text_preview': str(data.get('question_text', data.get('question', 'N/A')))[:100] + '...',
                    'has_options': 'options' in data,
                    'has_correct_answer': 'correct_answer' in data or 'answer' in data,
                    'all_keys': list(data.keys())
                })
            else:
                # Look for any nested structures that might contain questions
                for key, value in data.items():
                    if isinstance(value, list):
                        for item in value[:3]:  # Sample first 3
                            if isinstance(item, dict) and ('question_text' in item or 'question' in item):
                                results['nested_questions'] += 1
                                results['questions_count'] += 1
        
        return results
        
    except Exception as e:
        return {
            'file_type': 'error',
            'structure': None,
            'questions_count': 0,
            'questions_found': [],
            'nested_questions': 0,
            'errors': [str(e)]
        }

def find_potential_question_sources():
    """Look for any other files that might contain questions."""
    root_dir = Path('/home/dr6117285/lmqb')
    potential_sources = []
    
    # Search for JSON files anywhere in the project
    for json_file in root_dir.rglob('*.json'):
        if 'node_modules' not in str(json_file):  # Skip node_modules
            potential_sources.append(json_file)
    
    # Also look for any files with 'question' in the name
    for file_path in root_dir.rglob('*question*'):
        if 'node_modules' not in str(file_path):
            potential_sources.append(file_path)
    
    return potential_sources

def comprehensive_analysis():
    """Perform comprehensive analysis of all question sources."""
    questions_dir = Path('/home/dr6117285/lmqb/data/questions')
    
    print("="*100)
    print("COMPREHENSIVE QUESTION ANALYSIS")
    print("="*100)
    
    total_questions = 0
    total_nested = 0
    file_details = []
    
    # Analyze all JSON files in the questions directory
    json_files = list(questions_dir.glob('*.json'))
    
    print(f"\nAnalyzing {len(json_files)} JSON files in data/questions/:")
    print("-"*100)
    
    for json_file in sorted(json_files):
        analysis = deep_analyze_file_structure(json_file)
        file_details.append((json_file.name, analysis))
        total_questions += analysis['questions_count']
        total_nested += analysis['nested_questions']
        
        status = "✓" if analysis['questions_count'] > 0 else "✗"
        print(f"{status} {json_file.name:<65} {analysis['questions_count']:>5} questions ({analysis['file_type']})")
        
        if analysis['errors']:
            print(f"    ERRORS: {', '.join(analysis['errors'])}")
        
        if analysis['nested_questions'] > 0:
            print(f"    Found {analysis['nested_questions']} nested questions")
    
    print("-"*100)
    print(f"TOTAL QUESTIONS IN MAIN DIRECTORY: {total_questions}")
    if total_nested > 0:
        print(f"TOTAL NESTED QUESTIONS: {total_nested}")
    print("-"*100)
    
    # Search for other potential question sources
    print("\nSearching for other potential question sources...")
    potential_sources = find_potential_question_sources()
    other_questions = 0
    
    for source in potential_sources:
        if source.parent.name != 'questions':  # Skip ones we already counted
            if source.suffix == '.json':
                try:
                    analysis = deep_analyze_file_structure(source)
                    if analysis['questions_count'] > 0:
                        other_questions += analysis['questions_count']
                        print(f"✓ {source.relative_to(Path('/home/dr6117285/lmqb')):<80} {analysis['questions_count']:>5} questions")
                except:
                    pass
    
    if other_questions == 0:
        print("No additional question sources found outside main directory.")
    else:
        print(f"TOTAL QUESTIONS FROM OTHER SOURCES: {other_questions}")
    
    # Detailed structure analysis of a few sample files
    print(f"\n{'='*100}")
    print("DETAILED STRUCTURE ANALYSIS (Sample Files)")
    print("="*100)
    
    sample_files = [
        'General - 5. Nutrition Science Assessment and Prescription Guidelines.json',  # Highest count
        'Study-Tool Based - 6. Physical Activity Science and Prescription.json',      # High count
        'From Board Review Notes -  - 2. Fundamentals of Health Behavior Change.json' # Board review
    ]
    
    for filename in sample_files:
        filepath = questions_dir / filename
        if filepath.exists():
            analysis = deep_analyze_file_structure(filepath)
            print(f"\n{filename}:")
            print(f"  File type: {analysis['file_type']}")
            print(f"  Structure: {analysis['structure']}")
            print(f"  Questions count: {analysis['questions_count']}")
            print(f"  Nested questions: {analysis['nested_questions']}")
            
            if analysis['questions_found']:
                print(f"  Sample questions:")
                for i, q in enumerate(analysis['questions_found'][:2]):
                    print(f"    {i+1}. ID: {q['question_id']}")
                    print(f"       Keys: {q['all_keys']}")
                    print(f"       Preview: {q['question_text_preview'][:50]}...")
    
    print(f"\n{'='*100}")
    print("SUMMARY")
    print("="*100)
    print(f"Questions in main directory: {total_questions}")
    print(f"Questions from other sources: {other_questions}")
    print(f"Total nested questions: {total_nested}")
    print(f"GRAND TOTAL: {total_questions + other_questions + total_nested}")
    print(f"User reported count: 1148")
    print(f"Discrepancy: {1148 - (total_questions + other_questions + total_nested)}")
    
    return file_details, total_questions, other_questions, total_nested

if __name__ == '__main__':
    comprehensive_analysis()