
### Python Script to Clear a Specific Cell in a SQLite Database

import sqlite3
import sys
import os

def clear_cell(table_name, row_id, column_name):
    try:
        # Define the path to your database
        db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'poll.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check if the table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cursor.fetchone():
            print(f"Error: Table '{table_name}' does not exist")
            return False

        # Check if the column exists
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [column[1] for column in cursor.fetchall()]
        if column_name not in columns:
            print(f"Error: Column '{column_name}' does not exist in table '{table_name}'")
            return False

        # Clear the specific cell
        cursor.execute(f"UPDATE {table_name} SET {column_name} = NULL WHERE id = ?", (row_id,))
        conn.commit()

        if cursor.rowcount == 0:
            print(f"Error: No row with ID {row_id} found in table '{table_name}'")
            return False

        print(f"Successfully cleared cell in column '{column_name}' for row ID {row_id} in table '{table_name}'")
        return True

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return False
    finally:
        conn.close()

def print_usage():
    print("Usage: python clear_cell.py <table_name> <row_id> <column_name>")
    print("Example: python clear_cell.py users 1 email")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print_usage()
        sys.exit(1)

    table_name = sys.argv[1]
    try:
        row_id = int(sys.argv[2])
    except ValueError:
        print("Error: Row ID must be a number")
        print_usage()
        sys.exit(1)

    column_name = sys.argv[3]

    clear_cell(table_name, row_id, column_name)
