# What Is Actually in the Corpus

[Series index](README.md) | [Previous](01-research-journey.md) | [Next](03-correction-engineering.md)

**Written 16 October 2026. Counts are dated snapshots, not a live inventory.**

This article preserves the original research snapshot. See the
[20 October correction checkpoint](06-corpus-correction-checkpoint-20261020.md)
for subsequent execution, current counts and remaining work.

## Start With Units, Not Headlines

The source inventory has 1,178,118 rows, the instruction working collection has
52,002 records, and a response experiment used 21,170 training examples.
These figures answer different questions. They are not competing estimates
of one dataset and should not be summed.

| Unit | Meaning in this programme |
| --- | --- |
| Source row | A record recovered from a pinned source |
| Source group | Connected records that must share restrictions and split boundaries |
| Training view | A task-specific presentation of a source, such as one translation direction |
| Conversation history | An ordered source-linked path with roles and context preserved |
| Queue membership | One appearance of a source in a particular audit or correction list |
| Content token | A tokenizer-specific count excluding some or all formatting overhead |
| Supervised token | A token actually exposed to the selected training objective |
| Admission | An explicit decision that an exact version may enter a specified training export |

Two translation directions are two views, not two independent bilingual
sources. An English and a Twi derivative are not two independent facts. A source
appearing in three audit lists is not three errors or three new records.

The pipeline therefore separates four collections. Their shared lineage is
retained, but their purpose and acceptance criteria differ.

## Collection 1: Language Learning

This collection is for learning language patterns from text. It does not need
invented meanings, intent labels, or assistant answers. Source-backed documents
retain their boundaries. Short useful utterances remain available in a
separate view. Vocabulary remains vocabulary.

The September 29 corrected export accounted for all 44,873 previously
exported language sources: **42,950 retained across train and validation**,
with **1,923 requiring review**. Its training measurements were:

| Training view | Records | Content tokens |
| --- | ---: | ---: |
| Longer prose and transcript records | 9,156 | 370,230 |
| Short sentences and utterances | 7,590 | 86,890 |
| Vocabulary | 25,378 | 278,532 |
| Total | 42,124 | 735,652 |

Validation had 826 records and 14,587 content tokens. The counting tokenizer
was pinned; these are not universal word counts or automatically comparable
with a different model's training-token measurements.

The practical language-volume figure is **457,120 non-lexical training tokens**,
not all 735,652 tokens interpreted as prose. A later source-type supplement
added 23 nonduplicate language records: 13 short utterances and ten lexical
entries. That is useful cleanup, but not a major increase in discourse exposure.
[E02](evidence/README.md#e02-source-inventory-and-stage-capacity)

### Why the Million-Row Inventory Does Not Enter Automatically

The frozen Pristine strata contain **978,351 train and 20,100 validation rows**
awaiting source-quality qualification. They remain separate synthetic material;
a category named Dialogue is not proof of valid user/assistant roles.

The recorded WAXAL disposition has **11,892 protected records and 860 requiring
dialect or quality resolution**. The recorded GhanaNLP speech contribution has
**11,350 train and 229 validation transcripts**. These are contributions within
the existing accounting, not additional independent totals to append to every
table. A transcript is useful language evidence without necessarily being a
conversational answer.

The system does not join unrelated speech fragments into paragraphs, infer
assistant identity from a speaker's biography, or move protected material into
training merely to increase volume. Those choices preserve what each source
can actually support.

## Collection 2: Meaning and Bilingual Alignment

Alignment connects Twi with an existing English reference. Structured
understanding adds appropriate semantic fields: who is involved, what happened,
negation, time, quantity, uncertainty, and conversational function.

Those are different products. A dictionary entry can be a valid lexical pair
without having a conversational intent. A narrative should remain a narrative,
not become an invented patient request. Suggested spelling normalisation must
remain separate from the original.

The September 29 alignment correction accounted for **30,404 original bilingual
sources**:

| Routing | Unique sources |
| --- | ---: |
| Sentence pairs | 5,483 |
| Lexical pairs | 23,096 |
| Recognised short utterances | 7 |
| Grounded QA question pairs | 113 |
| Review-needed | 1,705 |

Thus 28,699 source-preserved pairs existed in the retained views, but most were
lexical. A later type supplement added 26 unique pairs in a separate version;
it did not retroactively change the frozen release. [E02](evidence/README.md#e02-source-inventory-and-stage-capacity)

### A Record-Type Bug Changed the Apparent Training Material

An upstream classifier defaulted to sentence unless a source label contained
dictionary, glossary, or mono. School vocabulary collections did not always
use those labels. As a result, an earlier claim that vocabulary was excluded
from the sentence training view was wrong.

The correction routed **5,114 former sentence records to lexical entries**,
and seven to short utterances. Ambiguous sources stayed in review. Original
text and split identities stayed unchanged. Validation records moved into
lexical or review views did not become training records.

This also changes how results may be compared. A new score on a smaller,
corrected sentence subset cannot be presented as an improvement over an older
score on a different validation population. [E03](evidence/README.md#e03-reference-and-record-type-recovery)

### Recover References Before Generating Them

Of the 52,002 instruction sources, 49,891 already had complete English
references. The other **2,111** were recovered by exact matching to the
original instruction release identified by the translated source's provenance.
No model translated those English fields.

This was not a fuzzy match by row number. It required the exact source Twi
and a unique original English instruction-plus-answer match. Of the recovered
references, 1,386 had nonempty context and 725 had genuinely empty context.
Existing reference/context differences were preserved rather than silently
overwritten. Recovery repaired missing evidence; it did not certify either
the English answer or its Twi translation. [E03](evidence/README.md#e03-reference-and-record-type-recovery)

## Collection 3: Conversation and Direct Responses

This is where the model learns to answer, continue, clarify, correct itself,
and retain context. A meaningful English interpretation is not a substitute
for a Twi assistant target. Neither are thousands of intent labels.

The earlier source-preserved conversation release contained 2,131 English
retention histories, including 879 multi-turn examples, but only 108 short
Twi QA examples with 625 assistant-content tokens. Separately, the October
response run used a much larger translated instruction pool. Neither fact
established broad, coherent Twi multi-turn supervision.

Subsequent recovery joined all **3,200 selected Akan messages into 1,565 complete
histories**, retaining the original source structure. At the October 10
checkpoint, **1,214 histories were protected**, 13 had complete correction
proposals, and 338 other nonprotected histories remained pending. There were
**zero admitted general Twi multi-turn histories** from that repair work.
[E05](evidence/README.md#e05-conversation-recovery-and-repairs)

### Full Histories, Not Attractive Individual Turns

A correction must preserve earlier user information, shared turns, speaker
roles, and the meaning of follow-ups. It cannot repair the latest answer by
quietly deleting the difficult previous context.

Ten new proposals covered 24 original turns, including two four-turn histories.
Five source English answers also needed explicit changes: for example, an
unjustified answer became an acknowledgement of missing information, and a
simulated directory listing retained earlier state. Those revised English
answers are derivatives, not recovered originals.

Two literal simulated-tool outputs were counted separately from ten new
Twi-prose assistant turns. Directory names and JSON payloads do not become
evidence of fluent Twi merely because they occur in an assistant message.

## Collection 4: Health, Commerce, and Tools

Specialisation requires more than attaching a domain label. Health material
needs complete supported answers, distinction between education and individual
assessment, and explicit treatment of unresolved factual contradictions.
Commerce needs actions grounded in an actual catalogue or tool result.

### Health Source Recovery

The full selected Ghana partition of AfriHealth contains **11,116 original
questions and complete answers**, including all 8,809 rows in the earlier
train-labelled structural pass. The current source disposition is:

| Disposition | Twi | Ghana English | Total |
| --- | ---: | ---: | ---: |
| Train-split sources needing work | 957 | 3,211 | 4,168 |
| Development validation | 19 | 73 | 92 |
| Protected | 4,593 | 2,263 | 6,856 |

This supersedes older partition counts without rewriting the old artifact.
Two upstream validation examples had been misclassified by an importer;
protecting their connected groups affected four records. This is a boundary
repair, not evidence that those records had already leaked into a training run.

The package retained **367 historical annotation records across 317 sources**,
including 799 variants. In the train-split queue, 62 sources already had saved
annotations to qualify, while **895 Twi sources still lacked English meanings
for both the question and the full answer**. [E06](evidence/README.md#e06-health-and-tool-material)

The English and Akan files are not proven parallel translations. Matching row
positions would invent a relationship the source does not provide. The source
scope is mainly adolescent sexual and reproductive health; it is not evidence
of broad emergency, paediatric, diagnostic, or multi-turn coverage. No clinical
readiness claim follows from recovering these rows.

The source records also retain unresolved differences between published licence
metadata and earlier registry entries. This series redistributes neither the
dataset nor those private derivatives and does not resolve that discrepancy.

### Commerce and Tool Evidence

There are **45 controlled catalogue cases**, represented as **90 bilingual
candidate histories**, with **210 locally executed and replayed tool results**.
The fixture catalogue has five products. Scenarios cover comparison, location
clarification, and quantity correction.

That is useful executable evidence, but not a live shopping service. There
were no purchases, real offers, or fabricated search results. Twi and English
histories derived from the same case remain linked across splits. Language
frames still need qualification; correct arithmetic alone does not certify
the wording of the final answer. [E06](evidence/README.md#e06-health-and-tool-material)

## The Missing Piece Is Not a Universal Annotation Column

Completeness is task-specific. A clean language document does not need a made-up
intent. A word pair does not need a patient profile. A valid QA answer needs
its supporting question and context, not an arbitrary summary that removes
important qualifications. A tool trajectory needs the actual result it claims
to have used.

The useful completion target is therefore **a qualified export for each
training role**, with explicit coverage and exclusions. It is not a spreadsheet
where every field has been filled with plausible text.

The four collections share source identities and restrictions, but remain
separate so language text is not counted as dialogue and health cannot silently
dominate the general-purpose mixture. That separation turns an inventory into
an experimental resource rather than a collection of interchangeable row counts.

[Next: Repairing training data without rewriting history](03-correction-engineering.md)
