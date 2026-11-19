import unittest

from casebook import CASES, QUERIES, load, reveal, results
from rdflib import Namespace


class CasebookTests(unittest.TestCase):
    def test_answers_and_published_pages(self):
        # Handwritten answers in query order: trace, different evidence,
        # outside rubric, shared reasoning. Trace expectations identify the
        # reviewer, criterion, cited passage and document.
        expected = {
            "the-night-shift": (
                [("Reviewer A", "Safe handover", "p1", "Outgoing shift message"),
                 ("Reviewer B", "Safe handover", "p2", "Morning receipt")],
                [["jA", "jB"]], [], []),
            "whose-words": (
                [("Reviewer A", "Clear instructions", "p1", "Visitor trial"),
                 ("Reviewer B", "Technical-writing degree", "p1", "Visitor trial")],
                [], [["jB", "extra"]], []),
            "missing-credit": (
                [("Reviewer A", "Leadership", "p1", "Dossier cover"),
                 ("Reviewer B", "Leadership", "p2", "Project diary")],
                [["jA", "jB"]], [], []),
            "moving-goalpost": (
                [("Reviewer A", "Delivery", "p1", "Launch report"),
                 ("Reviewer B", "Prior management experience", "p1", "Launch report")],
                [], [["jB", "extra"]], []),
            "same-reasoning": (
                [("Reviewer A", "Verification", "p1", "Release notebook"),
                 ("Reviewer B", "Verification", "p1", "Release notebook")],
                [], [], [["jA", "jB"]]),
        }
        for case in CASES:
            with self.subTest(case=case.name):
                graph = load(case)
                trace, *comparisons = [results(graph, q)[1] for q in QUERIES]
                page = (case / "README.md").read_text()
                story = page.split("<!-- reveal -->")[0]
                for _, _, _, quote, _ in trace:
                    self.assertIn(quote, story)
                self.assertEqual([(r, c, p, d) for r, c, p, _, d in trace],
                                 expected[case.name][0])
                self.assertEqual(comparisons, list(expected[case.name][1:]))
                self.assertTrue(page.endswith(reveal(case)))

    def test_change_one_citation(self):
        graph = load(next(c for c in CASES if c.name == "missing-credit"))
        case = Namespace("https://example.org/on-second-read/missing-credit#")
        ontology = Namespace("https://example.org/on-second-read#")
        graph.set((case.jB, ontology.cites, case.p1))
        self.assertEqual(results(graph, QUERIES[1])[1], [])
        self.assertEqual(results(graph, QUERIES[3])[1], [["jA", "jB"]])
