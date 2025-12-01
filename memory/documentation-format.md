# Documentation Format Guidelines

**Created:** 2024-12-01  
**Last Updated:** 2024-12-01

## Documentation Structure

All documentation in the `docs/` directory follows a specific format:

### Format: Direct HTML Files

Documentation is written as **HTML files directly**, not generated from markdown.

```
docs/
├── ADMIN_SETUP.html
├── DEPLOYMENT_GUIDE.html
├── AUTHENTICATION.html
├── ICAL_SYNC.html
└── ... (all .html files)
```

### Key Characteristics

1. **HTML as Primary Format**
   - Documentation is written/edited as HTML
   - Not generated from markdown sources
   - Uses consistent styling and navigation

2. **Consistent Structure**
   - DOCTYPE declaration
   - Title format: `Topic Name - 17 @ Peppertree Documentation`
   - Embedded CSS styling (dark theme)
   - Navigation bar
   - Semantic HTML structure

3. **No Markdown Source Files**
   - The `docs/` directory does NOT contain `.md` files
   - Exception: `SCRIPTS.md` was created but should not have been
   - HTML is the source and published format

## Creating New Documentation

When creating new documentation in `docs/`:

### ❌ DON'T Do This
- Create markdown files in docs/
- Generate HTML from markdown
- Create dual markdown/HTML documentation

### ✅ DO This
- Create HTML files directly
- Follow the existing HTML template structure
- Use the established CSS styling
- Match the navigation pattern
- Keep consistent naming (UPPERCASE.html)

## Template Structure

New docs should follow this pattern:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Topic Name - 17 @ Peppertree Documentation</title>
  <style>
    /* Consistent dark theme styling */
  </style>
</head>
<body>
  <nav>
    <!-- Navigation links -->
  </nav>
  
  <main>
    <!-- Content -->
  </main>
  
  <button id="back-to-top">↑ Top</button>
  
  <script>
    <!-- Navigation and interaction scripts -->
  </script>
</body>
</html>
```

## Documentation Locations

### Primary Documentation Hub
- **Location:** `docs/` directory
- **Format:** HTML files
- **Purpose:** Official documentation website
- **Access:** Via docs/index.html

### Quick Reference Guides
- **Location:** Subdirectories (e.g., `scripts/README.md`)
- **Format:** Markdown
- **Purpose:** Quick reference for developers
- **Audience:** Developers working in that specific directory

## Example: Scripts Documentation

**Correct Structure:**
- `docs/SCRIPTS.html` - Full HTML documentation in docs hub
- `scripts/README.md` - Quick markdown reference in scripts directory

**Incorrect Structure (Don't do this):**
- ~~`docs/SCRIPTS.md`~~ - Markdown in docs directory
- Creating markdown source to generate HTML

## Why This Matters

1. **Consistency:** All docs follow same format
2. **Maintenance:** One format to maintain, not multiple
3. **No Build Step:** HTML is ready to serve
4. **Styling Control:** Direct control over presentation
5. **No Conversion:** No markdown-to-HTML conversion needed

## Exceptions

The only markdown documentation:
- `README.md` - Repository root (standard convention)
- `*/README.md` - Directory quick references
- `memory/*.md` - Memory bank (internal notes)

## Related Files

- `docs/index.html` - Documentation hub homepage
- `docs/convert-to-html.js` - Exists but NOT used for main docs
- All documentation is HTML-first

## Summary

**Remember:** When creating documentation in `docs/`, write HTML directly, following the existing pattern and styling of other documentation files. Do not create markdown sources in the docs directory.
