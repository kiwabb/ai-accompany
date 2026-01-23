# backend/tests/test_topics_api.py
import pytest


@pytest.mark.asyncio
async def test_topic_crud(async_client):
    """Test the full CRUD lifecycle of a topic via the API."""
    headers = {"Authorization": "Bearer test-user-123"}

    # 1. Create Topic
    topic_data = {
        "name": "Learning Rust",
        "description": "Mastering the Rust programming language.",
        "is_active": True,
    }
    response = await async_client.post("/api/topics", json=topic_data, headers=headers)
    assert response.status_code == 201
    created_topic = response.json()
    assert created_topic["name"] == "Learning Rust"
    assert created_topic["user_id"] == "test-user-123"
    topic_id = created_topic["id"]

    # 2. Get Topics List
    response = await async_client.get("/api/topics", headers=headers)
    assert response.status_code == 200
    topics = response.json()
    assert len(topics) >= 1
    assert any(t["id"] == topic_id for t in topics)

    # 3. Get Topic Detail
    response = await async_client.get(f"/api/topics/{topic_id}", headers=headers)
    assert response.status_code == 200
    topic = response.json()
    assert topic["name"] == "Learning Rust"

    # 4. Update Topic
    update_data = {
        "name": "Learning Rust Advanced",
        "description": "Deep dive into Rust.",
        "is_active": False,
    }
    response = await async_client.put(
        f"/api/topics/{topic_id}", json=update_data, headers=headers
    )
    assert response.status_code == 200
    updated_topic = response.json()
    assert updated_topic["name"] == "Learning Rust Advanced"
    assert updated_topic["is_active"] is False

    # 5. Delete Topic
    response = await async_client.delete(f"/api/topics/{topic_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Topic deleted"

    # 6. Verify Deletion
    response = await async_client.get(f"/api/topics/{topic_id}", headers=headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_unauthorized_topic_access(async_client):
    """Test that a user cannot access another user's topic."""
    user1_headers = {"Authorization": "Bearer test-user-1"}
    user2_headers = {"Authorization": "Bearer test-user-2"}

    # 1. User 1 creates a topic
    topic_data = {
        "name": "User 1 Topic",
        "description": "Secret topic",
        "is_active": True,
    }
    response = await async_client.post(
        "/api/topics", json=topic_data, headers=user1_headers
    )
    assert response.status_code == 201
    topic_id = response.json()["id"]

    # 2. User 2 tries to GET User 1's topic
    response = await async_client.get(f"/api/topics/{topic_id}", headers=user2_headers)
    assert response.status_code == 404

    # 3. User 2 tries to PUT User 1's topic
    update_data = {
        "name": "Hacked",
        "description": "Hacked",
        "is_active": False,
    }
    response = await async_client.put(
        f"/api/topics/{topic_id}", json=update_data, headers=user2_headers
    )
    assert response.status_code == 404

    # 4. User 2 tries to DELETE User 1's topic
    response = await async_client.delete(
        f"/api/topics/{topic_id}", headers=user2_headers
    )
    assert response.status_code == 404
