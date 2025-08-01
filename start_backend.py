#!/usr/bin/env python3
"""
Start script for PMFusion backend with proper MongoDB setup.
"""

import subprocess
import sys
import time
import os
from pathlib import Path

def check_mongodb_running():
    """Check if MongoDB is running locally"""
    try:
        # Try to connect to MongoDB using pymongo
        from pymongo import MongoClient
        client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
        client.admin.command('ping')
        client.close()
        print("✅ MongoDB is running locally")
        return True
    except Exception as e:
        print(f"❌ MongoDB is not running locally: {e}")
        return False

def start_mongodb():
    """Start MongoDB if it's not running"""
    print("🔧 Attempting to start MongoDB...")
    
    # Common MongoDB service names and commands
    commands = [
        ["net", "start", "MongoDB"],  # Windows service
        ["brew", "services", "start", "mongodb-community"],  # macOS Homebrew
        ["sudo", "systemctl", "start", "mongod"],  # Linux systemd
        ["sudo", "service", "mongod", "start"],  # Linux init.d
    ]
    
    for cmd in commands:
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                print(f"✅ Started MongoDB using: {' '.join(cmd)}")
                time.sleep(3)  # Give MongoDB time to start
                if check_mongodb_running():
                    return True
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
            continue
    
    print("❌ Could not start MongoDB automatically")
    return False

def start_backend():
    """Start the FastAPI backend server"""
    print("🚀 Starting PMFusion backend server...")
    
    # Set environment variables for local development
    os.environ["MONGO_URL"] = "mongodb://localhost:27017"
    os.environ["DB_NAME"] = "pmfusion_local"
    os.environ["HOST"] = "0.0.0.0"
    os.environ["PORT"] = "8000"
    os.environ["RELOAD"] = "true"
    os.environ["LOG_LEVEL"] = "info"
    
    # Change to backend directory
    backend_dir = Path(__file__).parent / "backend"
    os.chdir(backend_dir)
    
    # Start the server
    try:
        subprocess.run([sys.executable, "server.py"], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")

def main():
    print("🔧 PMFusion Backend Startup")
    print("=" * 40)
    
    # Check if MongoDB is running
    if not check_mongodb_running():
        print("📋 MongoDB is not running. Attempting to start it...")
        if not start_mongodb():
            print("\n❌ MongoDB Setup Failed!")
            print("Please start MongoDB manually:")
            print("  Windows: net start MongoDB")
            print("  macOS: brew services start mongodb-community")
            print("  Linux: sudo systemctl start mongod")
            print("\nThen run this script again.")
            return 1
    
    # Start the backend server
    start_backend()
    return 0

if __name__ == "__main__":
    sys.exit(main())