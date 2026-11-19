"""Reproduce the evidence tables from one dossier at a time."""
import argparse
import json
from pathlib import Path

from rdflib import Graph, URIRef

ROOT = Path(__file__).resolve().parent
CASES = sorted((ROOT / "cases").iterdir())
QUERIES = sorted((ROOT / "queries").glob("*.rq"))


def load(case):
    graph = Graph().parse(ROOT / "ontology/review.ttl")
    return graph.parse(case / "data.ttl")


def value(term):
    if isinstance(term, URIRef):
        return str(term).rsplit("#", 1)[-1]
    return str(term)


def results(graph, query):
    answer = graph.query(query.read_text())
    return list(map(str, answer.vars)), [[value(x) for x in row] for row in answer]


def reveal(case):
    graph = load(case)
    parts = ["<details>", "<summary>Reveal the evidence</summary>"]
    guide = json.loads((case / "guide.json").read_text())
    parts.extend(["### How to read the evidence", guide["walk"]])
    for query in QUERIES:
        columns, rows = results(graph, query)
        parts.append(f"[{query.stem}](../../queries/{query.name})")
        if rows:
            table = [columns, ["---"] * len(columns), *rows]
            parts.append("\n".join("| " + " | ".join(row) + " |" for row in table))
        else:
            parts.append("No matching judgments.")
    parts.extend([(case / "question.txt").read_text().strip(), "</details>"])
    return "\n\n".join(parts) + "\n"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case", choices=[case.name for case in CASES] + ["all"])
    parser.add_argument("--write", action="store_true", help="refresh the case pages")
    args = parser.parse_args()
    for case in CASES:
        if args.case in ("all", case.name):
            content = reveal(case)
            if args.write:
                page = case / "README.md"
                intro, marker, _ = page.read_text().partition("<!-- reveal -->")
                if not marker:
                    raise ValueError(f"Missing reveal marker in {page}")
                page.write_text(intro + marker + "\n\n" + content)
            else:
                print(case.name, content, sep="\n")
