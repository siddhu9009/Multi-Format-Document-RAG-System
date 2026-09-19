from fastembed import TextEmbedding


MODEL_NAME = "BAAI/bge-small-en-v1.5"

embedding_model = TextEmbedding(
    model_name=MODEL_NAME
)


def create_embedding(text: str) -> list[float]:

    if not text or not text.strip():
        raise ValueError("Text cannot be empty")

    embeddings = list(
        embedding_model.embed([text])
    )

    return embeddings[0].tolist()


def create_embeddings(chunks: list[str]) -> list[list[float]]:

    if not chunks:
        return []

    embeddings = embedding_model.embed(chunks)

    return [
        embedding.tolist()
        for embedding in embeddings
    ]