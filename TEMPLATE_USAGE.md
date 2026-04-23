# Document Generation Templates - Usage Guide

## Overview
The `generate-docx.js` file now includes **5 reusable template functions** that follow standardized document structures. You can create any documentation by simply providing specific content.

---

## Available Templates

### 1. **LLD (Low Level Design) Template**
**Function:** `generateLldDocFromTemplate(title, lldData, filename)`

**Usage:**
```javascript
const { generateLldDocFromTemplate } = require('./generate-docx.js');

const lldData = {
    documentInfo: [
        ['Story Summary', 'Your Feature Name'],
        ['Implementation Type', 'New'],
        ['Review Date', 'April 2026'],
        ['Approval Status', 'Draft']
    ],
    overview: ['Your overview content here'],
    businessObjectives: ['Objective 1', 'Objective 2'],
    additionalSections: [
        {
            heading: 'Section Title',
            level: 2,
            content: ['Section content'],
            list: ['Item 1', 'Item 2']
        }
    ]
};

generateLldDocFromTemplate('Feature Name - LLD', lldData, '.github/copilot/Feature-LLD.docx');
```

**Structure Includes:**
- Document Information table
- Overview
- Business Objectives
- Custom sections (any number)

---

### 2. **Backend Documentation Template**
**Function:** `generateBackendDocFromTemplate(title, beData, filename)`

**Usage:**
```javascript
const beData = {
    documentInfo: [...],
    purpose: ['Purpose of the backend implementation'],
    businessObjectives: ['Objective 1', 'Objective 2'],
    technicalObjectives: ['Tech objective 1'],
    scope: ['Scope description'],
    inScope: ['In scope item 1'],
    outOfScope: ['Out of scope item 1'],
    currentProcess: ['Current process description'],
    additionalSections: [...]
};

generateBackendDocFromTemplate('Feature - Backend', beData, 'filename.docx');
```

**Structure Includes:**
- Document Information
- Purpose
- Business & Technical Objectives
- Scope (In/Out)
- Current Process
- Custom sections

---

### 3. **Frontend Documentation Template**
**Function:** `generateFrontendDocFromTemplate(title, feData, filename)`

**Usage:**
```javascript
const feData = {
    documentInfo: [...],
    overview: ['Overview content'],
    capabilities: ['Feature 1', 'Feature 2'],
    architecture: ['Architecture description'],
    fileStructure: {
        headers: ['Area', 'File'],
        rows: [['Main', 'src/pages/Main.tsx']]
    },
    routing: ['Routing information'],
    components: ['Component details'],
    additionalSections: [...]
};

generateFrontendDocFromTemplate('Feature - Frontend', feData, 'filename.docx');
```

**Structure Includes:**
- Document Information
- Overview
- High-Level Capabilities
- Architecture & Data Flow
- File Structure (table)
- Routing & Access Control
- Component Responsibilities
- Custom sections

---

### 4. **Database Documentation Template**
**Function:** `generateDatabaseDocFromTemplate(title, dbData, filename)`

**Usage:**
```javascript
const dbData = {
    documentInfo: [...],
    purpose: ['Purpose of DB changes'],
    scope: ['Scope of implementation'],
    currentProcess: ['Current database flow'],
    primaryTables: {
        headers: ['Table Name', 'Description'],
        rows: [['table_name', 'Description']]
    },
    referenceTables: {
        headers: ['Table Name', 'Description'],
        rows: [['reference_table', 'Description']]
    },
    additionalSections: [...]
};

generateDatabaseDocFromTemplate('Feature - Database', dbData, 'filename.docx');
```

**Structure Includes:**
- Document Information
- Purpose
- Scope
- Current Process (Database Flow)
- Primary Tables
- Reference / Lookup Tables
- Custom sections

---

### 5. **Testing Documentation Template**
**Function:** `generateTestingDocFromTemplate(title, testData, filename)`

**Usage:**
```javascript
const testData = {
    documentInfo: [...],
    purpose: ['Purpose of testing'],
    testScope: ['Test scope item 1'],
    testScenarios: {
        headers: ['No.', 'Scenarios'],
        rows: [
            ['1', 'Scenario 1'],
            ['2', 'Scenario 2']
        ]
    },
    testCases: {
        headers: ['Test Case ID', 'Test Case Title', 'Expected Result'],
        rows: [
            ['TC-001', 'Test case title', 'Expected result']
        ]
    },
    additionalSections: [...]
};

generateTestingDocFromTemplate('Feature - Testing', testData, 'filename.docx');
```

**Structure Includes:**
- Document Information
- Purpose
- Test Scope
- Test Scenarios (table)
- Test Cases (table)
- Custom sections

---

## Key Features

✅ **Reusable Structure**: Same document format for all similar documentation types
✅ **Customizable Content**: Only provide the specific content, structure is automatic
✅ **Flexible**: Add unlimited `additionalSections` for custom content
✅ **Tables Support**: Built-in table rendering for structured data
✅ **Lists Support**: Bullet point lists for organized information
✅ **Consistent Format**: All documents follow the same professional layout

---

## Object Structure

### documentInfo (Optional)
Array of [field, value] pairs for the document metadata table

### Content Types
- **string**: Simple text paragraph
- **array of strings**: Multiple paragraphs or bullet points
- **table object**: 
  ```javascript
  {
      headers: ['Column 1', 'Column 2'],
      rows: [['Row 1 Col 1', 'Row 1 Col 2']]
  }
  ```

### additionalSections (Optional)
Array of section objects:
```javascript
{
    heading: 'Section Title',
    level: 2,  // Heading level (2-4)
    content: ['Content 1', 'Content 2'],
    list: ['Item 1', 'Item 2'],
    table: { headers: [...], rows: [...] },
    pageBreak: false  // Insert page break after section
}
```

---

## Example: Create Product Listing Backend Documentation

```javascript
const { generateBackendDocFromTemplate } = require('./generate-docx.js');

const productListingBe = {
    purpose: [
        'The Product Listing API allows users to retrieve products in a paginated format with sorting and RBAC-based visibility.'
    ],
    businessObjectives: [
        'Product Discovery: View products in a structured list',
        'RBAC Enforcement: Show only products allowed for the user',
        'Efficient Data Retrieval: Handle large datasets using pagination'
    ],
    technicalObjectives: [
        'Single endpoint (GET /api/products)',
        'Pagination support (default: 20 records)',
        'Sorting by any field',
        'RBAC using combinations'
    ],
    inScope: [
        'Pagination',
        'Sorting',
        'RBAC-based visibility',
        'Data enrichment'
    ],
    outOfScope: [
        'Filtering (handled separately)',
        'Create/update/delete product',
        'Analytics/reporting'
    ],
    currentProcess: [
        'API Request → Validation → Controller → Service → Repository → Database → Response'
    ]
};

generateBackendDocFromTemplate(
    'Product Listing - Backend Specification',
    productListingBe,
    '.github/copilot/Product-Listing-Backend.docx'
);
```

---

## Existing Documents

The file already includes specific document generators (for backward compatibility):

- `generateDatabricksLld()` - Databricks DACH UDL LLD
- `generateRmsRbacDbDoc()` - RMS RBAC Database Documentation

These can still be used via command line:
```bash
node generate-docx.js --databricks
node generate-docx.js --rms-rbac-db
```

---

## Notes

- All template functions automatically create the output directory if it doesn't exist
- File is saved to `.github/copilot/` by default
- Console output shows success/error messages
- Use meaningful filenames for organization
- Keep heading levels between 2-4 for proper document hierarchy
