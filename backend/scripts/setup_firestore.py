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
        },
        {
            'email': 'sarah.jones@example.com',
            'password': 'sarah123',
            'first_name': 'Sarah',
            'last_name': 'Jones',
            'is_active': True,
            'is_staff': False,
            'is_superuser': False,
            'position': 'Member',
            'phone_number': '+1234567893',
            'occupation': 'Teacher',
            'paid': True,
            'preferences': {'theme': 'light'}
        },
        {
            'email': 'michael.wong@example.com',
            'password': 'michael123',
            'first_name': 'Michael',
            'last_name': 'Wong',
            'is_active': True,
            'is_staff': True,
            'is_superuser': False,
            'position': 'Content Manager',
            'phone_number': '+1234567894',
            'occupation': 'Content Writer',
            'paid': True,
            'preferences': {'theme': 'dark'}
        },
        {
            'email': 'emma.brown@example.com',
            'password': 'emma123',
            'first_name': 'Emma',
            'last_name': 'Brown',
            'is_active': True,
            'is_staff': False,
            'is_superuser': False,
            'position': 'Member',
            'phone_number': '+1234567895',
            'occupation': 'Graphic Designer',
            'paid': False,
            'preferences': {'theme': 'light'}
        },
        {
            'email': 'david.miller@example.com',
            'password': 'david123',
            'first_name': 'David',
            'last_name': 'Miller',
            'is_active': True,
            'is_staff': True,
            'is_superuser': False,
            'position': 'Event Coordinator',
            'phone_number': '+1234567896',
            'occupation': 'Event Planner',
            'paid': True,
            'preferences': {'theme': 'dark'}
        },
        {
            'email': 'lisa.chen@example.com',
            'password': 'lisa123',
            'first_name': 'Lisa',
            'last_name': 'Chen',
            'is_active': True,
            'is_staff': False,
            'is_superuser': False,
            'position': 'Member',
            'phone_number': '+1234567897',
            'occupation': 'Marketing Specialist',
            'paid': True,
            'preferences': {'theme': 'light'}
        },
        {
            'email': 'james.wilson@example.com',
            'password': 'james123',
            'first_name': 'James',
            'last_name': 'Wilson',
            'is_active': True,
            'is_staff': False,
            'is_superuser': False,
            'position': 'Member',
            'phone_number': '+1234567898',
            'occupation': 'Accountant',
            'paid': False,
            'preferences': {'theme': 'dark'}
        },
        {
            'email': 'maria.rodriguez@example.com',
            'password': 'maria123',
            'first_name': 'Maria',
            'last_name': 'Rodriguez',
            'is_active': True,
            'is_staff': True,
            'is_superuser': False,
            'position': 'Community Manager',
            'phone_number': '+1234567899',
            'occupation': 'Community Coordinator',
            'paid': True,
            'preferences': {'theme': 'light'}
        },
        {
            'email': 'robert.kim@example.com',
            'password': 'robert123',
            'first_name': 'Robert',
            'last_name': 'Kim',
            'is_active': True,
            'is_staff': False,
            'is_superuser': False,
            'position': 'Member',
            'phone_number': '+1234567900',
            'occupation': 'Student',
            'paid': False,
            'preferences': {'theme': 'dark'}
        },
        {
            'email': 'jennifer.patel@example.com',
            'password': 'jennifer123',
            'first_name': 'Jennifer',
            'last_name': 'Patel',
            'is_active': True,
            'is_staff': False,
            'is_superuser': False,
            'position': 'Member',
            'phone_number': '+1234567901',
            'occupation': 'Researcher',
            'paid': True,
            'preferences': {'theme': 'light'}
        },
        {
            'email': 'william.taylor@example.com',
            'password': 'william123',
            'first_name': 'William',
            'last_name': 'Taylor',
            'is_active': True,
            'is_staff': True,
            'is_superuser': False,
            'position': 'Technical Support',
            'phone_number': '+1234567902',
            'occupation': 'IT Specialist',
            'paid': True,
            'preferences': {'theme': 'dark'}
        },
        {
            'email': 'patricia.garcia@example.com',
            'password': 'patricia123',
            'first_name': 'Patricia',
            'last_name': 'Garcia',
            'is_active': True,
            'is_staff': False,
            'is_superuser': False,
            'position': 'Member',
            'phone_number': '+1234567903',
            'occupation': 'Artist',
            'paid': False,
            'preferences': {'theme': 'light'}
        },
        {
            'email': 'thomas.nguyen@example.com',
            'password': 'thomas123',
            'first_name': 'Thomas',
            'last_name': 'Nguyen',
            'is_active': True,
            'is_staff': False,
            'is_superuser': False,
            'position': 'Member',
            'phone_number': '+1234567904',
            'occupation': 'Engineer',
            'paid': True,
            'preferences': {'theme': 'dark'}
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
            'is_vendor': False,
            'notes': 'Primary sponsor for annual gala'
        },
        {
            'full_name': 'Jane Smith',
            'email': 'jane.smith@example.com',
            'phone_number': '+1234567891',
            'website': 'https://www.janesmith.com',
            'is_sponsor': False,
            'is_vendor': True,
            'notes': 'Catering vendor for monthly events'
        },
        {
            'full_name': 'Bob Johnson',
            'email': 'bob.johnson@example.com',
            'phone_number': '+1234567892',
            'website': 'https://www.bobjohnson.com',
            'is_sponsor': True,
            'is_vendor': True,
            'notes': 'Both sponsor and vendor for tech equipment'
        },
        {
            'full_name': 'Sarah Williams',
            'email': 'sarah.w@example.com',
            'phone_number': '+1234567893',
            'website': 'https://www.sarahwilliams.com',
            'is_sponsor': True,
            'is_vendor': False,
            'notes': 'Major donor for education programs'
        },
        {
            'full_name': 'Michael Brown',
            'email': 'michael.b@example.com',
            'phone_number': '+1234567894',
            'website': 'https://www.michaelbrown.com',
            'is_sponsor': False,
            'is_vendor': True,
            'notes': 'Audio/Visual equipment provider'
        },
        {
            'full_name': 'Emily Davis',
            'email': 'emily.d@example.com',
            'phone_number': '+1234567895',
            'website': 'https://www.emilydavis.com',
            'is_sponsor': True,
            'is_vendor': False,
            'notes': 'Sponsors youth programs'
        },
        {
            'full_name': 'David Wilson',
            'email': 'david.w@example.com',
            'phone_number': '+1234567896',
            'website': 'https://www.davidwilson.com',
            'is_sponsor': False,
            'is_vendor': True,
            'notes': 'Printing services provider'
        },
        {
            'full_name': 'Lisa Anderson',
            'email': 'lisa.a@example.com',
            'phone_number': '+1234567897',
            'website': 'https://www.lisaanderson.com',
            'is_sponsor': True,
            'is_vendor': True,
            'notes': 'Provides venue space and sponsorship'
        },
        {
            'full_name': 'James Taylor',
            'email': 'james.t@example.com',
            'phone_number': '+1234567898',
            'website': 'https://www.jamestaylor.com',
            'is_sponsor': True,
            'is_vendor': False,
            'notes': 'Corporate sponsor'
        },
        {
            'full_name': 'Maria Garcia',
            'email': 'maria.g@example.com',
            'phone_number': '+1234567899',
            'website': 'https://www.mariagarcia.com',
            'is_sponsor': False,
            'is_vendor': True,
            'notes': 'Translation services provider'
        },
        {
            'full_name': 'Robert Martinez',
            'email': 'robert.m@example.com',
            'phone_number': '+1234567900',
            'website': 'https://www.robertmartinez.com',
            'is_sponsor': True,
            'is_vendor': False,
            'notes': 'Community outreach sponsor'
        },
        {
            'full_name': 'Jennifer Lee',
            'email': 'jennifer.l@example.com',
            'phone_number': '+1234567901',
            'website': 'https://www.jenniferlee.com',
            'is_sponsor': False,
            'is_vendor': True,
            'notes': 'Event planning services'
        },
        {
            'full_name': 'William Chen',
            'email': 'william.c@example.com',
            'phone_number': '+1234567902',
            'website': 'https://www.williamchen.com',
            'is_sponsor': True,
            'is_vendor': True,
            'notes': 'Technology sponsor and IT services'
        },
        {
            'full_name': 'Patricia Moore',
            'email': 'patricia.m@example.com',
            'phone_number': '+1234567903',
            'website': 'https://www.patriciamoore.com',
            'is_sponsor': True,
            'is_vendor': False,
            'notes': 'Arts program sponsor'
        },
        {
            'full_name': 'Thomas Wright',
            'email': 'thomas.w@example.com',
            'phone_number': '+1234567904',
            'website': 'https://www.thomaswright.com',
            'is_sponsor': False,
            'is_vendor': True,
            'notes': 'Security services provider'
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
