// Global variables to store our grounded knowledge bases
let currentBriefData = null;
let techKnowledge = {};
let industryKnowledge = {};

// Asynchronously load both JSON knowledge bases
async function loadKnowledgeBases() {
    try {
        const [techRes, industryRes] = await Promise.all([ // Promise all used to execute multiple asynchronous operations concurrently
            fetch('technology_knowledge.json'),
            fetch('industry_knowledge.json')
        ]);

        techKnowledge = await techRes.json();
        industryKnowledge = await industryRes.json();

        console.log("Both Knowledge Bases loaded successfully!");
    } catch (error) {
        console.error("Error loading knowledge bases:", error);
    }
}

// Call the function when script loads
loadKnowledgeBases();

import { GoogleGenAI } from '@google/genai';

// 1. Initialize Gemini API Client
const GEMINI_API_KEY = "GEMINI_API_KEY";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// 2. DOM Elements
const intakeForm = document.getElementById('intake-form');
const statusBanner = document.getElementById('form-status');
const briefOutput = document.getElementById('aiOutput');

// 3. Helper function to call gemini-3.6-flash with automatic retries on high demand / rate limits
async function callGeminiWithRetry(systemPrompt, maxRetries = 4) {
    let delay = 3000; // Start with 3-second delay

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: systemPrompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            businessProblem: { type: "STRING" },
                            clientObjective: { type: "STRING" },
                            recommendedTechnology: { type: "STRING" },
                            solutionConcept: { type: "STRING" },
                            targetUsers: { type: "STRING" },
                            expectedBenefits: { type: "STRING" },
                            complexity: { type: "STRING" },
                            recommendedNextStep: { type: "STRING" },

                            // New additions
                            alternativeRecommendation: { type: "STRING" },
                            why: { type: "STRING" }, // Fixed string type typo here
                            limitations: {
                                type: "ARRAY",
                                items: { type: "STRING" }
                            },
                            hardwareRequirements: {
                                type: "ARRAY",
                                items: { type: "STRING" }
                            },
                            softwareRequirements: {
                                type: "ARRAY",
                                items: { type: "STRING" }
                            },
                            implementationApproach: {
                                type: "ARRAY",
                                items: { type: "STRING" }
                            }
                        },
                        required: [
                            "businessProblem",
                            "clientObjective",
                            "recommendedTechnology",
                            "solutionConcept",
                            "targetUsers",
                            "expectedBenefits",
                            "complexity",
                            "recommendedNextStep",
                            "alternativeRecommendation",
                            "why",
                            "limitations",
                            "hardwareRequirements",
                            "softwareRequirements",
                            "implementationApproach"
                        ],
                    },
                },
            });
        } catch (err) {
            const errString = (err.message || '').toLowerCase();

            // Catch 503, 429, or general "high demand / rate limit" errors
            const isRateLimited = errString.includes('503') ||
                errString.includes('429') ||
                errString.includes('demand') ||
                errString.includes('quota') ||
                errString.includes('busy');

            if (isRateLimited && i < maxRetries - 1) {
                console.warn(`Server busy / High demand. Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${maxRetries})`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff multiplier (3s -> 6s -> 12s)
            } else {
                throw err;
            }
        }
    }
}

// 4. Attach Event Listener to Intake Form
intakeForm?.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent page reload

    let hasError = false;

    // 1. Standard text inputs, textareas, and select dropdowns
    const requiredFields = intakeForm.querySelectorAll('input[required]:not([type="radio"]):not([type="checkbox"]), textarea[required], select[required]');

    requiredFields.forEach((field) => {
        const val = field.value.trim();
        const isEmpty = !val || (field.tagName === 'SELECT' && val.toLowerCase().startsWith('select'));

        if (isEmpty) {
            field.classList.add('input-error');
            hasError = true;

            const eventType = field.tagName === 'SELECT' ? 'change' : 'input';
            field.addEventListener(eventType, () => {
                const updatedVal = field.value.trim();
                const stillEmpty = !updatedVal || (field.tagName === 'SELECT' && updatedVal.toLowerCase().startsWith('select'));
                if (!stillEmpty) {
                    field.classList.remove('input-error');
                }
            }, { once: true });
        } else {
            field.classList.remove('input-error');
        }
    });

    // 2. Target User Count (Radio Buttons) - Highlight visible option cards
    const radioGroups = new Set();
    intakeForm.querySelectorAll('input[type="radio"][required]').forEach(radio => radioGroups.add(radio.name));

    radioGroups.forEach((groupName) => {
        const groupRadios = intakeForm.querySelectorAll(`input[name="${groupName}"]`);
        const isChecked = Array.from(groupRadios).some(radio => radio.checked);

        groupRadios.forEach(radio => {
            // Target the visible parent box/label wrapping the radio input
            const boxContainer = radio.closest('label') || radio.parentElement;

            if (!isChecked) {
                hasError = true;
                boxContainer?.classList.add('input-error');

                // Remove red border from all boxes in the group as soon as one is clicked
                radio.addEventListener('change', () => {
                    groupRadios.forEach(r => {
                        const parentBox = r.closest('label') || r.parentElement;
                        parentBox?.classList.remove('input-error');
                    });
                }, { once: true });
            } else {
                boxContainer?.classList.remove('input-error');
            }
        });
    });

    // 🛑 Stop submission if any required input is empty
    if (hasError) {
        if (statusBanner) {
            statusBanner.className = 'status-banner error';
            statusBanner.innerText = 'Please fill up all required fields before submitting.';
        }
        statusBanner?.scrollIntoView({ behavior: 'smooth' });
        return; // Do NOT call Gemini API
    }

    // --- READ VALUES AFTER VALIDATION ---
    const companyName = document.getElementById('companyName')?.value.trim();
    const industry = document.getElementById('industry')?.value.trim();
    const problem = document.getElementById('problem')?.value.trim();
    const targetPersona = document.getElementById('targetUser')?.value.trim();
    const targetUserCount = document.querySelector('input[name="targetUserCount"]:checked')?.value;
    const currentProcess = document.getElementById('currentProcess')?.value.trim();
    const desiredOutcome = document.getElementById('desiredOutcome')?.value.trim();
    const budgetRange = document.getElementById('budgetRange')?.value.trim();
    const timeline = document.getElementById('timeline')?.value.trim();

    const submitBtn = intakeForm.querySelector('button[type="submit"]');

    // Display Loading State
    if (statusBanner) {
        statusBanner.className = 'status-banner loading';
        statusBanner.innerText = 'Sending client data to Gemini...';
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Generating Brief...';
    }

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Build knowledge contexts for both technology and industry
    const techContext = techKnowledge ? JSON.stringify(techKnowledge) : "";
    const industryContext = industryKnowledge ? JSON.stringify(industryKnowledge) : "";

    // Add right at the top of systemPrompt

    const systemPrompt = `BE CONCISE AND DIRECT. Limit each JSON field string to essential architectural details only.

You are an expert Enterprise AI & Solution Architect for THEXRA. Analyze the following SPECIFIC client intake submission using the grounded technology knowledge base (${techContext}) and industry knowledge base (${industryContext}).

CLIENT SUBMISSION DATA:
- Company Name: ${companyName}
- Industry Vertical: ${industry}
- Core Problem / Friction: ${problem}
- Target End User Persona: ${targetPersona} (${targetUserCount} users)
- Current Operational Process: ${currentProcess}
- Desired KPIs / Outcome: ${desiredOutcome}
- Budget Range: ${budgetRange}
- Delivery Timeline: ${timeline}

ALLOWED TECHNOLOGY CATEGORIES ONLY:
- AR
- VR
- MR
- AI
- Digital Twin
- Simulator
- Interactive Display
- Location-Based Experience
- Mobile/Web
- Combination solution

CRITICAL FORMAT RULES:
1. "recommendedTechnology": Select the single BEST FIT category based on the client's specific problem above.
   - You MUST use real THEXRA product names found directly inside the technology knowledge base (${techContext}). NEVER fabricate non-existent products.
   - Format as: "[Category] — THEXRA [Product Name from Knowledge Base]".
2. "why": Provide ONLY 2 concise sentences of architectural rationale:
   - Sentence 1: Why the fundamental tech category solves the client's specific operational bottleneck (${problem}).
   - Sentence 2: Why the THEXRA platform is the ideal deployment choice for ${companyName}.
3. DO NOT output any system confirmation phrases or chatter.

Respond ONLY with a raw JSON object (no markdown code blocks):

{
  "businessProblem": "Summarize the specific client problem",
  "clientObjective": "Summarize the specific client goal & KPI",
  "recommendedTechnology": "Category — THEXRA Product Name",
  "solutionConcept": "High-level architectural overview for this exact client",
  "targetUsers": "Primary user personas",
  "expectedBenefits": "Key quantitative operational gains",
  "complexity": "Low | Medium | High",
  "recommendedNextStep": "Recommended immediate technical scoping action",
  "alternativeRecommendation": "Category — THEXRA Product Name",
  "why": "Two concise sentences of architectural reasoning addressing this client.",
  "limitations": ["Constraint 1", "Constraint 2"],
  "hardwareRequirements": ["Hardware requirement 1", "Hardware requirement 2"],
  "softwareRequirements": ["Software requirement 1", "Software requirement 2"],
  "implementationApproach": ["Phase 1 description", "Phase 2 description", "Phase 3 description"]
}`;

    try {
        const response = await callGeminiWithRetry(systemPrompt);
        const data = JSON.parse(response.text);

        if (statusBanner) {
            statusBanner.className = 'status-banner success';
            statusBanner.innerText = 'AI Response received successfully!';
        }

        if (briefOutput) {
            briefOutput.className = 'glass-panel active';

            // Helper to clean up extra whitespace/spaces in sentences
            const cleanText = (str) => (str || '').replace(/\s+/g, ' ').trim();
            currentBriefData = data;
            briefOutput.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px; width: 100%;">
        
        <!-- 1. Client Problem -->
        <div class="glass-card" style="padding: 10px 12px; border-radius: 6px;">
          <span style="font-size: 10px; text-transform: uppercase; color: #38BDF8; font-weight: 700; letter-spacing: 0.05em; display: block; margin: 0 0 4px 0;">1. Client Problem</span>
          <p style="margin: 0; color: #E2E8F0; font-size: 13px; line-height: 1.3;">${cleanText(data.businessProblem)}</p>
          <div style="margin-top: 4px; font-size: 11.5px; color: #94A3B8;">
            <strong style="color: #CBD5E1;">Target Users:</strong> ${cleanText(data.targetUsers || 'N/A')}
          </div>
        </div>

        <!-- 2. AI Analysis -->
        <div class="glass-card" style="padding: 10px 12px; border-radius: 6px;">
          <span style="font-size: 10px; text-transform: uppercase; color: #C084FC; font-weight: 700; letter-spacing: 0.05em; display: block; margin: 0 0 4px 0;">2. AI Analysis & Rationale</span>
          <p style="margin: 0; color: #CBD5E1; font-size: 13px; line-height: 1.3; font-style: italic;">"${cleanText(data.why)}"</p>
          ${data.limitations && data.limitations.length > 0 ? `
            <div style="margin-top: 4px; font-size: 11.5px; color: #F87171;">
              <strong>Constraints:</strong> ${data.limitations.map(l => cleanText(l)).join(', ')}
            </div>
          ` : ''}
        </div>

        <!-- 3. Recommended Solution -->
        <div class="glass-card" style="padding: 10px 12px; border-radius: 6px;">
          <span style="font-size: 10px; text-transform: uppercase; color: #FBBF24; font-weight: 700; letter-spacing: 0.05em; display: block; margin: 0 0 4px 0;">3. Recommended Solution Concept</span>
          <p style="margin: 0; color: #E2E8F0; font-size: 13px; line-height: 1.3;">${cleanText(data.solutionConcept)}</p>
          
          ${data.implementationApproach && data.implementationApproach.length > 0 ? `
            <div style="margin-top: 4px;">
              <strong style="font-size: 10.5px; color: #FBBF24; text-transform: uppercase; display: block; margin-bottom: 2px;">Implementation Roadmap:</strong>
              <ol style="margin: 0; padding-left: 16px; color: #CBD5E1; font-size: 12px; line-height: 1.3;">
                ${data.implementationApproach.map(step => `<li style="margin: 0;">${cleanText(step)}</li>`).join('')}
              </ol>
            </div>
          ` : ''}
        </div>

        <!-- 4. Technology Stack -->
        <div class="glass-card" style="padding: 10px 12px; border-radius: 6px; border-left: 3px solid #38BDF8;">
          <span style="font-size: 10px; text-transform: uppercase; color: #38BDF8; font-weight: 700; letter-spacing: 0.05em; display: block; margin: 0 0 4px 0;">4. Technology Selection</span>
          <h3 style="margin: 0 0 4px 0; color: #FFF; font-size: 14.5px; font-weight: 700;">${cleanText(data.recommendedTechnology)}</h3>
          
          <div style="display: flex; gap: 12px; font-size: 11.5px; color: #CBD5E1; flex-wrap: wrap; margin-top: 2px;">
            <div><strong>Hardware:</strong> ${Array.isArray(data.hardwareRequirements) ? data.hardwareRequirements.join(', ') : (data.hardwareRequirements || 'N/A')}</div>
            <div><strong>Software:</strong> ${Array.isArray(data.softwareRequirements) ? data.softwareRequirements.join(', ') : (data.softwareRequirements || 'N/A')}</div>
          </div>

          <div style="margin-top: 2px; font-size: 11.5px; color: #94A3B8;">
            <strong>Alternative Option:</strong> ${cleanText(data.alternativeRecommendation || 'N/A')}
          </div>
        </div>

        <!-- 5. Benefits -->
        <div class="glass-card" style="padding: 10px 12px; border-radius: 6px;">
          <span style="font-size: 10px; text-transform: uppercase; color: #34D399; font-weight: 700; letter-spacing: 0.05em; display: block; margin: 0 0 4px 0;">5. Expected Benefits & Objectives</span>
          <p style="margin: 0; color: #E2E8F0; font-size: 13px; line-height: 1.3;">${cleanText(data.expectedBenefits)}</p>
          <div style="margin-top: 4px; font-size: 11.5px; color: #94A3B8;">
            <strong>KPI Alignment:</strong> ${cleanText(data.clientObjective || 'N/A')}
          </div>
        </div>

        <!-- 6. Next Step -->
        <div class="glass-card" style="padding: 10px 12px; border-radius: 6px;">
          <span style="font-size: 10px; text-transform: uppercase; color: #34D399; font-weight: 700; letter-spacing: 0.05em; display: block; margin: 0 0 4px 0;">6. Recommended Next Step</span>
          <p style="margin: 0; color: #E2E8F0; font-size: 13px; line-height: 1.3;">${cleanText(data.recommendedNextStep || data.nextStep)}</p>
        </div>

        <!-- Action Bar -->
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
          <button type="button" id="btn-regenerate" style="flex: 1; min-width: 120px; padding: 8px; font-size: 11.5px; background: rgba(59, 130, 246, 0.2); border: 1px solid #3B82F6; color: #60A5FA; border-radius: 5px; cursor: pointer; font-weight: 600;">Regenerate</button>
          <button type="button" id="btn-edit" style="flex: 1; min-width: 120px; padding: 8px; font-size: 11.5px; background: rgba(148, 163, 184, 0.2); border: 1px solid #64748B; color: #CBD5E1; border-radius: 5px; cursor: pointer; font-weight: 600;">Edit Requirement</button>
          <button type="button" id="btn-save" style="flex: 1; min-width: 120px; padding: 8px; font-size: 11.5px; background: rgba(52, 211, 153, 0.2); border: 1px solid #10B981; color: #34D399; border-radius: 5px; cursor: pointer; font-weight: 600;">Save Solution</button>
          <button type="button" id="btn-proposal" style="flex: 1; min-width: 120px; padding: 8px; font-size: 11.5px; background: rgba(192, 132, 252, 0.2); border: 1px solid #A855F7; color: #C084FC; border-radius: 5px; cursor: pointer; font-weight: 600;">Generate Proposal</button>
        </div>

      </div>
    `;


            // Handlers , Regenerate
            document.getElementById('btn-regenerate')?.addEventListener('click', () => {
                // Show loading indicator in output card
                briefOutput.innerHTML = `
                <div style="text-align:center; padding: 40px; color: #94A3B8;">
                <p style="font-size: 16px; font-weight: 600; margin-bottom; 8px;"> Regenerating Solution Brief...</p>
                <p style="font-size: 13px;">Analyzing requirements...</p> 
                </div>
                `;
                briefOutput.scrollIntoView({ behavior: 'smooth' });
                intakeForm.requestSubmit();
            });

            // Edit requirement: Scroll smoothly back up to the form inputs
            document.getElementById('btn-edit')?.addEventListener('click', () => {
                intakeForm.scrollIntoView({ behavior: 'smooth' });
            });

            // Save Solution: Export formatted document for Microsoft Word
            document.getElementById('btn-save')?.addEventListener('click', () => {
                if (!currentBriefData) {
                    alert('Please generate a solution brief first before saving.');
                    return;
                }

                const data = currentBriefData;

                const htmlDoc = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>THEXRA Solution Brief</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1e293b; }
          h1 { color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 8px; font-size: 18pt; }
          h2 { color: #2563eb; font-size: 12pt; text-transform: uppercase; margin-top: 18pt; margin-bottom: 4pt; }
          p, li { font-size: 11pt; line-height: 1.5; color: #334155; }
          .tech-box { background: #f8fafc; border-left: 4px solid #2563eb; padding: 12px; margin: 10pt 0; }
        </style>
      </head>
      <body>
        <h1>THEXRA ENTERPRISE SOLUTION BRIEF</h1>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()} | <strong>Status:</strong> Approved Architecture Brief</p>
        
        <h2>1. Client Problem Statement</h2>
        <p>${cleanText(data.businessProblem)}</p>
        <p><strong>Target Users:</strong> ${cleanText(data.targetUsers || 'N/A')}</p>

        <h2>2. AI Rationale & Analysis</h2>
        <p><em>"${cleanText(data.why)}"</em></p>
        ${data.limitations && data.limitations.length > 0 ? `<p><strong>Constraints:</strong> ${data.limitations.map(l => cleanText(l)).join(', ')}</p>` : ''}

        <h2>3. Proposed Solution Concept</h2>
        <p>${cleanText(data.solutionConcept)}</p>

        <div class="tech-box">
          <h2 style="margin-top:0; color:#0f172a;">4. Technology Architecture Selection</h2>
          <p style="font-size:14pt; font-weight:bold; color:#0f172a;">${cleanText(data.recommendedTechnology)}</p>
          <p><strong>Hardware Specs:</strong> ${Array.isArray(data.hardwareRequirements) ? data.hardwareRequirements.join(', ') : (data.hardwareRequirements || 'N/A')}</p>
          <p><strong>Software Specs:</strong> ${Array.isArray(data.softwareRequirements) ? data.softwareRequirements.join(', ') : (data.softwareRequirements || 'N/A')}</p>
          <p><strong>Alternative Technology:</strong> ${cleanText(data.alternativeRecommendation || 'N/A')}</p>
        </div>

        <h2>5. Expected Business Outcomes & KPIs</h2>
        <p>${cleanText(data.expectedBenefits)}</p>
        <p><strong>KPI Alignment:</strong> ${cleanText(data.clientObjective || 'N/A')}</p>

        <h2>6. Recommended Next Steps</h2>
        <p>${cleanText(data.recommendedNextStep || data.nextStep)}</p>
      </body>
      </html>
    `;

                const blob = new Blob(['\ufeff', htmlDoc], { type: 'application/msword' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `THEXRA-Solution-Brief-${Date.now()}.doc`;
                link.click();
                URL.revokeObjectURL(link.href);
            });


            // Generate Proposal: Opens clean document preview modal
            document.getElementById('btn-proposal')?.addEventListener('click', () => {
                const modal = document.getElementById('proposalModal');
                const content = document.getElementById('proposalContent');

                if (!modal || !content) return;

                // Inject document view
                content.innerHTML = `
      <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h1 style="margin: 0; font-size: 20px; color: #0f172a; font-weight: 700;">THEXRA ENTERPRISE SOLUTION PROPOSAL</h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Architecture Recommendation Brief</p>
        </div>
        <div style="text-align: right; font-size: 11px; color: #64748b;">
          <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
          <strong>Status:</strong> Draft
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 20px; font-size: 13px; line-height: 1.6; color: #334155;">
        <div>
          <strong style="font-size: 11px; text-transform: uppercase; color: #2563eb; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">1. Client Problem Statement</strong>
          <p style="margin: 0;">${cleanText(data.businessProblem)}</p>
        </div>

        <div>
          <strong style="font-size: 11px; text-transform: uppercase; color: #2563eb; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">2. AI Rationale & Analysis</strong>
          <p style="margin: 0; font-style: italic; color: #475569;">"${cleanText(data.why)}"</p>
        </div>

        <div>
          <strong style="font-size: 11px; text-transform: uppercase; color: #2563eb; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">3. Proposed Solution Concept</strong>
          <p style="margin: 0;">${cleanText(data.solutionConcept)}</p>
        </div>

        <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #2563eb;">
          <strong style="font-size: 11px; text-transform: uppercase; color: #0f172a; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">4. Technology Architecture</strong>
          <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #0f172a;">${cleanText(data.recommendedTechnology)}</h3>
          <div style="font-size: 12px; color: #475569;">
            <p style="margin: 0 0 4px 0;"><strong>Hardware Specs:</strong> ${Array.isArray(data.hardwareRequirements) ? data.hardwareRequirements.join(', ') : (data.hardwareRequirements || 'N/A')}</p>
            <p style="margin: 0 0 4px 0;"><strong>Software Specs:</strong> ${Array.isArray(data.softwareRequirements) ? data.softwareRequirements.join(', ') : (data.softwareRequirements || 'N/A')}</p>
            <p style="margin: 0;"><strong>Alternative Technology:</strong> ${cleanText(data.alternativeRecommendation || 'N/A')}</p>
          </div>
        </div>

        <div>
          <strong style="font-size: 11px; text-transform: uppercase; color: #2563eb; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">5. Expected Business Outcomes</strong>
          <p style="margin: 0;">${cleanText(data.expectedBenefits)}</p>
        </div>

        <div>
          <strong style="font-size: 11px; text-transform: uppercase; color: #2563eb; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">6. Implementation Next Steps</strong>
          <p style="margin: 0;">${cleanText(data.recommendedNextStep || data.nextStep)}</p>
        </div>
      </div>
    `;

                modal.style.display = 'block';
            });

            // Modal button controls
            document.getElementById('btn-modal-close')?.addEventListener('click', () => {
                document.getElementById('proposalModal').style.display = 'none';
            });

            document.getElementById('btn-modal-print')?.addEventListener('click', () => {
                window.print();
            });
        }

        statusBanner?.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        console.error("Gemini API Error:", err);
        if (statusBanner) {
            statusBanner.className = 'status-banner error';
            statusBanner.innerText = err.message || 'API Error: Failed to generate response.';
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Submit for AI Scoping →';
        }
    }
});