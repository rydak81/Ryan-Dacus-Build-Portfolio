---
name: pipeline-steward
description: >
  Maintenance loop for this repo's skills and data pipeline: audit skill definitions
  and Python for faults, run evals with repeats to measure output-consistency
  variance, and log findings so the next run starts from what the last one learned.
  Use this skill whenever the task involves checking whether the skills or the data
  pipeline still work — "audit the skills", "why is this skill flaky", "measure
  variance", "the refresh job is failing", "is the pipeline healthy", "improve this
  skill" — and also before editing any SKILL.md or ingestion script, so changes are
  measured rather than guessed at. Use it after any pipeline change to confirm
  nothing regressed.
---

# Pipeline steward

A maintenance loop over the repo's own tooling. It answers two questions: *is
anything broken right now*, and *did the last change make things better or just
different*.

## Two things this skill is not

**It is not a variance minimizer.** Output variance is a diagnostic, not the
objective. An eval that passes half the time is reporting that the same inputs
produced different outcomes, which means an instruction is ambiguous — a real,
locatable fault. But a skill that fails identically every run has *zero* variance
and no value. So the objective is pass rate, and variance is how you find the
ambiguity. If you ever find yourself tightening instructions to suppress spread
without pass rate improving, stop: you are overfitting to the eval set, and the
skill will be worse on the inputs you did not test.

**It does not learn.** Skills are static markdown read into context. Nothing
adapts, no weights change. What `findings.py` provides is an append-only log that
each run reads before starting, so prior conclusions arrive as input. Behavior
genuinely does improve across runs — but through accumulated notes and retrieval,
not learning. Say it that way when describing it; the difference is the first thing
a technical reader will probe.

## The loop

### 1. Read the log first

```bash
python3 .claude/skills/pipeline-steward/scripts/findings.py read
```

Do this before looking at any code. Half the value of the log is not re-diagnosing
something a previous run already understood, and the other half is noticing that a
finding marked resolved has come back — which means the fix addressed a symptom.

### 2. Audit for static faults

```bash
python3 .claude/skills/pipeline-steward/scripts/audit.py
```

Checks every skill and Python file for the faults that are cheap to find and
expensive to hit in production: frontmatter that won't register, a `name` that
disagrees with its directory, a description too terse to trigger, SKILL.md pointing
at a path that no longer exists, scripts nothing references, syntax errors, bare
`except:`, and HTTP calls without a `timeout=` that would hang a scheduled job
indefinitely.

`--fail-on warn` tightens it for CI. `--json` emits findings for piping into the log.

Exit 1 means at least one error. Fix errors before measuring anything — there is no
point benchmarking a skill whose instructions reference a missing file.

### 3. Run evals with repeats

Variance needs repeats. One run per eval tells you nothing about consistency, so
spawn each eval **at least 3 times** per configuration, and prefer 5 when a result
will drive a decision.

Use subagents, one per rep, all in the same turn so they finish together. Each gets
the eval prompt and writes `grading.json` into its own rep directory:

```
<workspace>/iteration-N/
  <descriptive-eval-name>/
    with_skill/rep-1/grading.json
    with_skill/rep-2/grading.json
    with_skill/rep-3/grading.json
    without_skill/rep-1/grading.json
```

`grading.json` uses skill-creator's schema — `{"expectations": [{"text", "passed", "evidence"}]}`.
The field names matter; `variance.py` and skill-creator's viewer both depend on them.

Always run the baseline. A skill that scores 80% means nothing until you know the
no-skill baseline wasn't already 80%.

### 4. Analyze

```bash
python3 .claude/skills/pipeline-steward/scripts/variance.py <workspace>/iteration-N
```

Reports pass rate, Bernoulli variance, and a 95% Wilson confidence interval per
eval and configuration, then flags:

- **flaky-eval** — pass rate in the middle band; an instruction is ambiguous
- **always-failing** — 0% with zero variance; the skill or the assertion is wrong
- **wide-interval** — the CI is too wide to support any conclusion; add reps
- **insufficient-reps** — fewer than `--min-trials`; variance is unmeasurable
- **non-discriminating-assertion** — passes 100% with *and* without the skill, so it
  cannot detect a regression and is inflating the score

Why Wilson rather than the usual pass-rate-plus-or-minus: the normal approximation
reports 3/3 as `[1.00, 1.00]`, claiming certainty from three observations. Wilson
reports `[0.44, 1.00]`, which is the truth. See `references/variance-method.md` for
the arithmetic and for how many reps a given decision actually needs.

### 5. Adjust one thing, then re-measure

Change one thing per iteration. If you fix three ambiguities at once and the pass
rate moves, you have learned nothing about which fix mattered — and ambiguity fixes
sometimes trade against each other.

Prefer explaining *why* an instruction matters over adding another imperative. A
model that understands the reason generalizes to inputs the eval set never covered;
one following a rule it cannot see the point of will satisfy the letter and miss it.

### 6. Log what you concluded

```bash
python3 .claude/skills/pipeline-steward/scripts/findings.py add \
  --kind flaky-eval \
  --summary "audit-flags-missing-script passes 50% -- 'missing path' wording ambiguous" \
  --recommendation "state that a path is checked against the repo root, not cwd"

python3 .claude/skills/pipeline-steward/scripts/findings.py resolve \
  --summary "make_fixtures.py now documented in market-data-ingest/SKILL.md" \
  --evidence "audit.py clean at warn level"
```

Log the reasoning, not just the symptom. "Pass rate was 50%" is worth almost nothing
to the next run; "the instruction said 'check the path' without saying relative to
what" is worth the whole entry.

## When to stop

Stop when pass rate is where you need it and the remaining variance has an
understood cause. Do not keep iterating toward zero spread — past a point you are
only memorizing the eval set. If a pass rate plateaus below target and no further
ambiguity is findable, the honest conclusion is that the task is genuinely hard and
the skill has a real ceiling. Record that in the log and stop.

## Pipeline health

The data side has its own gates; this skill checks that they ran, not what they
contain. For envelope validation and freshness see `.claude/skills/market-data-ingest/SKILL.md`.
Quick staleness check:

```bash
python3 .claude/skills/market-data-ingest/scripts/validate.py --freshness --max-age-hours 30
```

## Reporting

State: errors and warnings from the audit, pass rate with its confidence interval
per eval, which findings were new versus recurring, what single change you made, and
what you deliberately left alone. A recurring finding is the most important thing in
the report — it means a previous fix missed the cause.
