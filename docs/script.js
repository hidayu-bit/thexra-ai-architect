// Global variables to store our grounded knowledge bases
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
const GEMINI_API_KEY = "GEMINI_KEY";
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

            briefOutput.innerHTML = `
  <div style="display: flex; flex-direction: column; gap: 0.6rem; text-align: left; width: 100%;" class="glass-card p-3 rounded-xl">
    <h3 style="color: #60A5FA; font-size: 1.1rem; font-weight: 700; margin: 0 0 0.15rem 0; letter-spacing: -0.01em;">Generated Solution Architecture Brief</h3>
    
    <!-- Business Problem, Client Objective & Target Users -->
    <div class="glass-card" style="padding: 10px 12px; border-radius: 8px;">
      <p style="margin: 0 0 4px 0; font-size: 13px; line-height: 1.4;"><strong style="color: #60A5FA;">Business Problem:</strong> ${cleanText(data.businessProblem)}</p>
      <p style="margin: 0 0 4px 0; font-size: 13px; line-height: 1.4;"><strong style="color: #60A5FA;">Client Objective:</strong> ${cleanText(data.clientObjective)}</p>
      <p style="margin: 0; font-size: 13px; line-height: 1.4;"><strong style="color: #60A5FA;">Target Users:</strong> ${cleanText(data.targetUsers)}</p>
    </div>

    <!-- Solution Concept -->
    <div class="glass-card" style="padding: 10px 12px; border-radius: 8px;">
      <strong style="color: #60A5FA; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">Solution Concept</strong>
      <p style="margin: 0; color: #E2E8F0; font-size: 13px; line-height: 1.4;">${cleanText(data.solutionConcept)}</p>
    </div>

    <!-- Primary Tech vs Alternative Recommendation -->
    <div class="responsive-grid" style="align-items: start;">
      <div class="glass-card" style="padding: 10px 12px; border-radius: 8px;">
        <span style="font-size: 10px; text-transform: uppercase; color: #60A5FA; font-weight: 700; letter-spacing: 0.05em;">Recommended Tech (Primary)</span>
        <h4 style="margin: 2px 0 0 0; color: #FFF; font-size: 13.5px; font-weight: 600;">${cleanText(data.recommendedTechnology || data.primaryRecommendation)}</h4>
      </div>
      <div class="glass-card" style="padding: 10px 12px; border-radius: 8px;">
        <span style="font-size: 10px; text-transform: uppercase; color: #94A3B8; font-weight: 700; letter-spacing: 0.05em;">Alternative Recommendation</span>
        <h4 style="margin: 2px 0 0 0; color: #CBD5E1; font-size: 13.5px; font-weight: 600;">${cleanText(data.alternativeRecommendation)}</h4>
      </div>
    </div>

    <!-- Architectural Rationale (Why) -->
    <div class="glass-card" style="padding: 10px 12px; border-radius: 8px;">
      <span style="font-size: 10px; text-transform: uppercase; color: #FBBF24; font-weight: 700; letter-spacing: 0.05em;">Architectural Rationale (Why)</span>
      <p style="margin: 2px 0 0 0; color: #E2E8F0; font-size: 13px; line-height: 1.4;">${cleanText(data.why)}</p>
    </div>

    <!-- Expected Benefits & Limitations -->
    <div class="responsive-grid" style="align-items: start;">
      <div class="glass-card" style="padding: 10px 12px; border-radius: 8px;">
        <span style="font-size: 10px; text-transform: uppercase; color: #34D399; font-weight: 700; letter-spacing: 0.05em;">Expected Benefits</span>
        <p style="margin: 2px 0 0 0; color: #CBD5E1; font-size: 12.5px; line-height: 1.35;">${cleanText(data.expectedBenefits)}</p>
      </div>
      <div class="glass-card" style="padding: 10px 12px; border-radius: 8px;">
        <span style="font-size: 10px; text-transform: uppercase; color: #F87171; font-weight: 700; letter-spacing: 0.05em;">Limitations & Trade-offs</span>
        <ul style="margin: 2px 0 0 0; padding-left: 14px; color: #CBD5E1; font-size: 12px; line-height: 1.35;">
          ${Array.isArray(data.limitations) && data.limitations.length > 0 ? data.limitations.map(l => `<li style="margin-bottom: 1px;">${cleanText(l)}</li>`).join('') : '<li style="color: #64748b;">None specified</li>'}
        </ul>
      </div>
    </div>

    <!-- Hardware & Software Requirements -->
    <div class="responsive-grid" style="align-items: start;">
      <div class="glass-card" style="padding: 10px 12px; border-radius: 8px;">
        <span style="font-size: 10px; text-transform: uppercase; color: #C084FC; font-weight: 700; letter-spacing: 0.05em;">Hardware Requirements</span>
        <ul style="margin: 2px 0 0 0; padding-left: 14px; color: #CBD5E1; font-size: 12px; line-height: 1.35;">
          ${Array.isArray(data.hardwareRequirements) && data.hardwareRequirements.length > 0 ? data.hardwareRequirements.map(h => `<li style="margin-bottom: 1px;">${cleanText(h)}</li>`).join('') : '<li style="color: #64748b;">Standard commercial workstation</li>'}
        </ul>
      </div>
      <div class="glass-card" style="padding: 10px 12px; border-radius: 8px;">
        <span style="font-size: 10px; text-transform: uppercase; color: #22D3EE; font-weight: 700; letter-spacing: 0.05em;">Software Requirements</span>
        <ul style="margin: 2px 0 0 0; padding-left: 14px; color: #CBD5E1; font-size: 12px; line-height: 1.35;">
          ${Array.isArray(data.softwareRequirements) && data.softwareRequirements.length > 0 ? data.softwareRequirements.map(s => `<li style="margin-bottom: 1px;">${cleanText(s)}</li>`).join('') : '<li style="color: #64748b;">Web browser / THEXRA App</li>'}
        </ul>
      </div>
    </div>

    <!-- Complexity & Implementation Approach -->
    <div class="responsive-grid" style="align-items: start;">
      <div class="glass-card" style="padding: 10px 12px; border-radius: 8px;">
        <span style="font-size: 10px; text-transform: uppercase; color: #FACC15; font-weight: 700; letter-spacing: 0.05em;">Complexity</span>
        <p style="margin: 1px 0 0 0; font-weight: 700; color: #FFF; font-size: 13.5px;">${cleanText(data.complexity) || 'Medium'}</p>
      </div>
      <div class="glass-card" style="padding: 10px 12px; border-radius: 8px;">
        <span style="font-size: 10px; text-transform: uppercase; color: #818CF8; font-weight: 700; letter-spacing: 0.05em;">Implementation Approach</span>
        <ol style="margin: 2px 0 0 0; padding-left: 14px; color: #CBD5E1; font-size: 12px; line-height: 1.35;">
          ${Array.isArray(data.implementationApproach) && data.implementationApproach.length > 0 ? data.implementationApproach.map(step => `<li style="margin-bottom: 1px;">${cleanText(step)}</li>`).join('') : '<li>Phase 1 Scoping & Deployment</li>'}
        </ol>
      </div>
    </div>

    <!-- Recommended Next Step -->
    <div class="glass-card" style="padding: 10px 12px; border-radius: 8px;">
      <span style="font-size: 10px; text-transform: uppercase; color: #34D399; font-weight: 700; letter-spacing: 0.05em;">Recommended Next Step</span>
      <p style="margin: 2px 0 0 0; color: #E2E8F0; font-size: 13px; line-height: 1.4;">${cleanText(data.recommendedNextStep || data.nextStep)}</p>
    </div>
  </div>
`;
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