# Deploy RAG/AI App To AWS

## Getting Started

### Installing Requirements

```sh
pip install -r image/requirements.txt
```

### Generate the database

```sh
# Execute from image/ directory.
cd image
python populate_database.py --reset
```

### Running the app

```sh
# Execute from image/src directory
cd image/src
python rag_app/query_rag.py "how much does a landing page cost?"
```

Example output:

```text
Answer the question based on the above context: How much does a landing page cost to develop?

Response:  Based on the context provided, the cost for a landing page service offered by Galaxy Design Agency is $4,820. Specifically, under the "Our Services" section, it states "Landing Page for Small Businesses ($4,820)" when describing the landing page service. So the cost listed for a landing page is $4,820.
Sources: ['src/data/source/galaxy-design-client-guide.pdf:1:0', 'src/data/source/galaxy-design-client-guide.pdf:7:0', 'src/data/source/galaxy-design-client-guide.pdf:7:1']
```

### Starting FastAPI Server

```sh
# From image/src directory.
python app_api_handler.py
```

Then go to `http://0.0.0.0:8000/docs` to try it out.
