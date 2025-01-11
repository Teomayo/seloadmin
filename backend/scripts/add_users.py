import sqlite3
import os
import bcrypt
import yaml
from datetime import datetime

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def add_users():
    # Get the directory where the script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Path to the users.yaml file
    users_file = os.path.join(script_dir, 'users.yaml')
    
    # Check if users.yaml exists
    if not os.path.exists(users_file):
        print(f"Error: {users_file} not found.")
        print("Please copy users_template.yaml to users.yaml and update with real credentials.")
        return

    # Read users from yaml file
    with open(users_file, 'r') as f:
        config = yaml.safe_load(f)
        
    if not config or 'users' not in config:
        print("Error: No users defined in users.yaml")
        return

    # Connect to database
    db_path = os.path.join(script_dir, '..', '..', 'poll.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # First, check if the table exists and its structure
    cursor.execute("SELECT * FROM users LIMIT 0")
    columns = [description[0] for description in cursor.description]
    print("Available columns:", columns)
    
    # Add users from config
    for user in config['users']:
        hashed_password = hash_password(user['password'])
        now = datetime.utcnow()
        try:
            cursor.execute('''
                INSERT INTO users (username, email, password, first_name, last_name, 
                                 is_active, is_staff, is_superuser, date_joined, last_login)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user['username'], user['email'], hashed_password, user['first_name'], 
                 user['last_name'], user['is_active'], user['is_staff'], 
                 user['is_superuser'], now, now))
            print(f"Added user: {user['username']}")
        except sqlite3.IntegrityError as e:
            print(f"Skipping user {user['username']}: {e}")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_users() 