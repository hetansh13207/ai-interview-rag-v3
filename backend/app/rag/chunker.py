from dataclasses import dataclass


@dataclass
class ResumeChunk:
    chunk_id: int
    text: str


def chunk_text(
    text: str,
    chunk_size: int = 800,
    overlap: int = 120,
) -> list[ResumeChunk]:
    if not text.strip():
        return []

    words = text.split()

    chunks: list[ResumeChunk] = []

    start = 0
    chunk_id = 0

    while start < len(words):
        end = min(start + chunk_size, len(words))

        chunk_words = words[start:end]

        chunks.append(
            ResumeChunk(
                chunk_id=chunk_id,
                text=" ".join(chunk_words),
            )
        )

        chunk_id += 1

        if end == len(words):
            break

        start = end - overlap

    return chunks