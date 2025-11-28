# Documentation Audit

Perform a comprehensive audit of the /docs folder. Present findings as a report and wait for approval before making any changes.

## Audit Checklist

### 1. INDEX.md Integrity

**Quick Reference Table:**
- Check every document path in the table exists
- Check section anchors are valid (e.g., `#phase-1-foundation` exists in target doc)
- Flag entries pointing to removed/renamed files

**Keyword Search Section:**
- Verify all linked files exist
- Verify anchor links point to valid sections
- Check alphabetical ordering is maintained
- Flag duplicate keyword entries

### 2. Orphan Documents

- List all .md files in /docs and subdirectories
- Compare against INDEX.md entries
- Flag any docs NOT listed in INDEX.md (orphans)
- Exception: Files in /docs/ideas/ may be informal and unindexed

### 3. Staleness Check

**Check "Last Updated" timestamps:**
- Flag docs older than 60 days
- Flag docs with no "Last Updated" line
- Note docs that reference features/code that may have changed

**Cross-reference with recent commits:**
- If a feature area had recent code changes, flag related docs for review

### 4. Format Compliance

Per AGENT_PROTOCOL.md, every doc must have:
- [ ] `# Title` (H1 heading)
- [ ] `> Last Updated: YYYY-MM-DD` line
- [ ] `## Summary` section
- [ ] `## Keywords` section with backtick-wrapped keywords
- [ ] `## Table of Contents` (for docs with 3+ sections)
- [ ] `---` horizontal rules between major sections

Flag any docs missing required elements.

### 5. Broken Cross-References

Check `## Related Documents` sections:
- Verify all linked paths exist
- Verify descriptions match target doc content

Check inline references:
- Find patterns like `**See:** /docs/...` or `[text](/docs/...)`
- Verify targets exist

### 6. Content Issues

**Duplicates:**
- Flag docs with overlapping content (>50% similar)
- Suggest merging candidates

**Obsolete References:**
- Check for references to removed files in /src
- Check for removed environment variables
- Check for deprecated API endpoints

**Empty/Stub Docs:**
- Flag docs under 50 lines as potentially incomplete

### 7. /docs/ideas/ Folder

This folder contains informal feature ideas - apply lighter standards:
- Check files exist and are readable
- Don't require full format compliance
- Note if ideas have been implemented (move to archive or delete)

## Output Format

Present findings as:

```markdown
## Documentation Audit Report

**Date:** YYYY-MM-DD
**Total docs scanned:** N

### Critical Issues (fix immediately)
- [ ] Issue description — file path

### Warnings (review recommended)
- [ ] Issue description — file path

### Suggestions (optional improvements)
- [ ] Issue description — file path

### Summary
- X critical issues
- Y warnings
- Z suggestions

### Recommended Actions
1. Action item
2. Action item
```

## Rules

1. **DO NOT auto-fix anything** - present report and wait for approval
2. **DO NOT delete files** without explicit user confirmation
3. **Group related issues** for easier review
4. For each issue, explain WHY it's a problem
5. Prioritize: broken links > missing format > staleness > suggestions
