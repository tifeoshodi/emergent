#!/usr/bin/env python3
"""
Test script to verify the demo users are properly configured.
"""
import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient

async def test_users():
    """Test the demo users configuration"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.pmfusion
    
    try:
        # Check users
        users = await db.users.find().to_list(100)
        print(f"📊 Total users found: {len(users)}")
        print("\n👥 User Details:")
        for user in users:
            print(f"  • {user['name']} - {user['role']} ({user['discipline']})")
        
        # Check disciplines
        disciplines = await db.disciplines.find().to_list(100)
        print(f"\n🏗️ Total disciplines found: {len(disciplines)}")
        print("\n📋 Discipline Details:")
        for discipline in disciplines:
            members = discipline.get('members', [])
            print(f"  • {discipline['name']} - {len(members)} members")
            for member_id in members:
                user = await db.users.find_one({"id": member_id})
                if user:
                    print(f"    - {user['name']} ({user['role']})")
        
    except Exception as e:
        print(f"❌ Error testing users: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(test_users())