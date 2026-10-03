from app.rag.chunker import chunk_text
from app.rag.embeddings import create_embedding
from app.rag.qdrant import insert_chunks, search_chunks


def ingest_resume(
    resume_text: str,
    resume_id: str,
) -> dict:
    chunks = chunk_text(resume_text)

    if not chunks:
        raise ValueError("No text available to ingest.")

    embeddings = [
        create_embedding(chunk.text)
        for chunk in chunks
    ]

    insert_chunks(
        chunks=chunks,
        embeddings=embeddings,
        resume_id=resume_id,
    )

    return {
        "resume_id": resume_id,
        "chunks_created": len(chunks),
    }


def retrieve_resume_context(
    query: str,
    resume_id: str,
    limit: int = 5,
) -> list[dict]:
    query_embedding = create_embedding(query)

    return search_chunks(
        query_embedding=query_embedding,
        resume_id=resume_id,
        limit=limit,
    )