import sqlite3
import os

def view_users():
    db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'poll.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id, username, email, password FROM users")
        users = cursor.fetchall()
        
        print("\nUsers in database:")
        print("ID | Username | Email | Password Hash")
        print("-" * 80)
        for user in users:
            print(f"{user[0]} | {user[1]} | {user[2]} | {user[3][:30]}...")
            
    except sqlite3.Error as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    view_users() 