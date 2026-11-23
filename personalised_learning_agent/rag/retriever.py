from functools import lru_cache
from typing import Optional

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

from config import CHROMA_DIR
from ingestion.build_vectorstore import EMBEDDING_MODEL


@lru_cache(maxsize=1)
def _get_store() -> Chroma:
    if not CHROMA_DIR.exists():
        raise FileNotFoundError(
            "The Chroma database does not exist. Run:\n"
            "python -m ingestion.build_vectorstore"
        )

    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL
    )

    return Chroma(
        persist_directory=str(CHROMA_DIR),
        embedding_function=embeddings,
        collection_name="campuspulse_data",
    )


def semantic_search(
    query: str,
    k: int = 5,
    student_id: Optional[str] = None,
):
    search_filter = None

    if student_id:
        search_filter = {
            "student_id": student_id.strip().upper()
        }

    store = _get_store()

    results = store.similarity_search(
        query,
        k=k,
        filter=search_filter,
    )

    return [
        (document.page_content, document.metadata)
        for document in results
    ]


def clear_retriever_cache() -> None:
    _get_store.cache_clear()