import psycopg2
from psycopg2.extras import RealDictCursor

# Database connection parameters
db_params = {
    'host': 'localhost',
    'database': 'invoice_hub',
    'user': 'postgres',
    'password': 'Sakthi@05',
    'port': '5432'
}

try:
    # Connect to the database
    conn = psycopg2.connect(**db_params)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    print("Connected to PostgreSQL database successfully!")
    
    # Check if users table exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
        );
    """)
    result = cursor.fetchone()
    table_exists = result['exists'] if result else False
    
    if table_exists:
        print("\nUsers table exists.")
        
        # Count users
        cursor.execute("SELECT COUNT(*) as count FROM users;")
        user_count = cursor.fetchone()['count']
        print(f"Total users in table: {user_count}")
        
        if user_count > 0:
            # Fetch all users
            cursor.execute("SELECT id, username, email, password, role, is_active, created_at FROM users;")
            users = cursor.fetchall()
            
            print("\nUsers in database:")
            for user in users:
                print(f"ID: {user['id']}")
                print(f"Username: {user['username']}")
                print(f"Email: {user['email']}")
                print(f"Password (first 20 chars): {user['password'][:20] if user['password'] else 'NULL'}")
                print(f"Role: {user['role']}")
                print(f"Active: {user['is_active']}")
                print(f"Created: {user['created_at']}")
                print("-" * 40)
        else:
            print("\nNo users found in the database.")
    else:
        print("\nUsers table does not exist.")
        
except psycopg2.Error as e:
    print(f"Database error: {e}")
except Exception as e:
    print(f"General error: {e}")
finally:
    if conn:
        cursor.close()
        conn.close()
        print("\nDatabase connection closed.")