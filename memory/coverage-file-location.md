# Coverage File Location

**Created:** 2025-11-21  
**Last Updated:** 2025-11-21

---

## Coverage File Storage

All test coverage files must be written to the **`./tmp`** directory.

### Location
```
/tmp/coverage-report.md
/tmp/coverage-summary.json
/tmp/coverage-technical-summary.md
```

### Purpose
- Temporary storage for test coverage reports
- Generated files that can be regenerated anytime
- Not critical documentation
- Keeps `/docs` directory clean

### Lifecycle
- **Directory:** `./tmp`
- **Cleanup:** Can be cleaned out every 24 hours
- **Regeneration:** Run tests to regenerate coverage reports
- **Version Control:** Files in `/tmp` should be gitignored

### Files Previously in `/docs`
Moved on 2025-11-21:
1. `docs/coverage-report.md` → `tmp/coverage-report.md`
2. `docs/coverage-summary.json` → `tmp/coverage-summary.json`
3. `docs/coverage-technical-summary.md` → `tmp/coverage-technical-summary.md`

### .gitignore Rule
The `/tmp` directory should be excluded from version control:
```
tmp/
*.log
```

### Regenerating Coverage Reports
```bash
# Frontend tests (generates coverage reports)
npm test -- --coverage

# Backend tests
cd backend
python -m pytest --cov=. --cov-report=term --cov-report=html

# Move generated reports to tmp
mv coverage-*.md coverage-*.json tmp/ 2>/dev/null || true
```

---

## Related
- Test coverage reports are temporary build artifacts
- Not permanent documentation
- Can be deleted and regenerated at any time
