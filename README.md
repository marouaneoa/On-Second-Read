# On Second Read

Two reviewers assess the same volunteer. One reads a cover sheet naming Sam as project lead. The other reads a diary describing how Sam reassigned volunteers when a driver missed a handoff. Which document would you use to assess leadership?

On Second Read is a playable casebook about how people use evidence in hiring decisions. Read two reviews, choose the passage that supports each judgment, then follow the links in an ontology to see how the reviewers reached their conclusions.

**[Play the hosted casebook](https://marouaneoa.github.io/On-Second-Read/)** · [Understand the graph](#understand-the-graph) · [Run the annotation studio](#annotation-studio)

## Play the casebook

Start with the library exercise on the landing page. Choose a phrase, follow it through the graph, and compare your interpretation with a worked answer. Then try one of the five fictional cases. Each is also readable on GitHub.

| Case | Question to investigate |
| --- | --- |
| [The missing credit](cases/missing-credit/README.md) | Which record shows what Sam actually did when the delivery went wrong? |
| [The moving goalpost](cases/moving-goalpost/README.md) | Did the panel ask Alex to deliver a service or to demonstrate management experience? |
| [Different words, same reasoning](cases/same-reasoning/README.md) | Do two differently worded reviews point to the same test? |
| [The night shift](cases/the-night-shift/README.md) | When does the record show that someone accepted responsibility for the faulty light? |
| [Whose words count?](cases/whose-words/README.md) | What does a visitor collecting a ticket tell us about Ravi’s instructions? |

For a hands-on investigation, [request one document](https://marouaneoa.github.io/On-Second-Read/#request-a-document) before judging the pantry case, or [repair the clinic’s rubric](https://marouaneoa.github.io/On-Second-Read/#repair-the-rubric) by removing a single graph relationship. Within each case, **Explore ontology** lets you follow the evidence. After making a prediction, use the **Evidence lab** to change a citation and compare query results.

You can [download the browser edition](https://github.com/marouaneoa/On-Second-Read/raw/refs/heads/main/docs/index.html) and play offline. Progress and saved reflections stay in your browser. The optional **LLM workbench** accepts a pasted model response or sends the dossier directly to your selected provider using your personal API key.

## Understand the graph

The important distinction in the clinic case is between a standard **the panel published** and one **a reviewer applied**. A judgment has its own identifier so you can ask which criterion it applies, which passage it cites, and where that passage came from.

![Two judgments applying the same leadership criterion and citing different passages](docs/trace.svg)

The [ontology](ontology/review.ttl) defines the vocabulary. Each dossier supplies [case-specific facts](cases/missing-credit/data.ttl). The [four SPARQL queries](queries/) trace sources, compare the evidence reviewers cite, and find judgments that use an unlisted criterion. Each fictional case provides a complete rubric. With a partial real-world record, a missing criterion would leave the question open. Establishing a reviewer’s intent would require further evidence.

## Reproduce a reveal

From the repository root, set up Python once and run the first case. These commands work in a Linux, WSL, or macOS shell.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python casebook.py missing-credit
```

To explore the same case in Protégé, export the vocabulary and individuals together. Open the resulting file and select **Individuals by class → Judgment → Judgment B** to inspect its criterion and source passage.

```bash
python -c "from casebook import ROOT, load; load(ROOT/'cases/missing-credit').serialize('missing-credit-view.ttl', format='turtle')"
```

## Annotation studio

The local studio lets you bring a dossier of your own, review proposed judgments, and export the accepted graph as Turtle. After [setting up Python](#reproduce-a-reveal), run `python studio.py` and open [the local studio](http://127.0.0.1:8765).

1. Choose *The moving goalpost* and click **Load authored annotations** for a first run without a key. To try your own case, edit the dossier JSON with a complete rubric, named reviews, and identified source passages.
2. Inspect each judgment alongside the reviewer’s exact wording and the cited passage. Correct a mismatched criterion, remove an unsupported link, or add a missing judgment.
3. Accept the reviewed set to run all four queries. In the clinic example, try changing Reviewer B’s criterion to `Delivery` and see which result disappears. Download any graph you want to keep before switching dossiers.

### Choose an LLM provider

Select a provider in the studio and click **Propose judgments** to generate suggestions. The model receives the dossier and OWL vocabulary. The reference answers are excluded. Model overrides and API keys for the **local studio and benchmark** are read from the server environment at startup.

| Provider | API key variable | Optional model override | Default model |
| --- | --- | --- | --- |
| Ollama (local) | None | `OSR_MODEL` | `qwen2.5:3b` |
| OpenAI | `OPENAI_API_KEY` | `OSR_OPENAI_MODEL` | `gpt-4o-mini` |
| OpenRouter | `OPENROUTER_API_KEY` | `OSR_OPENROUTER_MODEL` | `openai/gpt-4o-mini` |
| Google Gemini | `GEMINI_API_KEY` | `OSR_GEMINI_MODEL` | `gemini-3.8-flash` |

For local inference, install [Ollama](https://ollama.com/download), start its service, and run `ollama pull qwen2.5:3b`. For hosted inference, set the appropriate key before starting or restarting the studio. For example, in Bash:

```bash
read -rsp 'Gemini API key: ' GEMINI_API_KEY && echo
export GEMINI_API_KEY
python studio.py
```

Hosted requests use the selected provider account. When overriding a model, choose one that supports structured JSON output. Provider references: [Ollama](https://docs.ollama.com/capabilities/structured-outputs), [OpenAI](https://developers.openai.com/api/docs/guides/structured-outputs), [OpenRouter](https://openrouter.ai/docs/guides/features/structured-outputs), and [Gemini](https://ai.google.dev/gemini-api/docs/structured-output).

### Measure extraction quality

Run `python evaluate.py` for the baseline. To compare a model before human corrections, run `python evaluate.py --live --provider gemini > evaluation.json`. The other provider names are `ollama`, `openai`, and `openrouter`.

The baseline assigns every review the first rubric criterion and first passage. It matches **6 of 10** authored judgments. The report lists missing and extra judgments and gives micro precision, recall, and F1. Matching uses the exact reviewer, excerpt, criterion, and passage ID, so even a shorter accurate quotation can count as a miss. These five cases are a small debugging benchmark.

## Build the browser edition

After editing cases, queries, or browser source, run the relevant commands from the repository root.

| Task | Command |
| --- | --- |
| Refresh the Markdown reveals | `python casebook.py all --write` |
| Rebuild the offline game in `docs/index.html` | `python build_web.py` |
| Run the checks | `python -m unittest discover -s tests -v` |
| Preview at `http://localhost:8000` | `python -m http.server 8000 --directory docs` |

## License

The code, ontology, fictional case texts, and illustration are available under the [MIT License](LICENSE).
