# Different words, same reasoning

Noor maintains software for a library. Returning the same book twice used to remove a second, unrelated loan from the reader’s account. Noor submitted a fix. Two reviewers on a hiring panel read the release notebook to decide whether Noor checked the change carefully enough. One reviewer writes like a developer and the other writes for library staff.

## What the panel agreed to assess

Verification means recreating the original failure and recording what happens after the repair. In this case a replay means repeating the same sequence of actions with a test account.

## Read the file

**p1 · Release notebook**

I made a test account with two books on loan. On the old version I returned the first book twice. Both loans disappeared. I repeated those exact steps with the fix installed. The second book stayed on the account. I saved the steps as a regression test, a check we can run again after future changes.

## Listen to the reviewers

**Reviewer A · cites p1**

The recorded replay verifies the fix. Noor first reproduced the loss of the second loan and then showed that the regression test passed on the repaired version. I can follow the sequence in the notebook.

**Reviewer B · cites p1**

I wanted to know whether the other book would still be there after a mistaken second return. Noor tried that very mistake before and after the repair and wrote down both results. That answers my verification question.

Before opening the answer, name the standard each reviewer used and point to the words each one relied on.

<!-- reveal -->

<details>

<summary>Reveal the evidence</summary>

### How to read the evidence

Translate “regression test” into the library scene: try the mistaken return again and check the other book. That is exactly the check the second reviewer describes. Both judgments point to the same notebook entry and the same verification requirement. You can establish that overlap even though the reviewers use different words. Their overall hiring recommendations remain unknown.

[01-trace](../../queries/01-trace.rq)

| reviewer | criterion | passage | quote | source |
| --- | --- | --- | --- | --- |
| Reviewer A | Verification | p1 | I made a test account with two books on loan. On the old version I returned the first book twice. Both loans disappeared. I repeated those exact steps with the fix installed. The second book stayed on the account. I saved the steps as a regression test, a check we can run again after future changes. | Release notebook |
| Reviewer B | Verification | p1 | I made a test account with two books on loan. On the old version I returned the first book twice. Both loans disappeared. I repeated those exact steps with the fix installed. The second book stayed on the account. I saved the steps as a regression test, a check we can run again after future changes. | Release notebook |

[02-different-evidence](../../queries/02-different-evidence.rq)

No matching judgments.

[03-outside-rubric](../../queries/03-outside-rubric.rq)

No matching judgments.

[04-shared-reasoning](../../queries/04-shared-reasoning.rq)

| a | b |
| --- | --- |
| jA | jB |

Which words would you highlight to show a librarian what the developer means by a replay?

</details>
