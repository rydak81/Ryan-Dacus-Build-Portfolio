#!/usr/bin/env python3
"""Static fault-finder for the skills and pipeline code in this repo.

Finds the faults that are cheap to detect and expensive to discover in production:
a skill whose description will never trigger it, a SKILL.md pointing at a script
that was renamed, a network call with no timeout that will hang a CI job forever.

Severity drives the exit code. 'error' means fix before merging; 'warn' means a
real smell worth a look; 'info' is context. Exit 1 on any error.
"""

from __future__ import annotations

import argparse
import ast
import json
import re
import sys
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parents[4]
SKILLS_DIR = REPO_ROOT / ".claude" / "skills"
REQUIREMENTS = REPO_ROOT / "requirements.txt"

# Anything that looks like a repo-relative path to a file we own. Used to check
# that SKILL.md's instructions still point at things that exist -- a renamed script
# leaves instructions that fail only when someone follows them.
PATH_PATTERN = re.compile(r"(?:\.claude|data|scripts|lib|app|components)/[\w./-]+")


class Finding:
    def __init__(self, severity: str, where: str, what: str, why: str = ""):
        self.severity = severity
        self.where = where
        self.what = what
        self.why = why

    def to_dict(self) -> dict:
        return {"severity": self.severity, "where": self.where, "what": self.what, "why": self.why}


def read_frontmatter(path: Path) -> tuple[dict | None, str]:
    """Split a SKILL.md into (frontmatter dict, body). Returns (None, text) if absent."""
    text = path.read_text()
    if not text.startswith("---"):
        return None, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return None, text
    try:
        return yaml.safe_load(parts[1]) or {}, parts[2]
    except yaml.YAMLError:
        return None, parts[2]


def audit_skill(skill_dir: Path) -> list[Finding]:
    findings: list[Finding] = []
    rel = skill_dir.relative_to(REPO_ROOT)
    skill_md = skill_dir / "SKILL.md"

    if not skill_md.exists():
        findings.append(
            Finding("error", str(rel), "no SKILL.md", "a skill directory without one is never loaded")
        )
        return findings

    frontmatter, body = read_frontmatter(skill_md)
    if frontmatter is None:
        findings.append(
            Finding(
                "error",
                str(rel / "SKILL.md"),
                "frontmatter missing or not parseable as YAML",
                "without it the skill cannot be registered",
            )
        )
        return findings

    name = frontmatter.get("name")
    if not name:
        findings.append(Finding("error", str(rel / "SKILL.md"), "frontmatter has no 'name'"))
    elif name != skill_dir.name:
        findings.append(
            Finding(
                "error",
                str(rel / "SKILL.md"),
                f"name '{name}' does not match directory '{skill_dir.name}'",
                "the mismatch breaks invocation by name",
            )
        )

    description = (frontmatter.get("description") or "").strip()
    if not description:
        findings.append(Finding("error", str(rel / "SKILL.md"), "frontmatter has no 'description'"))
    else:
        # Description is the whole triggering mechanism. A terse one undertriggers,
        # which looks exactly like the skill not existing.
        if len(description) < 120:
            findings.append(
                Finding(
                    "warn",
                    str(rel / "SKILL.md"),
                    f"description is only {len(description)} chars",
                    "short descriptions undertrigger; name the contexts and phrases that should invoke it",
                )
            )
        if not re.search(r"\buse this skill\b|\bwhenever\b|\bwhen the\b", description, re.I):
            findings.append(
                Finding(
                    "warn",
                    str(rel / "SKILL.md"),
                    "description states what the skill does but not when to use it",
                    "trigger conditions belong in the description, not the body",
                )
            )

    # Every path the instructions mention should resolve, or following them fails.
    for match in sorted(set(PATH_PATTERN.findall(body))):
        candidate = REPO_ROOT / match
        if not candidate.exists():
            findings.append(
                Finding(
                    "error",
                    str(rel / "SKILL.md"),
                    f"references missing path: {match}",
                    "instructions that point at nothing waste a whole run",
                )
            )

    # Scripts that exist but nothing references are either dead or undiscoverable.
    scripts_dir = skill_dir / "scripts"
    if scripts_dir.exists():
        for script in sorted(scripts_dir.glob("*.py")):
            if script.name not in body:
                findings.append(
                    Finding(
                        "warn",
                        str(script.relative_to(REPO_ROOT)),
                        "script is never mentioned in SKILL.md",
                        "it will not be found when needed, or it is dead code",
                    )
                )

    return findings


def audit_python(path: Path) -> list[Finding]:
    findings: list[Finding] = []
    rel = str(path.relative_to(REPO_ROOT))
    source = path.read_text()

    try:
        tree = ast.parse(source)
    except SyntaxError as exc:
        return [Finding("error", rel, f"syntax error at line {exc.lineno}: {exc.msg}")]

    for node in ast.walk(tree):
        # A bare except swallows KeyboardInterrupt and SystemExit along with the
        # error you meant to catch, which turns a cancelled job into a silent pass.
        if isinstance(node, ast.ExceptHandler) and node.type is None:
            findings.append(
                Finding(
                    "warn",
                    f"{rel}:{node.lineno}",
                    "bare 'except:' clause",
                    "catches SystemExit/KeyboardInterrupt too; name the exceptions",
                )
            )

        # An HTTP call with no timeout hangs until the CI runner is killed, and the
        # job reads as 'still running' rather than 'failed'.
        if isinstance(node, ast.Call):
            func = node.func
            dotted = ""
            if isinstance(func, ast.Attribute):
                dotted = func.attr
            if dotted in {"get", "post", "put", "request"} and isinstance(func, ast.Attribute):
                owner = getattr(func.value, "id", "")
                if owner in {"requests", "httpx", "session"}:
                    kwargs = {kw.arg for kw in node.keywords}
                    if "timeout" not in kwargs:
                        findings.append(
                            Finding(
                                "error",
                                f"{rel}:{node.lineno}",
                                f"{owner}.{dotted}() without timeout=",
                                "will hang a scheduled job indefinitely",
                            )
                        )
    return findings


def declared_requirements() -> set[str]:
    """Distribution names from requirements.txt, lowercased with separators folded."""
    if not REQUIREMENTS.exists():
        return set()
    names = set()
    for line in REQUIREMENTS.read_text().splitlines():
        line = line.split("#", 1)[0].strip()
        if not line or line.startswith("-"):
            continue
        name = re.split(r"[<>=!~\[;]", line, 1)[0].strip()
        if name:
            names.add(name.lower().replace("-", "_"))
    return names


# Import name differs from distribution name often enough to need a map. Only the
# ones this repo actually depends on -- a general solution needs package metadata.
IMPORT_TO_DISTRIBUTION = {"yaml": "pyyaml"}


def local_module_names() -> set[str]:
    """Modules importable via sys.path juggling inside a skill, so not third-party."""
    return {p.stem for p in SKILLS_DIR.rglob("*.py")}


def audit_imports(py_files: list[Path]) -> list[Finding]:
    """Flag third-party imports that requirements.txt does not declare.

    An undeclared import passes on any machine that happens to have the package and
    then fails in CI. That is a slow, confusing failure, and it is trivially
    preventable by comparing what the code imports against what we promised to install.
    """
    declared = declared_requirements()
    local = local_module_names()
    findings: list[Finding] = []
    seen: set[tuple[str, str]] = set()

    for path in py_files:
        rel = str(path.relative_to(REPO_ROOT))
        try:
            tree = ast.parse(path.read_text())
        except SyntaxError:
            continue  # audit_python already reports this

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                roots = [alias.name.split(".")[0] for alias in node.names]
            elif isinstance(node, ast.ImportFrom):
                # A relative import never resolves to a distribution.
                roots = [] if node.level else [(node.module or "").split(".")[0]]
            else:
                continue

            for root in roots:
                if not root or root in sys.stdlib_module_names or root in local:
                    continue
                distribution = IMPORT_TO_DISTRIBUTION.get(root, root).lower().replace("-", "_")
                if distribution in declared:
                    continue
                key = (rel, root)
                if key in seen:
                    continue
                seen.add(key)
                findings.append(
                    Finding(
                        "error",
                        f"{rel}:{node.lineno}",
                        f"imports '{root}' but requirements.txt does not declare it",
                        "passes locally wherever the package happens to exist, then fails in CI",
                    )
                )
    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="Emit findings as JSON for the log.")
    parser.add_argument(
        "--fail-on",
        choices=["error", "warn"],
        default="error",
        help="Severity that makes this exit non-zero.",
    )
    args = parser.parse_args()

    findings: list[Finding] = []

    if not SKILLS_DIR.exists():
        print(f"no skills directory at {SKILLS_DIR}", file=sys.stderr)
        return 1

    skill_dirs = sorted(d for d in SKILLS_DIR.iterdir() if d.is_dir())
    for skill_dir in skill_dirs:
        findings.extend(audit_skill(skill_dir))

    py_files = sorted(SKILLS_DIR.rglob("*.py"))
    for path in py_files:
        findings.extend(audit_python(path))
    findings.extend(audit_imports(py_files))

    if args.json:
        print(json.dumps([f.to_dict() for f in findings], indent=2))
    else:
        by_severity = {"error": [], "warn": [], "info": []}
        for f in findings:
            by_severity.setdefault(f.severity, []).append(f)
        for severity in ("error", "warn", "info"):
            items = by_severity.get(severity, [])
            if not items:
                continue
            print(f"\n{severity.upper()} ({len(items)})")
            for f in items:
                print(f"  {f.where}")
                print(f"    {f.what}")
                if f.why:
                    print(f"    -> {f.why}")
        print(
            f"\naudited {len(skill_dirs)} skill(s) and {len(py_files)} python file(s): "
            f"{len(by_severity.get('error', []))} error, {len(by_severity.get('warn', []))} warn"
        )

    threshold = {"error": ("error",), "warn": ("error", "warn")}[args.fail_on]
    return 1 if any(f.severity in threshold for f in findings) else 0


if __name__ == "__main__":
    sys.exit(main())
