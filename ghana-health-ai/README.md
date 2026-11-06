# Ghana Health AI: Building a General-Purpose Twi Assistant

- **Written:** 16 October 2026
- **Research checkpoint:** 11 October 2026
- **Evidence window:** August to October 2026
- **Status:** Ongoing research. A reliable independent Twi conversational model has not yet been demonstrated.

This series documents the work behind Ghana Health AI: a voice-first product
and a research programme for Twi understanding, direct response generation,
English retention, and later health, commerce, and tool-use specialisation.
It explains the experiments that failed, the useful evidence they produced,
the data defects we found, and the work completed to make the next training
run more defensible.

## Read the Series

| Article | Focus |
| --- | --- |
| [1. A Million Rows Were Not Enough to Build a Reliable Twi Assistant](01-research-journey.md) | Product goal, research scope, false signals of progress, and the shift toward source-grounded data repair |
| [2. What a Million-Row Twi Corpus Actually Teaches a Model](02-four-collections.md) | The four collections, exact capacity measurements, source recovery, missing fields, and why row counts cannot be added indiscriminately |
| [3. How We Repair Training Data Without Losing Its History](03-correction-engineering.md) | Applied corrections, source identities, protected groups, queue consolidation, resumability, and verification |
| [4. Lower Loss, Worse Replies: What Our Twi Model Experiments Taught Us](04-benchmarks.md) | Historical model comparisons, training recipes, before/after metrics, failed teacher qualification, and bounded speech diagnostics |
| [5. What We Need Before the Next Twi Fine-Tuning Run](05-next-training-stage.md) | The execution graph, remaining gates, review strategy, export contract, and a controlled training comparison |
| [Complete experiment ledger](evidence/experiment-ledger.md) | Full dated recipes, scores, negative results, and speech diagnostics |
| [Evidence ledger](evidence/README.md) | Source-document locators, artifact identities, interpretation rules, and verification scope |
| [Machine-readable checkpoint](evidence/checkpoint.json) | Aggregate counts, node status, selected metrics, and explicit non-readiness flags |

For a meeting, read Articles 1 and 5 first. For an implementation review, start
with Articles 2 and 3. For a research-methods discussion, start with Article 4.

## The Checkpoint in One Paragraph

The instruction working corpus accounts for **52,002 sources**. A source-bound
pass applied **24 complete correction proposals**, made limited terminology
edits in **37 additional records**, and cleared **31,323 false empty-input
markers**. A second pass consolidated overlapping findings into **674 distinct
instruction work items**. The next node is a documented inspection of the
**24,819-source unflagged sampling pool**. None of those counts certifies Twi
accuracy, and these two passes added **zero training admissions**.

## Publication Boundaries

This is an engineering case study, not a peer-reviewed paper or an accepted-model
announcement. Historical scores retain their original evaluation limitations.
No private recordings, user conversations, corpus row dumps, credentials, or
model weights are included. Evidence hashes identify private artifacts; they
do not make those artifacts publicly accessible or establish their truth.

The series is a dated snapshot, not the requested live execution dashboard.
That interactive dashboard had not been implemented at this checkpoint.
All project material is contained in this folder so the parent repository can
host unrelated engineering articles independently.
