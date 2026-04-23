const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mammoth = require('mammoth');
require('dotenv').config();

async function convertDocxToConfluenceHtml(filePath) {
    try {
        const result = await mammoth.convertToHtml({ path: filePath });
        return htmlToConfluenceFormat(result.value);
    } catch (error) {
        throw new Error(`DOCX conversion failed: ${error.message}`);
    }
}

function htmlToConfluenceFormat(html) {
    let confluenceHtml = html;
    
    // Remove scripts and styles
    confluenceHtml = confluenceHtml.replace(/<script[\s\S]*?<\/script>/gi, '');
    confluenceHtml = confluenceHtml.replace(/<style[\s\S]*?<\/style>/gi, '');
    
    // Convert headings
    confluenceHtml = confluenceHtml.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '<h1>$1</h1>');
    confluenceHtml = confluenceHtml.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '<h2>$1</h2>');
    confluenceHtml = confluenceHtml.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '<h3>$1</h3>');
    confluenceHtml = confluenceHtml.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '<h4>$1</h4>');
    confluenceHtml = confluenceHtml.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '<h5>$1</h5>');
    confluenceHtml = confluenceHtml.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '<h6>$1</h6>');
    
    // Convert text formatting (bold, italic, etc)
    confluenceHtml = confluenceHtml.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '<strong>$1</strong>');
    confluenceHtml = confluenceHtml.replace(/<b[^>]*>(.*?)<\/b>/gi, '<strong>$1</strong>');
    confluenceHtml = confluenceHtml.replace(/<em[^>]*>(.*?)<\/em>/gi, '<em>$1</em>');
    confluenceHtml = confluenceHtml.replace(/<i[^>]*>(.*?)<\/i>/gi, '<em>$1</em>');
    confluenceHtml = confluenceHtml.replace(/<u[^>]*>(.*?)<\/u>/gi, '<u>$1</u>');
    
    // Convert links
    confluenceHtml = confluenceHtml.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '<a href="$1">$2</a>');
    
    // Convert code
    confluenceHtml = confluenceHtml.replace(/<code[^>]*>(.*?)<\/code>/gi, '<code>$1</code>');
    confluenceHtml = confluenceHtml.replace(/```([\s\S]*?)```/g, '<ac:structured-macro ac:name="code"><ac:plain-text-body><![CDATA[$1]]></ac:plain-text-body></ac:structured-macro>');
    
    // Convert lists
    confluenceHtml = confluenceHtml.replace(/<ul[^>]*>/gi, '<ul>');
    confluenceHtml = confluenceHtml.replace(/<ol[^>]*>/gi, '<ol>');
    confluenceHtml = confluenceHtml.replace(/<li[^>]*>(.*?)<\/li>/gi, '<li>$1</li>');
    
    // Handle paragraphs and line breaks
    confluenceHtml = confluenceHtml.replace(/<br\s*\/?>/gi, '<br/>');
    confluenceHtml = confluenceHtml.replace(/<hr\s*\/?>/gi, '<hr/>');
    
    // Handler for tables - already in proper HTML format from mammoth
    // Just ensure proper Confluence table structure
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    confluenceHtml = confluenceHtml.replace(tableRegex, (match) => {
        let tableContent = match;
        // Ensure table has tbody
        if (!tableContent.includes('<tbody>')) {
            tableContent = tableContent.replace(/<table[^>]*>/, '<table><tbody>');
            tableContent = tableContent.replace(/<\/table>/, '</tbody></table>');
        }
        // Convert td/th cells to Confluence format with <p> tags
        tableContent = tableContent.replace(/<td[^>]*>(.*?)<\/td>/gi, '<td><p>$1</p></td>');
        tableContent = tableContent.replace(/<th[^>]*>(.*?)<\/th>/gi, '<th><p>$1</p></th>');
        return tableContent;
    });
    
    // Wrap paragraphs properly
    const lines = confluenceHtml.split('\n');
    let processedLines = [];
    let inBlock = false;
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // Don't wrap if already in structured element
        if (line.match(/^<(h\d|ul|ol|li|table|tbody|tr|td|th|hr|p|ac:)/i)) {
            processedLines.push(line);
            inBlock = true;
        } else if (line.match(/^<\/(h\d|ul|ol|li|table|tbody|tr|td|th|p|ac:)/i)) {
            processedLines.push(line);
            inBlock = false;
        } else if (!inBlock && line.length > 0) {
            processedLines.push(`<p>${line}</p>`);
        } else {
            processedLines.push(line);
        }
    }
    
    // Decode HTML entities
    confluenceHtml = processedLines.join('\n');
    confluenceHtml = confluenceHtml.replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
    
    return confluenceHtml.trim();
}

async function getSpaceId(baseUrl, auth, spaceKey) {
    try {
        const response = await axios.get(`${baseUrl}/api/v2/spaces`, {
            headers: { 'Authorization': `Basic ${auth}` },
            params: { keys: spaceKey }
        });
        if (response.data.results && response.data.results.length > 0) {
            return response.data.results[0].id;
        }
        throw new Error(`Space not found: ${spaceKey}`);
    } catch (error) {
        throw new Error(`Failed to get space ID: ${error.message}`);
    }
}

async function createConfluencePage(baseUrl, auth, spaceId, parentId, title, content) {
    try {
        const pageData = {
            spaceId: spaceId,
            status: 'current',
            title: title,
            body: { representation: 'storage', value: content }
        };
        if (parentId) pageData.parentId = parseInt(parentId);
        const response = await axios.post(`${baseUrl}/api/v2/pages`, pageData, {
            headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        const errorMsg = error.response?.data?.errors?.[0]?.title || error.response?.data?.message || error.message;
        throw new Error(`Failed to create page: ${errorMsg}`);
    }
}

function extractPageIdFromUrl(pageUrl) {
    // Try old format: ?pageId=12345
    let match = pageUrl.match(/pageId=([0-9]+)/i);
    if (match && match[1]) {
        return match[1];
    }
    // Try new format: /pages/12345/
    match = pageUrl.match(/\/pages\/([0-9]+)/);
    if (match && match[1]) {
        return match[1];
    }
    throw new Error(`Invalid page URL format. Expected: https://domain/wiki/pages/viewpage.action?pageId=12345 or https://domain/wiki/spaces/{space}/pages/{pageId}/...`);
}

async function updateConfluencePage(baseUrl, auth, pageId, title, content) {
    try {
        const getResponse = await axios.get(`${baseUrl}/api/v2/pages/${pageId}`, {
            headers: { 'Authorization': `Basic ${auth}` }
        });
        const currentVersion = getResponse.data.version.number;
        const updateData = {
            id: pageId,
            status: 'current',
            title: title,
            body: { representation: 'storage', value: content },
            version: { number: currentVersion + 1, message: 'Updated via automation' }
        };
        const response = await axios.put(`${baseUrl}/api/v2/pages/${pageId}`, updateData, {
            headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        throw new Error(`Failed to update page: ${error.response?.data?.message || error.message}`);
    }
}

function showUsage() {
    console.log('\n\x1b[36m📚 DOCX to Confluence Automation\x1b[0m\n');
    console.log('\x1b[33mCASE 1: Publish New DOCX (Create New Confluence Page)\x1b[0m');
    console.log('  node publish_sop_to_confluence.js --mode publish');
    console.log('  Converts DOCX → Confluence HTML and creates new page');
    console.log('  Config: Set DOCX_FILE and TITLE in .env\n');
    console.log('\x1b[33mCASE 2: Direct DOCX Publish (Same as CASE 1)\x1b[0m');
    console.log('  node publish_sop_to_confluence.js --mode publish --file <docx-path>');
    console.log('  Publishes specified DOCX file directly\n');
    console.log('\x1b[33mCASE 3: Update Existing Page with Edited DOCX\x1b[0m');
    console.log('  node publish_sop_to_confluence.js --mode update');
    console.log('  Updates existing Confluence page with edited DOCX');
    console.log('  Config: Set DOCX_FILE and CONFLUENCE_UPDATE_PAGE_URL in .env\n');
    console.log('\x1b[33m⚠️  NOTE: No markdown files are created. DOCX only workflow.\x1b[0m\n');
}

async function main() {
    const args = process.argv.slice(2);
    let mode = '';
    let filePath = '';
    let title = '';
    let pageId = '';
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--mode' || args[i] === '-m') mode = args[++i];
        else if (args[i] === '--file' || args[i] === '-f') filePath = args[++i];
        else if (args[i] === '--title' || args[i] === '-t') title = args[++i];
        else if (args[i] === '--page-id' || args[i] === '-p') pageId = args[++i];
    }
    
    if (!mode) {
        showUsage();
        process.exit(1);
    }
    
    if (!['publish', 'update'].includes(mode)) {
        console.error('\x1b[31m✗ Invalid mode. Use: publish or update\x1b[0m');
        showUsage();
        process.exit(1);
    }
    
    const baseUrl = process.env.CONFLUENCE_BASE_URL;
    const user = process.env.CONFLUENCE_USER;
    const token = process.env.CONFLUENCE_API_TOKEN;
    const spaceKey = process.env.CONFLUENCE_SPACE_KEY;
    const parentPageId = process.env.CONFLUENCE_PARENT_PAGE_ID;
    
    if (!baseUrl || !user || !token || !spaceKey) {
        console.error('\x1b[31m✗ Missing Confluence config in .env\x1b[0m');
        console.error('\x1b[31m  Required: CONFLUENCE_BASE_URL, CONFLUENCE_USER, CONFLUENCE_API_TOKEN, CONFLUENCE_SPACE_KEY\x1b[0m');
        process.exit(1);
    }
    
    const auth = Buffer.from(`${user}:${token}`).toString('base64');
    
    try {
        if (mode === 'publish') {
            let publishFilePath = filePath || process.env.DOCX_FILE;
            let publishTitle = title || process.env.TITLE;
            
            if (!publishFilePath || publishFilePath.startsWith('#')) {
                console.error('\x1b[31m✗ Publish requires DOCX_FILE set in .env (not commented out)\x1b[0m');
                process.exit(1);
            }
            
            if (!fs.existsSync(publishFilePath)) {
                console.error(`\x1b[31m✗ File not found: ${publishFilePath}\x1b[0m`);
                process.exit(1);
            }
            
            if (!publishFilePath.toLowerCase().endsWith('.docx')) {
                console.error('\x1b[31m✗ File must be .docx format\x1b[0m');
                process.exit(1);
            }
            
            if (!publishTitle) {
                console.error('\x1b[31m✗ TITLE is required in .env for publish mode\x1b[0m');
                process.exit(1);
            }
            
            const spaceId = await getSpaceId(baseUrl, auth, spaceKey);
            
            console.log('\x1b[36m[PUBLISHING DOCX TO CONFLUENCE]\x1b[0m');
            console.log(`\x1b[36m  File: ${publishFilePath}\x1b[0m`);
            console.log(`\x1b[36m  Title: ${publishTitle}\x1b[0m`);
            console.log('\x1b[36m  Converting DOCX to Confluence format...\x1b[0m');
            
            const confluenceHtml = await convertDocxToConfluenceHtml(publishFilePath);
            
            const page = await createConfluencePage(baseUrl, auth, spaceId, parentPageId, publishTitle, confluenceHtml);
            
            console.log('\x1b[32m✓ Success!\x1b[0m');
            console.log(`\x1b[32m  Page ID: ${page.id}\x1b[0m`);
            console.log(`\x1b[32m  URL: ${baseUrl}/pages/viewpage.action?pageId=${page.id}\x1b[0m`);
        }
        else if (mode === 'update') {
            let updatePageId = pageId;
            let updateFilePath = filePath || process.env.DOCX_FILE;
            let updateTitle = title || process.env.TITLE;
            
            if (!updatePageId) {
                const pageUrl = process.env.CONFLUENCE_UPDATE_PAGE_URL;
                if (!pageUrl || pageUrl.startsWith('#')) {
                    console.error('\x1b[31m✗ Update requires CONFLUENCE_UPDATE_PAGE_URL in .env (not commented out)\x1b[0m');
                    process.exit(1);
                }
                try {
                    updatePageId = extractPageIdFromUrl(pageUrl);
                } catch (error) {
                    console.error(`\x1b[31m✗ ${error.message}\x1b[0m`);
                    process.exit(1);
                }
            }
            
            if (!updateFilePath || updateFilePath.startsWith('#')) {
                console.error('\x1b[31m✗ Update requires DOCX_FILE set in .env (not commented out)\x1b[0m');
                process.exit(1);
            }
            
            if (!fs.existsSync(updateFilePath)) {
                console.error(`\x1b[31m✗ File not found: ${updateFilePath}\x1b[0m`);
                process.exit(1);
            }
            
            if (!updateFilePath.toLowerCase().endsWith('.docx')) {
                console.error('\x1b[31m✗ File must be .docx format\x1b[0m');
                process.exit(1);
            }
            
            const finalTitle = updateTitle || path.basename(updateFilePath, '.docx').replace(/-/g, ' ');
            
            console.log('\x1b[36m[UPDATING CONFLUENCE PAGE WITH DOCX]\x1b[0m');
            console.log(`\x1b[36m  File: ${updateFilePath}\x1b[0m`);
            console.log(`\x1b[36m  Page ID: ${updatePageId}\x1b[0m`);
            console.log(`\x1b[36m  Title: ${finalTitle}\x1b[0m`);
            console.log('\x1b[36m  Converting DOCX to Confluence format...\x1b[0m');
            
            const confluenceHtml = await convertDocxToConfluenceHtml(updateFilePath);
            
            const page = await updateConfluencePage(baseUrl, auth, updatePageId, finalTitle, confluenceHtml);
            
            console.log('\x1b[32m✓ Success!\x1b[0m');
            console.log(`\x1b[32m  Page ID: ${page.id}\x1b[0m`);
            console.log(`\x1b[32m  Version: ${page.version.number}\x1b[0m`);
            console.log(`\x1b[32m  URL: ${baseUrl}/pages/viewpage.action?pageId=${page.id}\x1b[0m`);
        }
    } catch (error) {
        console.error(`\x1b[31m✗ Error: ${error.message}\x1b[0m`);
        process.exit(1);
    }
}

main().catch(error => {
    console.error(`\x1b[31m✗ Fatal error: ${error.message}\x1b[0m`);
    process.exit(1);
});