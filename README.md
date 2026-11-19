# On Second Read

Two reviewers assess the same portfolio. One reads the cover credit. The other reads the team diary. Before you open their evidence table, can you tell which conclusion you would revisit?

**[Play The missing credit →](cases/missing-credit/README.md)**

| Next case | Your question |
| --- | --- |
| [The moving goalpost](cases/moving-goalpost/README.md) | Where did a new requirement enter the decision? |
| [Different words, same reasoning](cases/same-reasoning/README.md) | How much does the wording change the evidence trail? |

Read the dossier and both reviews, make a prediction, then expand the reveal. Every row comes from a query you can inspect. These original fictional cases explore consistency in hiring reviews. They support questions about the documented reasoning. Establishing a reviewer’s intent requires additional evidence.

## Inside the graph

A case lists criteria and has reviews. Each review contains a judgment. Giving the judgment its own identifier lets us attach the criterion and cited passage to that particular assessment, even when one review makes several claims. The passage carries the exact quotation and points to its source document.

![Annotated graph showing the shared criterion and two distinct citations in The missing credit](docs/trace.svg)

Explore the [OWL vocabulary in Turtle](ontology/review.ttl) and the [first case’s individuals](cases/missing-credit/data.ttl). In Protégé, open the vocabulary and browse **Entities → Classes** and **Object properties**. For a combined view, run the following after setup, open the resulting Turtle file in Protégé, and select **Individuals by class → Judgment**. Inspect the property assertions for judgment B.

```bash
python -c "from casebook import ROOT, load; load(ROOT/'cases/missing-credit').serialize('missing-credit-view.ttl', format='turtle')"
```

## Reproduce a reveal

From a checkout, create a Python environment and install RDFLib. The following commands use a Linux, WSL or macOS shell.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python casebook.py missing-credit
```

Run `python casebook.py all --write` to refresh the three Markdown reveals. Run `python -m unittest discover -s tests -v` to check the expected answers and try a citation change in memory.

## Reading the results

The [four SPARQL queries](queries/) trace sources, compare citations under a shared criterion, find judgments outside the rubric, and identify shared citations under different wording. The runner loads one case at a time. Each fictional rubric explicitly lists all its criteria. That completeness assumption lets the outside-rubric query use absence as evidence. In a partial record, a missing entry would leave the question open. Shared citations establish overlap in the recorded evidence. Two people can cite the same passage and interpret it differently.

For a reader check, pick a judgment and locate its exact quotation in the dossier. What could you conclude from the case, and what would you still need to know?

Code, ontology, case texts and illustration are available under the [MIT License](LICENSE).
