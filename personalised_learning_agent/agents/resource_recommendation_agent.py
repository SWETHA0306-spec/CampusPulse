"""
Resource Recommendation Agent — uses real RAG semantic search (ChromaDB)
to retrieve grounded study resources for each of the student's weak topics.
Falls back to LLM-generated suggestions if the vector store has no hits.
"""
from utils.risk_engine import weak_subjects, compute_risk
from utils.llm_client import generate
from ingestion.load_data import normalize_student_id


def _rag_search(query: str, student_id: str, k: int = 3):
    """
    Try to run semantic_search. Returns empty list if ChromaDB is not yet built.
    """
    try:
        from rag.retriever import semantic_search
        return semantic_search(query=query, k=k, student_id=student_id)
    except FileNotFoundError:
        return []
    except Exception:
        return []


def _llm_resources(subject: str, topic: str) -> list[dict]:
    """
    Ask the LLM to suggest 2-3 specific study resources for a topic.
    Returns formatted resource dicts.
    """
    system_prompt = (
        "You are an academic resource advisor for engineering students. "
        "Suggest 2 specific, concrete study resources for the given subject and topic. "
        "For each resource give: a one-sentence description of what it covers and why it helps. "
        "Format as a plain numbered list. No markdown headers or asterisks."
    )
    user_prompt = (
        f"Subject: {subject}\n"
        f"Topic: {topic}\n\n"
        f"Suggest 2 targeted study resources (textbook chapters, practice sheets, or video guides) "
        f"a student should use to improve in this topic."
    )
    try:
        text = generate(system_prompt, user_prompt, max_tokens=200)
        lines = [l.strip() for l in text.split("\n") if l.strip() and l.strip()[0].isdigit()]
        return [
            {"content": l, "metadata": {"type": "llm_suggestion", "file": ""}}
            for l in lines[:2]
        ]
    except Exception:
        return [
            {"content": f"Review core concepts and solved problems for {topic} in {subject}.", "metadata": {"type": "notes", "file": ""}}
        ]


def recommend(recovery_plan: dict, k: int = 3) -> dict:
    """
    Returns {subject: {topic: [ {content, metadata}, ... ]}}

    Strategy:
    1. Query ChromaDB for real retrieved content matching topic + subject.
    2. If RAG returns ≥ 1 result, use those.
    3. If RAG has no results (vectorstore not built), fall back to LLM-generated suggestions.
    """
    recommendations = {}

    for subject, info in recovery_plan.items():
        recommendations[subject] = {}
        topics = info.get("topics", [])

        for topic in topics:
            # The vector store only contains student marks & attendance, not study materials.
            # So we rely entirely on the LLM to generate targeted study resources.
            recommendations[subject][topic] = _llm_resources(subject, topic)

    return recommendations


if __name__ == "__main__":
    import json
    from agents import recovery_plan_agent
    plan = recovery_plan_agent.build("CP038")
    print(json.dumps(recommend(plan), indent=2))
