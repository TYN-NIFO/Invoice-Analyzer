import psycopg2

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
    cursor = conn.cursor()
    
    print("Connected to PostgreSQL database successfully!")
    
    # Enable pgcrypto extension
    cursor.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
    print("pgcrypto extension enabled.")
    
    # Update admin password
    cursor.execute("""
        UPDATE users 
        SET password = crypt('admin123', gen_salt('bf', 12)) 
        WHERE username = 'admin';
    """)
    print("Admin password hashed.")
    
    # Update reviewer password
    cursor.execute("""
        UPDATE users 
        SET password = crypt('reviewer123', gen_salt('bf', 12)) 
        WHERE username = 'reviewer';
    """)
    print("Reviewer password hashed.")
    
    # Commit changes
    conn.commit()
    
    # Verify hashes
    cursor.execute("SELECT username, password FROM users;")
    users = cursor.fetchall()
    
    print("\nUpdated passwords:")
    for user in users:
        username, password = user
        print(f"{username}: {password[:20]}...")
    
    print("\nPassword hashing completed successfully!")
    
except psycopg2.Error as e:
    print(f"Database error: {e}")
    if conn:
        conn.rollback()
except Exception as e:
    print(f"Error: {e}")
finally:
    if conn:
        cursor.close()
        conn.close()
        print("Database connection closed.")