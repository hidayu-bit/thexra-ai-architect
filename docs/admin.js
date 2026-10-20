// Google Sheets Config
const SHEET_ID = '1AFjgWSm9TTcuXzT9Eo9qrADEGhzGY_9zIb22A-acuJU';

// Parse CSV text into array of objects
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const splitLine = (text) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (c === '"') {
                inQuotes = !inQuotes;
            } else if (c === ',' && !inQuotes) {
                result.push(cur.trim().replace(/^["']|["']$/g, ''));
                cur = '';
            } else {
                cur += c;
            }
        }
        result.push(cur.trim().replace(/^["']|["']$/g, ''));
        return result;
    };

    const headers = splitLine(lines[0]);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const values = splitLine(lines[i]);
        if (values.length >= headers.length) {
            const rowObj = {};
            headers.forEach((header, index) => {
                rowObj[header.trim()] = values[index] || '';
            });
            rows.push(rowObj);
        }
    }

    return rows;
}

// Strictly Map Industry to the 10 Form Options
function getExactSheetIndustry(lead) {
    const validIndustries = [
        'Manufacturing', 'Education', 'Healthcare', 'Tourism',
        'Retail', 'Property', 'Energy', 'Government',
        'Training', 'Entertainment'
    ];

    // 1. Semak lajur borang spesifik
    for (const key of Object.keys(lead)) {
        const val = (lead[key] || '').trim();
        const matched = validIndustries.find(ind => ind.toLowerCase() === val.toLowerCase());
        if (matched) return matched;
    }

    // 2. Semak teks Prompt
    const prompt = lead['Prompt'] || lead['Full Prompt'] || lead['prompt'] || '';
    for (const ind of validIndustries) {
        if (new RegExp(`Industry(?:\\s*Vertical)?:\\s*${ind}`, 'i').test(prompt)) {
            return ind;
        }
    }

    // 3. Imbas kata kunci berpandukan 10 pilihan borang
    const fullText = (JSON.stringify(lead) + ' ' + prompt).toLowerCase();

    if (fullText.includes('property') || fullText.includes('estate') || fullText.includes('building') || fullText.includes('hvac') || fullText.includes('bim') || fullText.includes('klcc')) return 'Property';
    if (fullText.includes('surg') || fullText.includes('health') || fullText.includes('med') || fullText.includes('cadaver')) return 'Healthcare';
    if (fullText.includes('edu') || fullText.includes('school') || fullText.includes('university') || fullText.includes('student')) return 'Education';
    if (fullText.includes('train') || fullText.includes('skills') || fullText.includes('workshop')) return 'Training';
    if (fullText.includes('tour') || fullText.includes('visit') || fullText.includes('landmark') || fullText.includes('museum')) return 'Tourism';
    if (fullText.includes('shop') || fullText.includes('retail') || fullText.includes('store') || fullText.includes('apparel')) return 'Retail';
    if (fullText.includes('energy') || fullText.includes('oil') || fullText.includes('gas') || fullText.includes('power')) return 'Energy';
    if (fullText.includes('gov') || fullText.includes('public') || fullText.includes('agency') || fullText.includes('regulatory')) return 'Government';
    if (fullText.includes('arena') || fullText.includes('game') || fullText.includes('arcade') || fullText.includes('entertainment')) return 'Entertainment';

    return 'Manufacturing';
}

// Extractor for Recommended Solution
function getExactRecommendedSolution(lead) {
    for (const key of Object.keys(lead)) {
        const k = key.toLowerCase();
        if ((k.includes('solution') || k.includes('technology') || k.includes('tech') || k.includes('recommend')) && lead[key] && lead[key].trim() !== '') {
            const val = lead[key].trim();
            if (val.toLowerCase() !== 'n/a' && val.length > 3) {
                return val;
            }
        }
    }

    const fullText = (JSON.stringify(lead)).toLowerCase();
    if (fullText.includes('hvac') || fullText.includes('bim') || fullText.includes('building') || fullText.includes('property') || fullText.includes('twin')) {
        return 'Digital Twin — Spatial Twin Operations';
    }
    if (fullText.includes('surg') || fullText.includes('cadaver') || fullText.includes('agri') || fullText.includes('skills')) {
        return 'VR — THEXRA Immersive Simulator';
    }
    if (fullText.includes('crane') || fullText.includes('maritime') || fullText.includes('borescope')) {
        return 'AR — THEXRA View';
    }

    return 'THEXRA Spatial Architecture';
}

// Delete / Remove row from UI
function deleteLeadRow(buttonElement, companyName) {
    if (confirm(`Are you sure you want to delete/archive lead: "${companyName}" from this view?`)) {
        const row = buttonElement.closest('tr');
        if (row) {
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '0';
            setTimeout(() => {
                row.remove();
                // Update total counter
                const totalEl = document.getElementById('total-count');
                if (totalEl) {
                    const currentVal = parseInt(totalEl.innerText) || 0;
                    if (currentVal > 0) totalEl.innerText = currentVal - 1;
                }
            }, 300);
        }
    }
}

// Fetch Leads Data from Google Sheets CRM
async function loadSalesDashboardData() {
    const tableBody = document.getElementById('table-body');
    const totalCountEl = document.getElementById('total-count');
    const hotCountEl = document.getElementById('hot-count');
    const pendingCountEl = document.getElementById('pending-count');

    try {
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
        const response = await fetch(gvizUrl);
        const csvData = await response.text();

        const leads = parseCSV(csvData);

        if (!leads || leads.length === 0) {
            tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: #94A3B8; padding: 40px;">
            No sales leads recorded yet. Submissions from the Intake Form will appear here automatically.
          </td>
        </tr>
      `;
            return;
        }

        let hotCount = 0;
        let pendingCount = 0;

        leads.forEach(lead => {
            const score = (lead['Lead Score'] || lead['Score'] || lead['Lead Rating'] || '').toLowerCase();
            const status = (lead['Status'] || lead['Lifecycle Status'] || lead['Proposal Status'] || '').toLowerCase();

            if (score.includes('hot')) hotCount++;
            if (status.includes('draft') || status.includes('review') || status.includes('new')) pendingCount++;
        });

        totalCountEl.innerText = leads.length;
        hotCountEl.innerText = hotCount;
        pendingCountEl.innerText = pendingCount;

        // Render Rows
        tableBody.innerHTML = leads.map(lead => {
            const company = lead['Client / Company'] || lead['Company Name'] || lead['Company'] || lead['Client'] || 'N/A';
            const industry = getExactSheetIndustry(lead);
            const tech = getExactRecommendedSolution(lead);
            const score = lead['Lead Score'] || lead['Score'] || lead['Lead Rating'] || 'Warm';
            const status = lead['Status'] || lead['Lifecycle Status'] || 'Proposal Draft';
            const updatedDate = lead['Date'] || lead['Timestamp'] || lead['Created At'] || lead['Last Updated'] || '20/10/2026';
            const docLink = lead['Proposal Link'] || lead['Proposal Document'] || lead['Proposal File'] || lead['Google Drive Link'] || 'https://drive.google.com';

            // Score Badge Styling
            let badgeHTML = `<span class="badge badge-warm">⚡ Warm</span>`;
            const scoreLower = score.toLowerCase();
            if (scoreLower.includes('hot')) {
                badgeHTML = `<span class="badge badge-hot">🔥 Hot</span>`;
            } else if (scoreLower.includes('cold')) {
                badgeHTML = `<span class="badge badge-cold">❄️ Cold</span>`;
            }

            // Status Pill Styling
            let statusHTML = `<span class="status-pill status-draft">Proposal Draft</span>`;
            if (status.toLowerCase().includes('approved')) {
                statusHTML = `<span class="status-pill status-approved">Approved</span>`;
            } else if (status.toLowerCase().includes('review')) {
                statusHTML = `<span class="status-pill status-draft">Review</span>`;
            }

            return `
        <tr>
          <td style="font-weight: 700; color: #FFFFFF;">${company}</td>
          <td><span style="color: #38BDF8; font-weight: 600;">${industry}</span></td>
          <td>${tech}</td>
          <td>${badgeHTML}</td>
          <td>${statusHTML}</td>
          <td style="color: #94A3B8; font-size: 11px;">${updatedDate}</td>
          <td style="display: flex; gap: 8px;">
            <a href="${docLink}" target="_blank" class="btn-action" style="background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.4); color: #34D399; text-decoration: none;">
              📄 Proposal
            </a>
            <button class="btn-action" onclick="deleteLeadRow(this, '${company.replace(/'/g, "\\'")}')" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #F87171;">
              🗑️ Delete
            </button>
          </td>
        </tr>
      `;
        }).join('');

    } catch (error) {
        console.warn('Dashboard data fetch error:', error);
        tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: #EF4444; padding: 40px;">
          Failed to connect to Google Sheets CRM. Please verify internet connection.
        </td>
      </tr>
    `;
    }
}

document.addEventListener('DOMContentLoaded', loadSalesDashboardData);