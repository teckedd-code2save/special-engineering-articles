# Evidence Ledger and Publication Notes

[Series index](../README.md) | [Machine-readable checkpoint](checkpoint.json)

**Compiled:** 16 October 2026. **Research cutoff:** 11 October 2026.

**Update:** E01-E13 and `checkpoint.json` retain that historical scope. E14 and
[the dated checkpoint](checkpoint-20261020.json) cover D49 / E48, sealed on
20 October and checked for publication on 21 October 2026. Article 6 is the
current progress update; historical next-step descriptions below are not live status.

## E14: D49 / E48 Correction and Review Checkpoint

Source locators in the research checkout:

- `docs/instruction-residual-inspection-20261017.md`
- `docs/instruction-source-adjudication-20261020.md`
- `docs/corpus-checkpoint-20261020.md`
- `tmp/instruction-complete-repairs/v49-20261020/report.json`
- `tmp/instruction-meaning-assessments/v48-20261020/report.json`
- The corresponding sealed manifests and private storage receipts
- `tmp/instruction-review/d49-e48-20261020/progress.json`

Supports the 699-item accounting, 646 replacements, 28 retained targets,
25 pending items, 674 scoped assessments and 122 source-corrected derivatives.
The pending D items and E holds are distinct populations. The 671 scoped agent
passes are not independent semantic validation, model accuracy or admission.

Manifest and review-queue byte hashes were recomputed locally on 21 October
and matched the values in the dated checkpoint. Saved remote verification
receipts were inspected; this publication check did not launch another upload
or GPU run. The authenticated review was rechecked without writing reviews.
The public [application PR #41](https://github.com/teckedd-code2save/ghana-health-ai/pull/41)
contains code and aggregate progress, not the private corrections. Its CI and
security checks passed; it remained an open draft at this publication check.

No historical benchmark values are revised by E14. Twelve new projection
tests are software-verification results, not an improvement in model quality.

## Evidence Policy

The articles are original synthesis of project records, not a verbatim export
of internal notes. This ledger identifies the underlying documents and selected
frozen artifacts. Source locators below are relative to the separate
`ghana-health-ai` implementation repository, not this articles repository.
They are intentionally not broken links to unpublished files.

The research checkout contained substantial uncommitted work when inspected.
An implementation Git commit is therefore not claimed to reproduce the entire
checkpoint. Frozen artifact hashes provide the narrower identities available.
Some historical benchmark entries are based on saved research reports and
summary records rather than newly rerun evaluations.

Private corpus data, model weights, owner recordings, real user conversations,
raw review journals, infrastructure addresses, and credentials are not included.
Dataset restrictions are not transferred or overridden by publishing a case
study. A reader without authorised source/artifact access cannot reproduce
all experiments from these articles alone.

## E01: Research Objective and Current Graph

Source locators:

- `docs/GHANA_LANGUAGE_UNDERSTANDING_RESEARCH.md`
- `docs/research-data-roadmap.md`
- `docs/research-data-execution.md`
- `docs/CONTINUE.md`, latest entry dated 11 October

Supports the general-purpose Twi/English objective, direct-response requirement,
four-collection design, current A/B completion, C as next, and the remaining
correction/admission/export path. The diagram is a documented dependency and
status map, not an implemented interactive dashboard or proof of model gains.

## E02: Source Inventory and Stage Capacity

Source locators:

- `docs/language-capacity-20260929.md`
- `docs/corpus-readiness-20261010.md`, with its October 11 supplement
- `docs/corpus-gap-register-20261010.md`
- `docs/record-type-resolutions-20261010.md`

Frozen inventory manifest:

```text
twi-stage-v1-20260911
ddc88cb47302905d98d74d7e08f66856dd397836479619691c13e40a12e83866
```

Corrected language-export manifest:

```text
twi-language-v1-20260929
8b2bdb883216286c91c6058d7fcb2289ddff4f57fa0851e6e7a9bca179a8e5b3
```

Supports the 1,178,118-row inventory, 42,124-record language training view,
457,120 non-lexical content tokens, 25,378 lexical training records, and the
108-example/625-assistant-token Twi QA capacity observation. These views and
their later supplements overlap in source material; they are not additive
independent corpus totals. Counts use the stated counting tokenizers.

## E03: Reference and Record-Type Recovery

Source locators:

- `docs/corpus-record-types-20260929.md`
- `docs/instruction-reference-recovery-20261010.md`
- `data/response-adaptation/instruction-reference-original.v1.json`

Corrected alignment manifest:

```text
twi-alignment-v3-20260929
98d9f62aebfd45c81c8c2a12373e07bad22c231145862f9befc83d2e558f47cd
```

Reference-recovery manifest:

```text
instruction-reference-recovery/v1-20261010
d87272e781309a111897899d2d06aca35d9e016e8de8c95c6d78fa3093019f1c
```

Supports the type correction, unchanged split/reference handling, and exact
recovery of 2,111 complete English references. These are original synthetic
English and machine-translated Twi sources, not newly native-certified pairs.
The project's recorded research/noncommercial restrictions remain relevant.

## E04: Applied Working Corrections

Source locators:

- `docs/instruction-working-corrections-20261011.md`
- `docs/research-data-execution.md`
- `scripts/apply_instruction_corrections.py`
- `scripts/consolidate_instruction_repairs.py`

Node A artifact manifest:

```text
instruction-working-corrections/v1-20261011
ec008f4fbe2276c2db8240f5bf7411d60d30ea2e8062d6bfef753d6e42b38ebb
```

Node B artifact manifest:

```text
instruction-repair-consolidation/v1-20261011
0eae6501941a15da4a5ba0caa7e7fbe91b22b139c74206a6bc8b14f852600cea
```

The corresponding `report.json`, reconstruction receipts, and saved private
storage receipts were inspected during article preparation. Manifest byte
hashes were recomputed locally. The saved receipts record eight privately
verified files for A and nine for B. No new remote upload or GPU job was run
to write these articles.

The 31,323 marker total includes 31,311 direct marker operations and 12 marker
removals inside complete corrections. The 61 substantive records comprise
24 complete and 37 partial edits. The 31,344 changed-record total overlaps
those categories. Node B's 674 work items remain unresolved/review work,
not 674 newly approved targets.

## E05: Conversation Recovery and Repairs

Source locators:

- `docs/conversation-recovery-20261010.md`
- `docs/conversation-repairs-20261010.md`

Repair manifest:

```text
conversation-repairs/v2-20261010
3ac85932b40122878d7f300651e8ba8d4580ba468947cbac2e14639ac2335735
```

Supports recovery of 3,200 messages into 1,565 complete histories, with
1,214 protected, 13 complete proposals, and 338 remaining pending. Includes
the explicit distinction between original English answers and five proposed
source-answer changes. No new human approval or conversation admission is
inferred from proposal creation.

## E06: Health and Tool Material

Source locators:

- `docs/health-source-recovery-20261010.md`
- `docs/corpus-readiness-20261010.md`, bilingual-tool update
- `scripts/corpus_twi_tools.py`

Health recovery manifest:

```text
health-source-recovery/v1-20261010
e312d3334f7a0940a76458910ed3bce0b4886bd9d6297b3231e295ad6548ce72
```

Bilingual tool-candidate manifest:

```text
corpus-tools/bilingual-v1-20261010
a572b98192fffd3e4f63366febeb783ce0df09fe22dfb3e5f5be6b627e35a494
```

Supports the current 11,116-source health accounting and 45-case/90-history/
210-result tool fixture. The pinned health source is
`ImhotepSystems/AfriHealth-QA@61befdaa19e12afdbf9032a602067f0daa3e6c68`.
Its source scope and unresolved licence-metadata discrepancy are reported as
recorded, not resolved by this publication. The tools are controlled simulations,
not live purchases or search results.

## E07: Early Response Pilots

Source locators:

- `docs/CONTINUE.md`, September 5 structured-understanding result
- `data/medical-response-corpus/afrihealth-response-run.v1.summary.json`
- `data/medical-response-corpus/afrihealth-annotated-pilot.v1.summary.json`
- `docs/medical-response-pilot.md`
- `docs/CONTINUE.md`, September 8 pilot results and September 9 close-out

Supports the Qwen2.5-3B symptom-model test results, MiniCPM bilingual response
comparison, and 95-source annotated pilot. The first has a constant intent
label. The pilot's semantic labels were uncalibrated. Product checks are small
project diagnostics, not clinical accuracy estimates.

## E08: Foundation and Early Adaptation Comparisons

Source locators:

- `docs/foundation-comparison-20260909.md`
- `docs/language-adaptation-20260909.md`
- `docs/response-adaptation-20260910.md`
- `docs/afrique-response-v3-20260910.md`
- `docs/native-understanding-v5-20260910.md`
- `docs/stronger-foundations-20260910.md`
- `docs/balanced-afrique-v6-20260910.md`
- `data/response-adaptation/greeting-v6-decision.json`
- `docs/morena-baseline-evaluation-20260921.md`

These records distinguish complete outputs, partial evaluations, stopped
training, infrastructure faults, private auditions, and later corrections
to the evaluator's own interpretation. In particular, the MORENA document
is an evaluation plan, not evidence of a completed score.

Selected pinned identities:

| Model role | Model | Revision |
| --- | --- | --- |
| Qwen instruction control | `Qwen/Qwen3.5-9B` | `c202236235762e1c871ad0ccb60c8ee5ba337b9a` |
| Base-model NLI control | `Qwen/Qwen3.5-9B-Base` | `68c46c4b3498877f3ef123c856ecfde50c39f404` |
| Afrique 9B CPT | `McGill-NLP/AfriqueQwen3.5-9B-50Langs` | `4358dcbc062421751174279da1efe9f88f85e1d5` |
| Gemma instruction/correction checkpoint | `google/gemma-4-31B-it` | `842da3794eaa0b77d5f08bae87a17459d91ff475` |

Model identity is not an endorsement. Multiple earlier comparisons change
more than one variable; their results do not establish a causal ranking.

## E09: Early Synthetic Understanding Scorecard

Source locators:

- `data/understanding-benchmark/scorecard.v0.json`
- `data/understanding-benchmark/rubric.v0.json`
- `docs/understanding-research-report-2026-08-28.md`

The report's filename is August 28, but its consolidated hosted-model results
include August 29 runs. Article 4 therefore labels this an August suite rather
than implying every result was available on August 28.

The numbers are literal-rubric outcomes over 50 probes and 138 checks. Hosted
model revisions are unresolved. Prompt hints, lexical false negatives, and
context-sensitive meanings prevent interpreting the old "meaning score" or
`exact_cases` field as independent semantic accuracy.

## E10: Later Alignment and Language Runs

Source locators:

- `docs/stage1-alignment-run-20260928.md`
- `docs/native-adaptation-20260930.md`
- `docs/CONTINUE.md`, October 2 completed-native-pass entry
- `tmp/native-adaptation/v1-20260930.attempt3.report/README.md`
- `tmp/native-adaptation/v1-20260930.attempt3.report/results.json`

Alignment input manifest:

```text
ae656db3e477047ccb9405780b23a877ccccfec9073b48e4a95a4a3498d0691b
```

Native-adaptation input manifest:

```text
debd2a0edd9090d47bdbe42365e8179393e2a6c968e60862d4bcb3fd79161f55
```

Completed native adapter:

```text
7327a77f63d7c09cc710143e4ca7a2fcf5c08e8039986d7056b36289b1db48f9
```

Completed report `results.json` byte hash, recomputed for this article:

```text
1ad1af7ea01bfa09c4f795eb2374d4f5bdaca465712bd3d393307f038928db4c
```

The final report supersedes earlier active/submitted notes. It explicitly
records a false advancement gate and false production eligibility despite
lower Twi and English prediction loss.

## E11: October Response Training

Source locators:

- `docs/response-sft-results-20261009.md`
- `tmp/response-release/v3-20261003.attempt1.report/manifest.json`
- `tmp/response-release/v3-20261003.attempt1.report/metrics.json`

Input manifest:

```text
fea07e436e000bf9deb6b3934439cddda8706b91805f769d195914fa9488372f
```

Adapter:

```text
3360468ccf9e0686220df09bb483e6e52a82b566a9d85c94ec3aa631be4b17cf
```

Metrics byte hash, recomputed for this article:

```text
59e5c37b6eb272b08f2282f12157eba89e96c18e6c9abe535c3c2631ad9c3332
```

The report preserves paired outputs, model-specific conversation histories,
and the rejection decision. Semantic human review is incomplete. The recorded
loss ratios are not native quality scores or an independent unseen test.

## E12: Annotation and Correction Qualification

Source locators:

- `docs/response-quality-qualification-20260930.md`
- `docs/native-answer-synthesis-20260910.md`
- `docs/corpus-readiness-20261010.md`, reference-annotation qualification
- `docs/grounded-correction-qualification-20261010.md`

Selected manifests:

| Evidence package | SHA-256 |
| --- | --- |
| Qwen235 bilingual critic | `5856e8b07ab0506bd673103a4095c2b50c463790c964ef427b8cc185ffa66461` |
| SSA-COMET-QE diagnostic | `19eef77ed33146f90be8bacbf5a70ccd3d29174a71482094aabc75cf06596900` |
| Source-grounded Gemma correction review | `dc27e2a6566fea2cb59e546e1254a2eb8ec985fb8919659817b5e3e60c16b275` |

The Qwen critic used revision `e156cb4efae43fbee1a1ab073f946a1377e6b969`.
The reference annotation run used `openai/gpt-oss-120b` revision
`b5c939de8f754692c1647ca79fbf85e8c1e70f8a` on Modal, not a hosted OpenAI
annotation call. The QE run used `McGill-NLP/ssa-comet-qe` revision
`e999f0cc50ce030981925ba262a4a850ab60d0a8` and the pinned AfriMTE-WMT2024
English-to-Twi test material. Those benchmark groups stay protected.

Failure of a qualification run is evidence against scaling that unchanged
method, not proof that every possible teacher or correction method must fail.

## E13: Historical Speech Diagnostics

Source locators:

- `docs/CONTINUE.md`, ASR/DONDO handoff and English-retention measurements
- `docs/foundation-comparison-20260909.md`, voice comparison and streaming sections

The ASR figures in Article 4 are historical report-level measurements. They
were not recomputed from private audio for this publication. Local, WAXAL,
Common Voice, training-validation, and eight-clip holdout results are deliberately
kept separate. The very small language-model-assisted holdout result is not
a robust estimate of production recognition quality.

The TTS reference was owner-authorised for private experiments. Only aggregate
diagnostics and timing measurements are published here, not the reference,
generated audio, speaker embeddings, or local listening records. The selected
voice preference applies to one comparison, not every sentence or speaker.

## What Was Checked Again for This Publication

On 16 October 2026:

1. Read the current execution ledger, source reports, result summaries, and
   final native/response result files rather than relying on historical
   "submitted" notes.
2. Recomputed the selected manifest/result hashes listed above.
3. Reran the focused working-correction/consolidation regression suite:
   **67 tests passed**.
4. Checked publication link targets, JSON consistency, numeric reconciliation,
   and graph syntax before submitting the article changes.

The focused command, from the implementation repository's `scripts` directory:

```sh
python -m unittest \
  test_instruction_consolidation \
  test_instruction_working_corrections \
  test_response_corrections \
  test_response_repairs \
  test_instruction_reference_recovery
```

The articles repository also includes a dependency-free metadata/link check:

```sh
node ghana-health-ai/evidence/verify.mjs
```

It checks local links and heading targets, balanced code fences, and the
checkpoint's aggregate arithmetic and status invariants. It does not inspect
private corpus rows, score models, validate every prose claim, or render Mermaid.
The three Mermaid diagrams were separately parsed during publication checks.

Earlier reported suites with different totals overlap; they must not be added
to claim a larger number of distinct tests. This publication did not rerun
training, perform a new semantic evaluation, review every corpus row, verify
current production routing, or assert that the full application CI is green.

## Update Rules

The [22 October checkpoint](checkpoint-20261022.json) supersedes the correction
counts, not the historical benchmark results. Article 7 describes D50/E49 and
D51/E50, 23 new source replacements, two old-target revisions, scoped Paris
phrase feedback and two unchanged unavailable-source examples. No new model
evaluation is inferred from those changes. The private implementation report is
`ghana-health-ai/docs/corpus-checkpoint-20261022.md`; its two manifest identities
are reproduced in the dated metadata without exposing corpus contents.

- Advance the evidence cutoff only when new work has an actual result.
- Preserve historical metrics and record changed evaluation contracts separately.
- Keep proposal, automatic screen, native review, and training admission distinct.
- Refresh both prose and the checkpoint JSON when a node closes.
- Publish licensed research artifacts separately when authorised; do not use an
  article update to quietly release private source data or trained weights.
