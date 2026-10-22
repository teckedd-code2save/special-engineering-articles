# Ghana Health AI: Building a General-Purpose Twi Assistant

- **Written:** 16 October 2026
- **Latest update:** 22 October 2026, reporting the sealed D51 / E50 checkpoint
- **Original articles 1-5:** 11 October 2026 research snapshot, preserved as history
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
| [1. Why a large corpus did not immediately produce a reliable Twi assistant](01-research-journey.md) | Product goal, research scope, false signals of progress, and the shift toward source-grounded data repair |
| [2. What is actually in the corpus](02-four-collections.md) | The four collections, exact capacity measurements, source recovery, missing fields, and why row counts cannot be added indiscriminately |
| [3. Repairing training data without rewriting history](03-correction-engineering.md) | Applied corrections, source identities, protected groups, queue consolidation, resumability, and verification |
| [4. Benchmarks, experiments, and negative results](04-benchmarks.md) | Historical model comparisons, training recipes, before/after metrics, failed teacher qualification, and bounded speech diagnostics |
| [5. From the current checkpoint to credible training](05-next-training-stage.md) | The execution graph, remaining gates, review strategy, export contract, and a controlled training comparison |
| [6. From an inspection queue to 674 complete meaning handoffs](06-corpus-correction-checkpoint-20261020.md) | D49 / E48 correction progress, source-answer repairs, remaining work, durable evidence, and the live review map |
| [7. Closing the repairable queue](07-closing-the-correction-queue-20261022.md) | D51 / E50: 697 checked candidates, two quarantined sources, scoped human feedback and the admission boundary |
| [Evidence ledger](evidence/README.md) | Source-document locators, artifact identities, interpretation rules, and verification scope |
| [Latest machine-readable checkpoint](evidence/checkpoint-20261022.json) | Current correction and assessment counts, artifact hashes, and explicit non-readiness flags |
| [October 20 checkpoint](evidence/checkpoint-20261020.json) | Previous D49 / E48 snapshot, unchanged |
| [Historical checkpoint](evidence/checkpoint.json) | Original October 11 counts and historical model measurements, unchanged |

For a meeting, read Articles 1 and 7 first, then Article 5 for the training
design. For an implementation review, start with Articles 2 and 3. For a
research-methods discussion, start with Article 4.

## The Checkpoint in One Paragraph

The instruction working corpus accounts for **52,002 sources**. The targeted
699-item correction queue now reconciles as **669 distinct replacements, 28
retained examples, and two unavailable-source holds**. All 697 current complete
handoffs have a scoped same-agent meaning assessment and proceed to admission
review. The two older E holds and the focused phrase check are resolved. There are
**zero training admissions from this pass**. These are correction-progress
counts, not a model benchmark or certification of the uninspected corpus.

## Publication Boundaries

This is an engineering case study, not a peer-reviewed paper or an accepted-model
announcement. Historical scores retain their original evaluation limitations.
No private recordings, user conversations, corpus row dumps, credentials, or
model weights are included. Evidence hashes identify private artifacts; they
do not make those artifacts publicly accessible or establish their truth.

The articles are dated snapshots. The authenticated [review page](https://ghanahealth.serendepify.com/research/corpus/?collection=responses)
and [clickable execution map](https://ghanahealth.serendepify.com/research/corpus/progress)
now expose the latest sealed checkpoint. Articles 1-5 retain their original
historical scope; their then-pending steps must not be read as today's status.
All project material is contained in this folder so the parent repository can
host unrelated engineering articles independently.
