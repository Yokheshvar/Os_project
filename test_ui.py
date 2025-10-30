#!/usr/bin/env python3
"""
Test script to verify the Paging Simulator UI integration
"""

import requests
import json
import time

def test_api():
    """Test the API endpoint with sample data"""
    
    # Try different ports
    ports = [8000, 8001, 8002, 8003]
    url = None
    
    for port in ports:
        test_url = f"http://localhost:{port}/api/simulate"
        try:
            response = requests.get(f"http://localhost:{port}/", timeout=2)
            if response.status_code == 200:
                url = test_url
                print(f"✅ Found server running on port {port}")
                break
        except:
            continue
    
    if not url:
        print("❌ Could not find running server on ports 8000-8003")
        return False
    
    test_config = {
        "physicalMemSize": 4096,
        "logicalAddrSize": 12,
        "pageSize": 64,
        "processes": [
            {"codeSize": 32, "dataSize": 96},
            {"codeSize": 48, "dataSize": 64},
            {"codeSize": 24, "dataSize": 128}
        ]
    }
    
    try:
        print("🧪 Testing Paging Simulator API...")
        print(f"📤 Sending configuration: {json.dumps(test_config, indent=2)}")
        
        response = requests.post(url, json=test_config, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API test successful!")
            print(f"📥 Received response with {len(result['processes'])} processes")
            print(f"🔢 Total frames: {result['numFrames']}")
            print(f"💾 Internal fragmentation: {result['internalFragmentation']} bytes")
            
            # Display process summary
            for process in result['processes']:
                print(f"   Process {process['id']} (PID: {process['pid']}): "
                      f"{process['procSize']} bytes, {process['numPages']} pages")
            
            return True
        else:
            print(f"❌ API test failed with status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False

def main():
    print("🚀 Paging Simulator UI Test Suite")
    print("=" * 50)
    
    # Wait a moment for server to start
    time.sleep(2)
    
    success = test_api()
    
    print("=" * 50)
    if success:
        print("🎉 All tests passed! The UI is ready to use.")
        print("🌐 Open your browser and navigate to: http://localhost:8001")
    else:
        print("💥 Tests failed. Please check the server and try again.")
    
    return success

if __name__ == "__main__":
    main()
