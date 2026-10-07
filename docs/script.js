// Global variables to store our grounded knowledge bases
let currentBriefData = null;
let techKnowledge = {};
let industryKnowledge = {};

// Global helper to clean whitespace safely everywhere
const cleanText = (str) => (str || '').replace(/\s+/g, ' ').trim();

// Asynchronously load both JSON knowledge bases
async function loadKnowledgeBases() {
  try {
    const [techRes, industryRes] = await Promise.all([
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
const GEMINI_API_KEY = "GEMINIAPIKEY";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Helper to generate a visual architecture flowchart from solution architecture data
function renderArchitectureDiagram(architectureData, isProposal = false) {
  if (!architectureData) return '';

  const hw = (architectureData.hardware || [])[0] || 'Client Device';
  const xr = (architectureData.xrComponents || [])[0] || 'Interactive Visuals';
  const sw = (architectureData.software || [])[0] || 'THEXRA Platform';
  const aiComponents = (architectureData.aiComponents || [])[0] || 'Smart Automation';
  const backend = (architectureData.backend || [])[0] || 'Secure Cloud Storage';
  const dash = (architectureData.dashboard || [])[0] || 'Reporting Portal';

  // Configured step colors
  const steps = [
    { label: 'Step 1: Device', val: hw, color: '#38BDF8', border: isProposal ? '#38BDF8' : 'rgba(56, 189, 248, 0.3)' },
    { label: 'Step 2: Experience', val: xr, color: '#38BDF8', border: isProposal ? '#38BDF8' : 'rgba(56, 189, 248, 0.3)' },
    { label: 'Step 3: App & AI', val: `${sw} (${aiComponents})`, color: isProposal ? '#9333EA' : '#C084FC', border: isProposal ? '#C084FC' : 'rgba(192, 132, 252, 0.3)' },
    { label: 'Step 4: Cloud & DB', val: backend, color: isProposal ? '#059669' : '#34D399', border: isProposal ? '#34D399' : 'rgba(52, 211, 153, 0.3)' },
    { label: 'Step 5: Dashboard', val: dash, color: isProposal ? '#059669' : '#34D399', border: isProposal ? '#059669' : '#34D399' }
  ];

  const cardBg = isProposal ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)';
  const bodyTextColor = isProposal ? '#1E293B' : '#CBD5E1';
  const arrowColor = isProposal ? '#94A3B8' : '#38BDF8';

  return `
    <div style="display: flex; flex-wrap: nowrap; align-items: stretch; justify-content: flex-start; gap: 6px; width: 100%; margin: 6px 0; font-family: inherit; overflow-x: auto;">
      ${steps.map((step, idx) => `
        <div style="
          flex: 1; 
          min-width: 110px; 
          padding: 8px 10px; 
          border-radius: 6px; 
          border: 1px solid ${step.border}; 
          background: ${cardBg}; 
          text-align: left !important;
          box-sizing: border-box;
          display: flex !important;
          flex-direction: column !important;
          justify-content: flex-start !important;
          align-items: flex-start !important;
        ">
          <span style="font-size: 8.5px; font-weight: 700; text-transform: uppercase; color: ${step.color}; letter-spacing: 0.05em; display: block; margin-bottom: 4px; text-align: left !important; width: 100%;">
            ${step.label}
          </span>
          <span style="font-size: 11px; font-weight: 400; color: ${bodyTextColor} !important; line-height: 1.3; display: block; text-align: left !important; width: 100%;">
            ${step.val}
          </span>
        </div>
        ${idx < steps.length - 1 ? `
          <span style="color: ${arrowColor}; font-size: 11px; font-weight: 700; flex-shrink: 0; align-self: center;">➔</span>
        ` : ''}
      `).join('')}
    </div>
  `;
}

// Render Implementation Plan structure <ol>
function renderImplementationPlan(planData, isProposal = false) {
  if (!planData || !Array.isArray(planData)) return '';

  const stageColor = isProposal ? '#0284C7' : '#38BDF8';
  const textColor = isProposal ? '#334155' : '#CBD5E1';
  const durationColor = isProposal ? '#64748B' : '#94A3B8';

  return `
    <ol style="margin: 0; padding-left: 16px; color: ${textColor}; font-size: 12px; line-height: 1.3;">
      ${planData.map((item) => {
    const deliverablesText = Array.isArray(item.deliverables) ? item.deliverables.join(' • ') : item.deliverables;
    return `<li style="margin: 0;"><strong style="color: ${stageColor};">${cleanText(item.stage)}</strong> <span style="color: ${durationColor};">(${cleanText(item.duration)}):</span>${cleanText(deliverablesText)}</li>`;
  }).join('')}
    </ol>
  `;
}

// Helper to render Scope of Work (SOW) 10-field layout
function renderScopeOfWork(sow, isProposal = false) {
  if (!sow) return '';

  const formatList = (arr) =>
    Array.isArray(arr) && arr.length
      ? `<ul style="margin: 2px 0 0 0; padding-left: 16px; font-size: 11.5px; color: ${isProposal ? '#334155' : '#CBD5E1'};">${arr.map(item => `<li>${cleanText(item)}</li>`).join('')}</ul>`
      : '<span style="font-size: 11px; color: #94A3B8;">N/A</span>';

  const titleColor = isProposal ? '#0F172A' : '#FFFFFF';
  const labelColor = isProposal ? '#2563EB' : '#38BDF8';
  const cardBg = isProposal ? '#F8FAFC' : 'rgba(255, 255, 255, 0.05)';
  const border = isProposal ? '#E2E8F0' : 'rgba(255, 255, 255, 0.1)';

  return `
    <div style="margin-top: 10px; padding: 12px; background: ${cardBg}; border: 1px solid ${border}; border-radius: 6px;">
      <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: ${titleColor}; text-transform: uppercase; letter-spacing: 0.05em;">Scope of Work (SOW)</h3>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px;">
        <div style="grid-column: 1 / -1;">
          <strong style="color: ${labelColor}; font-size: 10.5px; text-transform: uppercase; display: block;">1. Project Scope</strong>
          <span style="font-size: 12px; color: ${isProposal ? '#334155' : '#CBD5E1'};">${cleanText(sow.projectScope)}</span>
        </div>

        <div><strong style="color: ${labelColor}; font-size: 10.5px; text-transform: uppercase; display: block;">2. Core Features</strong>${formatList(sow.features)}</div>
        <div><strong style="color: ${labelColor}; font-size: 10.5px; text-transform: uppercase; display: block;">3. Deliverables</strong>${formatList(sow.deliverables)}</div>
        <div><strong style="color: ${labelColor}; font-size: 10.5px; text-transform: uppercase; display: block;">4. Hardware Requirements</strong>${formatList(sow.hardware)}</div>
        <div><strong style="color: ${labelColor}; font-size: 10.5px; text-transform: uppercase; display: block;">5. Software Modules</strong>${formatList(sow.software)}</div>
        <div><strong style="color: ${labelColor}; font-size: 10.5px; text-transform: uppercase; display: block;">6. Content Assets</strong>${formatList(sow.content)}</div>
        <div><strong style="color: ${labelColor}; font-size: 10.5px; text-transform: uppercase; display: block;">7. Training Plan</strong><span style="font-size: 11.5px; color: ${isProposal ? '#334155' : '#CBD5E1'};">${cleanText(sow.training)}</span></div>
        <div><strong style="color: ${labelColor}; font-size: 10.5px; text-transform: uppercase; display: block;">8. Deployment Strategy</strong><span style="font-size: 11.5px; color: ${isProposal ? '#334155' : '#CBD5E1'};">${cleanText(sow.deployment)}</span></div>
        <div><strong style="color: ${labelColor}; font-size: 10.5px; text-transform: uppercase; display: block;">9. Ongoing Support</strong><span style="font-size: 11.5px; color: ${isProposal ? '#334155' : '#CBD5E1'};">${cleanText(sow.support)}</span></div>

        <div style="grid-column: 1 / -1; border-top: 1px dashed ${border}; padding-top: 6px;">
          <strong style="color: #F87171; font-size: 10.5px; text-transform: uppercase; display: block;">10. Exclusions (Out of Scope)</strong>
          ${formatList(sow.exclusions)}
        </div>
      </div>
    </div>
  `;
}

// 2. DOM Elements
const intakeForm = document.getElementById('intake-form');
const statusBanner = document.getElementById('form-status');
const briefOutput = document.getElementById('aiOutput');

// 3. Helper function to call gemini-3.8-flash with automatic retries and low-latency configuration
async function callGeminiWithRetry(systemPrompt, maxRetries = 2) {
  let delay = 500;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: systemPrompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
          maxOutputTokens: 2048,
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
              alternativeRecommendation: { type: "STRING" },
              why: { type: "STRING" },
              limitations: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              solutionArchitecture: {
                type: "OBJECT",
                properties: {
                  solutionOverview: { type: "STRING" },
                  userJourney: { type: "STRING" },
                  hardware: { type: "ARRAY", items: { type: "STRING" } },
                  software: { type: "ARRAY", items: { type: "STRING" } },
                  aiComponents: { type: "ARRAY", items: { type: "STRING" } },
                  xrComponents: { type: "ARRAY", items: { type: "STRING" } },
                  backend: { type: "ARRAY", items: { type: "STRING" } },
                  dashboard: { type: "ARRAY", items: { type: "STRING" } },
                  dataFlow: { type: "STRING" }
                },
                required: ["solutionOverview", "userJourney", "hardware", "software", "aiComponents", "xrComponents", "backend", "dashboard", "dataFlow"]
              },
              implementationApproach: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              implementationPlan: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    stage: { type: "STRING" },
                    duration: { type: "STRING" },
                    deliverables: { type: "ARRAY", items: { type: "STRING" } }
                  },
                  required: ["stage", "duration", "deliverables"]
                }
              },
              scopeOfWork: {
                type: "OBJECT",
                properties: {
                  projectScope: { type: "STRING" },
                  features: { type: "ARRAY", items: { type: "STRING" } },
                  deliverables: { type: "ARRAY", items: { type: "STRING" } },
                  hardware: { type: "ARRAY", items: { type: "STRING" } },
                  software: { type: "ARRAY", items: { type: "STRING" } },
                  content: { type: "ARRAY", items: { type: "STRING" } },
                  training: { type: "STRING" },
                  deployment: { type: "STRING" },
                  support: { type: "STRING" },
                  exclusions: { type: "ARRAY", items: { type: "STRING" } }
                },
                required: ["projectScope", "features", "deliverables", "hardware", "software", "content", "training", "deployment", "support", "exclusions"]
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
              "solutionArchitecture",
              "implementationApproach",
              "implementationPlan",
              "scopeOfWork"
            ]
          }
        }
      });
    } catch (err) {
      const errString = (err.message || '').toLowerCase();
      const isRateLimited = errString.includes('503') || errString.includes('429') || errString.includes('demand') || errString.includes('quota') || errString.includes('busy');

      if (isRateLimited && i < maxRetries - 1) {
        console.warn(`Server busy. Retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay += 500;
      } else {
        throw err;
      }
    }
  }
}

// 4. Attach Event Listener to Intake Form
intakeForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  let hasError = false;

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

  const radioGroups = new Set();
  intakeForm.querySelectorAll('input[type="radio"][required]').forEach(radio => radioGroups.add(radio.name));

  radioGroups.forEach((groupName) => {
    const groupRadios = intakeForm.querySelectorAll(`input[name="${groupName}"]`);
    const isChecked = Array.from(groupRadios).some(radio => radio.checked);

    groupRadios.forEach(radio => {
      const boxContainer = radio.closest('label') || radio.parentElement;

      if (!isChecked) {
        hasError = true;
        boxContainer?.classList.add('input-error');

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

  if (hasError) {
    if (statusBanner) {
      statusBanner.className = 'status-banner error';
      statusBanner.innerText = 'Please fill up all required fields before submitting.';
    }
    statusBanner?.scrollIntoView({ behavior: 'smooth' });
    return;
  }

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

  if (statusBanner) {
    statusBanner.className = 'status-banner loading';
    statusBanner.innerText = 'Sending client data to Gemini...';
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = 'Generating Brief...';
  }

  await new Promise((resolve) => setTimeout(resolve, 50));

  const selectedIndustryData = (industryKnowledge && industryKnowledge[industry])
    ? industryKnowledge[industry]
    : industryKnowledge;
  const techContext = techKnowledge ? JSON.stringify(techKnowledge) : "";
  const industryContext = selectedIndustryData ? JSON.stringify(selectedIndustryData) : "";

  const systemPrompt = `Role: Expert Enterprise AI & Solution Architect for THEXRA.
Task: Analyze client intake data using grounded technology knowledge (${techContext}) and industry knowledge (${industryContext}). Be concise, clear, and direct.

CLIENT DATA:
- Company: 
${companyName}
- Industry: 
${industry}
- Core Problem: 
${problem}
- Target User: 
${targetPersona} (${targetUserCount} users)
- Current Process: 
${currentProcess}
- Outcome/KPIs: 
${desiredOutcome}
- Budget: 
${budgetRange}
- Timeline Target: 
${timeline}

ALLOWED CATEGORIES:
AR, VR, MR, AI, Digital Twin, Simulator, Interactive Display, Location-Based Experience, Mobile/Web, Combination solution

CRITICAL FORMAT RULES:
1. "recommendedTechnology": Best-fit category. MUST use exact THEXRA product names from tech knowledge base (${techContext}). Format: "[Category] — THEXRA [Product Name]". Never invent products.
2. "why": Exactly 2 concise sentences: (1) Why tech category solves ${problem}, (2) Why THEXRA suits ${companyName}.
3. "implementationPlan": MUST contain exactly 7 sequential stages: Discovery, Design, Prototype, Development, Testing, Deployment, Support. 
   - Durations MUST be formatted cleanly (e.g., "1 week", "1.5 weeks", "2 weeks", "Ongoing").
   - Deliverables MUST be straightforward, non-jargon, clear business items that anyone can easily understand.
   - Cumulative time across stages 1 to 6 MUST strictly fit the selected timeline (${timeline}).
4. "scopeOfWork": MUST provide highly specific, non-generic details tailored strictly to the client's problem, industry, and recommended THEXRA solution. Never use generic filler.
5. DO NOT output code blocks, system confirmation phrases, or chatter. Return ONLY raw valid JSON matching the schema.`;

  try {
    const response = await callGeminiWithRetry(systemPrompt);
    const rawText = response.text || '';
    const cleanJsonText = rawText.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanJsonText);

    if (statusBanner) {
      statusBanner.className = 'status-banner success';
      statusBanner.innerText = 'AI Response received successfully!';
    }

    if (briefOutput) {
      briefOutput.className = 'glass-panel active';

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

        <!-- 3. Recommended Solution Concept -->
        <div class="glass-card" style="padding: 10px 12px; border-radius: 6px;">
          <span style="font-size: 10px; text-transform: uppercase; color: #FBBF24; font-weight: 700; letter-spacing: 0.05em; display: block; margin: 0 0 4px 0;">3. Recommended Solution Concept</span>
          <p style="margin: 0; color: #E2E8F0; font-size: 13px; line-height: 1.3;">${cleanText(data.solutionConcept)}</p>

          <!-- 1st <ol> List: Implementation Approach -->
          ${data.implementationApproach && data.implementationApproach.length > 0 ? `
            <div style="margin-top: 6px;">
              <strong style="font-size: 10.5px; color: #FBBF24; text-transform: uppercase; display: block; margin-bottom: 2px;">Implementation Approach:</strong>
              <ol style="margin: 0; padding-left: 16px; color: #CBD5E1; font-size: 12px; line-height: 1.3;">
                ${data.implementationApproach.map(step => `<li style="margin: 0;">${cleanText(step)}</li>`).join('')}
              </ol>
            </div>
          ` : ''}

          <!-- 2nd <ol> List: Detailed Implementation Plan -->
          ${data.implementationPlan ? `
            <div style="margin-top: 6px;">
              <strong style="font-size: 10.5px; color: #38BDF8; text-transform: uppercase; display: block; margin-bottom: 2px;">Detailed Implementation Plan:</strong>
              ${renderImplementationPlan(data.implementationPlan, false)}
            </div>
          ` : ''}

          <!-- Scope of Work (SOW) Output in Main Panel -->
          ${renderScopeOfWork(data.scopeOfWork, false)}
        </div>

        <!-- 4. Technology Architecture (9 Modules) -->
        <div class="glass-card" style="padding: 12px; border-radius: 6px; border-left: 3px solid #38BDF8;">
          <span style="font-size: 10px; text-transform: uppercase; color: #38BDF8; font-weight: 700; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">4. Technology Selection</span>
          <h3 style="margin: 0 0 10px 0; color: #FFF; font-size: 14.5px; font-weight: 700;">${cleanText(data.recommendedTechnology)}</h3>

          <div style="margin-bottom: 12px; padding: 10px; background: rgba(15, 23, 42, 0.6); border-radius: 6px; border: 1px dashed rgba(56, 189, 248, 0.3);">
            <strong style="color: #38BDF8; font-size: 10.5px; text-transform: uppercase; display: block; margin-bottom: 8px;">Automated System Flow Diagram:</strong>
            ${renderArchitectureDiagram(data.solutionArchitecture, false)}
          </div>
          
          ${data.solutionArchitecture ? `
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px; color: #CBD5E1;">
              <div><strong style="color: #38BDF8;">1. Overview:</strong> ${cleanText(data.solutionArchitecture.solutionOverview)}</div>
              <div><strong style="color: #38BDF8;">2. User Journey:</strong> ${cleanText(data.solutionArchitecture.userJourney)}</div>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; margin: 6px 0;">
                <div style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-radius: 4px; text-align: left;">
                  <strong style="color: #38BDF8; display: block; font-size: 10.5px; text-transform: uppercase; margin-bottom: 2px;">3. Hardware</strong>
                  <span style="font-size: 12px; color: #CBD5E1; display: block;">${(data.solutionArchitecture.hardware || []).join(', ')}</span>
                </div>

                <div style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-radius: 4px; text-align: left;">
                  <strong style="color: #38BDF8; display: block; font-size: 10.5px; text-transform: uppercase; margin-bottom: 2px;">4. Software</strong>
                  <span style="font-size: 12px; color: #CBD5E1; display: block;">${(data.solutionArchitecture.software || []).join(', ')}</span>
                </div>

                <div style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-radius: 4px; text-align: left;">
                  <strong style="color: #38BDF8; display: block; font-size: 10.5px; text-transform: uppercase; margin-bottom: 2px;">5. AI Components</strong>
                  <span style="font-size: 12px; color: #CBD5E1; display: block;">${(data.solutionArchitecture.aiComponents || []).join(', ')}</span>
                </div>

                <div style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-radius: 4px; text-align: left;">
                  <strong style="color: #38BDF8; display: block; font-size: 10.5px; text-transform: uppercase; margin-bottom: 2px;">6. XR Components</strong>
                  <span style="font-size: 12px; color: #CBD5E1; display: block;">${(data.solutionArchitecture.xrComponents || []).join(', ')}</span>
                </div>

                <div style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-radius: 4px; text-align: left;">
                  <strong style="color: #38BDF8; display: block; font-size: 10.5px; text-transform: uppercase; margin-bottom: 2px;">7. Backend</strong>
                  <span style="font-size: 12px; color: #CBD5E1; display: block;">${(data.solutionArchitecture.backend || []).join(', ')}</span>
                </div>

                <div style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-radius: 4px; text-align: left;">
                  <strong style="color: #38BDF8; display: block; font-size: 10.5px; text-transform: uppercase; margin-bottom: 2px;">8. Dashboard</strong>
                  <span style="font-size: 12px; color: #CBD5E1; display: block;">${(data.solutionArchitecture.dashboard || []).join(', ')}</span>
                </div>

                <div style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-radius: 4px; text-align: left; grid-column: 1 / -1;">
                  <strong style="color: #38BDF8; display: block; font-size: 10.5px; text-transform: uppercase; margin-bottom: 2px;">9. Data Flow</strong>
                  <span style="font-size: 12px; color: #CBD5E1; font-family: monospace; display: block;">${cleanText(data.solutionArchitecture.dataFlow)}</span>
                </div>
              </div>

              <div style="margin-top: 4px; font-size: 11.5px; color: #94A3B8;">
                <strong style="color: #CBD5E1;">Alternative Option:</strong> ${cleanText(data.alternativeRecommendation || 'N/A')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- 5. Business Outcomes -->
        <div class="glass-card" style="padding: 10px 12px; border-radius: 6px;">
          <span style="font-size: 10px; text-transform: uppercase; color: #34D399; font-weight: 700; letter-spacing: 0.05em; display: block; margin: 0 0 4px 0;">5. Expected Business Outcomes</span>
          <p style="margin: 0; color: #E2E8F0; font-size: 13px; line-height: 1.3;">${cleanText(data.expectedBenefits)}</p>
          <div style="margin-top: 4px; font-size: 11.5px; color: #94A3B8;">
            <strong style="color: #CBD5E1;">KPI Alignment:</strong> ${cleanText(data.clientObjective || 'N/A')}
          </div>
        </div>

        <!-- 6. Next Steps -->
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

      // Handlers: Regenerate
      document.getElementById('btn-regenerate')?.addEventListener('click', () => {
        briefOutput.innerHTML = `
          <div style="text-align:center; padding: 40px; color: #94A3B8;">
            <p style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Regenerating Solution Brief...</p>
            <p style="font-size: 13px;">Analyzing requirements...</p> 
          </div>
        `;
        briefOutput.scrollIntoView({ behavior: 'smooth' });
        intakeForm.requestSubmit();
      });

      // Edit requirement
      document.getElementById('btn-edit')?.addEventListener('click', () => {
        intakeForm.scrollIntoView({ behavior: 'smooth' });
      });

      // Save Solution (Export Word doc including SOW)
      document.getElementById('btn-save')?.addEventListener('click', () => {
        if (!currentBriefData) {
          alert('Please generate a solution brief first before saving.');
          return;
        }

        const data = currentBriefData;
        const sow = data.scopeOfWork;

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

${data.implementationPlan ? `
  <h2>Detailed Implementation Roadmap (7 Stages)</h2>
  ${renderImplementationPlan(data.implementationPlan, true)}
` : ''}

${sow ? `
  <h2>Scope of Work (SOW)</h2>
  <p><strong>Project Scope:</strong> ${cleanText(sow.projectScope)}</p>
  <p><strong>Features:</strong> ${(sow.features || []).join(', ')}</p>
  <p><strong>Deliverables:</strong> ${(sow.deliverables || []).join(', ')}</p>
  <p><strong>Hardware:</strong> ${(sow.hardware || []).join(', ')}</p>
  <p><strong>Software:</strong> ${(sow.software || []).join(', ')}</p>
  <p><strong>Content:</strong> ${(sow.content || []).join(', ')}</p>
  <p><strong>Training:</strong> ${cleanText(sow.training)}</p>
  <p><strong>Deployment:</strong> ${cleanText(sow.deployment)}</p>
  <p><strong>Support:</strong> ${cleanText(sow.support)}</p>
  <p><strong>Exclusions:</strong> ${(sow.exclusions || []).join(', ')}</p>
` : ''}

  <div class="tech-box">
    <h2 style="margin-top:0; color:#0f172a;">4. Technology Architecture Blueprint</h2>
    <p style="font-size:14pt; font-weight:bold; color:#0f172a;">${cleanText(data.recommendedTechnology)}</p>
    ${data.solutionArchitecture ? `
      <p><strong>1. Solution Overview:</strong> ${cleanText(data.solutionArchitecture.solutionOverview)}</p>
      <p><strong>2. User Journey:</strong> ${cleanText(data.solutionArchitecture.userJourney)}</p>
      <p><strong>3. Hardware:</strong> ${(data.solutionArchitecture.hardware || []).join(', ')}</p>
      <p><strong>4. Software:</strong> ${(data.solutionArchitecture.software || []).join(', ')}</p>
      <p><strong>5. AI Components:</strong> ${(data.solutionArchitecture.aiComponents || []).join(', ')}</p>
      <p><strong>6. XR Components:</strong> ${(data.solutionArchitecture.xrComponents || []).join(', ')}</p>
      <p><strong>7. Backend:</strong> ${(data.solutionArchitecture.backend || []).join(', ')}</p>
      <p><strong>8. Dashboard:</strong> ${(data.solutionArchitecture.dashboard || []).join(', ')}</p>
      <p><strong>9. Data Flow:</strong> ${cleanText(data.solutionArchitecture.dataFlow)}</p>
      <p><strong>Alternative Technology:</strong> ${cleanText(data.alternativeRecommendation || 'N/A')}</p>
    ` : ''}
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

      // Generate Proposal: Modal Document Preview (Day 17 Dynamic Mapping)
      document.getElementById('btn-proposal')?.addEventListener('click', () => {
        const modal = document.getElementById('proposalModal');
        const content = document.getElementById('proposalContent');

        if (!modal || !content) return;

        const data = currentBriefData || {};
        const sow = data.scopeOfWork || {};
        const arch = data.solutionArchitecture || {};
        const clientCompany = document.getElementById('companyName')?.value.trim() || 'Client Organization';

        content.innerHTML = `
        <div style="border-bottom: 2px solid #0F172A; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <h1 style="margin: 0; font-size: 22px; color: #0F172A; font-weight: 700; letter-spacing: -0.02em;">THEXRA ENTERPRISE SOLUTION PROPOSAL</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748B; font-weight: 600;">13-Section Formal Executive Proposal</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748B;">
            <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
            <strong>Status:</strong> Approved Proposal
          </div>
        </div>

        <div class="proposal-template-grid" style="display: flex; flex-direction: column; gap: 18px; font-size: 13px; line-height: 1.5; color: #334155;">

          <!-- Section 1: Executive Summary -->
          <div class="proposal-section">
            <strong class="section-label">1. Executive Summary</strong>
            <p style="margin: 0; background: #F8FAFC; border-left: 3px solid #2563EB; padding: 8px 12px; border-radius: 4px; color: #334155;">
              This enterprise proposal addresses core operational challenges for ${cleanText(clientCompany)}. By deploying ${cleanText(data.recommendedTechnology || 'THEXRA Platform')}, ${cleanText(clientCompany)} will achieve immediate workflow optimization, enhanced spatial analytics, and measurable ROI.
            </p>
          </div>

          <!-- Section 2: Client Challenge -->
          <div class="proposal-section">
            <strong class="section-label">2. Client Challenge</strong>
            <p style="margin: 0;">${cleanText(data.businessProblem || 'Core operational bottleneck specified during discovery.')}</p>
          </div>

          <!-- Section 3: Project Objective -->
          <div class="proposal-section">
            <strong class="section-label">3. Project Objective</strong>
            <div style="margin: 0; background: #F8FAFC; border-left: 3px solid #0284C7; padding: 8px 12px; border-radius: 4px; color: #334155;">
              <strong>Primary Goal:</strong> ${cleanText(data.clientObjective || 'Achieve operational efficiency gains.')}<br>
              <strong>Target Outcomes:</strong> ${cleanText(data.expectedBenefits || 'Streamlined user workflows and accurate tracking.')}
            </div>
          </div>

          <!-- Section 4: Proposed Solution -->
          <div class="proposal-section">
            <strong class="section-label">4. Proposed Solution</strong>
            <p style="margin: 0;">${cleanText(data.solutionConcept || 'Recommended solution architecture concept.')}</p>
            ${data.implementationApproach && data.implementationApproach.length > 0 ? `
              <div style="margin-top: 6px;">
                <strong style="font-size: 11px; text-transform: uppercase; color: #2563EB;">Implementation Phasing:</strong>
                <ol style="margin: 4px 0 0 0; padding-left: 18px; font-size: 12px;">
                  ${data.implementationApproach.map(step => `<li>${cleanText(step)}</li>`).join('')}
                </ol>
              </div>
            ` : ''}
          </div>

          <!-- Section 5: User Experience -->
          <div class="proposal-section">
            <strong class="section-label">5. User Experience & Journey</strong>
            <p style="margin: 0;"><strong>Target Users:</strong> ${cleanText(data.targetUsers || 'Primary Personas')}</p>
            <p style="margin: 4px 0 0 0;"><strong>Workflow:</strong> ${cleanText(arch.userJourney || 'Detailed end-user operational journey across spatial interfaces.')}</p>
          </div>

          <!-- Section 6: Solution Architecture -->
          <div class="proposal-section" style="background: #F8FAFC; padding: 14px; border-radius: 6px; border: 1px solid #E2E8F0;">
            <strong class="section-label" style="color: #0F172A;">6. Solution Architecture</strong>
            <h3 style="margin: 0 0 8px 0; font-size: 14.5px; color: #0F172A;">${cleanText(data.recommendedTechnology || 'THEXRA Enterprise Architecture')}</h3>

            <div style="margin: 8px 0; padding: 8px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 6px;">
              <strong style="font-size: 10px; text-transform: uppercase; color: #2563EB; display: block; margin-bottom: 4px;">Automated System Flow Diagram:</strong>
              ${renderArchitectureDiagram(arch, true)}
            </div>

            <div style="font-size: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin-top: 8px;">
              <div><strong>Hardware:</strong> ${(arch.hardware || []).join(', ') || 'N/A'}</div>
              <div><strong>Software:</strong> ${(arch.software || []).join(', ') || 'N/A'}</div>
              <div><strong>AI Components:</strong> ${(arch.aiComponents || []).join(', ') || 'N/A'}</div>
              <div><strong>XR Components:</strong> ${(arch.xrComponents || []).join(', ') || 'N/A'}</div>
              <div><strong>Backend:</strong> ${(arch.backend || []).join(', ') || 'N/A'}</div>
              <div><strong>Dashboard:</strong> ${(arch.dashboard || []).join(', ') || 'N/A'}</div>
              <div style="grid-column: 1 / -1;"><strong>Data Flow:</strong> <code>${cleanText(arch.dataFlow || 'N/A')}</code></div>
            </div>
          </div>

          <!-- Section 7: Scope of Work -->
          <div class="proposal-section">
            <strong class="section-label">7. Scope of Work (SOW)</strong>
            <p style="margin: 0;"><strong>Project Scope:</strong> ${cleanText(sow.projectScope || 'Scope boundary statement.')}</p>
            <p style="margin: 4px 0 0 0;"><strong>Core Features:</strong> ${(sow.features || []).join(', ') || 'N/A'}</p>
            <p style="margin: 4px 0 0 0; color: #DC2626;"><strong>Exclusions:</strong> ${(sow.exclusions || []).join(', ') || 'N/A'}</p>
          </div>

          <!-- Section 8: Deliverables -->
          <div class="proposal-section">
            <strong class="section-label">8. Deliverables</strong>
            <p style="margin: 0;">${(sow.deliverables || []).join(' • ') || 'Key technical and operational deliverables list.'}</p>
          </div>

          <!-- Section 9: Implementation Plan -->
          <div class="proposal-section">
            <strong class="section-label">9. Implementation Plan</strong>
            ${data.implementationPlan ? renderImplementationPlan(data.implementationPlan, true) : '<p style="margin:0;">7-Stage Execution Roadmap</p>'}
          </div>

          <!-- Section 10: Timeline -->
          <div class="proposal-section">
            <strong class="section-label">10. Timeline & Delivery Target</strong>
            <p style="margin: 0;"><strong>Target Horizon:</strong> ${cleanText(document.getElementById('timeline')?.value || '6-8 weeks')}</p>
          </div>

          <!-- Section 11: Assumptions -->
          <div class="proposal-section">
            <strong class="section-label">11. Assumptions & Prerequisites</strong>
            <div style="margin: 0; background: #F8FAFC; border-left: 3px solid #64748B; padding: 8px 12px; border-radius: 4px; color: #334155;">
              <ul style="margin: 0; padding-left: 16px;">
                <li>Technical Prerequisite: Dedicated network access provided by ${cleanText(clientCompany)} IT team.</li>
                <li>Operational Prerequisite: Assigned single point of contact during rollout phase.</li>
              </ul>
            </div>
          </div>

          <!-- Section 12: Optional Add-ons -->
          <div class="proposal-section">
            <strong class="section-label">12. Optional Add-ons & Phase 2 Upsells</strong>
            <div style="margin: 0; background: #F8FAFC; border-left: 3px solid #9333EA; padding: 8px 12px; border-radius: 4px; color: #334155;">
              <strong>Alternative Option:</strong> ${cleanText(data.alternativeRecommendation || 'Phase 2 Scale Module')}<br>
              <span style="font-size: 11.5px; color: #64748B;">Includes advanced predictive AI telemetry and extended SLA maintenance options.</span>
            </div>
          </div>

          <!-- Section 13: Next Steps -->
          <div class="proposal-section">
            <strong class="section-label">13. Next Steps & Scoping Workshop</strong>
            <p style="margin: 0;">${cleanText(data.recommendedNextStep || data.nextStep || 'Execute technical validation workshop and finalize SOW.')}</p>
          </div>

        </div>
        `;

        modal.style.display = 'block';
      });

      document.getElementById('btn-modal-close')?.addEventListener('click', () => {
        document.getElementById('proposalModal').style.display = 'none';
      });

      document.getElementById('btn-modal-print')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.print();
      });
    }

    statusBanner?.scrollIntoView({ behavior: 'smooth' });

  } catch (err) {
    console.error("Gemini API Detailed Error Log:", err);

    if (statusBanner) {
      statusBanner.className = 'status-banner error';
      const errString = (err.message || '').toLowerCase();

      if (errString.includes('503') || errString.includes('demand') || errString.includes('busy')) {
        statusBanner.innerText = "Our AI is currently experiencing high demand. Please wait a moment and try submitting again.";
      } else if (errString.includes('429') || errString.includes('quota') || errString.includes('limit')) {
        statusBanner.innerText = "API rate limit reached. Please wait 10 seconds before generating a new proposal.";
      } else if (errString.includes('json') || errString.includes('parse') || errString.includes('syntax')) {
        statusBanner.innerText = "We couldn't process the response structure. Please click 'Submit for AI Scoping' again.";
      } else {
        statusBanner.innerText = "Something went wrong while generating your solution proposal. Please refresh the page and try again.";
      }
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Submit for AI Scoping →';
    }
  }
});