"""Compile a portable browser investigation from the case RDF and SPARQL."""
import json
from rdflib import Literal, Namespace, RDF, RDFS

from casebook import CASES, QUERIES, ROOT, load, results, value

OS = Namespace("https://example.org/on-second-read#")


def compile_case(folder):
    graph = load(folder)
    ns = Namespace(f"https://example.org/on-second-read/{folder.name}#")
    def label(node):
        return str(graph.value(node, RDFS.label))
    def field(node, pred):
        return str(graph.value(node, pred))

    original = [results(graph, q)[1] for q in QUERIES]
    matches = [i for i in range(1, 4) if original[i]]
    if len(matches) != 1:
        raise ValueError(f"{folder.name} needs one primary puzzle answer")
    passages = sorted(graph.subjects(RDF.type, OS.Passage))
    actual = list(passages)
    if len(passages) == 1:
        graph.add((ns.practicePassage, OS.quote, Literal("The candidate submitted the work on schedule.")))
        graph.add((ns.practicePassage, OS.partOf, ns.practiceDocument))
        graph.add((ns.practiceDocument, RDFS.label, Literal("Hypothetical submission receipt")))
        passages.append(ns.practicePassage)
    criteria = sorted(graph.subjects(RDF.type, OS.Criterion))
    if len(criteria) == 1:
        criteria.append(ns.extra)
        graph.add((ns.extra, RDFS.label, Literal("Prior management experience")))
    base = [value(graph.value(ns.jB, p)) for p in (OS.cites, OS.appliesCriterion)]
    variants = {}
    for passage in passages:
        for criterion in criteria:
            graph.set((ns.jB, OS.cites, passage))
            graph.set((ns.jB, OS.appliesCriterion, criterion))
            variants[f"{value(passage)}|{value(criterion)}"] = [results(graph, q)[1] for q in QUERIES]
    return dict(guide=json.loads((folder/"guide.json").read_text()), id=folder.name, title=label(ns.case), rubric=label(ns.criterion),
                reviews=[field(j, OS.wording) for j in (ns.jA, ns.jB)],
                passages={value(p):dict(source=label(graph.value(p, OS.partOf)), text=field(p, OS.quote), original=p in actual) for p in passages},
                criteria={value(c):label(c) for c in criteria}, base=base, answer=matches[0],
                variants=variants, question=(folder/'question.txt').read_text().strip(),
                turtle=(folder/'data.ttl').read_text())


def build():
    web = ROOT / 'web'
    data = dict(cases=[compile_case(c) for c in CASES], queries=[q.read_text() for q in QUERIES])
    template = (web/'template.html').read_text()
    html = template.replace('/* STYLE */', (web/'style.css').read_text()).replace('/* APP */', (web/'app.js').read_text()).replace('/* DATA */', json.dumps(data).replace('<',r'\u003c'))
    (ROOT/'docs/index.html').write_text(html)


if __name__ == '__main__':
    build()
