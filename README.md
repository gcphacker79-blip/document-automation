# 📄 Document Automation Tool

Automate DOCX generation and Confluence publishing with reusable templates.

---

## 📋 Installation (First Time Only)

```bash
# 1. Install Node.js dependencies
npm install

# 2. Install required npm packages
npm install docx mammoth axios dotenv

# 3. Verify installation
node -v
npm list docx mammoth axios dotenv
```

---

## ⚙️ Configuration Setup

**Create/Edit `.env` file** in project root:

```env
# Confluence Credentials (REQUIRED)
CONFLUENCE_BASE_URL=https://your-company.atlassian.net/wiki
CONFLUENCE_USER=your-email@example.com
CONFLUENCE_API_TOKEN=ATATT3xFfGF0kZwo...
CONFLUENCE_SPACE_KEY=personal
CONFLUENCE_PARENT_PAGE_ID=131240

# DOCX File Configuration (for publish/update)
DOCX_FILE=.github/copilot/your-doc.docx
TITLE=Your Document Title

# Update Configuration (only for update mode)
CONFLUENCE_UPDATE_PAGE_URL=#https://your-company.atlassian.net/wiki/spaces/personal/pages/123456/Doc
```

**Get API Token:**
1. Visit: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Copy token and paste in `.env`
4. Same token works for Confluence and Jira

---

## 🚀 Usage - Three Main Cases

### **CASE 1: Generate DOCX from Reusable Templates**

Use template functions to create structured DOCX files programmatically.

**Available Templates:**
- `generateLldDocFromTemplate()` - Low Level Design
- `generateBackendDocFromTemplate()` - Backend APIs
- `generateFrontendDocFromTemplate()` - Frontend UI
- `generateDatabaseDocFromTemplate()` - Database Schema
- `generateTestingDocFromTemplate()` - Test Cases

**Quick Example:**
```javascript
const { generateDatabaseDocFromTemplate } = require('./generate-docx.js');

const dbData = {
    documentInfo: [['Title', 'My DB Doc'], ['Date', 'April 2026']],
    purpose: ['Database documentation purpose'],
    scope: ['Scope of changes'],
    currentProcess: ['Step 1', 'Step 2', 'Step 3'],
    primaryTables: { headers: ['Table', 'Purpose'], rows: [['users', 'User data']] },
    referenceTables: { headers: ['Table', 'Purpose'], rows: [['lookup', 'Lookup data']] },
    additionalSections: []
};

generateDatabaseDocFromTemplate('My Title', dbData, '.github/copilot/my-doc.docx');
```

---

### **CASE 2: Publish New DOCX to Confluence**

Create a **new Confluence page** from DOCX file.

**Setup in `.env`:**
```env
DOCX_FILE=.github/copilot/RMS-RBAC-Database-Documentation.docx
TITLE=RBAC Access
CONFLUENCE_SPACE_KEY=personal
```

**Command:**
```bash
node publish_sop_to_confluence.js --mode publish
```

**Output:**
- ✅ Converts DOCX → Confluence HTML
- ✅ Creates new page with title: **"RBAC Access"**
- ✅ Returns Page ID and URL

**Example Output:**
```
✓ Success!
  Page ID: 5111809
  URL: https://gcphacker79.atlassian.net/wiki/pages/viewpage.action?pageId=5111809
```

---

### **CASE 3: Update Existing Confluence Page**

Update an **existing Confluence page** with edited DOCX.

**Setup in `.env`:**
```env
DOCX_FILE=.github/copilot/updated-doc.docx
TITLE=RBAC Access Updated
CONFLUENCE_UPDATE_PAGE_URL=https://gcphacker79.atlassian.net/wiki/spaces/personal/pages/5111809/RBAC+Access
```

**Command:**
```bash
node publish_sop_to_confluence.js --mode update
```

**Output:**
- ✅ Reads updated DOCX
- ✅ Updates existing page
- ✅ Increments version number
- ✅ Returns updated Page ID and URL

---

## 📊 Full Workflow Example

**Step 1: Create DOCX programmatically** (Case 1)
```bash
node -e "
const { generateDatabaseDocFromTemplate } = require('./generate-docx.js');
const data = { documentInfo: [...], purpose: [...], ... };
generateDatabaseDocFromTemplate('RMS RBAC', data, '.github/copilot/rbac-doc.docx');
"
```

**Step 2: Publish to Confluence** (Case 2)
```bash
# Edit .env and set:
# DOCX_FILE=.github/copilot/rbac-doc.docx
# TITLE=RMS RBAC Documentation

node publish_sop_to_confluence.js --mode publish
```

**Step 3: Update after changes** (Case 3)
```bash
# Edit DOCX file, regenerate it, then:
# Update .env with CONFLUENCE_UPDATE_PAGE_URL

node publish_sop_to_confluence.js --mode update
```

---

## 📁 Project Structure

```
document-automation/
├── .env                                          # Configuration (IMPORTANT)
├── package.json                                  # Dependencies
├── generate-docx.js                             # Core DOCX generator + 5 templates
├── publish_sop_to_confluence.js                 # Confluence publisher
├── README.md                                     # This file
└── .github/copilot/
    ├── RMS-RBAC-Database-Documentation.docx    # Generated/Published DOCX
    └── (other generated DOCX files)
```

---

## 🎯 Quick Reference Commands

| Case | Command | Purpose |
|------|---------|---------|
| **Generate** | `node -e "const {generateDatabaseDocFromTemplate}..."` | Create DOCX from template |
| **Publish** | `node publish_sop_to_confluence.js --mode publish` | Create new Confluence page |
| **Update** | `node publish_sop_to_confluence.js --mode update` | Update existing Confluence page |
| **Check Syntax** | `node -c generate-docx.js` | Validate JavaScript syntax |
| **List Exports** | `node -e "console.log(Object.keys(require('./generate-docx.js')))"`| Show available functions |

---

## 📝 Available Template Functions

All in `generate-docx.js` module.exports:

```javascript
generateDocx(content, filename)                          // Core generator
createTable(tableData)                                    // Table formatter
generateLldDocFromTemplate(title, lldData, filename)     // LLD
generateBackendDocFromTemplate(title, beData, filename)  // Backend
generateFrontendDocFromTemplate(title, feData, filename) // Frontend
generateDatabaseDocFromTemplate(title, dbData, filename) // Database
generateTestingDocFromTemplate(title, testData, filename)// Testing
```

---

## ✅ Troubleshooting

| Issue | Solution |
|-------|----------|
| `Missing config in .env` | Check all REQUIRED fields are set (not commented with #) |
| `File not found` | Verify DOCX_FILE path exists and is correct |
| `Authentication failed` | Check API_TOKEN validity at https://id.atlassian.com |
| `Space not found` | Verify CONFLUENCE_SPACE_KEY is correct |
| `Syntax error` | Run `node -c generate-docx.js` to debug JavaScript |
| `Table formatting issue` | Ensure table headers and rows arrays are properly formatted |

---

## 📞 Support

For questions about reusable templates, check `TEMPLATE_USAGE.md` for detailed examples.

1. **Extract Text**: Opens the DOCX file as a ZIP archive and reads `word/document.xml`
2. **Clean Content**: Removes XML tags, decodes HTML entities, and converts special characters
3. **Split Sections**: Identifies sections by numbered headings and separates content
4. **Apply Template**: Replaces placeholders in the template with extracted sections
5. **Generate Markdown**: Creates a markdown file locally
6. **Publish/Update** (if mode is publish or update):
   - Converts markdown to Confluence storage format
   - Creates new page or updates existing page via Confluence REST API
   - Returns page URL

## Typical Workflow

```bash
# Step 1: Create draft and review
node publish_sop_to_confluence.js --mode draft -t "Product Edit SOP" -b "draft.docx"
# Review the generated markdown file

# Step 2: If satisfied, publish to Confluence
node publish_sop_to_confluence.js --mode publish -t "Product Edit SOP" -b "draft.docx"
# Save the returned Page ID (e.g., 131240)

# Step 3: Later, update the DOCX and/or template, then update the page
node publish_sop_to_confluence.js --mode update --page-id 131240 -t "Product Edit SOP" -b "updated.docx"
```

## Troubleshooting

### Authentication Errors
- Verify your CONFLUENCE_API_TOKEN is correct and not expired
- Check that CONFLUENCE_USER matches the email used to create the token
- Ensure CONFLUENCE_BASE_URL includes `/wiki` at the end

### Page Creation Errors
- Verify CONFLUENCE_SPACE_KEY exists and you have write access
- Check CONFLUENCE_PARENT_PAGE_ID if specified

### Update Errors
- Ensure the --page-id is correct
- Verify you have edit permissions for the page

## Requirements

- Node.js 14.x or higher
- npm or yarn package manager
- Confluence Cloud account with API access

## Dependencies

- `adm-zip` - ZIP file processing for reading DOCX files
- `axios` - HTTP client for Confluence REST API calls
- `dotenv` - Environment variable management

---

## 🚀 CI/CD Integration (GitHub Actions)

Automate documentation generation and Confluence publishing on every commit, release, or manual trigger.

**Quick Setup:**
1. Push `.github/workflows/publish-docs.yml` to GitHub
2. Add GitHub Secrets (see [CI_CD_SETUP.md](CI_CD_SETUP.md))
3. Push changes to `main` branch
4. Workflow auto-publishes to Confluence

**Triggers:**
- ✅ Push to `main` branch (auto-publishes)
- ✅ Release published (auto-publishes)
- ✅ Manual trigger via GitHub Actions UI

**Workflow Features:**
- Generates DOCX from doc files
- Publishes to Confluence
- Uploads artifacts for download
- Slack notifications (optional)
- Complete logging

**Setup Guide:** See [CI_CD_SETUP.md](CI_CD_SETUP.md) for detailed instructions.

## License

ISC
