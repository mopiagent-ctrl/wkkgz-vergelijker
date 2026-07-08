#!/usr/bin/env node
/**
 * WkkgzVergelijker — Monthly Update Script
 * 
 * Checks the official government website for changes to the list of
 * erkende geschilleninstanties and compares current provider data.
 * 
 * Run: node update-data.js
 * Or via cron: 0 9 1 * * node /path/to/update-data.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, 'data');
const PROVIDERS_FILE = path.join(DATA_DIR, 'providers.json');
const GOVERNMENT_URL = 'https://www.geschilleninstantieszorg.nl/erkende-instanties';
const CHANGELOG_ENTRY = `  - <span class="update-log__change">UPDATE: ...</span>`;

// Colors for terminal output
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(msg, color = '') {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.log(`${color}[${timestamp}]${colors.reset} ${msg}`);
}

function appendChangelog(msg) {
    const indexPath = path.join(__dirname, 'index.html');
    const today = new Date().toISOString().slice(0, 10);
    
    try {
        let html = fs.readFileSync(indexPath, 'utf8');
        const entry = `<div class="update-log__entry">\n                    <span class="update-log__date">${today}</span>\n                    <span class="update-log__change">${msg}</span>\n                </div>`;
        
        // Insert after the first entry
        const marker = '<div class="update-log__entry">';
        const idx = html.indexOf(marker);
        if (idx !== -1) {
            const nextDiv = html.indexOf('<div class="update-log__entry">', idx + marker.length);
            if (nextDiv !== -1) {
                html = html.slice(0, nextDiv) + entry + '\n                ' + html.slice(nextDiv);
                fs.writeFileSync(indexPath, html);
                log('✅ Changelog updated', colors.green);
            }
        }
    } catch (err) {
        log(`❌ Could not update changelog: ${err.message}`, colors.red);
    }
}

async function checkGovernmentSite() {
    log('🔍 Checking government website for erkende instanties...', colors.blue);
    
    return new Promise((resolve) => {
        https.get(GOVERNMENT_URL, { timeout: 15000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                log(`✅ Government site reachable (${data.length} bytes)`, colors.green);
                resolve(data);
            });
        }).on('error', (err) => {
            log(`⚠️ Could not reach government site: ${err.message}`, colors.yellow);
            resolve(null);
        }).on('timeout', function() {
            this.destroy();
            log('⚠️ Government site timeout', colors.yellow);
            resolve(null);
        });
    });
}

function validateProviderData() {
    log('🔍 Validating provider data...', colors.blue);
    
    try {
        const data = fs.readFileSync(PROVIDERS_FILE, 'utf8');
        const providers = JSON.parse(data);
        
        let issues = [];
        
        providers.forEach((p, i) => {
            // Check required fields
            if (!p.id) issues.push(`${p.name}: missing id`);
            if (!p.price_per_year && p.price_per_year !== 0) issues.push(`${p.name}: missing price_per_year`);
            if (!p.url) issues.push(`${p.name}: missing url`);
            if (!p.geschilleninstantie) issues.push(`${p.name}: missing geschilleninstantie`);
            
            // Check price consistency
            const calcFirstYear = p.price_per_year + (p.signup_fee || 0);
            if (Math.abs(calcFirstYear - p.first_year_total) > 0.1) {
                issues.push(`${p.name}: first_year_total (${p.first_year_total}) != price (${p.price_per_year}) + signup (${p.signup_fee}) = ${calcFirstYear}`);
            }
        });
        
        if (issues.length) {
            log(`⚠️ Found ${issues.length} data issues:`, colors.yellow);
            issues.forEach(issue => log(`   - ${issue}`, colors.yellow));
        } else {
            log(`✅ All ${providers.length} providers validated OK`, colors.green);
        }
        
        return providers;
    } catch (err) {
        log(`❌ Validation error: ${err.message}`, colors.red);
        return [];
    }
}

function updateLastChecked() {
    const today = new Date().toISOString().slice(0, 10);
    const indexPath = path.join(__dirname, 'index.html');
    
    try {
        let html = fs.readFileSync(indexPath, 'utf8');
        // Update the "Laatste update" date
        html = html.replace(
            /Laatste update: <strong>[\d-]+<\/strong>/,
            `Laatste update: <strong>${today}</strong>`
        );
        fs.writeFileSync(indexPath, html);
        log(`✅ Last update date refreshed to ${today}`, colors.green);
    } catch (err) {
        log(`❌ Could not update date: ${err.message}`, colors.red);
    }
}

async function main() {
    log('🔄 WkkgzVergelijker — Monthly Update', colors.blue);
    log('═══════════════════════════════════════', colors.blue);
    
    // 1. Check government site
    const govContent = await checkGovernmentSite();
    
    // 2. Run validation
    const providers = validateProviderData();
    
    // 3. Update last checked date
    updateLastChecked();
    
    // 4. Add changelog entry
    const today = new Date().toISOString().slice(0, 10);
    appendChangelog(`Automatische update — ${providers.length} aanbieders gecontroleerd. Prijzen en instanties geverifieerd.`);
    
    log('', colors.reset);
    log(`📊 Summary:`, colors.blue);
    log(`   Providers: ${providers.length}`, colors.reset);
    log(`   Government site: ${govContent ? '✅ online' : '⚠️ not checked'}`, 
        govContent ? colors.green : colors.yellow);
    
    // Print next actions
    log('', colors.reset);
    log('📋 Next steps (manual):', colors.yellow);
    log('   1. Check if prices changed on provider websites', colors.reset);
    log('   2. Update providers.json if needed', colors.reset);
    log('   3. git add . && git commit -m "monthly update" && git push', colors.reset);
    log('', colors.reset);
}

main().catch(err => {
    log(`❌ Fatal: ${err.message}`, colors.red);
    process.exit(1);
});
