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

// 1. Precise Industry Matcher mapped to form options & prompt
function getExactSheetIndustry(lead) {
    const validIndustries = [
        'Training', 'Education', 'Healthcare', 'Tourism',
        'Retail', 'Property', 'Energy', 'Government',
        'Manufacturing', 'Entertainment'
    ];

    // Direct Sheet Column Check
    for (const key of Object.keys(lead)) {
        const k = key.toLowerCase();
        if (k.includes('industry') || k.includes('vertical') || k.includes('sector')) {
            const val = (lead[key] || '').trim();
            const matched = validIndustries.find(ind => ind.toLowerCase() === val.toLowerCase());
            if (matched) return matched;
            if (val && val.toLowerCase() !== 'enterprise' && val.toLowerCase() !== 'n/a') {
                return val;
            }
        }
    }

    // Parse prompt text
    const prompt = lead['Prompt'] || lead['Full Prompt'] || lead['prompt'] || '';
    const match = prompt.match(/Industry(?:\s*Vertical)?:\s*([^\n]+)/i);
    if (match && match[1] && match[1].trim() !== '') {
        const val = match[1].trim();
        const matched = validIndustries.find(ind => ind.toLowerCase() === val.toLowerCase());
        if (matched) return matched;
    }

    // Keyword Fallback with Training & Aero Priority
    const fullText = (JSON.stringify(lead) + ' ' + prompt).toLowerCase();

    if (fullText.includes('train') || fullText.includes('disassembly') || fullText.includes('jet engine') || fullText.includes('technician') || fullText.includes('skills')) return 'Training';
    if (fullText.includes('retail') || fullText.includes('apparel') || fullText.includes('clothing') || fullText.includes('vogue')) return 'Retail';
    if (fullText.includes('property') || fullText.includes('estate') || fullText.includes('building') || fullText.includes('hvac') || fullText.includes('klcc')) return 'Property';
    if (fullText.includes('surg') || fullText.includes('health') || fullText.includes('med') || fullText.includes('cadaver')) return 'Healthcare';
    if (fullText.includes('energy') || fullText.includes('oil') || fullText.includes('gas') || fullText.includes('offshore')) return 'Energy';

    return 'Training';
}

// 2. Precise Recommended Solution Matcher
function getExactRecommendedSolution(lead) {
    // Direct Sheet Column Check
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

    if (fullText.includes('jet engine') || fullText.includes('disassembly') || fullText.includes('headset') || fullText.includes('haptic') || fullText.includes('cadaver') || fullText.includes('surgery') || fullText.includes('vr')) {
        return 'VR — THEXRA Immersive Simulator';
    }
    if (fullText.includes('apparel') || fullText.includes('clothing') || fullText.includes('retail') || fullText.includes('sizing') || fullText.includes('try-on')) {
        return 'AR — THEXRA View (Retail Edition)';
    }
    if (fullText.includes('hvac') || fullText.includes('bim') || fullText.includes('building') || fullText.includes('property') || fullText.includes('twin')) {
        return 'Digital Twin — Spatial Twin Operations';
    }

    return 'THEXRA Solution';
}
// 3. Dynamic Date Formatter (Preserves Original Sheet Date, Defaults to Today for New Leads)
function getFormattedDate(lead) {
    for (const key of Object.keys(lead)) {
        const k = key.toLowerCase();
        if (k.includes('date') || k.includes('time') || k.includes('created') || k.includes('timestamp')) {
            const val = (lead[key] || '').trim();
            if (val && val !== 'N/A') {
                const match = val.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/) || val.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
                if (match) {
                    if (match[1].length === 4) {
                        return `${match[3].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[1]}`;
                    }
                    return `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[3]}`;
                }
                return val;
            }
        }
    }

    // Fallback to Current Local Date (Kuala Lumpur) for new leads without dates
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
}

// Open Client Detail History Modal (Day 27 Feature)
function openClientHistoryModal(encodedLeadData) {
    try {
        const lead = JSON.parse(decodeURIComponent(encodedLeadData));

        const company = lead['Client / Company'] || lead['Company Name'] || lead['Company'] || 'Client Organization';
        const industry = getExactSheetIndustry(lead);
        const score = lead['Lead Score'] || lead['Score'] || 'Warm';
        const status = lead['Status'] || lead['Lifecycle Status'] || 'Proposal Draft';
        const tech = getExactRecommendedSolution(lead);

        let problem = 'Standard Enterprise Requirement';
        for (const key of Object.keys(lead)) {
            const k = key.toLowerCase();
            if ((k.includes('problem') || k.includes('opportunity') || k.includes('friction') || k.includes('requirement')) && lead[key] && lead[key].trim() !== '') {
                problem = lead[key].trim();
                break;
            }
        }

        if (problem === 'Standard Enterprise Requirement') {
            const prompt = lead['Prompt'] || lead['Full Prompt'] || lead['prompt'] || '';
            const match = prompt.match(/Core Business Problem:\s*([^\n]+)/i) || prompt.match(/Core Problem:\s*([^\n]+)/i);
            if (match && match[1]) problem = match[1].trim();
        }

        const updatedDate = getFormattedDate(lead);
        const docLink = lead['Proposal Link'] || lead['Proposal Document'] || lead['Proposal File'] || lead['Google Drive Link'] || '#';

        // Populate Modal Fields
        document.getElementById('modal-company-name').innerText = company;
        document.getElementById('modal-industry').innerText = industry;
        document.getElementById('modal-score').innerText = score;
        document.getElementById('modal-status').innerText = status;
        document.getElementById('modal-problem').innerText = problem;
        document.getElementById('modal-solution').innerText = tech;
        document.getElementById('modal-date').innerText = `Last Updated / Audit Date: ${updatedDate}`;

        // Score styling in Modal
        const scoreEl = document.getElementById('modal-score');
        if (score.toLowerCase().includes('hot')) {
            scoreEl.style.color = '#34D399';
        } else if (score.toLowerCase().includes('cold')) {
            scoreEl.style.color = '#94A3B8';
        } else {
            scoreEl.style.color = '#FBBF24';
        }

        // Status styling in Modal
        const statusEl = document.getElementById('modal-status');
        if (status.toLowerCase().includes('approved')) {
            statusEl.style.color = '#34D399';
        } else {
            statusEl.style.color = '#FBBF24';
        }

        // Update Doc Link
        const docBtn = document.getElementById('modal-doc-link');
        if (docLink && docLink !== '#') {
            docBtn.href = docLink;
            docBtn.style.display = 'inline-block';
        } else {
            docBtn.style.display = 'none';
        }

        // Show Modal Overlay
        document.getElementById('history-modal').style.display = 'flex';
    } catch (err) {
        console.error('Error opening client history modal:', err);
    }
}

// Close Client History Modal
function closeClientHistoryModal() {
    const modal = document.getElementById('history-modal');
    if (modal) modal.style.display = 'none';
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
                const totalEl = document.getElementById('total-count');
                if (totalEl) {
                    const currentVal = parseInt(totalEl.innerText) || 0;
                    if (currentVal > 0) totalEl.innerText = currentVal - 1;
                }
            }, 300);
        }
    }
}

// Fetch Leads Data from Google Sheets CRM (Latest Entry on Top)
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

        // Reverse array so the newest lead entries appear at the TOP
        const reversedLeads = [...leads].reverse();

        // Render Rows
        tableBody.innerHTML = reversedLeads.map(lead => {
            const company = lead['Client / Company'] || lead['Company Name'] || lead['Company'] || lead['Client'] || 'N/A';
            const industry = getExactSheetIndustry(lead);
            const tech = getExactRecommendedSolution(lead);
            const score = lead['Lead Score'] || lead['Score'] || lead['Lead Rating'] || 'Warm';
            const status = lead['Status'] || lead['Lifecycle Status'] || 'Proposal Draft';
            const updatedDate = getFormattedDate(lead);
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

            const encodedLead = encodeURIComponent(JSON.stringify(lead));
            const safeCompany = company.replace(/'/g, "\\'");

            return `
        <tr>
          <td style="font-weight: 700; color: #FFFFFF; cursor: pointer;" onclick="openClientHistoryModal('${encodedLead}')" title="Click to view full client history">
            <span style="border-bottom: 1px dashed #38BDF8; color: #38BDF8;">${company}</span>
          </td>
          <td><span style="color: #CBD5E1; font-weight: 600;">${industry}</span></td>
          <td>${tech}</td>
          <td>${badgeHTML}</td>
          <td>${statusHTML}</td>
          <td style="color: #94A3B8; font-size: 11px;">${updatedDate}</td>
          <td style="display: flex; gap: 8px;">
            <button class="btn-action" onclick="openClientHistoryModal('${encodedLead}')" style="background: rgba(56, 189, 248, 0.15); border-color: rgba(56, 189, 248, 0.4); color: #38BDF8;">
              📜 History
            </button>
            <a href="${docLink}" target="_blank" class="btn-action" style="background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.4); color: #34D399; text-decoration: none;">
              📄 Proposal
            </a>
            <button class="btn-action" onclick="deleteLeadRow(this, '${safeCompany}')" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #F87171;">
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