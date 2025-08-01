#!/usr/bin/env python3
"""
Verify the demo user configuration in the backend code.
"""

import re

def verify_user_config():
    """Verify the demo users are properly configured in the backend"""
    
    print("🔍 Verifying Demo User Configuration...")
    print("=" * 50)
    
    # Read the backend server file
    try:
        with open('backend/server.py', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract demo_users section
        demo_users_match = re.search(r'demo_users = \[(.*?)\]', content, re.DOTALL)
        if not demo_users_match:
            print("❌ Could not find demo_users configuration")
            return
        
        demo_users_content = demo_users_match.group(1)
        
        # Count users
        user_count = demo_users_content.count('"name":')
        print(f"📊 Total configured users: {user_count}")
        
        # Extract specific user information
        users = []
        user_blocks = re.findall(r'\{(.*?)\}', demo_users_content, re.DOTALL)
        
        for block in user_blocks:
            name_match = re.search(r'"name":\s*"([^"]+)"', block)
            role_match = re.search(r'"role":\s*"([^"]+)"', block)
            discipline_match = re.search(r'"discipline":\s*"([^"]+)"', block)
            
            if name_match and role_match and discipline_match:
                users.append({
                    'name': name_match.group(1),
                    'role': role_match.group(1),
                    'discipline': discipline_match.group(1)
                })
        
        print("\n👥 Configured Users:")
        print("-" * 30)
        
        scheduler_found = False
        mechanical_team_leader = False
        mechanical_members = []
        
        for user in users:
            role_display = {
                'scheduler': 'Scheduler',
                'engineering_manager': 'Team Leader',
                'senior_engineer_1': 'Senior Engineer',
                'intermediate_engineer': 'Engineer'
            }.get(user['role'], user['role'])
            
            print(f"  • {user['name']}")
            print(f"    Role: {role_display}")
            print(f"    Discipline: {user['discipline']}")
            print()
            
            # Track specific requirements
            if user['role'] == 'scheduler':
                scheduler_found = True
            elif user['name'] == 'Rotimi Thompson' and user['role'] == 'engineering_manager':
                mechanical_team_leader = True
            elif user['discipline'] == 'Mechanical' and user['role'] in ['senior_engineer_1', 'intermediate_engineer']:
                mechanical_members.append(user['name'])
        
        # Verify requirements
        print("✅ Requirement Verification:")
        print("-" * 30)
        
        if scheduler_found:
            print("✅ Scheduler account configured")
        else:
            print("❌ Scheduler account missing")
        
        if mechanical_team_leader:
            print("✅ Rotimi Thompson - Mechanical Team Leader configured")
        else:
            print("❌ Rotimi Thompson - Mechanical Team Leader missing")
        
        if 'Fola' in mechanical_members:
            print("✅ Fola - Mechanical Team Member configured")
        else:
            print("❌ Fola - Mechanical Team Member missing")
        
        if 'Boluwatife' in mechanical_members:
            print("✅ Boluwatife - Mechanical Team Member configured")
        else:
            print("❌ Boluwatife - Mechanical Team Member missing")
        
        print(f"\n📋 Mechanical Team Size: {len([u for u in users if u['discipline'] == 'Mechanical'])}")
        
        # Check for cleanup logic
        if 'delete_many({})' in content:
            print("✅ User cleanup on startup configured")
        else:
            print("❌ User cleanup on startup not found")
        
        if 'disciplines.delete_many({})' in content:
            print("✅ Discipline cleanup on startup configured")
        else:
            print("❌ Discipline cleanup on startup not found")
        
    except FileNotFoundError:
        print("❌ Could not find backend/server.py file")
    except Exception as e:
        print(f"❌ Error reading configuration: {e}")

if __name__ == "__main__":
    verify_user_config()