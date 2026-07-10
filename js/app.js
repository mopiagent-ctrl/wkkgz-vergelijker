/* ============================================
   WkkgzVergelijker.nl — App
   ============================================ */

// Official VWS-erkende geschilleninstanties (per zorgsoort)
const erkendeInstanties = [
    {
        name: 'Geschillencommissie Ziekenhuizen',
        url: 'https://www.degeschillencommissiezorg.nl',
        forWho: 'Ziekenhuizen (NVZ, NFU, incl. UMCs)',
        category: 'medisch-specialistisch'
    },
    {
        name: 'Geschillencommissie Zelfstandige Klinieken',
        url: 'https://www.degeschillencommissiezorg.nl',
        forWho: 'Leden van ZKN',
        category: 'medisch-specialistisch'
    },
    {
        name: 'Geschillencommissie EZa (Eerstelijns- en Ziekenhuiszorg)',
        url: 'https://www.degeschillencommissiezorg.nl',
        forWho: 'Eerstelijns- en ziekenhuiszorg',
        category: 'medisch-specialistisch'
    },
    {
        name: 'Geschilleninstantie Mondzorg (SGIM)',
        url: 'https://www.geschilleninstantiemondzorg.nl',
        forWho: 'Mondzorgaanbieders',
        category: 'mondzorg'
    },
    {
        name: 'Kwaliteitsinstituut Mondzorg (Stichting KIM)',
        url: 'https://stichting-kim.nl',
        forWho: 'Bij KIM aangesloten mondzorgaanbieders',
        category: 'mondzorg'
    },
    {
        name: 'GIDZ (Geschillen in de Zorg)',
        url: 'https://geschillenindezorg.nl',
        forWho: 'Alle zorgaanbieders (via SoloPartners)',
        category: 'generiek'
    },
    {
        name: 'Stichting Zorggeschil',
        url: 'https://zorggeschil.nl',
        forWho: 'Alle zorgaanbieders (via ZZP Nederland, Quasir)',
        category: 'generiek'
    },
    {
        name: 'Stichting Geschilleninstantie KPZ',
        url: 'https://geschillencommissiekpz.nl',
        forWho: 'Bij Klachtenportaal Zorg aangesloten aanbieders',
        category: 'generiek'
    },
    {
        name: 'Geschillencommissie Zelfstandige Zorgprofessionals',
        url: 'https://www.degeschillencommissiezorg.nl',
        forWho: 'Via ZorgVoorZZP aangesloten ZZP\'ers',
        category: 'generiek'
    }
];

let providers = [];
let activeFilter = 'all';
let keuzeActive = false;

async function loadProviders() {
    try {
        const res = await fetch('data/providers.json');
        providers = await res.json();
        renderTable(providers);
        renderInstanties();
    } catch (err) {
        console.error('Failed to load providers:', err);
        document.getElementById('tableBody').innerHTML = 
            '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--gray-400)">❌ Kon data niet laden. Probeer opnieuw.</td></tr>';
    }
}

function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    
    if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--gray-400)">Geen aanbieders gevonden voor deze selectie.</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(p => {
        const ratingDots = Array.from({length: 10}, (_, i) => 
            `<span class="dot ${i < p.rating_value ? 'dot--filled' : ''}"></span>`
        ).join('');
        
        const tags = [];
        if (p.price_per_year < 60) tags.push('<span class="provider-tag tag--budget">Budget</span>');
        else if (p.price_per_year < 120) tags.push('<span class="provider-tag tag--mid">Midden</span>');
        else tags.push('<span class="provider-tag tag--premium">Premium</span>');
        
        if (p.eigen_risico_per_klacht === '€0 (geen eigen risico)' || p.eigen_risico_per_klacht === '€0 — geen eigen risico' || p.eigen_risico_per_klacht === '€0 (geen)')
            tags.push('<span class="provider-tag tag--no-deductible">Geen eigen risico</span>');
        
        if (p.depot_verplichting || (p.kosten_per_zitting && p.kosten_per_zitting.includes('€2.500')))
            tags.push('<span class="provider-tag tag--warning">⚠️ Verborgen kosten</span>');
        
        if (p.kosten_per_zitting && p.kosten_per_zitting.includes('€0'))
            tags.push('<span class="provider-tag tag--no-deductible">Alles gedekt</span>');
        
        if (p.verplichte_bav)
            tags.push('<span class="provider-tag tag--warning">BAV verplicht</span>');
        
        // Check if Wzd is covered
        const dekkingIcons = [];
        if (p.dekking_wzd) dekkingIcons.push('Wzd');
        if (p.dekking_wmo) dekkingIcons.push('Wmo');
        if (p.dekking_jeugdwet) dekkingIcons.push('Jeugd');
        const dekkingStr = dekkingIcons.length ? dekkingIcons.join('+') : 'Alleen Wkkgz';
        
        const riskClass = (!p.eigen_risico_per_klacht || p.eigen_risico_per_klacht === '€0 (geen eigen risico)' || p.eigen_risico_per_klacht === '€0 — geen eigen risico') && 
                         (!p.kosten_per_zitting || p.kosten_per_zitting.includes('€0')) ? 'risk-green' : 
                         (p.kosten_per_zitting && (p.kosten_per_zitting.includes('€2.500') || p.kosten_per_zitting.includes('€295') || p.kosten_per_zitting.includes('€4.000'))) ? 'risk-red' : 'risk-gray';
        
        return `
            <tr>
                <td>
                    <a href="${p.url}" target="_blank" rel="noopener" class="provider-name">${p.name}</a>
                    <div class="provider-tags">${tags.join('')}</div>
                    <div style="margin-top:4px;font-size:0.7rem;color:var(--gray-400)">Dekking: ${dekkingStr}</div>
                </td>
                <td>
                    <span class="price-primary">€${p.price_per_year.toFixed(2).replace('.', ',')}</span>
                    <span class="price-note">${p.price_note ? p.price_note.substring(0,60) + '...' : ''}</span>
                </td>
                <td>
                    <span class="price-primary">€${p.first_year_total.toFixed(2).replace('.', ',')}</span>
                    <span class="price-note">daarna €${p.renewal_total.toFixed(2).replace('.', ',')}/jr</span>
                </td>
                <td>${p.inschrijfkosten || 'Geen'}</td>
                <td class="${p.eigen_risico_per_klacht && (p.eigen_risico_per_klacht.includes('€0') || p.eigen_risico_per_klacht.includes('Geen')) ? 'risk-green' : 'risk-red'}">${p.eigen_risico_per_klacht || 'Onbekend'}</td>
                <td class="${riskClass}">${p.kosten_per_zitting || 'Onbekend'}</td>
                <td><span style="font-size:0.8rem">${p.geschilleninstantie.substring(0,50)}...</span></td>
                <td>
                    <div class="rating-dots">${ratingDots}</div>
                    <a href="${p.url}" target="_blank" rel="noopener" class="price-cta">→ Site</a>
                </td>
            </tr>
        `;
    }).join('');
}

function renderInstanties() {
    const list = document.getElementById('instantiesList');
    list.innerHTML = erkendeInstanties.map(inst => `
        <div class="instantie-card">
            <h4>${inst.name}</h4>
            <p>${inst.forWho}</p>
            <a href="${inst.url}" target="_blank" rel="noopener">Bezoek website →</a>
        </div>
    `).join('');
}

function filterProviders(filter) {
    activeFilter = filter;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('filter-btn--active', btn.dataset.filter === filter);
    });
    
    let filtered = [...providers];
    
    switch(filter) {
        case 'budget':
            filtered = filtered.filter(p => p.price_per_year >= 0 && p.price_per_year <= 60);
            break;
        case 'mid':
            filtered = filtered.filter(p => p.price_per_year > 60 && p.price_per_year <= 120);
            break;
        case 'premium':
            filtered = filtered.filter(p => p.price_per_year > 120);
            break;
        case 'no-deductible':
            filtered = filtered.filter(p => p.kosten_per_zitting && (p.kosten_per_zitting.includes('€0') || p.kosten_per_zitting.includes('geen') || p.kosten_per_zitting.includes('Alles')));
            break;
        case 'breedste-dekking':
            filtered = filtered.filter(p => p.dekking_wzd === true && p.kosten_per_zitting && p.kosten_per_zitting.includes('€0'));
            break;
        default:
            break;
    }
    
    const sort = document.getElementById('sortSelect').value;
    sortProviders(filtered, sort);
    renderTable(filtered);
}

function sortProviders(data, sortBy) {
    switch(sortBy) {
        case 'price-asc':
            data.sort((a, b) => a.price_per_year - b.price_per_year);
            break;
        case 'price-desc':
            data.sort((a, b) => b.price_per_year - a.price_per_year);
            break;
        case 'rating':
            data.sort((a, b) => b.rating_value - a.rating_value);
            break;
        case 'name':
            data.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
}

function handleKeuzehulp(need) {
    keuzeActive = true;
    document.querySelectorAll('.keuzehulp__btn').forEach(btn => {
        btn.classList.toggle('keuzehulp__btn--active', btn.dataset.need === need);
    });
    
    let result = '';
    let filtered = [];
    
    switch(need) {
        case 'minimaal':
            filtered = providers.sort((a, b) => a.price_per_year - b.price_per_year).slice(0, 3);
            result = `💰 <strong>Goedkoopste opties:</strong> ${filtered.map(p => p.name + ' (€' + p.price_per_year.toFixed(2).replace('.', ',') + '/jr)').join(', ')}.<br>
                      <strong>Let op:</strong> ZorgDoenWijSamen is het goedkoopst, maar rekent €2.500+ per geschil. Kies bewust.`;
            break;
        case 'zekerheid':
            filtered = providers.filter(p => p.kosten_per_zitting && p.kosten_per_zitting.includes('€0'));
            result = `🛡️ <strong>Zonder verborgen kosten:</strong> ${filtered.map(p => p.name).join(', ')} hebben geen extra kosten bij een geschil.<br>
                      <strong>Aanrader:</strong> SoloPartners SoloPlus (€90,75/jr) — alles gedekt, geen eigen risico, ook Wzd+Wmo inbegrepen.`;
            break;
        case 'breedst':
            filtered = providers.filter(p => p.dekking_wzd === true && p.kosten_per_zitting && p.kosten_per_zitting.includes('€0'));
            result = `🏥 <strong>Breedste dekking (incl. Wzd):</strong> ${filtered.map(p => p.name).join(', ')}.<br>
                      <strong>Aanrader:</strong> SoloPartners SoloPlus — dekt Wkkgz+Wzd+Wmo+Jeugdwet, geen verborgen kosten.`;
            break;
        case 'all-in':
            result = `📦 <strong>Alles-in-1:</strong> SoloPartners SoloCompleet (€160/jr, incl. VOG+protocollen).<br>
                      <strong>Advies:</strong> Alleen doen als je VOG en protocollen nog nodig hebt. Anders is SoloPlus voordeliger.`;
            break;
    }
    
    const resultDiv = document.getElementById('keuzehulpResult');
    resultDiv.innerHTML = result;
    resultDiv.classList.add('keuzehulp__result--visible');
    
    // Scroll to result
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // If we have filtered providers, highlight them
    if (filtered.length) {
        const rows = document.querySelectorAll('#tableBody tr');
        const names = filtered.map(p => p.name);
        rows.forEach(row => {
            const nameCell = row.querySelector('.provider-name');
            if (nameCell && names.some(n => nameCell.textContent.includes(n))) {
                row.classList.add('highlighted');
            }
        });
    }
}

// --- Event Listeners ---

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        filterProviders(btn.dataset.filter);
        keuzeActive = false;
        document.querySelectorAll('.keuzehulp__btn').forEach(b => b.classList.remove('keuzehulp__btn--active'));
        document.getElementById('keuzehulpResult').classList.remove('keuzehulp__result--visible');
    });
});

// Sort select
document.getElementById('sortSelect').addEventListener('change', (e) => {
    if (keuzeActive) {
        // Re-apply the active filter logic
        const activeBtn = document.querySelector('.filter-btn--active');
        if (activeBtn) filterProviders(activeBtn.dataset.filter);
        return;
    }
    const sorted = [...providers];
    sortProviders(sorted, e.target.value);
    renderTable(sorted);
});

// Keuzehulp buttons
document.querySelectorAll('.keuzehulp__btn').forEach(btn => {
    btn.addEventListener('click', () => handleKeuzehulp(btn.dataset.need));
});

// Back to top
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
    backToTop.classList.toggle('back-to-top--visible', window.scrollY > 400);
});

// --- Init ---
document.addEventListener('DOMContentLoaded', loadProviders);
