"""
This script is used to remove a row from a database table.

Usage: python remove_row.py <table_name> <row_id>

Example: python remove_row.py users 1

Available tables:
- users
- questions
- choices

"""

import sqlite3
import sys
import os

def remove_row(table_name, row_id):
    try:
        db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'poll.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # First check if table exists
        cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cursor.fetchone():
            print(f"Error: Table '{table_name}' does not exist")
            return False
            
        # Check if ID exists
        cursor.execute(f"SELECT id FROM {table_name} WHERE id=?", (row_id,))
        if not cursor.fetchone():
            print(f"Error: No row with ID {row_id} found in table '{table_name}'")
            return False
            
        # Delete the row
        cursor.execute(f"DELETE FROM {table_name} WHERE id=?", (row_id,))
        conn.commit()
        print(f"Successfully removed row {row_id} from table '{table_name}'")
        return True
        
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return False
    finally:
        conn.close()

def print_usage():
    print("Usage: python remove_row.py <table_name> <row_id>")
    print("Example: python remove_row.py users 1")
    print("\nAvailable tables:")
    print("- users")
    print("- questions")
    print("- choices")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print_usage()
        sys.exit(1)
        
    table_name = sys.argv[1]
    try:
        row_id = int(sys.argv[2])
    except ValueError:
        print("Error: Row ID must be a number")
        print_usage()
        sys.exit(1)
        
    remove_row(table_name, row_id) 