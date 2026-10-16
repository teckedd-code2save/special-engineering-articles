import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const root = resolve(project, "..");
const checkpoint = JSON.parse(readFileSync(join(project, "evidence/checkpoint.json"), "utf8"));
const files = [join(root, "README.md")];

function collect(folder) {
  for (const name of readdirSync(folder)) {
    const path = join(folder, name);
    if (statSync(path).isDirectory()) collect(path);
    else if (extname(path) === ".md") files.push(path);
  }
}
collect(project);

function headings(text) {
  const used = new Map();
  const ids = new Set();
  for (const match of text.matchAll(/^#{1,6}\s+(.+)$/gm)) {
    const base = match[1].toLowerCase().replace(/[^\p{L}\p{N}_ -]/gu, "").replace(/ /g, "-");
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    ids.add(count ? `${base}-${count}` : base);
  }
  return ids;
}

let links = 0;
let diagrams = 0;
for (const file of files) {
  const text = readFileSync(file, "utf8");
  assert.equal((text.match(/^```/gm) ?? []).length % 2, 0, `Unclosed fence: ${file}`);
  diagrams += (text.match(/^```mermaid$/gm) ?? []).length;
  for (const match of text.matchAll(/\[[^\]\n]+\]\(([^)\s]+)\)/g)) {
    const destination = match[1];
    if (/^[a-z]+:/i.test(destination)) continue;
    const [path, anchor] = destination.split("#");
    const target = path ? resolve(dirname(file), decodeURIComponent(path)) : file;
    assert(target.startsWith(root + "/"), `Link escapes repository: ${destination}`);
    assert(statSync(target).isFile(), `Missing target: ${target}`);
    if (anchor) {
      assert(headings(readFileSync(target, "utf8")).has(decodeURIComponent(anchor)),
        `Missing heading: ${destination} in ${file}`);
    }
    links += 1;
  }
}

const w = checkpoint.instruction_working_copy;
const c = checkpoint.consolidation;
assert.equal(w.complete_corrections_applied + w.additional_partially_corrected_records,
  w.substantively_edited_records);
assert.equal(w.direct_marker_operations + w.marker_removals_inside_complete_edits,
  w.false_empty_markers_removed);
assert.equal(w.protected_or_excluded_records + c.nonprotected_work_items + c.unflagged_sampling_pool,
  w.records);
assert.equal(c.instruction_memberships + c.other_collection_items, c.input_memberships);
assert.equal(c.nonprotected_work_items + c.protected_or_excluded_sources_with_findings,
  c.unique_instruction_sources_with_findings);
assert.equal(c.conversation_message_items + c.english_retention_items, c.other_collection_items);
assert.equal(c.work_items_with_complete_edits + c.work_items_with_partial_edits +
  c.work_items_without_substantive_edits, c.nonprotected_work_items);

const h = checkpoint.health_recovery;
assert.equal(h.train_split_review_sources + h.validation_sources + h.protected_sources, h.sources);
assert.equal(h.twi_train_sources + h.english_train_sources, h.train_split_review_sources);
const conversations = checkpoint.conversation_recovery;
assert.equal(conversations.protected_histories + conversations.complete_proposals +
  conversations.other_pending_histories, conversations.histories);
const response = checkpoint.selected_benchmarks.response_20261003;
assert.equal(response.twi_train_examples + response.english_train_examples, response.train_examples);
assert.equal(checkpoint.execution_nodes.A, "complete");
assert.equal(checkpoint.execution_nodes.B, "complete");
assert.equal(checkpoint.execution_nodes.C, "next");
assert.equal(w.new_training_admissions, 0);
assert.equal(c.new_training_admissions, 0);
assert.equal(checkpoint.all_four_collections_ready, false);
assert.equal(checkpoint.reliable_independent_response_model_demonstrated, false);
assert.equal(response.production_eligible, false);

console.log(JSON.stringify({
  markdown_files: files.length,
  local_links_verified: links,
  mermaid_blocks: diagrams,
  aggregate_reconciliation: "passed",
  scope: "Article metadata and local links only; not corpus or model quality. Mermaid rendering is a separate check."
}, null, 2));
