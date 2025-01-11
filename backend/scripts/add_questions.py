import sqlite3
import os
from datetime import datetime

def add_questions():
    db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'poll.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # First, check if the tables exist and their structure
    cursor.execute("SELECT * FROM questions LIMIT 0")
    question_columns = [description[0] for description in cursor.description]
    print("Question columns:", question_columns)
    
    cursor.execute("SELECT * FROM choices LIMIT 0")
    choice_columns = [description[0] for description in cursor.description]
    print("Choice columns:", choice_columns)
    
    questions = [
        ("What's your favorite programming language?", [
            "Python",
            "JavaScript",
            "Go",
            "Java",
            "C++"
        ]),
        ("Which web framework do you prefer?", [
            "React",
            "Vue",
            "Angular",
            "Svelte",
            "Next.js"
        ]),
        ("What's your preferred database?", [
            "PostgreSQL",
            "MySQL",
            "MongoDB",
            "SQLite",
            "Redis"
        ])
    ]
    
    for question_text, choices in questions:
        try:
            now = datetime.utcnow()
            # Insert question
            cursor.execute('''
                INSERT INTO questions (text, created_at)
                VALUES (?, ?)
            ''', (question_text, now))
            
            question_id = cursor.lastrowid
            print(f"Created question with ID: {question_id}")
            
            # Insert choices for the question
            for choice_text in choices:
                cursor.execute('''
                    INSERT INTO choices (text, votes, question_id)
                    VALUES (?, ?, ?)
                ''', (choice_text, 0, question_id))
                choice_id = cursor.lastrowid
                print(f"Created choice with ID: {choice_id} for question {question_id}")
                
        except sqlite3.IntegrityError as e:
            print(f"Error adding question '{question_text}': {e}")
            conn.rollback()
            continue
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_questions() 