from langchain_aws import BedrockEmbeddings


def get_embedding_function():
    embeddings = BedrockEmbeddings()
    return embeddings
