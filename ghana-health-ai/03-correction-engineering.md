# Repairing Training Data Without Rewriting History

[Series index](README.md) | [Previous](02-four-collections.md) | [Next](04-benchmarks.md)

**Checkpoint: 11 October 2026. Verification revisit: 16 October 2026.**

This article preserves that historical snapshot. See the
[20 October correction checkpoint](06-corpus-correction-checkpoint-20261020.md)
for subsequent execution, current counts and remaining work.

## A Correction Is More Than a Better-Looking Sentence

A dataset correction needs an identity, evidence, an exact target version,
and a defined effect on future exports. Otherwise it can be lost between a
review screen and a training job, applied to the wrong source, or mistakenly
treated as human approval.

The working design separates four objects:

1. **Original source:** unchanged text, source identity, revision, and hash.
2. **Finding:** the particular defect or uncertainty observed in an exact version.
3. **Correction:** a derivative with before/after text, operations, and evidence.
4. **Decision:** an explicit assessment or admission event bound to that version.

These objects are related, not interchangeable. Applying a correction does not
erase the old finding. Passing a software test does not create a native review.
An approval of one proposal must not silently attach to its later replacement.

## First Distinguish Where an Error Came From

Several examples had become conflated in discussion:

| Error family | What the evidence actually showed | Required response |
| --- | --- | --- |
| Beans rendered as cassava | Present in an original instruction target and retained by a correction model | Repair the working target; do not attribute the original defect to the new run |
| Shopping-order verification rendered as checking documents | Existing source-target meaning defect | Correct the complete request and answer in context |
| Technical data rendered as food | Introduced by a fresh Gemma output | Reject that generated alternative; do not claim it was the original corpus wording |
| First-person versus third-person mismatch | A deliberately constructed diagnostic case | Use it to qualify a method, not to claim discovery of that exact natural corpus defect |

This distinction determines what can safely be changed. A failed translator is
not evidence that the original source is wrong. A correct English reference
does not imply that the Twi is correct. And an English source answer can itself
contain a faulty fact, omitted context, or broken task constraint.
[E04](evidence/README.md#e04-applied-working-corrections)

## Node A: Materialise the Corrected Working Corpus

The first completed node operated over **all 52,002 selected instruction
records**, not a handful of examples and not the entire million-row inventory.
It produced a working view with full English references, original Twi, corrected
Twi, source identities, restrictions, and reversible edit records.

### Apply the Complete Proposals That Already Exist

There were 24 source-bound complete corrections. Application required exact
source and English-reference matching plus the existing literal constraints.
The pass checked 90 such constraints before materialising those proposals.

Literal constraints can establish that a required quantity, code fragment,
or output length is retained. They cannot independently establish that every
sentence is natural or that an answer is factually sound. The proposals remain
separate from a native-review decision.

### Remove False Empty Inputs Conservatively

A serialization defect had turned missing context into the literal string
`nan`. The rule clears it only when the English reference confirms that the
context is genuinely empty. A numerical example discussing NaN is not cleared.

The completed pass removed **31,323 false markers**: 31,311 direct rule
applications plus 12 removals already included in complete corrections.
This is a large mechanical improvement. It is not 31,323 semantically repaired
answers.

### Make Narrow Terminology Repairs, Not Global Replacements

The partial repair rule targets explicit black/white food-bean references in
paired English and Twi fields. It excludes cases involving cassava, coffee,
cocoa, idioms, language exercises, and other ambiguous contexts.

This affected **42 fields in 37 additional records**. The narrow scope matters:
globally replacing a word for cassava would corrupt passages genuinely about
cassava. Even the targeted repair does not validate every other ingredient,
instruction, or factual statement in a recipe.

### Account for Overlap

| Measure | Result |
| --- | ---: |
| Instruction sources accounted for | 52,002 |
| Complete existing corrections applied | 24 |
| Additional partially corrected records | 37 |
| Substantively edited records | 61 |
| False empty markers removed | 31,323 |
| Unique changed records, including mechanical edits | 31,344 |
| Protected records | 26,509 |
| New training admissions | 0 |

The changed-record total is a union, not a sum. Complete corrections can also
remove an empty marker. Partial edits can overlap mechanical edits. The
26,509 protected records include exclusion and holdout restrictions; they
must not all be described as one clean test set.

Protected derivatives can be inspected, but their corrected copies do not
become new training examples or replacement benchmark answers. Original
evaluation files remain unchanged.

## Detection Rules Produce Candidates, Not Accuracy Scores

The pass scanned instruction, context, and answer fields for three error
families. Original field matches were 148 for beans/cassava, 161 for
order/documents, and 92 for data/food. Remaining matches were 115, 160, and 92.

Those numbers are not counts of confirmed errors. A legitimate answer about
food data can contain both terms. A partially fixed passage can still contain
another occurrence that needs context. The resulting **385-source pattern
queue** is an inspection aid, not a corpus-level semantic metric.

This limitation explains why the next inspection cannot be restricted to the
flagged queue. A detector that finds familiar errors can miss different ones.

## Node B: Turn Overlapping Queues Into One Worklist

By this point, sources appeared in multiple places: old repair queues,
quarantine, language screens, pattern matches, and newly edited views. Summing
those lists exaggerated the amount of distinct work and risked applying
incompatible decisions.

Node B consolidated **3,736 input memberships** while leaving both original
and working text unchanged:

| Selected input | Memberships |
| --- | ---: |
| Working-copy pattern queue | 385 |
| Substantive corrected view | 61 |
| Previous response repair queue | 382 |
| Previous quarantine | 1,700 |
| Language-screen review | 328 |
| Language-screen protected findings | 880 |
| Total | 3,736 |

Of those memberships, **2,737** concern instruction records and resolve to
**1,848 distinct instruction sources with direct findings**. They split into
674 nonprotected work items and 1,174 protected/excluded finding sources.
The remaining **999** items are routed intact: 961 conversation messages and
38 English-retention records. They are not additional instruction examples.
[E04](evidence/README.md#e04-applied-working-corrections)

The complete source accounting is:

```text
52,002 instruction sources
  = 26,509 protected or excluded
  +    674 direct correction/review work items
  + 24,819 sources in the unflagged sampling pool
```

Within the 674 work items, 16 already have complete edits, 20 have partial
terminology edits, and 638 have no substantive edit. The other previously
applied edits have not disappeared: they occur among protected/excluded
sources. An existing edit remains visible without being mistaken for approval.

## Identity and Restriction Propagation

The consolidation rejects stale source hashes, changed originals, conflicting
English references, duplicate queue entries, and stale working corrections.
It reconstructs originals from the working package and its patch history
instead of trusting a row's latest label.

Restrictions follow connected source aliases and exact original-text
duplicates. Renaming a source, presenting its reverse translation direction,
or retaining a related version must not let it cross into training from a
protected group.

The current run reported zero exact-original source-hash duplicate sets.
That does not establish the absence of paraphrases or all near duplicates.
The graph policy still matters for existing source aliases and future inputs.

Older findings remain attached to the text version that produced them.
Consolidation does not declare a finding resolved merely because some field
has changed. Node B added **zero new corrections, resolved semantic findings,
human approvals, model calls, or training admissions**.

## What the Artifact Contains

The versioned consolidation package includes:

- A populated correction queue with complete references, current working text,
  original text, applied operations, and accumulated findings.
- A separate protected-findings file.
- Full source accounting for all 52,002 records.
- A membership ledger preserving all 3,736 input appearances.
- A compact unflagged sampling pool for the next inspection.
- An intact handoff for conversation and English-retention findings.
- A report, dataset card, and manifest.

Public source material remains referenced by pinned provenance. Large derived
artifacts live in private research storage rather than being copied into
application database rows. Review decisions are small version-bound events.
The isolated corpus reviewer uses an independent append-only journal; it does
not need to rewrite the original source ledger when a reviewer makes a choice.

## Verification Must Check More Than a Checksum

A checksum detects a byte change relative to a known value. It does not tell
us whether the new bytes are correct. An attacker or faulty script can change
both a file and its declared checksum.

The verifiers therefore reconstruct expected outputs from pinned parents,
source evidence, correction specifications, and versioned builder code. Tests
include attempts to tamper with outputs and rehash them. The intended check is
whether the artifact follows the specified transformation, not merely whether
its self-declared manifest is internally tidy.

The focused correction/consolidation suite has **67 tests**. It passed again
on 16 October while preparing these articles. The scope includes stale-source
rejection, exact matching, marker distinctions, protected-group propagation,
membership accounting, correction-version checks, immutable output versions,
and tamper rejection. This is not a full application CI run and not a Twi
quality score.

The private storage receipts record eight verified files for Node A and nine
for Node B. Upload success alone was not the closure criterion; read-back
hashes were checked against the local artifacts. The article-preparation
pass inspected the saved receipts rather than rerunning a remote upload.

## Resumability Is Part of the Research Method

A restart must not repeat completed model requests, overwrite a frozen output,
or duplicate source membership. The project uses immutable version directories,
saved submission receipts, exact artifact identities, and separate status
inspection from submission.

That distinction also prevents a disconnected client from being mistaken for
a cancelled GPU job. Historical infrastructure failures stay separate from
model-quality failures. Neither a new process ID nor another successful upload
counts as a new scientific result.

The resulting system is a usable repair foundation. It does not yet establish
a qualified large Twi response corpus. That next step requires complete-example
inspection and correction, explicit decisions, and an export whose targets
are demonstrably the versions we meant to train on.

[Next: Benchmarks, experiments, and negative results](04-benchmarks.md)
