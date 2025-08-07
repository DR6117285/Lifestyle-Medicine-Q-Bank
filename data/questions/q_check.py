import json
import os
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def audit_json_files(directory):
    total_questions = 0
    questions_without_answers = 0
    questions_without_ids = 0
    unique_question_ids = set()
    
    for filename in os.listdir(directory):
        if filename.endswith('.json'):
            file_path = os.path.join(directory, filename)
            logger.info(f"Auditing file: {filename}")
            
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
                
                for question in data:
                    total_questions += 1
                    
                    if 'question_id' not in question:
                        questions_without_ids += 1
                        logger.warning(f"Question without ID in {filename}: {question.get('question_text', 'No question text')[:50]}...")
                    else:
                        if question['question_id'] in unique_question_ids:
                            logger.warning(f"Duplicate question ID {question['question_id']} in {filename}")
                        else:
                            unique_question_ids.add(question['question_id'])
                    
                    if 'correct_answer' not in question or not question['correct_answer']:
                        questions_without_answers += 1
                        logger.warning(f"Question without answer in {filename}: {question.get('question_text', 'No question text')[:50]}...")
    
    logger.info(f"Total questions across all files: {total_questions}")
    logger.info(f"Questions without answers: {questions_without_answers}")
    logger.info(f"Questions without IDs: {questions_without_ids}")
    logger.info(f"Unique question IDs: {len(unique_question_ids)}")

if __name__ == "__main__":
    audit_json_files(r'C:\Python Projects\qbank\data')