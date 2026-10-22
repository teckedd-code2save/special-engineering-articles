# Benchmarks, Experiments, and Negative Results

[Series index](../README.md) | [Previous](../03-correction-engineering.md) | [Next](../05-next-training-stage.md)

**Compiled 16 October 2026 from records through the 11 October checkpoint.**

## How to Read This Record

This is an experiment ledger, not a leaderboard. It covers the recoverable
comparisons relevant to the project's current direction, including earlier
speech work. It does not claim an exhaustive inventory of every abandoned
startup, infrastructure retry, or historical serving configuration.

The tasks, prompts, datasets, checkpoints, and decoding conditions vary.
Only within-run comparisons with matched conditions support a direct delta.
Recorded model names are the identifiers used by the experiments; hosted
service labels without immutable revisions are identified as such.

| Measurement | What it measures | What it does not establish |
| --- | --- | --- |
| Validation loss | Prediction of supplied target tokens under an objective | Correctness of the supplied target or usefulness of a generated answer |
| chrF++ | Character/word overlap with a reference | Semantic, clinical, or conversational accuracy |
| Intent accuracy | Agreement with a particular label contract | General understanding, especially with one repeated class |
| Entity F1 | Extraction under a specified span/schema contract | Overall response quality |
| JSON/schema success | Conformance to output structure | Correct content |
| Repetition/length flags | Specific mechanical generation behaviours | Absence of all incoherence or meaning errors |
| WER/CER | Recognition errors against a transcript under a defined normalisation | Downstream language understanding or TTS naturalness |
| Tool-call syntax | A parseable request to an available interface | Actual execution, correct arguments, or grounded final answers |

chrF++ extends character-based comparison with word n-grams; this series treats
it as a reference-similarity metric, not a percentage of meanings understood.
See the [original chrF++ paper](https://aclanthology.org/W17-4770/).
Most project adapters use LoRA, a low-rank parameter adaptation method, but
the use of LoRA itself says nothing about Twi quality. See the
[original LoRA paper](https://arxiv.org/abs/2106.09685).

## 1. The Early 50-Probe Understanding Check

The August synthetic suite contained 50 project-written phrases with 138
literal rubric checks. It was a diagnostic set, not the training corpus.
The historical scorecard reported:

| Logged candidate | Checks passed | Cases passing all checks | Reported elapsed time |
| --- | ---: | ---: | ---: |
| `openai:gpt-5.6-sol` | 138/138 | 50/50 | 149.285 s |
| `openai:gpt-5.4-mini` | 130/138 | 42/50 | 62.426 s |
| `openai:gpt-5.5` | 130/138 | 45/50 | 178.773 s |
| `ninte/twi-en-nllb-v2` | 107/138 | 30/50 | 5.866 s |
| NLLB-600M plus `mclanorjeff/NLLB-Twi-Human-Aligned` | 105/138 | 28/50 | 9.479 s |

The hosted names above are saved service/model labels, not independently
resolved weight revisions. NLLB weights and adapters had pinned revisions.
Elapsed times came from different inference paths and are not comparable
end-to-end voice latencies.

### Why the Historical 100% Must Not Be Oversold

The top result followed explicit product-specific meaning guidance in the
prompt. It is not an untouched, independent test of general Twi ability.
The rubric also had brittle lexical requirements: a response could preserve
a negation using a contraction and still fail an allowed-keyword check.
The saved field called `exact_cases` means all rubric checks passed, not exact
reference equality or independent human semantic agreement.

Some short Twi phrases also require context and native adjudication. A later
review explicitly questioned an isolated eye/sleepiness interpretation. The
older intended health reading must not be universalised into an unquestionable
gold meaning for every context.

The useful result was narrower: translation candidates had concrete meaning
failures, and a stronger external response path could mask weaknesses in the
project's own model. The original scores remain recorded, but their labels
and limits must travel with them. [E09](README.md#e09-early-synthetic-understanding-scorecard)

## 2. Medical Understanding and Small Response Pilots

### Structured Understanding V4

The September 5 model adapted `Qwen/Qwen2.5-3B-Instruct` for 1,200 steps using
a 7,000-row source-paired symptom corpus: 5,659 train, 669 development, and
672 test records. This was not the WAXAL/GhanaNLP speech corpus and did not
contain patient-facing response targets.

| Test measure, 672 rows | Unadapted base | V4 |
| --- | ---: | ---: |
| Parseable JSON | 278/672 | 672/672 |
| Exact intent | 0/672 | 672/672 |
| Exact body system | 0/672 | 259/672 |
| Strict semantic pass under project scorer | 0/672 | 79/672 |
| Mean natural-English token F1 | 0.0295 | 0.3425 |
| Separate product fixtures | 0/11 | 1/11 |

All test rows shared `health_symptom_report`, so 672/672 intent agreement was
not evidence of intent generalisation. The strict semantic score was 11.76%,
and commerce cases remained unsuccessful. The model learned structure and
some task behaviour but also narrowed ordinary requests into symptom patterns.
It was not promoted. These results are from the project's scorer, not a
clinical validation study. [E07](README.md#e07-early-response-pilots)

### MiniCPM Bilingual QA Adaptation

The September 6 run used `ghananlpcommunity/MiniCPM5-1B-Twi`, 8,809 training
rows, and 600 updates, approximately 1.09 epochs. Its generation comparison
used 64 Twi and 64 English held-out rows plus 13 product cases.

| Measure | Base | Adapted |
| --- | ---: | ---: |
| Twi chrF++ | 27.46 | 22.22 |
| English chrF++ | 14.44 | 23.49 |
| Recorded language-match rate | 50.00% | 98.44% |
| Product checks | 2/13 | 3/13 |
| Critical product checks | 0/8 | 0/8 |

Language matching improved while Twi reference similarity declined and the
critical checks did not improve. Recorded failures included unsupported
diagnoses and reassurance. No model-quality promotion followed.

### The 95-Source Annotated Pilot

The September 8 pilot selected 119 source records, split into 95 train and
24 pilot holdout. Three epochs produced 108 updates on the same MiniCPM Twi
family. The saved training-loop time was 205.98 seconds; total worker time
was 1,028.94 seconds. Those are different timing scopes.

| Measure | Base | Adapted |
| --- | ---: | ---: |
| Valid interpretation schema | 0/24 | 22/24 |
| Pilot holdout Twi reply chrF++ | 23.62 | 22.95 |
| Pilot holdout English reply chrF++ | 12.03 | 25.91 |
| Separate locked-source Twi reply chrF++ | 30.30 | 16.65 |
| Separate locked-source English reply chrF++ | 14.87 | 20.56 |
| Product lexical checks | 2/13 | 1/13 |

Adapter intent agreement was 13/24 against uncalibrated model labels, below
the 14/24 majority baseline. Only six interpretations passed all entity
question-grounding checks. The result demonstrated format learning, not a
reliable general-purpose understanding model. [E07](README.md#e07-early-response-pilots)

## 3. Foundation Comparisons and Earlier Adaptation

### Direct Foundations and Instruction Transfer

The September 9 foundation suite eventually contained 74 cases: 30 product
regressions, 12 source-reading cases, and 32 locked medical-response cases.
These conditions were not identical for every preliminary run.

| Candidate or method | Actual coverage | Observed result and limitation |
| --- | --- | --- |
| AfriqueQwen3.5-4B-Instruct-v1 | Preliminary 38 cases | Repetition and Twi meaning failures; four English excerpts were mistakenly labelled Twi and must be excluded from conclusions |
| Qwen3.5-9B instruction checkpoint | 74 cases | English instruction ability did not transfer to dependable elementary Twi meaning |
| Afrique 4B CPT plus full instruction-weight difference | 74 cases | Corrupted/repetitive generation; matching tensor shapes did not validate transfer |
| Same merge at half strength | 17 follow-up cases | All reached a 640-token limit; invented continuations and tool results |
| Gemma 4 12B instruction checkpoint | 74 cases | Several useful English/arithmetic behaviours; Twi meaning and corrections still failed |
| Gemma 4 31B instruction checkpoint | 30 product cases | Some stronger responses, but serious Twi meaning errors; an added language hint prevents a size-only comparison |
| External `mhqa-itu-adapters/gen7454` on Gemma 31B | 30 paired prompts, 60 replies | Some symptom and response gains; invented tool, looping, and context failures remained |

The external adapter's published ensemble leaderboard score was not used as
its standalone accuracy. That would conflate retrieval, sampling, judging,
and a single adapter. None of the above was accepted as a dependable Twi
assistant on these observations.

### Larger Does Not Automatically Mean Qualified

Qwen3.5-122B-A10B-FP8 completed 30 non-thinking and eight thinking outputs
before a 1,800-second timeout. It did not complete the intended 60-output
comparison. Qwen3.8-27B completed all 60 outputs in 413.38 seconds, including
164.75 seconds of loading.

The larger run retained some negation and quantity corrections but misread
other Twi meanings. The 27B comparison reversed a negated purchase in both
modes and changed the experiencer in another case. It had no empty answers
or repeated-eight-word flags: mechanically clean output still changed meaning.
Thinking/non-thinking profiles also differed in generation budgets and other
settings, so this was not a pure size or reasoning-mode ablation.
[E08](README.md#e08-foundation-and-early-adaptation-comparisons)

### A More Controlled Native-Language Comparison

The Qwen3.5-9B-Base versus AfriqueQwen3.5-9B-50Langs comparison used plain
few-shot continuation, not a chat template. Each model saw 450 Twi and 450
English AfriXNLI development cases with constrained A/B/C output, plus
32 translation pairs in each direction.

| Measurement | Original base | Afrique CPT |
| --- | ---: | ---: |
| Twi AfriXNLI | 211/450 (46.89%) | 214/450 (47.56%) |
| English AfriXNLI | 392/450 (87.11%) | 361/450 (80.22%) |
| English-to-Twi chrF++ | 9.11 | 41.47 |
| Twi-to-English chrF++ | 22.92 | 48.31 |
| English-to-Twi output limits | 18/32 | 1/32 |

Translation similarity improved considerably on this small sample. The NLI
change was three more Twi cases correct and 31 fewer English cases correct.
It was not evidence of a general assistant breakthrough. Source references
also had known defects, and this few-shot base-model contract differs from
the instruction-model NLI evaluations below.

### The Adaptation Trail Before V6

| Experiment | Completed work | Decision-driving evidence |
| --- | --- | --- |
| Gemma31 translation-heavy adaptation | Stopped after 281 updates; paired checkpoint-200 inspection retained | Much lower translation losses, but direct replies degraded into echoes or loops; quarter-strength inference scaling did not fix meaning |
| Balanced Response V2 | Stopped after 234 updates | Checkpoint regressions; planned final 54-case paired evaluation was not completed |
| Afrique Response V3, 4B | 691 updates over 5,521 training examples | All 30 development replies ended normally versus 30 length stops for the non-instruction CPT base; semantic errors remained |
| Grounded Response V4, Gemma31 | Stopped; last logged update 210, exact stop unknown | Checkpoint-100 Twi NLI 271/450 to 270/450; later conversational regression; final paired generation incomplete |
| Native Understanding V5, Gemma31 | All 320 updates completed | Small auxiliary NLI/entity gains did not yield reliable replies |

V3 checkpoint 200 executed one real decimal calculation and used its result
in a final response. Later checkpoints overused the calculator with invented
arguments. One successful integration case is not general tool competence.

V5 provides a particularly useful contrast:

| V5 final evaluation | Base | Adapted |
| --- | ---: | ---: |
| Twi AfriXNLI development | 271/450 | 278/450 |
| English AfriXNLI development | 408/450 | 409/450 |
| INJONGO intent, explicit schema | 207/320 | 212/320 |
| INJONGO exact records | 92/320 | 103/320 |
| Entity micro-F1 | 0.5894 | 0.6186 |
| Repetition flags in 60 paired generation cases | 0 | 4 |

The earlier INJONGO prompt omitted entity field/type requirements. Its poor
full-structure results were not treated as a credible measurement of entity
understanding. The explicit-schema comparison is a separately named contract;
it did not retroactively change the running training data.

The available V5 Twi-labelled token pool was dominated by health answers and
intent/entity structures, with no general Twi conversational-response task.
That is a measured supervision gap, not proof of a single causal explanation.
[E08](README.md#e08-foundation-and-early-adaptation-comparisons)

### Balanced Afrique Response V6, 9B

V6 completed 400 updates in 1,706.17 training seconds, 2,188.97 seconds total.
The prepared mixture had 8,681 training views from 7,464 source records; the
bounded run could consume at most 6,400 views, not a full epoch.

All 30 development replies and 12 new conversation turns terminated normally.
Among 48 source-validation replies, six hit the token limit and five triggered
the repeated-eight-word heuristic. Meaning, follow-up, unsupported price, and
health-context failures remained.

Private audition then exposed an invented human identity and a long greeting
loop. A clean four-context paired check reduced the adapter's length stops
relative to the CPT base but did not establish natural, language-matched
conversation. One earlier critique of a named-person answer was itself wrong
and was corrected in the record. Evaluation mistakes must be retained and
fixed, not repeated as model failures. [E08](README.md#e08-foundation-and-early-adaptation-comparisons)

## 4. The Later Controlled Qwen9 Runs

These runs use the instruction foundation `Qwen/Qwen3.5-9B`, revision
`c202236235762e1c871ad0ccb60c8ee5ba337b9a`. The
[publisher's model page](https://huggingface.co/Qwen/Qwen3.5-9B) identifies
the foundation; the project artifacts, not the publisher card, establish
the adaptation outcomes below.

### September 28: Alignment Pilot

The pilot completed 200 updates in 69.93 minutes on one H100. It used fresh
rank-16/alpha-16 LoRA, learning rate 5e-6, English replay, and matched greedy
generation with a 384-token limit. Its original evaluation contained 227
sentence-source views in each translation direction.

| Measure | Base | Adapted |
| --- | ---: | ---: |
| English-to-Twi chrF++ | 7.9166 | 6.9906 |
| Twi-to-English chrF++ | 20.7151 | 20.8303 |
| English retention loss ratio | 1.0000 | 0.9523 |

The gate required at least two chrF++ points in each direction, retention
within the declared bound, and no new empty/looping development replies.
It failed. The later record-type audit found vocabulary misclassified as
sentences. The pilot also had only 38,532 Twi target tokens and no native Twi
assistant-dialogue targets. These are relevant defects, not proof of sole
causation. The old scores and evaluation membership remain unchanged.
[E10](README.md#e10-later-alignment-and-language-runs)

### September 30: Source-Preserved Language Adaptation

After two infrastructure attempts with zero completed optimiser updates,
the corrected run completed 561 updates and all 17,938 examples: 16,742 Twi
text records plus 1,196 English conversation examples. Supervised exposure
was 473,845 Twi and 255,264 English tokens, approximately 65/35.

| Objective | Base loss | Adapted loss |
| --- | ---: | ---: |
| Twi text | 6.145030 | 2.369211 |
| English retention | 1.318064 | 1.106109 |

The completed report still set the advancement gate to false. Repetition
appeared in two new health/context development cases. The base and adapter
each had two repetition flags, but on different cases; a total alone would
hide the regressions. No generated Twi dialogue targets were added by this
language-learning run. Full semantic review remained pending.

The final result was recovered on October 2. A historical note saying
"submitted" does not mean the job is still running. The completed artifact
and report supersede that earlier status. [E10](README.md#e10-later-alignment-and-language-runs)

### October 3: Direct Response SFT, Inspected October 9

| Run setting | Value |
| --- | --- |
| Training views | 21,170: 14,298 Twi and 6,872 English |
| Exposure | One complete epoch, 662 updates |
| Adapter | LoRA rank 16, alpha 16 |
| Learning rate | 2e-5 |
| Target handling | Complete final-assistant targets, including native end-of-turn; no target truncation |
| Training time | 10,422.358 seconds |
| Total run time | 11,381.832 seconds, about 3 hours 10 minutes |

| Validation objective | Base loss | Adapted loss | Relative reduction |
| --- | ---: | ---: | ---: |
| Twi responses | 2.232587 | 1.459290 | 34.6% |
| English retention | 1.317664 | 1.112312 | 15.6% |
| Paired English references | 1.195671 | 0.978049 | 18.2% |

Validation contained 260 Twi responses, 44 English-retention histories, and
260 paired English-reference views. The references include weak translated
supervision. A lower loss against them is not a percentage improvement in
understanding.

The 34 fixed development replies had three repetition flags before and five
after training, with three newly flagged cases and one old flag removed.
The removal was not necessarily success: a commerce response stopped looping
but invented a price without a connected tool.

Qualitative inspection found lost negation/time, a standard greeting that
still looped, an informal greeting treated as a platform name, and failures
to use follow-up corrections. A Twi arithmetic case returned 30 where the
corresponding English case returned the correct 20. Some quantity corrections
and English switching were useful, but not evidence of broad competence.

All six saved two-turn scenarios were inspected using each model's own
previous answer. The result remained private and unpromoted. Data quality,
base capability, and training dynamics remain possible contributors; this
run does not isolate their causal shares. [E11](README.md#e11-october-response-training)

## 5. Can Automatic Teachers or Judges Qualify the Data?

### Qwen235 Bilingual Critic

The pinned Qwen3-235B-A22B-Instruct-2507-FP8 critic was given a 64-request
qualification plan. The 900-second call persisted only 16 results. Loading
and warmup consumed 671.8 seconds; the first result batch took 125.8 seconds.

Six of seven observed positive controls failed, including two invalid schemas.
Three observed counterfactual controls were identified correctly. The remaining
unseen results could no longer satisfy the fixed 12/14 positive-control gate.
The terminal event was a timeout, not a completed 64-output evaluation.
Independent token recount confirmed prompts fit the limit, so truncation did
not explain the observed meaning errors.

### SSA-COMET-QE

The independent diagnostic scored 354 of 361 pairs; seven overlength cases
were skipped without truncation. All 247 human-rated AfriMTE benchmark rows
were scored.

| Measure | Result |
| --- | ---: |
| Spearman correlation with human ratings | 0.1830 |
| Pearson correlation with human ratings | 0.4126 |
| Controlled contrasts correctly ranked | 10/14 |
| Total runtime | 102.26 seconds |

The public 76-language checkpoint was used, not a newer backbone described
elsewhere. Counterfactual failures involved negation, quantity, experiencer,
and a name/thank-you distinction. No acceptance threshold was established.
The scores remained diagnostic rankings rather than an automatic approval gate.

### Source-Backed Question Synthesis and Translation

A source-answer synthesis experiment retained 128 original sources. Its
evidence-grounded English reviewer passed 26/28 calibration judgments but
still mishandled pronoun/context controls, so it did not pass the automatic
batch gate. Seventy-one sources had inspectable English-compatible candidates,
not 71 gold training examples.

The follow-on translation stage produced 117 question alternatives from those
71 sources. Inspection flagged 56 possible meaning changes. A separate back
stage produced 188 outputs: question back-translations and translations of
the 71 original answers. No output was empty or length-limited, but important
meaning errors remained. Same-model back-translation was not treated as
independent proof of correctness.

### October Reference Annotation

The changed `gpt-oss-120b` reference-annotation contract tested 32 fresh
held-out source groups plus 16 protected controls. All 48 outputs were saved
in 558.39 seconds, including 196.85 seconds loading. Six final channels were
empty and nine outputs failed automatic checks. The 39 format/literal passes
were not 39 semantically correct annotations.

Further inspection found ten additional or overlapping meaning/contract
issues involving desire, obligation, promises, actors, time, and entity
categories. No unchanged bulk run or training admission followed.

### October Source-Grounded Gemma Correction

The Gemma 4 31B run compared fresh translation and post-editing on 44 cases:
28 development contrasts and 16 complete corpus records. It produced all
88 outputs in 736.79 seconds, including 243.69 seconds staging/loading.
No source was truncated.

All 88 passed the structural/repetition screen. Ten concrete inspected findings
still showed meaning defects, and 33 control outputs gave false source-defect
reasons for valid standalone sentences. These findings overlap and are not a
complete error count or a random accuracy estimate.

This is why model confidence, two-model agreement, and grammatical JSON do
not open the bulk-generation gate. The method must demonstrate the distinctions
that the project needs to preserve. [E12](README.md#e12-annotation-and-correction-qualification)

## Speech Diagnostics Are Separate

The historical speech results belong in the project record, but must not be
mixed with language-model understanding scores. They do not describe the
currently deployed service, which was not re-audited for this publication.

### ASR: Domain Shift and English Retention

| Historical comparison | Recorded result | Boundary |
| --- | --- | --- |
| Whisper v6 versus DONDO v1, local product corpus | WER 54.18% versus 32.66% | Historical local-set result; not a cross-speaker population estimate |
| Whisper-small versus Twi v6, Common Voice English | WER 11.82% versus 42.34% | 100-sample English-retention check |
| Balanced Whisper v7-lite | Twi WER 40.86%, CER 14.10%; English WER 15.10%, CER 8.10% | Separate 100-sample, beam-5 checks; retention gain did not justify Twi regression |
| Frozen v7-lite | Validation WER 53.83%, CER 22.18% | Training-validation measure, not the same evaluation as the row above |
| DONDO v1 completed trial | WER 35.77%, CER 12.19% | Its final evaluation; do not confuse with the separate local-set result |
| DONDO v2, WAXAL | WER 28.12% greedy, 27.31% with Twi language model | 300 samples |
| DONDO v2, local holdout | WER 26.67% greedy, 6.67% with Twi language model | Only eight clips; far too small for a broad promotion claim |

These measurements supported investigating domain data and English replay,
not a universal 30% WER limit or a claim that the problem had been solved.
The original Whisper v6 shorthand of roughly 30% referred to a different
evaluation context from the much worse local product result.

### TTS: Listening, Round Trips, and First Audio

A matched-text comparison generated three phrases for stable-Twi speakers
1 and 6, nano-Twi, and a CosyVoice-based Twi voice with an authorised owner
reference. A DONDO round-trip diagnostic over only 28 reference words per
voice produced word-edit counts of **18, 20, 16, and 10**, respectively.

This was not a pronunciation or speaker-similarity leaderboard. Recognition
errors, spelling, segmentation, the tiny set, and possible owner-speaker bias
all affect the diagnostic. No voice recording is published with this article.

The optimised FP16 streaming experiment recorded:

| Phrase position | First audio | Total synthesis | Audio duration |
| --- | ---: | ---: | ---: |
| Greeting, first utterance | 5.308 s | 8.773 s | 5.20 s |
| Unwellness phrase, warm | 2.500 s | 7.170 s | 6.68 s |
| Shopping phrase, warm | 2.498 s | 7.376 s | 7.08 s |

These single measurements exclude model loading and network transit, and are
not p95 latency. Later chunks were still too slow for uninterrupted immediate
playback. Owner feedback preferred one FP32-streaming alternative in a later
single-sentence comparison, but that preference was not converted into a
naturalness score or a production-readiness claim. [E13](README.md#e13-historical-speech-diagnostics)

## Missing Results Stay Missing

The MORENA document specifies a proposed untouched-base evaluation over 1,144
alignment views. A plan is not a result. No completed MORENA metric is asserted
in this series from that document.

Similarly, the timed-out large-Qwen comparison, stopped V2/V4 final comparisons,
and incomplete infrastructure attempts are not counted as completed benchmarks.
No claim is made that every state-of-the-art approach has been tested.

The recurring lesson is narrower and more useful: improvements in format,
reference prediction, translation similarity, or termination must be checked
against actual meaning and behaviour. The next dataset release is intended
to change the supervision responsible for those behaviours; its success
still has to be measured rather than promised.

[Next: From the current checkpoint to credible training](../05-next-training-stage.md)
