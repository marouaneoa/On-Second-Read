"""Evaluate exact judgment tuples before human edits on the three authored cases."""
import argparse
import json

from studio import FIELDS, MODEL, examples, extract


def score(gold, proposed):
    def keys(rows):
        return {tuple(row.get(k) for k in FIELDS) for row in rows}
    target, predicted = keys(gold), keys(proposed)
    return len(target & predicted), len(predicted-target), len(target-predicted)


def evaluate(predict):
    counts = [0, 0, 0]
    report = []
    for sample in examples():
        gold = sample.pop("gold")
        predicted = predict(sample)
        tp, fp, fn = score(gold, predicted)
        report.append(dict(case=sample["title"],matched=tp,extra=fp,missing=fn,proposed=predicted))
        counts = [a+b for a,b in zip(counts,(tp,fp,fn))]
    tp,fp,fn = counts
    return dict(cases=report, micro_precision=tp/(tp+fp) if tp+fp else 0,
                micro_recall=tp/(tp+fn), micro_f1=2*tp/(2*tp+fp+fn))


def first_link(d):
    return [dict(reviewer=name,wording=text,criterion=d["rubric"][0],passage=next(iter(d["passages"])))
            for name,text in d["reviews"].items()]


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--live",action="store_true",help="also evaluate the configured Ollama model")
    args=parser.parse_args()
    report={"first_link_baseline":evaluate(first_link)}
    if args.live:
        report[MODEL]=evaluate(extract)
    print(json.dumps(report,indent=2,ensure_ascii=False))
