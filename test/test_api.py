import time
import requests

# Update this with whatever the endpoint is for your API.
ENDPOINT = "http://localhost:8000"

SUBMIT_QUERY_ENDPOINT = f"{ENDPOINT}/submit_query"
GET_QUERY_ENDPOINT = f"{ENDPOINT}/get_query"
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
