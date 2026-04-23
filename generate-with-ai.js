require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const {
    generateLldDocFromTemplate,
    generateBackendDocFromTemplate,
    generateFrontendDocFromTemplate,
    generateDatabaseDocFromTemplate,
    generateTestingDocFromTemplate
} = require('./generate-docx');

const TEMPLATES = {
    backend:  { fn: generateBackendDocFromTemplate,  name: 'generateBackendDocFromTemplate'  },
    frontend: { fn: generateFrontendDocFromTemplate, name: 'generateFrontendDocFromTemplate' },
    database: { fn: generateDatabaseDocFromTemplate, name: 'generateDatabaseDocFromTemplate' },
    lld:      { fn: generateLldDocFromTemplate,      name: 'generateLldDocFromTemplate'      },
    testing:  { fn: generateTestingDocFromTemplate,  name: 'generateTestingDocFromTemplate'  }
};

async function main() {
    const docType     = (process.env.DOC_TYPE  || '').toLowerCase().trim();
    const docTitle    = (process.env.DOC_TITLE || '').trim();
    const changedFiles = (process.env.CHANGED_FILES || '').trim();

    if (!docType || !docTitle) {
        console.log('DOC_TYPE or DOC_TITLE not provided. Skipping documentation generation.');
        process.exit(0);
    }

    const template = TEMPLATES[docType];
    if (!template) {
        console.error(`Unknown DOC_TYPE: "${docType}". Valid values: backend, frontend, database, lld, testing`);
        process.exit(1);
    }

    // Read changed code files
    const files = changedFiles.split(',').map(f => f.trim()).filter(Boolean);
    const codeSnippets = [];

    for (const file of files.slice(0, 15)) {
        try {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                codeSnippets.push(`=== FILE: ${file} ===\n${content}`);
                console.log(`Read: ${file}`);
            }
        } catch (e) {
            console.log(`Skipped: ${file} — ${e.message}`);
        }
    }

    if (codeSnippets.length === 0) {
        console.log('No readable code files found. Skipping documentation generation.');
        process.exit(0);
    }

    // Read the full generate-docx.js so Claude can see the exact template function
    const generateDocxSource = fs.readFileSync(path.join(__dirname, 'generate-docx.js'), 'utf8');

    // Call Claude API
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    console.log(`\nCalling Claude API to generate ${docType} documentation...`);

    const response = await client.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 4096,
        messages: [{
            role: 'user',
            content: `You are a senior technical writer. Your job is to generate documentation for a software feature based on its code.

Here are the code files that were added or modified in this feature:

${codeSnippets.join('\n\n')}

Here is the documentation template file that will be used to generate the DOCX document:

\`\`\`javascript
${generateDocxSource}
\`\`\`

Your task:
1. Read the code files carefully and understand what the feature does.
2. Look at the function "${template.name}" in the template file above.
3. Understand exactly what fields/structure the second argument (data object) of that function expects.
4. Generate a complete, detailed documentation data object based on the actual code.

Rules:
- Every field must have real, meaningful content derived from the code — not placeholder text.
- Arrays must have at least 2-3 items.
- Table objects must have "headers" (array of strings) and "rows" (array of arrays of strings).
- Return ONLY the raw JSON object — no explanation, no markdown, no code blocks.`
        }]
    });

    // Parse JSON from Claude's response
    let docData;
    const responseText = response.content[0].text.trim();

    try {
        // Strip markdown code fences if Claude wrapped the JSON
        const cleaned = responseText
            .replace(/^```(?:json)?\s*/m, '')
            .replace(/\s*```\s*$/m, '')
            .trim();
        docData = JSON.parse(cleaned);
    } catch (e) {
        console.error('Failed to parse Claude response as JSON.');
        console.error('Response received:', responseText);
        process.exit(1);
    }

    // Build output path
    const safeTitle = docTitle.replace(/[^a-zA-Z0-9\s\-]/g, '').replace(/\s+/g, '-');
    const outputDir  = 'generated-docs';
    const outputFilename = `${outputDir}/${safeTitle}.docx`;

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate DOCX using the matching template function
    console.log(`\nGenerating DOCX: ${outputFilename}`);
    template.fn(docTitle, docData, outputFilename);

    // Wait for the internal async DOCX write (Packer.toBuffer) to complete
    await new Promise(resolve => setTimeout(resolve, 5000));

    if (!fs.existsSync(outputFilename)) {
        console.error('DOCX file was not created. Check the template function logs above.');
        process.exit(1);
    }

    // Write step outputs for GitHub Actions
    if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `docx_file=${outputFilename}\n`);
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `doc_title=${docTitle}\n`);
    }

    console.log(`\n✓ Documentation generated successfully: ${outputFilename}`);
}

main().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
