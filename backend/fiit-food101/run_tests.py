#!/usr/bin/env python3
"""
Test runner for FIIT Food-101 API
"""
import subprocess
import sys
import os

def run_tests():
    """Run all tests with coverage"""
    print("🧪 Running FIIT Food-101 API Tests")
    print("=" * 50)
    
    # Change to the backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    # Install test dependencies
    print("📦 Installing test dependencies...")
    subprocess.run([
        sys.executable, "-m", "pip", "install", "-r", "requirements-test.txt"
    ], check=True)
    
    # Run tests with coverage
    print("\n🔍 Running tests with coverage...")
    result = subprocess.run([
        sys.executable, "-m", "pytest", 
        "tests/", 
        "-v", 
        "--cov=.", 
        "--cov-report=html", 
        "--cov-report=term-missing",
        "--tb=short"
    ])
    
    if result.returncode == 0:
        print("\n✅ All tests passed!")
        print("📊 Coverage report generated in htmlcov/index.html")
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
