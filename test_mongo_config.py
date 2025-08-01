#!/usr/bin/env python3
"""
Test script to verify MongoDB configuration is correctly set to localhost.
"""

import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

def test_mongodb_config():
    """Test MongoDB configuration"""
    
    print("🔧 Testing MongoDB Configuration")
    print("=" * 50)
    
    # Clear any existing MongoDB environment variables
    if "MONGO_URL" in os.environ:
        print(f"⚠️  Found existing MONGO_URL: {os.environ['MONGO_URL']}")
        del os.environ["MONGO_URL"]
    
    if "MONGODB_URI" in os.environ:
        print(f"⚠️  Found existing MONGODB_URI: {os.environ['MONGODB_URI']}")
        del os.environ["MONGODB_URI"]
    
    # Set local configuration
    os.environ["MONGO_URL"] = "mongodb://localhost:27017"
    print(f"✅ Set MONGO_URL to: {os.environ['MONGO_URL']}")
    
    # Test client creation
    try:
        client = AsyncIOMotorClient(
            "mongodb://localhost:27017",
            serverSelectionTimeoutMS=3000,
            connectTimeoutMS=3000,
            directConnection=True,
            host="localhost",
            port=27017,
        )
        print(f"✅ MongoDB client created successfully")
        print(f"✅ Client address: {client.address}")
        
        # Test basic connection
        async def test_connection():
            try:
                await client.admin.command("ping")
                print("✅ MongoDB connection successful!")
                return True
            except Exception as e:
                print(f"❌ MongoDB connection failed: {e}")
                if "cluster1" in str(e) or "mongodb.net" in str(e):
                    print("🚨 ERROR: Still trying to connect to remote cluster!")
                    print("🔧 This indicates a configuration issue that needs to be fixed.")
                else:
                    print("📋 MongoDB is not running locally. Please start MongoDB:")
                    print("   - Install: https://www.mongodb.com/try/download/community")
                    print("   - Start service: net start MongoDB")
                return False
            finally:
                client.close()
        
        # Run the connection test
        result = asyncio.run(test_connection())
        return result
        
    except Exception as e:
        print(f"❌ Failed to create MongoDB client: {e}")
        if "cluster1" in str(e) or "mongodb.net" in str(e):
            print("🚨 ERROR: Attempting to connect to remote cluster instead of localhost!")
        return False

if __name__ == "__main__":
    success = test_mongodb_config()
    if success:
        print("\n🎉 MongoDB configuration test PASSED")
        print("✅ Ready to start the backend server")
    else:
        print("\n⚠️  MongoDB configuration test FAILED")
        print("🔧 Please check MongoDB installation and configuration")
    
    sys.exit(0 if success else 1)