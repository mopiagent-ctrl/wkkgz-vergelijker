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
        
        if (p.eigen_risico_per_klacht === '€0 (geen eigen risico)') 
            tags.push('<span class="provider-tag tag--no-deductible">Geen eigen risico</span>');
        
        if (p.depot_verplichting) 
            tags.push('<span class="provider-tag tag--warning">⚠️ Depot</span>');
        
        const riskClass = p.eigen_risico_per_klacht === '€0 (geen eigen risico)' ? 'risk-green' : 
                         (p.eigen_risico_per_klacht === '€150+ per klacht' || p.depot_verplichting ? 'risk-red' : 'risk-gray');
        
        const zittingClass = p.kosten_per_zitting === '€0 (alles gedekt in abonnement)' ? 'risk-green' :
                           (p.depot_verplichting ? 'risk-red' : 'risk-gray');
        
        return `
            <tr>
                <td>
                    <a href="${p.url}" target="_blank" rel="noopener" class="provider-name">${p.name}</a>
                    <div class="provider-tags">${tags.join('')}</div>
                </td>
                <td>
                    <span class="price-primary">€${p.price_per_year.toFixed(2).replace('.', ',')}</span>
                    <span class="price-note">${p.price_note}</span>
                </td>
                <td>
                    <span class="price-primary">€${p.first_year_total.toFixed(2).replace('.', ',')}</span>
                    <span class="price-note">daarna €${p.renewal_total.toFixed(2).replace('.', ',')}/jr</span>
                </td>
                <td>${p.inschrijfkosten}</td>
                <td class="${riskClass}">${p.eigen_risico_per_klacht}</td>
                <td class="${zittingClass}">${p.kosten_per_zitting}${p.depot_bedrag ? '<br><span class="price-note">' + p.depot_bedrag + '</span>' : ''}</td>
                <td><span style="font-size:0.8rem">${p.geschilleninstantie}</span></td>
                <td>
                    <div class="rating-dots">${ratingDots}</div>
                    <a href="${p.url}" target="_blank" rel="noopener" class="price-cta">→ Website</a>
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
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('filter-btn--active', btn.dataset.filter === filter);
    });
    
    let filtered = [...providers];
    
    switch(filter) {
        case 'budget':
            filtered = filtered.filter(p => p.price_per_year <= 60);
            break;
        case 'mid':
            filtered = filtered.filter(p => p.price_per_year > 60 && p.price_per_year <= 120);
            break;
        case 'premium':
            filtered = filtered.filter(p => p.price_per_year > 120);
            break;
        case 'no-deductible':
            filtered = filtered.filter(p => p.eigen_risico_per_klacht === '€0 (geen eigen risico)');
            break;
        case 'big':
            filtered = filtered.filter(p => p.categorieen.includes('big'));
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
                      <strong>Winnaar:</strong> ZorgDoenWijSamen voor €48,40/jaar — de absolute basis, geen franje.`;
            break;
        case 'zekerheid':
            filtered = providers.filter(p => p.eigen_risico_per_klacht === '€0 (geen eigen risico)');
            result = `🛡️ <strong>Zonder eigen risico:</strong> ${filtered.map(p => p.name).join(' en ')} hebben geen eigen risico per klacht.<br>
                      <strong>Winnaar:</strong> SoloPartners SoloPlus (€90,75/jr) — de goedkoopste met 100% kosten dekking bij geschillen.`;
            break;
        case 'big':
            filtered = providers.filter(p => p.categorieen.includes('big'));
            result = `👨‍⚕️ <strong>BIG-geregistreerd:</strong> NIBIG is specifiek voor BIG'ers. Maar elk generiek abonnement werkt ook voor jou.<br>
                      <strong>Advies:</strong> ZorgDoenWijSamen (€48,40) voor de prijs, SoloPartners (€90,75) voor zekerheid.`;
            break;
        case 'all-in':
            result = `📦 <strong>Alles-in-1:</strong> SoloPartners SoloCompleet (€160/jr, incl. VOG+protocollen) of ZorgVoorZZP (€208,80/jr, incl. Wtza+community).<br>
                      <strong>Advies:</strong> SoloCompleet is voordeliger. Alleen ZorgVoorZZP als je de community-functies echt gaat gebruiken.`;
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
