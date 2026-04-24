const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, UnorderedList, PageBreak, BorderStyle, VerticalAlign, AlignmentType } = require('docx');
const fs = require('fs');
const path = require('path');

/**
 * Generate DOCX file from structured content
 * @param {Object} content - Content object with sections, tables, etc.
 * @param {String} filename - Output DOCX filename
 */
async function generateDocx(content, filename) {
    try {
        const elements = [];

        // Process content sections
        if (content.title) {
            elements.push(
                new Paragraph({
                    text: content.title,
                    heading: HeadingLevel.HEADING_1,
                    thematicBreak: false,
                    spacing: { after: 400 }
                })
            );
        }

        if (content.sections && Array.isArray(content.sections)) {
            content.sections.forEach((section, idx) => {
                // Section heading
                if (section.heading) {
                    elements.push(
                        new Paragraph({
                            text: section.heading,
                            heading: section.level ? HeadingLevel[`HEADING_${section.level}`] : HeadingLevel.HEADING_2,
                            spacing: { after: 200, before: 200 }
                        })
                    );
                }

                // Section content (paragraphs)
                if (section.content) {
                    if (Array.isArray(section.content)) {
                        section.content.forEach(para => {
                            if (typeof para === 'string') {
                                elements.push(
                                    new Paragraph({
                                        text: para,
                                        spacing: { after: 200 }
                                    })
                                );
                            } else if (para.type === 'paragraph') {
                                elements.push(
                                    new Paragraph({
                                        text: para.text || '',
                                        spacing: { after: 200 }
                                    })
                                );
                            }
                        });
                    } else if (typeof section.content === 'string') {
                        elements.push(
                            new Paragraph({
                                text: section.content,
                                spacing: { after: 200 }
                            })
                        );
                    }
                }

                // Section table
                if (section.table) {
                    elements.push(createTable(section.table));
                }

                // Section list
                if (section.list && Array.isArray(section.list)) {
                    const listItems = section.list.map(item => 
                        new Paragraph({
                            text: item,
                            bullet: { level: 0 },
                            spacing: { after: 100 }
                        })
                    );
                    elements.push(...listItems);
                    elements.push(new Paragraph({ text: '', spacing: { after: 200 } }));
                }

                // Page break after section
                if (section.pageBreak) {
                    elements.push(new PageBreak());
                }
            });
        }

        // Create document
        const doc = new Document({
            sections: [{
                children: elements
            }]
        });

        // Generate and save
        const outputDir = path.dirname(filename);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        Packer.toBuffer(doc).then(buffer => {
            fs.writeFileSync(filename, buffer);
            console.log(`\x1b[32m✓ DOCX created successfully: ${filename}\x1b[0m`);
        });

    } catch (error) {
        console.error(`\x1b[31m✗ Error generating DOCX: ${error.message}\x1b[0m`);
        throw error;
    }
}

/**
 * Create a formatted table from table data
 * @param {Object} tableData - Table with headers and rows
 * @returns {Table}
 */
function createTable(tableData) {
    const rows = [];

    // Header row
    if (tableData.headers && Array.isArray(tableData.headers)) {
        rows.push(
            new TableRow({
                children: tableData.headers.map(header =>
                    new TableCell({
                        children: [new Paragraph({
                            text: header,
                            bold: true
                        })],
                        shading: { fill: 'D3D3D3' },
                        verticalAlign: VerticalAlign.CENTER
                    })
                )
            })
        );
    }

    // Data rows
    if (tableData.rows && Array.isArray(tableData.rows)) {
        tableData.rows.forEach(row => {
            rows.push(
                new TableRow({
                    children: row.map(cell =>
                        new TableCell({
                            children: [new Paragraph(cell)],
                            verticalAlign: VerticalAlign.CENTER
                        })
                    )
                })
            );
        });
    }

    return new Table({
        width: { size: 100, type: 'pct' },
        rows: rows,
        borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
        }
    });
}

/**
 * Generic LLD Template
 * @param {String} title - Document title
 * @param {Object} lldData - LLD-specific content sections
 * @param {String} filename - Output filename
 */
function generateLldDocFromTemplate(title, lldData, filename) {
    const lldContent = {
        title: title,
        sections: [
            {
                heading: 'Document Information',
                level: 2,
                table: {
                    headers: ['Field', 'Value'],
                    rows: lldData.documentInfo || [
                        ['Story Summary', 'Feature Implementation'],
                        ['Implementation Type', 'New'],
                        ['Review Date', 'April 2026'],
                        ['Approval Status', 'Draft']
                    ]
                }
            },
            {
                heading: 'Overview',
                level: 2,
                content: lldData.overview || ['Overview section']
            },
            {
                heading: 'Business Objectives',
                level: 2,
                list: lldData.businessObjectives || ['Objective 1', 'Objective 2']
            },
            ...lldData.additionalSections || []
        ]
    };

    console.log(`\x1b[36m📄 Generating ${title}...\x1b[0m`);
    generateDocx(lldContent, filename);
}

/**
 * Generic Backend Documentation Template
 * @param {String} title - Document title
 * @param {Object} beData - Backend-specific content sections
 * @param {String} filename - Output filename
 */
function generateBackendDocFromTemplate(title, beData, filename) {
    const beContent = {
        title: title,
        sections: [
            {
                heading: 'Document Information',
                level: 2,
                table: {
                    headers: ['Field', 'Value'],
                    rows: beData.documentInfo || [
                        ['Story Summary', 'Feature Implementation'],
                        ['Implementation Type', 'New'],
                        ['Review Date', 'April 2026'],
                        ['Approval Status', 'Draft']
                    ]
                }
            },
            {
                heading: '1. Purpose',
                level: 2,
                content: beData.purpose || ['Purpose section']
            },
            {
                heading: 'Business Objectives',
                level: 3,
                list: beData.businessObjectives || ['Objective 1', 'Objective 2']
            },
            {
                heading: 'Technical Objectives',
                level: 3,
                list: beData.technicalObjectives || ['Technical objective 1']
            },
            {
                heading: '2. Scope',
                level: 2,
                content: beData.scope || ['Scope section']
            },
            {
                heading: 'In Scope',
                level: 3,
                list: beData.inScope || ['In scope item 1']
            },
            {
                heading: 'Out of Scope',
                level: 3,
                list: beData.outOfScope || ['Out of scope item 1']
            },
            {
                heading: '3. Current Process',
                level: 2,
                content: beData.currentProcess || ['Current process description']
            },
            ...beData.additionalSections || []
        ]
    };

    console.log(`\x1b[36m📄 Generating ${title}...\x1b[0m`);
    generateDocx(beContent, filename);
}

/**
 * Generic Frontend Documentation Template
 * @param {String} title - Document title
 * @param {Object} feData - Frontend-specific content sections
 * @param {String} filename - Output filename
 */
function generateFrontendDocFromTemplate(title, feData, filename) {
    const feContent = {
        title: title,
        sections: [
            {
                heading: 'Document Information',
                level: 2,
                table: {
                    headers: ['Field', 'Value'],
                    rows: feData.documentInfo || [
                        ['Story Summary', 'Feature Implementation'],
                        ['Implementation Type', 'New'],
                        ['Review Date', 'April 2026'],
                        ['Approval Status', 'Draft']
                    ]
                }
            },
            {
                heading: '1. Overview',
                level: 2,
                content: feData.overview || ['Overview section']
            },
            {
                heading: '2. High-Level Capabilities',
                level: 2,
                list: feData.capabilities || ['Feature 1', 'Feature 2']
            },
            {
                heading: '3. Architecture & Data Flow',
                level: 2,
                content: feData.architecture || ['Architecture description']
            },
            {
                heading: '4. File Structure',
                level: 2,
                table: feData.fileStructure || {
                    headers: ['Area', 'File'],
                    rows: [['Main', 'src/pages/Main.tsx']]
                }
            },
            {
                heading: '5. Routing & Access Control',
                level: 2,
                content: feData.routing || ['Routing information']
            },
            {
                heading: '6. Component Responsibilities',
                level: 2,
                content: feData.components || ['Component details']
            },
            ...feData.additionalSections || []
        ]
    };

    console.log(`\x1b[36m📄 Generating ${title}...\x1b[0m`);
    generateDocx(feContent, filename);
}

/**
 * Generic Database Documentation Template
 * @param {String} title - Document title
 * @param {Object} dbData - Database-specific content sections
 * @param {String} filename - Output filename
 */
function generateDatabaseDocFromTemplate(title, dbData, filename) {
    const dbContent = {
        title: title,
        sections: [
            {
                heading: 'Document Information',
                level: 2,
                table: {
                    headers: ['Field', 'Value'],
                    rows: dbData.documentInfo || [
                        ['Story Summary', 'Database Implementation'],
                        ['Implementation Type', 'New'],
                        ['Review Date', 'April 2026'],
                        ['Approval Status', 'Draft']
                    ]
                }
            },
            {
                heading: '1. Purpose',
                level: 2,
                content: dbData.purpose || ['Purpose of database implementation']
            },
            {
                heading: '2. Scope',
                level: 2,
                content: dbData.scope || ['Scope of database changes']
            },
            {
                heading: '3. Current Process (Database Flow)',
                level: 2,
                content: dbData.currentProcess || ['Current database process']
            },
            {
                heading: '4. Tables Used (Database Perspective)',
                level: 2,
                content: ['Primary and reference tables used in this implementation']
            },
            {
                heading: 'Primary Table',
                level: 3,
                table: dbData.primaryTables || {
                    headers: ['Table Name', 'Description'],
                    rows: [['table_name', 'Table description']]
                }
            },
            {
                heading: 'Reference / Lookup Tables',
                level: 3,
                table: dbData.referenceTables || {
                    headers: ['Table Name', 'Description'],
                    rows: [['reference_table', 'Reference table description']]
                }
            },
            ...dbData.additionalSections || []
        ]
    };

    console.log(`\x1b[36m📄 Generating ${title}...\x1b[0m`);
    generateDocx(dbContent, filename);
}

/**
 * Generic Testing Documentation Template
 * @param {String} title - Document title
 * @param {Object} testData - Testing-specific content sections
 * @param {String} filename - Output filename
 */
function generateTestingDocFromTemplate(title, testData, filename) {
    const testContent = {
        title: title,
        sections: [
            {
                heading: 'Document Information',
                level: 2,
                table: {
                    headers: ['Field', 'Value'],
                    rows: testData.documentInfo || [
                        ['Story Summary', 'Feature Testing'],
                        ['Implementation Type', 'Testing'],
                        ['Review Date', 'April 2026'],
                        ['Approval Status', 'Draft']
                    ]
                }
            },
            {
                heading: '1. Purpose',
                level: 2,
                content: testData.purpose || ['Purpose of testing']
            },
            {
                heading: '2. Test Scope',
                level: 2,
                list: testData.testScope || ['Test scope item 1']
            },
            {
                heading: '3. Test Scenarios',
                level: 2,
                table: testData.testScenarios || {
                    headers: ['No.', 'Scenarios'],
                    rows: [['1', 'Test scenario 1']]
                }
            },
            {
                heading: '4. Test Cases',
                level: 2,
                table: testData.testCases || {
                    headers: ['Test Case ID', 'Test Case Title', 'Expected Result'],
                    rows: [['TC-001', 'Test case title', 'Expected result']]
                }
            },
            ...testData.additionalSections || []
        ]
    };

    console.log(`\x1b[36m📄 Generating ${title}...\x1b[0m`);
    generateDocx(testContent, filename);
}

// Example usage if run directly
if (require.main === module) {
    // Generate example document
    const exampleContent = {
        title: 'Example Document',
        sections: [
            {
                heading: 'Introduction',
                level: 2,
                content: [
                    'This is an example paragraph.',
                    'This is another example paragraph.'
                ]
            },
            {
                heading: 'Table Example',
                level: 2,
                table: {
                    headers: ['Name', 'Value', 'Status'],
                    rows: [
                        ['Item 1', 'Value 1', 'Active'],
                        ['Item 2', 'Value 2', 'Inactive']
                    ]
                }
            }
        ]
    };

    generateDocx(exampleContent, '.github/copilot/example.docx');
}

module.exports = { 
    generateDocx, 
    createTable,
    generateLldDocFromTemplate,
    generateBackendDocFromTemplate,
    generateFrontendDocFromTemplate,
    generateDatabaseDocFromTemplate,
    generateTestingDocFromTemplate
};


