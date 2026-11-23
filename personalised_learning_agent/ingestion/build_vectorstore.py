"""
Convert every row in the new CampusPulse CSV datasets into a
LangChain Document and store it in Chroma.

Run using:

    python -m ingestion.build_vectorstore
"""

import shutil
from typing import Iterable

import pandas as pd
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

from config import CHROMA_DIR
from ingestion.load_data import (
    load_attendance,
    load_faculty,
    load_hackathon_deadlines,
    load_hackathons,
    load_hod,
    load_marks,
    load_students,
    load_tasks,
)

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


def clean_value(value) -> str:
    if pd.isna(value):
        return "Not available"

    if isinstance(value, pd.Timestamp):
        return value.strftime("%Y-%m-%d")

    return str(value).strip()


def row_to_text(
    dataset_name: str,
    row: pd.Series,
) -> str:
    readable_fields = []

    for column, value in row.items():
        label = column.replace("_", " ").title()
        readable_fields.append(
            f"{label}: {clean_value(value)}"
        )

    return (
        f"Dataset: {dataset_name}\n"
        + "\n".join(readable_fields)
    )


def dataframe_to_documents(
    dataframe: pd.DataFrame,
    dataset_name: str,
) -> Iterable[Document]:
    for row_number, (_, row) in enumerate(
        dataframe.iterrows(),
        start=1,
    ):
        metadata = {
            "dataset": dataset_name,
            "row_number": row_number,
        }

        for identifier in [
            "student_id",
            "subject_code",
            "hackathon_id",
            "task_id",
            "department",
        ]:
            if identifier in row.index and pd.notna(row[identifier]):
                metadata[identifier] = str(row[identifier])

        yield Document(
            page_content=row_to_text(dataset_name, row),
            metadata=metadata,
        )


def build() -> None:
    datasets = {
        "students": load_students(),
        "marks": load_marks(),
        "attendance": load_attendance(),
        "hackathon_deadlines": load_hackathon_deadlines(),
        "faculty": load_faculty(),
        "hod": load_hod(),
        "hackathons": load_hackathons(),
        "tasks": load_tasks(),
    }

    documents = []

    for dataset_name, dataframe in datasets.items():
        dataset_documents = list(
            dataframe_to_documents(
                dataframe,
                dataset_name,
            )
        )

        documents.extend(dataset_documents)

        print(
            f"{dataset_name}: "
            f"{len(dataset_documents)} rows prepared"
        )

    if not documents:
        raise ValueError(
            "No documents were created from the CSV files."
        )

    # Remove the old Chroma database before inserting new data.
    if CHROMA_DIR.exists():
        shutil.rmtree(CHROMA_DIR)
        print(f"Removed old vector database: {CHROMA_DIR}")

    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL
    )

    Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory=str(CHROMA_DIR),
        collection_name="campuspulse_data",
    )

    print()
    print(
        f"Successfully indexed {len(documents)} rows "
        f"into {CHROMA_DIR}"
    )


if __name__ == "__main__":
    build()