
import requests
import time
import subprocess
import os
import signal

def test_auth_endpoints():
    print("Starting backend server for testing...")
    # 启动后端进程
    process = subprocess.Popen(
        ["uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8001"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        preexec_fn=os.setsid
    )
    
    time.sleep(3)  # 等待服务器启动
    
    base_url = "http://127.0.0.1:8001/api"
    
    try:
        # 1. 测试 Signup 接口是否存在
        print(f"Testing POST {base_url}/auth/signup ...")
        signup_data = {
            "username": "testuser_unique",
            "email": "test@example.com",
            "password": "testpassword123"
        }
        response = requests.post(f"{base_url}/auth/signup", json=signup_data)
        print(f"Signup Response Status: {response.status_code}")
        print(f"Signup Response Body: {response.text}")
        
        # 2. 如果是 404，打印所有可用路由进行诊断
        if response.status_code == 404:
            print("\nERROR: 404 Not Found detected! Checking root...")
            root_res = requests.get("http://127.0.0.1:8001/")
            print(f"Root check: {root_res.status_code} - {root_res.text}")
            
    except Exception as e:
        print(f"Test failed with error: {e}")
    finally:
        print("Cleaning up...")
        os.killpg(os.getpgid(process.pid), signal.SIGTERM)

if __name__ == "__main__":
    test_auth_endpoints()
