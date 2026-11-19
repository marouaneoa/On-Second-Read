import unittest
from unittest.mock import patch
import json
from io import BytesIO

from rdflib import Graph, RDF
from studio import OS, PROV, analyze, examples, extract
from evaluate import evaluate, first_link


class StudioTests(unittest.TestCase):
    def test_authored_cases_roundtrip(self):
        for case, pattern in zip(examples(), (1,2,3)):
            result = analyze(case,case["gold"],"Reviewed fixture")
            self.assertEqual([bool(f["rows"]) for f in result["findings"]],[True]+[i==pattern for i in (1,2,3)])
            graph=Graph().parse(data=result["turtle"],format="turtle")
            self.assertEqual(len(list(graph.subjects(RDF.type,OS.Judgment))),2)
            self.assertEqual(len(list(graph.triples((None,PROV.wasGeneratedBy,None)))),2)

    def test_ungrounded_wording(self):
        case=examples()[0]
        case["gold"][0]["wording"]="invented wording"
        with self.assertRaisesRegex(ValueError,"exact excerpt"):
            analyze(case,case["gold"],"test")

    def test_model_request_excludes_answers(self):
        case=examples()[0]
        reply=BytesIO(json.dumps({"message":{"content":json.dumps({"judgments":case["gold"]})}}).encode())
        with patch("studio.urlopen",return_value=reply) as endpoint:
            self.assertEqual(extract(case),case["gold"])
            request=json.loads(endpoint.call_args.args[0].data)
            self.assertNotIn("gold",json.loads(request["messages"][1]["content"]))
            self.assertIn("os:appliesCriterion",request["messages"][0]["content"])

    def test_baseline(self):
        self.assertAlmostEqual(evaluate(first_link)["micro_f1"],4/6)

    def test_hosted_extraction(self):
        case = examples()[0]
        reply = {"choices": [{"message": {"content": json.dumps({"judgments": case["gold"]})}}]}
        with patch.dict("os.environ", {"OPENAI_API_KEY":"test-only"}), patch(
            "studio.urlopen", return_value=BytesIO(json.dumps(reply).encode())
        ) as endpoint:
            self.assertEqual(extract(case, "openai"), case["gold"])
            request = endpoint.call_args.args[0]
            self.assertEqual(request.full_url, "https://api.openai.com/v1/chat/completions")
            self.assertEqual(request.get_header("Authorization"), "Bearer test-only")
            body = json.loads(request.data)
            self.assertTrue(body["response_format"]["json_schema"]["strict"])
            self.assertNotIn("gold", json.loads(body["messages"][1]["content"]))

    def test_missing_hosted_key(self):
        with patch.dict("os.environ", {"OPENAI_API_KEY":""}), patch("studio.urlopen") as endpoint:
            with self.assertRaisesRegex(ValueError, "OPENAI_API_KEY"):
                extract(examples()[0], "openai")
            endpoint.assert_not_called()
