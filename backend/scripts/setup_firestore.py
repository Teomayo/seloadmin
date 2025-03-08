import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
from pathlib import Path
import argparse
from datetime import datetime

def init_firebase(use_emulator=False):
    """Initialize Firebase Admin SDK with option for emulator"""
    # Get the project root directory
    project_root = Path(__file__).parent.parent.parent
    print(project_root)
    # Construct the path to the service account file
    cred_path = os.path.join(project_root, "selo-service-account.json")
    
    if use_emulator:
        print("Setting up Firebase emulator...")
        # Clear any existing Firebase apps
        if firebase_admin._apps:
            firebase_admin.delete_app(firebase_admin.get_app())
            
        os.environ["FIRESTORE_EMULATOR_HOST"] = "127.0.0.1:8000"
        os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = "127.0.0.1:9099"
        print(f"FIRESTORE_EMULATOR_HOST: {os.environ.get('FIRESTORE_EMULATOR_HOST')}")
        print(f"FIREBASE_AUTH_EMULATOR_HOST: {os.environ.get('FIREBASE_AUTH_EMULATOR_HOST')}")
    else:
        print("Setting up Firebase production...")
        # Clear any existing Firebase apps and emulator settings
        if firebase_admin._apps:
            firebase_admin.delete_app(firebase_admin.get_app())
        
        # Clear emulator environment variables
        if "FIRESTORE_EMULATOR_HOST" in os.environ:
            del os.environ["FIRESTORE_EMULATOR_HOST"]
        if "FIREBASE_AUTH_EMULATOR_HOST" in os.environ:
            del os.environ["FIREBASE_AUTH_EMULATOR_HOST"]

    # Initialize Firebase
    cred = credentials.Certificate(cred_path)
    app = firebase_admin.initialize_app(cred)

    store = firestore.client()
    # check if app is initialized
    if not store:
        print("Failed to initialize Firebase")
        return None
    print(f"Firebase initialized in {'emulator' if use_emulator else 'production'} mode")
    
    return store

def create_test_users(db):
    """Create test users in both Firebase Auth and Firestore"""
    users = [
        {
            'email': 'admin@example.com',
            'password': 'admin123',
            'first_name': 'Admin',
            'last_name': 'User',
            'is_active': True,
            'is_staff': True,
            'is_superuser': True,
            'position': 'Administrator',
            'phone_number': '+1234567890',
            'occupation': 'System Administrator',
            'paid': True,
            'preferences': {
                'theme': 'dark',
                'widget_settings': {
                    'orthodox': True,
                    'questions': True,
                    'members': True
                }
            }
        },
        {
            'email': 'staff@example.com',
            'password': 'staff123',
            'first_name': 'Staff',
            'last_name': 'User',
            'is_active': True,
            'is_staff': True,
            'is_superuser': False,
            'position': 'Staff Member',
            'phone_number': '+1234567891',
            'occupation': 'Support Staff',
            'paid': True,
            'preferences': {
                'theme': 'light',
                'widget_settings': {
                    'orthodox': True,
                    'questions': True,
                    'members': False
                }
            }
        },
        {
            'email': 'user@example.com',
            'password': 'user123',
            'first_name': 'Regular',
            'last_name': 'User',
            'is_active': True,
            'is_staff': False,
            'is_superuser': False,
            'position': 'Member',
            'phone_number': '+1234567892',
            'occupation': 'Software Developer',
            'paid': False,
            'preferences': {
                'theme': 'light',
                'widget_settings': {
                    'orthodox': False,
                    'questions': True,
                    'members': True
                }
            }
        }
    ]

    print("\nCreating test users...")
    for user_data in users:
        try:
            # First, try to delete existing user if it exists
            try:
                existing_user = auth.get_user_by_email(user_data['email'])
                auth.delete_user(existing_user.uid)
                print(f"Deleted existing user: {user_data['email']}")
            except:
                pass

            # Create user in Firebase Auth
            auth_user = auth.create_user(
                email=user_data['email'],
                password=user_data['password'],
                display_name=f"{user_data['first_name']} {user_data['last_name']}",
                email_verified=True
            )

            # Prepare Firestore user document
            user_doc = {
                'uid': auth_user.uid,  # Copy of document ID
                'email': user_data['email'],
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name'],
                'is_active': user_data['is_active'],
                'is_staff': user_data['is_staff'],
                'is_superuser': user_data['is_superuser'],
                'position': user_data['position'],
                'phone_number': user_data['phone_number'],
                'occupation': user_data['occupation'],
                'paid': user_data['paid'],
                'preferences': user_data['preferences'],
                'date_joined': firestore.SERVER_TIMESTAMP,
                'last_login': firestore.SERVER_TIMESTAMP
            }

            # Store user in Firestore using UID as document ID
            db.collection('users').document(auth_user.uid).set(user_doc)
            print(f"Created user: {user_data['email']} with UID: {auth_user.uid}")
            
        except Exception as e:
            print(f"Error creating user {user_data['email']}: {e}")

def create_test_questions(db):
    """Create test questions in Firestore"""
    questions = [
        {
            'text': "What's your favorite programming language?",
            'choices': [
                {'text': 'Python', 'votes': 0},
                {'text': 'JavaScript', 'votes': 0},
                {'text': 'Go', 'votes': 0},
                {'text': 'Java', 'votes': 0},
                {'text': 'C++', 'votes': 0}
            ],
            'voted_users': [],
            'created_at': firestore.SERVER_TIMESTAMP
        },
        {
            'text': "Which web framework do you prefer?",
            'choices': [
                {'text': 'React', 'votes': 0},
                {'text': 'Vue', 'votes': 0},
                {'text': 'Angular', 'votes': 0},
                {'text': 'Svelte', 'votes': 0},
                {'text': 'Next.js', 'votes': 0}
            ],
            'voted_users': [],
            'created_at': firestore.SERVER_TIMESTAMP
        },
        {
            'text': "What's your preferred database?",
            'choices': [
                {'text': 'PostgreSQL', 'votes': 0},
                {'text': 'MySQL', 'votes': 0},
                {'text': 'MongoDB', 'votes': 0},
                {'text': 'SQLite', 'votes': 0},
                {'text': 'Redis', 'votes': 0}
            ],
            'voted_users': [],
            'created_at': firestore.SERVER_TIMESTAMP
        }
    ]

    print("\nCreating test questions...")
    for question_data in questions:
        try:
            # Add question to Firestore
            question_ref = db.collection('questions').document()
            question_ref.set(question_data)
            print(f"Created question: {question_data['text']}")
            
        except Exception as e:
            print(f"Error creating question '{question_data['text']}': {e}")

def create_test_contacts(db):
    """Create test contacts in Firestore"""
    contacts = [
        {
            'full_name': 'John Doe',
            'email': 'john.doe@example.com',
            'phone_number': '+1234567890',
            'website': 'https://www.johndoe.com',
            'is_sponsor': True,
            'is_vendor': False
        },
        {
            'full_name': 'Jane Smith',
            'email': 'jane.smith@example.com',
            'phone_number': '+1234567891',
            'website': 'https://www.janesmith.com',
            'is_sponsor': False,
            'is_vendor': True
        },
        {
            'full_name': 'Bob Johnson',
            'email': 'bob.johnson@example.com',
            'phone_number': '+1234567892',
            'website': 'https://www.bobjohnson.com',
            'is_sponsor': True,
            'is_vendor': True
        }
    ]

    print("\nCreating test contacts...")
    for contact_data in contacts:   
        try:
            # Add contact to Firestore
            contact_ref = db.collection('contacts').document()
            contact_ref.set(contact_data)
            print(f"Created contact: {contact_data['full_name']}")
            
        except Exception as e:
            print(f"Error creating contact '{contact_data['full_name']}': {e}")


def main():
    parser = argparse.ArgumentParser(description='Setup Firestore with test data')
    parser.add_argument('--emulator', action='store_true', 
                      help='Use Firebase emulator instead of production')
    args = parser.parse_args()

    try:
        # Initialize Firebase
        db = init_firebase(use_emulator=args.emulator)
        
        # Create test data
        create_test_users(db)
        create_test_questions(db)
        create_test_contacts(db)
        print("\nFirestore setup completed successfully!")
        
    except Exception as e:
        print(f"\nError during setup: {e}")
        raise e

if __name__ == "__main__":
    main()
