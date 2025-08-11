#!/usr/bin/env python3

import json
import os
from pathlib import Path

def analyze_missing_files_and_discrepancy():
    """Investigate the 232-question discrepancy between user count (1148) and our count (916)."""
    
    print("="*80)
    print("INVESTIGATING THE 232-QUESTION DISCREPANCY")
    print("="*80)
    
    # Current counts
    print(f"User reported count: 1148")
    print(f"Our JSON file count: 916")
    print(f"Database count: 916")
    print(f"Missing: 232 questions")
    
    print(f"\n{'='*80}")
    print("ANALYSIS OF MISSING FILES")
    print("="*80)
    
    # Check what's missing in "From Board Review Notes"
    board_review_files = []
    general_files = []
    study_tool_files = []
    
    questions_dir = Path('/home/dr6117285/lmqb/data/questions')
    
    for json_file in questions_dir.glob('*.json'):
        if 'From Board Review Notes' in json_file.name:
            board_review_files.append(json_file.name)
        elif 'General -' in json_file.name:
            general_files.append(json_file.name)
        elif 'Study-Tool Based' in json_file.name:
            study_tool_files.append(json_file.name)
    
    # Expected chapters 1-10
    expected_chapters = list(range(1, 11))
    
    def extract_chapter_number(filename):
        """Extract chapter number from filename."""
        import re
        match = re.search(r'- (\d+)\.', filename)
        return int(match.group(1)) if match else None
    
    # Analyze Board Review Notes
    board_chapters = []
    for filename in board_review_files:
        chapter = extract_chapter_number(filename)
        if chapter:
            board_chapters.append(chapter)
    
    missing_board_chapters = [ch for ch in expected_chapters if ch not in board_chapters]
    
    print(f"Board Review Notes series:")
    print(f"  Present chapters: {sorted(board_chapters)}")
    print(f"  Missing chapters: {missing_board_chapters}")
    print(f"  Current count: 139 questions")
    
    # Analyze General series
    general_chapters = []
    for filename in general_files:
        chapter = extract_chapter_number(filename)
        if chapter:
            general_chapters.append(chapter)
    
    missing_general_chapters = [ch for ch in expected_chapters if ch not in general_chapters]
    
    print(f"\nGeneral series:")
    print(f"  Present chapters: {sorted(general_chapters)}")
    print(f"  Missing chapters: {missing_general_chapters}")
    print(f"  Current count: 497 questions")
    
    # Analyze Study-Tool Based series
    study_chapters = []
    for filename in study_tool_files:
        chapter = extract_chapter_number(filename)
        if chapter:
            study_chapters.append(chapter)
    
    missing_study_chapters = [ch for ch in expected_chapters if ch not in study_chapters]
    
    print(f"\nStudy-Tool Based series:")
    print(f"  Present chapters: {sorted(study_chapters)}")
    print(f"  Missing chapters: {missing_study_chapters}")
    print(f"  Current count: 280 questions")
    
    print(f"\n{'='*80}")
    print("ESTIMATION OF MISSING QUESTIONS")
    print("="*80)
    
    # Calculate average questions per chapter for each series
    if board_chapters:
        avg_board_questions = 139 / len(board_chapters)
        estimated_missing_board = avg_board_questions * len(missing_board_chapters)
        print(f"Board Review Notes:")
        print(f"  Average per chapter: {avg_board_questions:.1f}")
        print(f"  Estimated missing questions: {estimated_missing_board:.0f}")
    
    if general_chapters:
        avg_general_questions = 497 / len(general_chapters)
        estimated_missing_general = avg_general_questions * len(missing_general_chapters)
        print(f"\nGeneral series:")
        print(f"  Average per chapter: {avg_general_questions:.1f}")
        print(f"  Estimated missing questions: {estimated_missing_general:.0f}")
    
    if study_chapters:
        avg_study_questions = 280 / len(study_chapters)
        estimated_missing_study = avg_study_questions * len(missing_study_chapters)
        print(f"\nStudy-Tool Based series:")
        print(f"  Average per chapter: {avg_study_questions:.1f}")
        print(f"  Estimated missing questions: {estimated_missing_study:.0f}")
    
    total_estimated_missing = (
        (estimated_missing_board if board_chapters else 0) +
        (estimated_missing_general if general_chapters else 0) +
        (estimated_missing_study if study_chapters else 0)
    )
    
    print(f"\n{'='*80}")
    print("HYPOTHESIS TESTING")
    print("="*80)
    
    print(f"Total estimated missing from incomplete series: {total_estimated_missing:.0f}")
    print(f"Actual discrepancy: 232")
    print(f"Difference: {232 - total_estimated_missing:.0f}")
    
    if abs(232 - total_estimated_missing) < 50:
        print("\n✅ HYPOTHESIS CONFIRMED:")
        print("   The discrepancy is likely due to missing files in the series.")
    else:
        print("\n❓ HYPOTHESIS PARTIALLY CONFIRMED:")
        print("   Missing files explain part of the discrepancy.")
        print("   Additional investigation needed for remaining questions.")
    
    print(f"\n{'='*80}")
    print("POSSIBLE EXPLANATIONS FOR USER'S 1148 COUNT")
    print("="*80)
    
    explanations = [
        "1. User counted from a complete set of files (including missing chapters)",
        "2. User counted from a different source/backup that has all files",
        "3. User counted questions in the database before some were removed",
        "4. User counted from original source files before processing",
        "5. User's count includes variations/versions of the same questions",
        "6. User counted from a different directory or backup location"
    ]
    
    for explanation in explanations:
        print(f"   {explanation}")
    
    print(f"\n{'='*80}")
    print("RECOMMENDATIONS")
    print("="*80)
    
    recommendations = [
        "1. Ask user to specify WHERE they counted the 1148 questions",
        "2. Check if user has complete set of source files",
        "3. Verify if missing Board Review chapters 1 & 8 exist elsewhere",
        "4. Look for any original/source files that might contain all questions",
        "5. Check if user counted from database during a different state",
        "6. Consider if there are additional question variations not yet imported"
    ]
    
    for rec in recommendations:
        print(f"   {rec}")
    
    return {
        'missing_board_chapters': missing_board_chapters,
        'missing_general_chapters': missing_general_chapters, 
        'missing_study_chapters': missing_study_chapters,
        'estimated_missing': total_estimated_missing
    }

if __name__ == '__main__':
    result = analyze_missing_files_and_discrepancy()