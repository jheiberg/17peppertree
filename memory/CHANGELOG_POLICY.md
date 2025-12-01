# Changelog Documentation Policy

**Date Established:** 2025-12-01  
**Status:** Active

## Policy

**ALL future changes to the 17 @ Peppertree project MUST be documented in `docs/CHANGELOG.html`**

## What to Document

### Features (🌟 FEATURE badge)
- New functionality added
- Major component implementations
- API endpoint additions
- Database schema changes
- UI/UX improvements

### Bug Fixes (🔧 BUG FIX badge)
- Issues resolved
- Authentication/authorization fixes
- Data handling corrections
- UI rendering problems fixed
- Performance improvements

### Changes (📝 CHANGE badge)
- Configuration updates
- Dependency upgrades
- Refactoring work
- Documentation improvements

## Required Information

For each entry, include:

1. **Date:** When change was made
2. **Type:** Feature, Bug Fix, or Change (with badge)
3. **Status:** ✅ Complete, 🚧 In Progress, or ⚠️ Needs Testing
4. **Overview:** Brief description of what was done
5. **Files Modified:** List of changed files
6. **Files Created:** List of new files (if applicable)
7. **Testing:** How it was tested
8. **Deployment Notes:** Any special deployment steps

## Template

```html
<h3><span class="badge badge-feature">FEATURE</span> Your Feature Name</h3>
<p><strong>Date:</strong> YYYY-MM-DD<br>
<strong>Status:</strong> ✅ Complete</p>

<h4>Overview</h4>
<p>Description of what was implemented/fixed.</p>

<h4>Files Modified</h4>
<ul>
  <li><code>path/to/file.js</code> - What changed</li>
</ul>

<h4>Testing</h4>
<ul>
  <li>Test description</li>
</ul>

<hr>
```

## Location

- **File:** `/home/jako/Development/17@peppertree/docs/CHANGELOG.html`
- **Section:** Add new entries at the top, under the current month heading
- **Format:** HTML with dark theme styling (consistent with other docs)

## Why This Matters

1. **Track Progress:** See what's been accomplished over time
2. **Debugging:** Understand when issues were introduced
3. **Onboarding:** New developers can review change history
4. **Documentation:** Keep stakeholders informed
5. **Rollbacks:** Know what to revert if problems occur

## Enforcement

- Before committing code, update CHANGELOG.html
- Code reviews should verify changelog entry exists
- CI/CD could eventually check for changelog updates

---

**Remember:** If it changed the code, it belongs in the changelog!
