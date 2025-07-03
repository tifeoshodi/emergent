#!/usr/bin/env python3
"""
PMFusion Demo Runner
Automatically sets up the Python path and runs the demo workflow script.

This script handles the PYTHONPATH configuration automatically so you don't
need to set environment variables manually.

Usage:
    python scripts/run_demo.py
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    """Run the demo workflow with proper Python path configuration"""
    
    # Check Python version
    if sys.version_info < (3, 6):
        print("❌ Error: Python 3.6 or higher is required")
        print(f"Current version: {sys.version}")
        return 1
    
    # Get the project root directory (parent of scripts directory)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent    
    # Convert to absolute path for reliability
    project_root_abs = project_root.resolve()
    
    print("🚀 PMFusion Demo Workflow Runner")
    print(f"📁 Project root: {project_root_abs}")
    print(f"🐍 Python executable: {sys.executable}")
    print("-" * 60)
    
    # Set up the environment with PYTHONPATH
    env = os.environ.copy()
    
    # Add project root to PYTHONPATH
    current_pythonpath = env.get('PYTHONPATH', '')
    if current_pythonpath:
        env['PYTHONPATH'] = f"{project_root_abs}{os.pathsep}{current_pythonpath}"
    else:
        env['PYTHONPATH'] = str(project_root_abs)
    
    print(f"🔧 PYTHONPATH set to: {env['PYTHONPATH']}")
    print("-" * 60)
    
    # Path to the demo script
    demo_script = script_dir / "demo_pmfusion_workflow.py"
    
    if not demo_script.exists():
        print(f"❌ Demo script not found: {demo_script}")
        return 1
    
    # Run the demo script with the configured environment
    try:
        print("▶️  Starting demo workflow...\n")
        result = subprocess.run(
            [sys.executable, str(demo_script)],
            env=env,
            cwd=project_root_abs
        )
        return result.returncode
    except KeyboardInterrupt:
        print("\n\n⏹️  Demo interrupted by user")
        return 130
    except Exception as e:
        print(f"\n❌ Error running demo: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    if exit_code == 0:
        print("\n✅ Demo completed successfully!")
    else:
        print(f"\n❌ Demo finished with exit code: {exit_code}")
    sys.exit(exit_code)