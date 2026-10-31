# FOODHUB Project Backup Manifest

**Backup Date**: 2026-10-30 23:28:14  
**Backup ID**: `backup_20261030-232814`  
**Purpose**: Pre-theme-implementation checkpoint  
**Branch**: `main` (tracking `origin/main`)

---

## 📁 Backup Contents

### Staff Side (`foodhub-staff-project-folder/`)
Complete project folder — 80 files including:
- **10 HTML pages**: dashboard.html, expenses.html, inventory.html, inventory_prediction.html, orders.html, payment.html, payments.html, settings.html, staff_profile.html, todays_orders.html
- **10 CSS files**: dashboard.css, expenses.css, inventory.css, inventory_prediction.css, orders.css, payment.css, payments.css, settings.css, sidebar_nav.css, staff_profile.css, todays_orders.css, topbar_nav.css
- **27 JS files**: controllers/, models/, services/, components/, utils/
- **5 Assets**: auth_page_img.jpg, foodhub_logo_no_bg.png, foodpanda.svg, gcash.svg, maya.svg

### Backend — Settings App (`foodhub_backend/settings_app/`)
- models.py (UserSettings with theme_mode: light/dark)
- serializers.py (UserSettingsSerializer, UserSettingsUpdateSerializer)
- views.py (UserSettingsViewSet with me/update_settings/backup actions)
- urls.py
- migrations/0001_initial.py

### Backend — Accounts (`foodhub_backend/accounts/`)
- serializers.py (CustomTokenObtainPairSerializer)
- views.py (CustomTokenObtainPairView)
- urls.py
- models.py (Custom User model)
- migrations/

### Backend — Settings Config (`foodhub_backend/foodhub_backend/settings/`)
- base.py
- development.py
- production.py
- __init__.py

---

## 📊 File Counts
| Category | Files |
|----------|-------|
| Staff Side | 80 |
| Backend settings_app | 8 |
| Backend accounts | 13 |
| Backend settings config | 4 |
| **Total** | **105** |

---

## 🚫 Excluded from Backup
- `.env` files (contain secrets)
- `db.sqlite3` (database)
- `*.log` files
- `__pycache__/` directories
- `.vscode/` directory
- `media/` uploads
- `staticfiles/` collected static

---

## 🔄 Recovery Instructions

### Option 1: File System Restore (Fastest, Non-Destructive)
```bash
cd "C:\xampp\htdocs\Thesis\Proposal"

# Restore Staff Side only
cp -r backup_20261030-232814/foodhub-staff-project-folder/* foodhub-staff-project-folder/

# Restore Backend settings_app
cp -r backup_20261030-232814/foodhub_backend/settings_app/* foodhub_backend/settings_app/

# Restore Backend accounts
cp -r backup_20261030-232814/foodhub_backend/accounts/* foodhub_backend/accounts/

# Restore Backend settings config
cp -r backup_20261030-232814/foodhub_backend/foodhub_backend/settings/* foodhub_backend/foodhub_backend/settings/
```

### Option 2: Git Restore (If Git Checkpoint Created)
```bash
# Check available backup branches
git branch -a | grep backup

# Checkout backup branch (creates detached HEAD)
git checkout backup/pre-theme-<timestamp>

# Or reset current branch to tagged commit (DESTRUCTIVE - loses current changes)
git reset --hard pre-theme-checkpoint-<timestamp>

# Restore single file from backup branch
git show backup/pre-theme-<timestamp>:Proposal/foodhub-staff-project-folder/css/settings.css > foodhub-staff-project-folder/css/settings.css
```

### Option 3: Verify Backup Integrity
```bash
# Count files in backup
find backup_20261030-232814 -type f | wc -l

# Compare specific file with current
diff backup_20261030-232814/foodhub-staff-project-folder/css/settings.css \
     foodhub-staff-project-folder/css/settings.css

# List all backed up HTML pages
find backup_20261030-232814/foodhub-staff-project-folder -name "*.html"
```

---

## ⚠️ Important Notes

1. **Uncommitted Work Preserved**: This backup captures the exact working state including all 40+ modified files shown in `git status`.

2. **Secrets Safe**: No `.env` files, database files, or credentials were copied.

3. **Shared Dependencies**: Staff Side `sidebar_nav.css`, `topbar_nav.css`, `TopbarNav.js`, `api.js` are included — Admin Side copies are separate in the actual project.

4. **Git State Unchanged**: This backup does not modify the git repository. Your current modified/untracked files remain as-is.

5. **Rollback Safe**: You can restore from this backup at any time without affecting git history.

---

## 📍 Backup Location
```
C:\xampp\htdocs\Thesis\Proposal\backup_20261030-232814\
```

---

## ✅ Verification Checklist
- [x] Staff Side HTML pages (10) backed up
- [x] Staff Side CSS files (12) backed up
- [x] Staff Side JS files (27) backed up
- [x] Staff Side assets (5) backed up
- [x] Backend settings_app (model, serializer, views, migrations) backed up
- [x] Backend accounts (auth serializers, views, urls) backed up
- [x] Backend settings config (base, development, production) backed up
- [x] No .env files included
- [x] No database files included
- [x] Manifest created
- [x] Recovery instructions documented