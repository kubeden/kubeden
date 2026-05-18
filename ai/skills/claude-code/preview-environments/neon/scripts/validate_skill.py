#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FORBIDDEN = [
    "kube" + "den",
    "txt" + "write",
    "k" + "6" + "nis" + ".dev",
    "registry." + "k" + "6" + "nis" + ".dev",
]


def fail(message: str) -> None:
    print(f"ERROR: {message}")
    sys.exit(1)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def validate_skill_md() -> None:
    path = ROOT / "SKILL.md"
    if not path.exists():
        fail("SKILL.md is missing")
    text = read(path)
    if not text.startswith("---\n"):
        fail("SKILL.md frontmatter is missing")
    frontmatter = text.split("---", 2)[1]
    if "name:" not in frontmatter or "description:" not in frontmatter:
        fail("SKILL.md frontmatter must include name and description")
    if "disable-model-invocation: true" not in frontmatter:
        fail("Claude Code installer skill must be manually invocable")


def validate_agent_config() -> None:
    path = ROOT / "assets/templates/core/agent.config.json"
    data = json.loads(read(path))
    if data.get("baseBranch") != "development":
        fail("agent.config.json default baseBranch must be development")
    if not data.get("preview", {}).get("commands", {}).get("deploy"):
        fail("agent.config.json preview deploy command is missing")


def validate_claude_workflow() -> None:
    workflow = ROOT / "assets/templates/core/.github/workflows/agent-claude.yml"
    if not workflow.exists():
        fail("agent-claude.yml workflow template is missing")
    text = read(workflow)
    required = [
        "npm install -g @anthropic-ai/claude-code",
        "claude -p",
        "--permission-mode bypassPermissions",
        "CLAUDE_CODE_OAUTH_TOKEN",
    ]
    for needle in required:
        if needle not in text:
            fail(f"agent-claude.yml is missing {needle!r}")


def validate_no_project_literals() -> None:
    for path in ROOT.rglob("*"):
        if path.is_dir() or path.name == "validate_skill.py":
            continue
        text = read(path)
        lowered = text.lower()
        for forbidden in FORBIDDEN:
          if forbidden in lowered:
              fail(f"forbidden project-specific literal {forbidden!r} found in {path.relative_to(ROOT)}")


def validate_scripts_parse() -> None:
    if shutil.which("node") is None:
        print("WARN: node is not installed; skipping .mjs syntax checks")
        return
    for path in (ROOT / "assets/templates").rglob("*.mjs"):
        result = subprocess.run(
            ["node", "--check", str(path)],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            fail(f"node --check failed for {path.relative_to(ROOT)}:\n{result.stdout}")


def main() -> None:
    validate_skill_md()
    validate_agent_config()
    validate_claude_workflow()
    validate_no_project_literals()
    validate_scripts_parse()
    print("Skill validation passed.")


if __name__ == "__main__":
    main()
