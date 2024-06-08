import time
import uuid
import requests

# Update this with whatever the endpoint is for your API.
ENDPOINT = "http://localhost:8000"

SUBMIT_QUERY_ENDPOINT = f"{ENDPOINT}/submit_query"
GET_QUERY_ENDPOINT = f"{ENDPOINT}/get_query"
LIST_QUERY_ENDPOINT = f"{ENDPOINT}/list_query"

QUERY_WAIT_TIME_SEC = 15


def test_fail_on_large_query():
    query_text = "a" * 10000
    response = requests.post(
        SUBMIT_QUERY_ENDPOINT,
        json={"query_text": query_text},
        timeout=QUERY_WAIT_TIME_SEC,
    )
    assert response.status_code == 400


def test_can_submit_query():
    query_text = "How much does a website for a Salon cost?"
    response = requests.post(
        SUBMIT_QUERY_ENDPOINT,
        json={"query_text": query_text},
        timeout=QUERY_WAIT_TIME_SEC,
    )
    assert response.status_code == 200

    response_data = response.json()
    query_id = response_data["query_id"]
    print(f"Received Query ID: {query_id}")

    print(f"Waiting for {QUERY_WAIT_TIME_SEC} seconds for the query to be processed.")
    time.sleep(QUERY_WAIT_TIME_SEC)

    response = requests.get(
        GET_QUERY_ENDPOINT, params={"query_id": query_id}, timeout=10
    )
    assert response.status_code == 200
    data = response.json()
    print(f"Received response: {data}")

    assert data["query_text"] == query_text
    assert data["answer_text"] is not None
    assert data["is_complete"]


def test_list_items():
    user_id = uuid.uuid4().hex
    NUM_ITEMS = 3
    original_query_ids = []
    for i in range(NUM_ITEMS):
        query_id = add_query_for_user(user_id, f"Query {i}")
        original_query_ids.append(query_id)
        print(f"Added query {i} for user {user_id}: {query_id}")

    response = requests.get(
        LIST_QUERY_ENDPOINT,
        params={"user_id": user_id},
        timeout=QUERY_WAIT_TIME_SEC,
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == NUM_ITEMS

    received_query_ids = [item["query_id"] for item in data]
    print(f"Received query IDs: {received_query_ids}")

    # Should be in reverse order.
    assert received_query_ids == original_query_ids[::-1]


def add_query_for_user(user_id: str, query_text: str):
    response = requests.post(
        SUBMIT_QUERY_ENDPOINT,
        json={"query_text": query_text, "user_id": user_id},
        timeout=QUERY_WAIT_TIME_SEC,
    )
    assert response.status_code == 200
    return response.json()["query_id"]
