# From Corrections to Training Admission, Without Skipping the Export Gate

**Started:** 22 October 2026. **Updated:** 24 October 2026.
**Checkpoint:** F/G/I/J complete for the selected queue; V6 sealed with 333 eligible sources and 366 exclusions.
**Scope:** Selected instruction sources, private noncommercial research only.

## What Admission Changes

[Article 7](07-closing-the-correction-queue-20261022.md) closed the repairable
queue at D51/E50: **699 originals, 669 replacements, 28 retained examples and
two unavailable-source holds**. The 697 complete targets received exact-version,
same-agent E passes. That established a correction checkpoint, not permission
to train on every passing target.

F/G now records a decision for every original: **696 provisional research
admissions and three exclusions**. The two unavailable sources remain excluded.
A meal-plan example also remains outside admission because its decision
explicitly requires specialist assessment. A meaning pass cannot erase that
requirement.

The admitted task distribution is:

| Task kind | Provisional sources |
| --- | ---: |
| Language exercises | 355 |
| Twi prose | 287 |
| Code exercises | 39 |
| Literal labels | 14 |
| Literal structure | 1 |

These five categories total 696. They describe the admission ledger, not final
export counts. Language exercises, code and literal outputs must not be
represented as natural conversational coverage.

## An Exact-Target Decision, Not a Quality Certificate

Each admission binds the original source, target, reference, E assessment,
task type and recorded limitations. Where an English reference was corrected,
the derivative and its adjudication remain separately identified. The original
reference is preserved rather than overwritten by a more convenient account.

Saved review objections must remain visible. The earlier human phrase
confirmation stays narrow: it does not become approval of a complete example.
This pass records **zero human whole-example approvals**, with no independent
native or clinical certification.

Admission is explicitly provisional. Duplicate, holdout and inherited-family
checks may revoke it before J. The distinction prevents a plausible corrected
answer from bypassing protections attached to its source history.

## The Protection Bug Caught Before Sealing

An earlier export attempt was stopped unsealed after a holdout-family audit.
The important failure mode was inherited protection: a comparison row labelled
`train` could nevertheless belong to a protected family through an alias or
a relationship discovered later.

Discarding its shared-span evidence too early would lose a valid exclusion.
The corrected mechanism retains overlap witnesses, resolves the family graph,
and then checks direct and inherited protection. Exclusion also propagates
through related candidate families. Regression cases cover train-labelled
protected aliases and protection discovered through a later relationship.

This was a bug caught before a release seal, not evidence of a clean final
dataset. The repaired mechanism subsequently finished its full scan and
independent reconstruction, as reported below.

## Comparing More Than the Corrected Answer

The export inventory pins **98 inputs**, including manifests, source records,
derived collections, holdouts and tokenizer files. It includes the complete
**1,178,118-record legacy ledger as comparison material, not newly admitted
training data**. Required coverage is checked; an incomplete inventory cannot
be treated as a successful smaller scan.

Candidate comparisons include original Twi, corrected targets, original English
references and corrected-English derivatives. Looking only at the latest answer
could miss a relationship carried by an earlier version. Source identities,
group aliases and explicit related-source links supplement textual evidence.

The candidate-focused index checks exact text, every contiguous eight-word
span, and five-word shingle similarity. Near screening uses Jaccard at least
0.82 or containment at least 0.90, with at least 20 words on both sides.
These are lexical rules, not semantic paraphrase detection. Conservative
exclusions remain traceable. Resource limits fail closed rather than silently
skipping comparisons and allowing a seal.

## Export the Task That Was Actually Reviewed

The exporter produces separate task-specific message and token files, with
source accounting, overlap evidence, a schema, dataset card and configuration.
It does not silently concatenate the five categories into a conversation
corpus or add English references as response-training rows.

Encoding uses the pinned native chat template and assistant loss masks.
System and user tokens are excluded from loss; the final assistant completion
and native end-of-turn are supervised. Target round-trip checks guard against
losing answer content at those boundaries.

The sequence limit is **4,096 tokens, with no truncation**. Overlength examples
are excluded with a reason, not shortened until they fit. Tokenizer compatibility
is an encoding measurement, not selection of a winning base model. Changing
the tokenizer or template requires fresh validation; training mixtures and
separately admitted English-retention data remain later decisions.

## Reconstruction Before a Seal

Final verification requires more than matching existing files to their recorded
hashes. A fresh process reconstructs the export from pinned inputs and compares
the complete artifact set and bytes. Source, implementation and runtime
identities are bound, with checks for changes during construction and replay.
A seal follows successful reconstruction, not merely a populated output folder.

Saved private-backup receipts cover F/G, its input snapshot and the comparison
inventory, recording remote read-back hash checks. Those backups do not imply
that the active export is finished or backed up. They disclose no private rows
and grant no new publication or commercial rights.

## Making the Full Check Resumable

The fourth attempt stopped at a combined resource guard after more than
1.4 million comparisons. It produced no seal. The guard combined elapsed time,
evidence count and witness count, so the error did not identify which resource
was exhausted. Repeating that implementation unchanged would waste the same
work without resolving its operational weakness.

The fifth attempt commits each 250-record batch into a transactional SQLite
journal. The cursor and matching evidence commit together; a crash can require
repeating an unfinished batch, but not previously committed work. Every batch
binds its source, cursor interval and compressed payload to a checksum. Resume
checks the full input inventory, implementation and runtime, journal integrity,
source counts and continuous batch sequence. A concurrent writer is refused.

We verified a deliberate stop at 1,000 records and resumed from that exact
cursor. Unit cases also cover a transaction failure, changed inputs, corrupted
evidence, altered cursors, empty sources, compressed-file seeking, and equality
between uninterrupted and resumed results. These are engineering tests, not
linguistic evaluations.

Evidence is now retained on disk rather than bounded by a cumulative in-memory
match count. The exact, near and shared-span criteria are unchanged. An explicit
disk bound still stops safely with the last committed cursor intact. Time slices
checkpoint rather than discard the run. All planned comparisons must complete
before protected-family closure; no limit converts an incomplete scan into a
successful release.

The initial scan and fresh-process reconstruction use separate journals.
Consistent online snapshots can be backed up while scanning continues. Private
Modal receipts record remote read-back hashes for those snapshots, review-map
data and an allowlisted research-source archive. They exclude credentials and
do not upload the corpus publicly.

The complete journal grew to approximately 860 MiB, larger than the backup
tool's unchanged 256 MiB single-package bound. A new snapshot format divides
it into 64 MiB parts with an ordered, hash-bound index. Restore checks every
part and the assembled snapshot, then validates all batch hashes and cursors
before exposing a new file. It never overwrites an existing journal. A restore
of the real full-size snapshot succeeded, retaining all 1,520,077 comparisons.
At that point the expanded instruction suite passed 511 tests; nine cover the part/restore
format, including corruption, reordering, missing parts and false count metadata.

## Final Outcome: Sealed Research Partition

The V5 parent scan completed **all 1,520,077 planned comparison records across
62 sources**. All 30 files in the
complete 14-part snapshot and its index have matching remote hash receipts;
the real full-size restore also passed. V5 finalization was stopped unsealed
after a second checker defect was found: 436 preserved original input fields
contain the literal missing-value marker `nan`, while their pinned English
input is empty. The earlier correction pass already knew these represented
missing context. Comparing the marker as meaningful text generated spurious
exact matches and could wrongly exclude corrected examples.

V6 removes only that standalone missing-input field from the candidate matching
index. It preserves source bytes, genuine NaN in instructions or answers,
real supplied context, other short labels and all matching thresholds. It
reuses verified unaffected batches and rechecks affected raw rows. Simply
deleting the false strongest match would be unsafe: it may have hidden a real
weaker overlap. Tests demonstrate that such genuine witnesses survive and that
resumed rechecking produces the same results as a cold comparison. All 522
instruction tests pass, including 11 focused marker/recheck cases.

**`release-v6-20261024` is sealed.** The independent cold reconstruction read all
1,520,077 comparison records without parent scan results and reproduced all
18 export artifacts byte for byte. The normal seal verifier also passed.
The recovered initial build reused 1,443,497 verified parent comparisons and
rechecked 76,580 affected raw records. Agreement with the full cold scan verifies
that this recovery did not omit a hidden genuine witness.

The final ledger accounts for all 699 sources: **333 eligible and 366 excluded**.
Of the exclusions, 363 involve protected overlap or related families, one is the
specialist-admission hold, and two have unavailable linked sources. Within the
363, 362 have protected-text witnesses and one is excluded through its family.
These conservative lexical rules can exclude otherwise usable examples; their
evidence remains available instead of being waived to enlarge the export.

| Training partition | Sources | Assistant tokens | Full sequence tokens |
| --- | ---: | ---: | ---: |
| Twi prose | 86 | 18,752 | 26,208 |
| Language exercises | 220 | 25,045 | 43,893 |
| Code exercises | 17 | 5,161 | 6,813 |
| Literal labels | 9 | 373 | 1,049 |
| Literal structure | 1 | 62 | 197 |
| Total | 333 | 49,393 | 78,160 |

The export contains 332 related families, zero exported holdout conflicts under
the recorded rules, zero duplicate final messages and zero truncated targets.
All rows remain explicitly source/agent-derived synthetic material. They do not
become human gold or 333 natural conversations. No new multi-turn histories or
English retention examples were added. Original sources and saved reviews remain
unchanged. The 696 provisional F/G admissions are not the final training count.

The dataset card, five message/token partitions, source ledger, overlap evidence,
schema, configuration and checksums are preserved in private research storage.
The release, complete replay snapshot and final review projection have 26 files
whose remote bytes were read and hash-verified. The full-size parent snapshot
also has a tested recovery path. No private corpus rows are published here.

Manifest: `0cd8d8ddb3b63e6cc3cbd92efeb2ce55d1c1c1e17baa8d7f3bf5bf52142c501c`.
The [dated metadata](evidence/checkpoint-20261024.json) preserves these counts
and the report hash. This is an integrity and admission result, not a new
language-quality score.

The next training decision should treat this as one explicitly weighted
instruction partition, with separately admitted English retention and independent
evaluation of meaning, naturalness, repetition and English regression. Its size
and task mix do not justify expecting general conversation quality from training
on it alone. A base model and curriculum remain separate, evidence-led choices.

No training or new model evaluation is reported. This is not four-collection
completion or evidence of model improvement. [Historical benchmarks](04-benchmarks.md)
remain unchanged.

## Evidence Boundary

The [evidence ledger](evidence/README.md) and [D51/E50 metadata](evidence/checkpoint-20261022.json)
retain their earlier scope. New evidence was read from the implementation
checkout's `tmp/instruction-admission/fg-v1-20261022/report.json`, export input
inventory, saved storage receipts, exporter and regression cases. Those private
source locators are not public dataset downloads.
