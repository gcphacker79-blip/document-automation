require('dotenv').config();
const OpenAI = require('openai');
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
    const docType      = (process.env.DOC_TYPE     || '').toLowerCase().trim();
    const docTitle     = (process.env.DOC_TITLE    || '').trim();
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

    // Extract only the specific template function — not the full file
    const generateDocxSource = fs.readFileSync(path.join(__dirname, 'generate-docx.js'), 'utf8');
    const templateFunctionCode = extractFunction(generateDocxSource, template.name);

    // Truncate large code files to keep token count low
    const truncatedSnippets = codeSnippets.map(snippet => {
        const lines = snippet.split('\n');
        if (lines.length > 80) {
            return lines.slice(0, 80).join('\n') + '\n... (truncated)';
        }
        return snippet;
    });

    // GitHub Models client — uses GITHUB_TOKEN automatically, completely free
    const client = new OpenAI({
        baseURL: 'https://models.inference.ai.azure.com',
        apiKey: process.env.GITHUB_TOKEN
    });

    console.log(`\nCalling GitHub Models (gpt-4o) to generate ${docType} documentation...`);

    const response = await client.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 2048,
        messages: [{
            role: 'user',
            content: `You are a senior technical writer. Generate documentation for a software feature based on its code.

Code files changed in this feature:
${truncatedSnippets.join('\n\n')}

Template function to use:
\`\`\`javascript
${templateFunctionCode}
\`\`\`

Read the code and generate the data object that "${template.name}" expects as its second argument.
Every field must have real content from the code. Arrays need 2-3 items. Tables need "headers" and "rows".
Return ONLY raw JSON — no explanation, no markdown.`
        }]
    });

    // Parse JSON from response
    let docData;
    const responseText = response.choices[0].message.content.trim();

    try {
        const cleaned = responseText
            .replace(/^```(?:json)?\s*/m, '')
            .replace(/\s*```\s*$/m, '')
            .trim();
        docData = JSON.parse(cleaned);
    } catch (e) {
        console.error('Failed to parse LLM response as JSON.');
        console.error('Response received:', responseText);
        process.exit(1);
    }

    // Build output path
    const safeTitle     = docTitle.replace(/[^a-zA-Z0-9\s\-]/g, '').replace(/\s+/g, '-');
    const outputDir     = 'generated-docs';
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

function extractFunction(source, functionName) {
    const startIndex = source.indexOf(`function ${functionName}`);
    if (startIndex === -1) return source;

    let braceCount = 0;
    let started = false;
    let endIndex = startIndex;

    for (let i = startIndex; i < source.length; i++) {
        if (source[i] === '{') { braceCount++; started = true; }
        else if (source[i] === '}') {
            braceCount--;
            if (started && braceCount === 0) { endIndex = i + 1; break; }
        }
    }
    return source.substring(startIndex, endIndex);
}

main().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
