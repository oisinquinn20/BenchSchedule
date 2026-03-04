import bcrypt
import globals

users = globals.db["users"]

username = "admin"
password = "admin123"  # change later

# check if user already exists
if users.find_one({"username": username}):
    print(f"User '{username}' already exists")
    exit()

# hash password
hashed_pw = bcrypt.hashpw(
    password.encode("utf-8"),
    bcrypt.gensalt()
).decode("utf-8")

# insert admin user
users.insert_one({
    "username": username,
    "password": hashed_pw,
    "admin": True
})

print(f"Admin user '{username}' created successfully")
