
from fastapi.testclient import TestClient
from backend.main import app
import json

client = TestClient(app)

def test_routes():
    print("Listing all registered routes:")
    for route in app.routes:
        if hasattr(route, "path"):
            print(f"Path: {route.path}")

    print("\nTesting /api/auth/signup endpoint...")
    # 我们只测试它是否返回 404
    # 注意：因为没有真实的数据库连接，这里可能会报 500 或数据库错误，
    # 但只要不是 404，就说明路由是通的！
    try:
        response = client.post("/api/auth/signup", json={
            "username": "test",
            "email": "test@test.com",
            "password": "password"
        })
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
    except Exception as e:
        print(f"Request failed (expected if DB is down): {e}")

if __name__ == "__main__":
    test_routes()
