import os
import uvicorn
import boto3
import json

from fastapi import FastAPI, HTTPException
from mangum import Mangum
from pydantic import BaseModel
from query_model import QueryModel
from rag_app.query_rag import query_rag

WORKER_LAMBDA_NAME = os.environ.get("WORKER_LAMBDA_NAME", None)
CHARACTER_LIMIT = 2000

app = FastAPI()
handler = Mangum(app)  # Entry point for AWS Lambda.


class SubmitQueryRequest(BaseModel):
    query_text: str


@app.get("/")
def index():
    return {"Hello": "World"}


@app.get("/get_query")
def get_query_endpoint(query_id: str) -> QueryModel:
    query = QueryModel.get_item(query_id)
    if query:
        return query
    else:
        raise HTTPException(status_code=404, detail=f"Query Not Found: {query_id}")


@app.post("/submit_query")
def submit_query_endpoint(request: SubmitQueryRequest) -> QueryModel:

    # Check if the query is too long.
    if len(request.query_text) > CHARACTER_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"Query is too long. Max character limit is {CHARACTER_LIMIT}",
        )

    # Create the query item, and put it into the data-base.
    new_query = QueryModel(query_text=request.query_text)

    if WORKER_LAMBDA_NAME:
        # Make an async call to the worker (the RAG/AI app).
        new_query.put_item()
        invoke_worker(new_query)
    else:
        # Make a synchronous call to the worker (the RAG/AI app).
        query_response = query_rag(request.query_text)
        new_query.answer_text = query_response.response_text
        new_query.sources = query_response.sources
        new_query.is_complete = True
        new_query.put_item()

    return new_query


def invoke_worker(query: QueryModel):
    # Initialize the Lambda client
    lambda_client = boto3.client("lambda")

    # Get the QueryModel as a dictionary.
    payload = query.model_dump()

    # Invoke another Lambda function asynchronously
    response = lambda_client.invoke(
        FunctionName=WORKER_LAMBDA_NAME,
        InvocationType="Event",
        Payload=json.dumps(payload),
    )

    print(f"✅ Worker Lambda invoked: {response}")


if __name__ == "__main__":
    # Run this as a server directly.
    port = 8000
    print(f"Running the FastAPI server on port {port}.")
    uvicorn.run("app_api_handler:app", host="0.0.0.0", port=port)
