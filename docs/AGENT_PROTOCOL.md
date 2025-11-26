# Agent Protocol

> Last Updated: 2025-11-26

## Summary

Mandatory reading for all AI agents. Defines how to read, write, and maintain documentation in this project. Follow these rules for every task.

## Keywords

`protocol` `agent` `documentation` `rules` `workflow` `reading` `updating`

## Table of Contents

- [Before Starting Work](#before-starting-work)
- [Reading Strategy](#reading-strategy)
- [Updating Documentation](#updating-documentation)
- [Document Format Standard](#document-format-standard)
- [INDEX.md Maintenance](#indexmd-maintenance)
- [DECISION_LOG.md Format](#decision_logmd-format)

---

## Before Starting Work

1. State what you're about to do
2. Search /docs/INDEX.md for relevant keywords
3. Read the Summary of each relevant doc
4. Read only the sections you need (not full docs)
5. Check /docs/DECISION_LOG.md if proposing architectural changes

---

## Reading Strategy

### DO

- Use INDEX.md keyword search to find relevant docs
- Read Summary sections first to assess relevance
- Jump to specific sections via Table of Contents
- Read multiple focused sections across docs

### DO NOT

- Read entire docs linearly
- Skip the Summary section
- Make architectural changes without checking DECISION_LOG.md
- Assume you know the pattern—verify in docs first

---

## Updating Documentation

After completing work, update docs if you:

| Action | Update Required |
|--------|-----------------|
| Add feature | Create /docs/features/[FEATURE].md, update INDEX.md |
| Change architecture | Update /docs/architecture/*.md, update INDEX.md |
| Add component | Update COMPONENT_LIBRARY.md, update INDEX.md |
| Make design decision | Add to DECISION_LOG.md, update INDEX.md |
| Change data model | Update DATABASE_SCHEMA.md, update INDEX.md |
| Add/change API | Update API_CONTRACTS.md, update INDEX.md |
| Release version | Update CHANGELOG.md |

---

## Document Format Standard

Every doc must follow this structure:

```markdown
# [Document Title]

> Last Updated: YYYY-MM-DD

## Summary

[3-5 sentences. Agent reads this first to determine relevance.]

## Keywords

`keyword1` `keyword2` `keyword3`

## Table of Contents

- [Section 1](#section-1)
- [Section 2](#section-2)

---

## Section 1

### Subsection 1.1

### Subsection 1.2

## Section 2

...
```

---

## INDEX.md Maintenance

**UPDATE INDEX.md WITH EVERY DOCUMENTATION CHANGE.**

When adding/modifying docs:

1. Add entry to Quick Reference table if new topic
2. Add all new keywords to Keyword Search section (alphabetized)
3. Link to specific sections, not just docs
4. Maintain alphabetical order in Keyword Search

---

## DECISION_LOG.md Format

Use this format for every decision entry:

```markdown
### YYYY-MM-DD: [Decision Title]

**Context:** Why this decision was needed

**Options Considered:**
1. Option A — pros/cons
2. Option B — pros/cons

**Decision:** What was chosen

**Consequences:** Impact on codebase

**Keywords:** `keyword1` `keyword2`
```

Always add decision keywords to INDEX.md after logging.
