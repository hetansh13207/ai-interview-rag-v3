import os
from uuid import uuid4

from dotenv import load_dotenv
from qdrant_client import QdrantClient, models


load_dotenv()

qdrant_url = os.getenv("QDRANT_URL")
qdrant_api_key = os.getenv("QDRANT_API_KEY")

if not qdrant_url:
    raise RuntimeError("QDRANT_URL is not configured.")

if not qdrant_api_key:
    raise RuntimeError("QDRANT_API_KEY is not configured.")


client = QdrantClient(
    url=qdrant_url,
    api_key=qdrant_api_key,
)


COLLECTION_NAME = "resume_chunks"


def ensure_resume_id_index() -> None:
    client.create_payload_index(
        collection_name=COLLECTION_NAME,
        field_name="resume_id",
        field_schema=models.PayloadSchemaType.KEYWORD,
    )


def ensure_collection(vector_size: int) -> None:
    collections = client.get_collections()

    exists = any(
        collection.name == COLLECTION_NAME
        for collection in collections.collections
    )

    if not exists:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(
                size=vector_size,
                distance=models.Distance.COSINE,
            ),
        )

    ensure_resume_id_index()


def insert_chunks(
    chunks,
    embeddings: list[list[float]],
    resume_id: str,
) -> None:
    if len(chunks) != len(embeddings):
        raise ValueError(
            "Number of chunks and embeddings must be the same."
        )

    if not embeddings:
        return

    ensure_collection(
        vector_size=len(embeddings[0])
    )

    points = []

    for chunk, embedding in zip(chunks, embeddings):
        points.append(
            models.PointStruct(
                id=str(uuid4()),
                vector=embedding,
                payload={
                    "resume_id": resume_id,
                    "chunk_id": chunk.chunk_id,
                    "text": chunk.text,
                },
            )
        )

    client.upsert(
        collection_name=COLLECTION_NAME,
        points=points,
    )


def search_chunks(
    query_embedding: list[float],
    resume_id: str,
    limit: int = 5,
) -> list[dict]:
    # Make absolutely sure the filter index exists
    # before performing the filtered vector search.
    ensure_resume_id_index()

    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding,
        query_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="resume_id",
                    match=models.MatchValue(
                        value=resume_id
                    ),
                )
            ]
        ),
        with_payload=True,
        limit=limit,
    ).points

    return [
        {
            "score": result.score,
            "chunk_id": result.payload.get("chunk_id"),
            "text": result.payload.get("text"),
        }
        for result in results
    ]