# Lower Loss, Worse Replies: What Our Twi Model Experiments Taught Us

[Series index](README.md) | [Previous: Data repair](03-correction-engineering.md) | [Next: The next training stage](05-next-training-stage.md)

*By Edward Kwabena Twumasi. Research evidence through 11 October 2026. Edited 22 October 2026.*

Our October response run completed one epoch over 21,170 training examples. Twi validation loss fell by 34.6%. English-retention loss fell too.

The generated answers gave a less encouraging result. On the same 34 development replies, repetition flags increased from three to five. A greeting still looped. Negation, time, and follow-up corrections still failed. In one arithmetic case, the Twi response returned 30 while the corresponding English response returned the correct 20.

We did not promote the checkpoint.

That result was one of several experiments in Ghana Health AI where a useful numerical improvement failed to establish the behaviour we needed. This article follows the most instructive comparisons. The [complete dated experiment ledger](evidence/experiment-ledger.md) preserves the other runs, recipes, timings, and limitations.

## Decide what each metric is allowed to claim

A voice assistant has to preserve meaning, carry context, answer naturally, and ground actions in actual results. None of our convenient automatic metrics measured all of that.

| Measurement | Useful evidence | Limit |
| --- | --- | --- |
| Validation loss | How well a model predicts supplied target tokens | A weak target can become easier to predict |
| chrF++ | Character and word overlap with a reference | Similar wording can still reverse meaning |
| Schema validity | Whether an output follows a structure | Valid JSON can contain the wrong person or intent |
| Intent agreement | Agreement with the selected labels | A repeated class can make the score trivial |
| Repetition flags | A specific mechanical failure | An unflagged answer can still invent a price |
| Tool syntax | A parseable request | It does not establish execution or a grounded answer |

[chrF++](https://aclanthology.org/W17-4770/) extends character-based comparison with word n-grams. We use it as a reference-similarity measure, not a percentage of meanings understood. Likewise, using [LoRA](https://arxiv.org/abs/2106.09685) establishes an adaptation method, not the quality of its result.

The practical rule became: read each improvement alongside the behaviour it leaves unmeasured.

## A model can learn the output format faster than the task

A September pilot selected 119 source records: 95 for training and 24 for a pilot holdout. It trained the MiniCPM Twi family for three epochs, producing 108 updates.

| Pilot measure | Base | Adapted |
| --- | ---: | ---: |
| Valid interpretation schema | 0/24 | 22/24 |
| Twi reply chrF++ | 23.62 | 22.95 |
| English reply chrF++ | 12.03 | 25.91 |
| Separate product lexical checks | 2/13 | 1/13 |

The format gain was real. It did not establish better Twi understanding. Adapter intent agreement was 13/24 against uncalibrated model labels, below a 14/24 majority-class baseline. Only six interpretations passed all entity question-grounding checks.

An earlier symptom-understanding run exposed the same evaluation risk more dramatically. It reached 672/672 exact intent agreement, but every test row shared the same intent. Strict semantic passes under the project scorer were only 79/672, and separate product fixtures improved from zero to one of eleven.

The useful conclusion was that we could teach a structure. The evidence did not support calling that structure a dependable general-purpose interpreter. [Pilot evidence](evidence/README.md#e07-early-response-pilots)

## Translation gains did not transfer evenly

A more controlled foundation comparison used Qwen3.5-9B-Base and an Afrique 50-language continued-pretraining checkpoint. Both used plain few-shot continuation, with 450 Twi and 450 English AfriXNLI development cases and 32 translation pairs in each direction.

| Measurement | Original base | Afrique CPT |
| --- | ---: | ---: |
| Twi AfriXNLI correct | 211/450 | 214/450 |
| English AfriXNLI correct | 392/450 | 361/450 |
| English-to-Twi chrF++ | 9.11 | 41.47 |
| Twi-to-English chrF++ | 22.92 | 48.31 |

Translation similarity rose substantially on the small paired sample. Twi NLI changed by three correct selections; English NLI lost 31.

These are different tasks with different failure surfaces. Better reference overlap did not establish broad reasoning or conversational ability. The comparison also made English retention an explicit objective rather than something to assume would survive adaptation.

Known reference defects and the few-shot base-model contract limit interpretation. These results cannot be merged with instruction-model evaluations into one improvement curve. [Foundation comparison evidence](evidence/README.md#e08-foundation-and-early-adaptation-comparisons)

## Lower response loss still left the assistant unreliable

The October response run used the instruction foundation `Qwen/Qwen3.5-9B`, pinned to revision `c202236235762e1c871ad0ccb60c8ee5ba337b9a`. It trained rank-16, alpha-16 LoRA at a learning rate of 2e-5.

The 21,170 training views contained 14,298 Twi and 6,872 English examples. One epoch completed 662 updates. Final-assistant targets were complete, including the end-of-turn token, with no target truncation.

| Validation objective | Base loss | Adapted loss |
| --- | ---: | ---: |
| Twi responses | 2.232587 | 1.459290 |
| English retention | 1.317664 | 1.112312 |
| Paired English references | 1.195671 | 0.978049 |

Validation contained 260 Twi responses, 44 English-retention histories, and 260 paired English-reference views. Some references came from weak translated supervision. Lower loss against those targets is not a measured percentage improvement in understanding.

The repetition count also needed case-level inspection. There were three newly flagged cases and one old flag removed. In the removed case, a commerce answer stopped looping but invented a price without a connected tool. A cleaner ending was still an incorrect answer.

We inspected all six saved two-turn scenarios using each model's own previous reply. That matters: supplying a correct reference reply as conversation history can conceal an earlier error that the model itself would introduce.

The run did not isolate how much failure came from supervision, foundation capability, or training dynamics. It established that the resulting checkpoint was not ready to replace the existing path. [Response-run evidence](evidence/README.md#e11-october-response-training)

## The correction model needs its own qualification

It was tempting to use a larger model to repair the corpus and move on. That would make the correction model another source of supervision errors unless it could preserve the distinctions we cared about.

A source-grounded Gemma 31B experiment compared fresh translation with post-editing on 44 cases. Each route received complete English context and retrieved parallel material. The run produced all 88 outputs without source truncation.

Every output passed the structural and repetition screen. Inspection still found meaning changes, including changed people, wrong ingredients, and technical terms translated into unrelated concepts. Some outputs also invented reasons to “correct” valid source sentences.

The method failed qualification for bulk use. The observed findings overlap and are not a random-sample error rate. They are enough to show why a perfect format pass was insufficient.

An independent quality-estimation diagnostic had a similar limitation. SSA-COMET-QE scored all 247 human-rated AfriMTE rows in the comparison, with Spearman correlation 0.1830 and Pearson correlation 0.4126. It correctly ranked 10 of 14 controlled contrasts. Failures included negation, quantity, and experiencer distinctions. We retained it as a diagnostic ranking rather than an automatic acceptance gate.

Retrieval can provide relevant evidence. It does not establish that the model will interpret that evidence faithfully. Same-model back-translation and agreement between models also need calibration before becoming approval mechanisms. [Qualification evidence](evidence/README.md#e12-annotation-and-correction-qualification)

## Keep speech results in their own lane

Historical ASR and TTS experiments belong in the project record, but their scores answer different questions.

For example, a DONDO v2 local holdout showed WER changing from 26.67% to 6.67% with a Twi language model. That holdout contained only eight clips. A separate 300-sample WAXAL comparison changed from 28.12% to 27.31%. Presenting the eight-clip result as a broad recognition breakthrough would hide the denominator and domain.

Likewise, a natural-sounding voice does not validate the answer it speaks. Our tiny TTS round-trip checks mixed recognition, spelling, segmentation, and synthesis effects. They were diagnostics, not pronunciation or speaker-similarity leaderboards.

The [speech section of the ledger](evidence/experiment-ledger.md#speech-diagnostics-are-separate) preserves the measured timings and evaluation scopes. None of those measurements re-audits the currently deployed service.

## What changes in the next experiment

The experiments point toward a more disciplined comparison:

1. Qualify the exact response targets before exporting them.
2. Count supervised Twi answer tokens separately from surrounding context.
3. Preserve source-group boundaries and English-retention exposure.
4. Hold prompts, budgets, decoding, and scoring fixed for paired comparisons.
5. Inspect meaning and multi-turn behaviour alongside aggregate scores.
6. Keep incomplete runs and failed gates visible.

These steps do not guarantee that data repair will solve every failure. They make its effect observable.

The next meaningful result is a model whose actual responses preserve meaning and conversation state more reliably under a controlled comparison. Another completed training run can provide evidence toward that result; it cannot stand in for it.

[Next: What we need before the next fine-tuning run](05-next-training-stage.md)
