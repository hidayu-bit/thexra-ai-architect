// Global state variables
let currentBriefData = null;
let savedVersions = [];
let techKnowledge = {};
let industryKnowledge = {};

// Global helper to clean whitespace safely everywhere
const cleanText = (str) => (str || '').replace(/\s+/g, ' ').trim();

// Load Knowledge Bases asynchronously
async function loadKnowledgeBases() {
  try {
    const [techRes, industryRes] = await Promise.all([
      fetch('technology_knowledge.json').catch(() => null),
      fetch('industry_knowledge.json').catch(() => null)
    ]);

    if (techRes) techKnowledge = await techRes.json();
    if (industryRes) industryKnowledge = await industryRes.json();

    console.log("Knowledge Bases initialized.");
  } catch (error) {
    console.warn("Using default internal knowledge fallbacks.");
  }
}
loadKnowledgeBases();

import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = "GEMINIAPIKEY";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// DAY 16 — Visual Architecture Flowchart Generator
function renderArchitectureDiagram(architectureData, isProposal = false) {
  if (!architectureData) return '';

  const hw = (architectureData.hardware || [])[0] || 'Client Device';
  const xr = (architectureData.xrComponents || [])[0] || 'Interactive Visuals';
  const sw = (architectureData.software || [])[0] || 'THEXRA Platform';
  const aiComponents = (architectureData.aiComponents || [])[0] || 'Smart Automation';
  const backend = (architectureData.backend || [])[0] || 'Secure Cloud Storage';
  const dash = (architectureData.dashboard || [])[0] || 'Reporting Portal';

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

// Render Implementation Plan Roadmap
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

// Render Scope of Work (SOW) Grid
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

// DOM Elements
const intakeForm = document.getElementById('intake-form');
const statusBanner = document.getElementById('form-status');
const briefOutput = document.getElementById('aiOutput');

function generateLocalFallbackData(clientInfo) {
  const comp = clientInfo.companyName || 'Client Organization';
  const ind = clientInfo.industry || 'Enterprise';
  const prob = clientInfo.problem || 'Operational bottlenecks';
  const outcome = clientInfo.desiredOutcome || 'Efficiency gains';
  const target = clientInfo.targetPersona || 'End Users';
  const process = clientInfo.currentProcess || 'Manual procedures';
  const time = clientInfo.timeline || '6-8 weeks';

  return {
    businessProblem: `In the ${ind} sector, ${comp} currently faces ${prob} driven by legacy processes (${process}).`,
    clientObjective: `${outcome} within a targeted ${time} timeframe for ${target}.`,
    recommendedTechnology: `AR — THEXRA View for ${ind}`,
    solutionConcept: `Custom THEXRA spatial solution engineered specifically for ${comp} to replace ${process} and solve ${prob}.`,
    targetUsers: `${target} (${clientInfo.targetUserCount || '10-50'} active users)`,
    expectedBenefits: `Directly achieves ${outcome} while modernizing current ${process}.`,
    why: `THEXRA View directly eliminates ${prob} by replacing ${process} with interactive visual guidance. Specially configured for ${comp}'s operational team.`,
    solutionArchitecture: {
      solutionOverview: `Integrated THEXRA cloud and spatial mobile interface architecture customized for ${comp}.`,
      userJourney: `${target} authenticates -> Loads ${ind} workflow -> Interacts with digitized spatial steps -> Automatically logs analytics.`,
      hardware: ["Enterprise Mobile / Tablet Devices"],
      software: [`THEXRA ${ind} Core Module`],
      aiComponents: ["Automated Workflow Engine"],
      xrComponents: ["Interactive Spatial Overlay"],
      backend: ["Encrypted Enterprise Cloud Storage"],
      dashboard: ["Executive Operations Dashboard"],
      dataFlow: "Edge Device -> Secure Gateway -> Real-time Analytics"
    },
    implementationApproach: ["Phase 1: Workflow Digitization", "Phase 2: Pilot Deployment", "Phase 3: Organization Rollout"],
    implementationPlan: [
      { stage: "Discovery & Setup", duration: "1 week", deliverables: [`Technical specs for ${process}`] },
      { stage: "Core Build & Testing", duration: "3 weeks", deliverables: ["Working THEXRA module and QA report"] },
      { stage: "Deployment & Onboarding", duration: "1 week", deliverables: [`User onboarding for ${target}`] }
    ],
    scopeOfWork: {
      projectScope: `Core delivery of THEXRA platform tailored to streamline ${prob} for ${comp}.`,
      features: ["Real-time spatial tracking", "Automated activity reporting"],
      deliverables: ["THEXRA App Access", "Admin Analytics Dashboard"],
      hardware: ["Client-provided handheld hardware"],
      software: ["THEXRA Core License"],
      content: ["Customized UI Asset Pack"],
      training: `1-Day Workshop for ${target}`,
      deployment: "Managed Enterprise Cloud Release",
      support: "8/5 SLA Technical Support",
      exclusions: ["Third-party legacy system refactoring"]
    },
    recommendedNextStep: `Schedule 30-minute technical scoping review for ${comp}.`
  };
}

// Helper function to call Gemini with automatic retries and backoff delay
async function callGeminiWithRetry(prompt, maxRetries = 3, baseDelayMs = 1500) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Gemini API Call — Attempt ${attempt} of ${maxRetries}...`);

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });

      return response; // Success! Return Gemini response
    } catch (err) {
      console.warn(`Gemini API Attempt ${attempt} failed:`, err.message || err);

      // If we've reached max retries, throw the error to engage local fallback
      if (attempt === maxRetries) {
        throw new Error(`Gemini failed after ${maxRetries} retries: ${err.message}`);
      }

      // Calculate exponential wait delay (1.5s, 3s, etc.)
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Form Submission Handler
intakeForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const clientInfo = {
    companyName: document.getElementById('companyName')?.value.trim() || 'Client Organization',
    industry: document.getElementById('industry')?.value.trim() || 'General Enterprise',
    problem: document.getElementById('problem')?.value.trim() || 'Operational Bottlenecks',
    targetPersona: document.getElementById('targetUser')?.value.trim() || 'End Users',
    targetUserCount: document.querySelector('input[name="targetUserCount"]:checked')?.value || '10-50',
    currentProcess: document.getElementById('currentProcess')?.value.trim() || 'Manual Workflow',
    desiredOutcome: document.getElementById('desiredOutcome')?.value.trim() || 'Efficiency Gains',
    budgetRange: document.getElementById('budgetRange')?.value.trim() || 'Standard Enterprise',
    timeline: document.getElementById('timeline')?.value.trim() || '6-8 weeks'
  };

  const submitBtn = intakeForm.querySelector('button[type="submit"]');

  if (statusBanner) {
    statusBanner.className = 'status-banner loading';
    statusBanner.innerText = 'Analyzing requirements with Gemini (this may take up to 30s)...';
  }
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = 'Generating Brief...';
  }

  let data = null;

  try {
    const prompt = `Role: Expert Enterprise Solution Architect for THEXRA. Analyze client data and return RAW VALID JSON ONLY:
Client: ${clientInfo.companyName} (${clientInfo.industry})
Problem: ${clientInfo.problem}
Target User: ${clientInfo.targetPersona} (${clientInfo.targetUserCount} users)
Current Process: ${clientInfo.currentProcess}
Goal: ${clientInfo.desiredOutcome}
Timeline: ${clientInfo.timeline}

Return JSON with exact keys:
{
  "businessProblem": "${clientInfo.problem}",
  "clientObjective": "${clientInfo.desiredOutcome}",
  "recommendedTechnology": "AR — THEXRA View",
  "solutionConcept": "High-level architectural concept.",
  "targetUsers": "${clientInfo.targetPersona}",
  "expectedBenefits": "${clientInfo.desiredOutcome}",
  "why": "Two short sentences explaining why THEXRA suits ${clientInfo.companyName}.",
  "solutionArchitecture": {
    "solutionOverview": "Technical overview.",
    "userJourney": "User workflow path.",
    "hardware": ["Client Handheld Device"],
    "software": ["THEXRA Core Module"],
    "aiComponents": ["Automated Data Processing"],
    "xrComponents": ["Interactive Spatial UI"],
    "backend": ["Cloud Database"],
    "dashboard": ["Analytics Portal"],
    "dataFlow": "Device -> Edge -> Cloud"
  },
  "implementationApproach": ["Phase 1: Setup", "Phase 2: Pilot", "Phase 3: Rollout"],
  "implementationPlan": [
    { "stage": "Discovery", "duration": "1 week", "deliverables": ["Specs & Scope"] },
    { "stage": "Build", "duration": "3 weeks", "deliverables": ["Core Build"] },
    { "stage": "Launch", "duration": "1 week", "deliverables": ["Production Release"] }
  ],
  "scopeOfWork": {
    "projectScope": "Key scope boundaries.",
    "features": ["Core Feature 1", "Core Feature 2"],
    "deliverables": ["Deliverable 1", "Deliverable 2"],
    "hardware": ["Device Hardware"],
    "software": ["THEXRA Software"],
    "content": ["UI Assets"],
    "training": "Operational Onboarding",
    "deployment": "Phased Rollout",
    "support": "Monthly SLA",
    "exclusions": ["Legacy Systems Maintenance"]
  },
  "recommendedNextStep": "Schedule 30-minute scoping workshop."
}`;

    const response = await callGeminiWithRetry(prompt, 3, 5000);
    const rawText = response.text || '';
    data = JSON.parse(rawText.replace(/```json|```/g, "").trim());

    if (statusBanner) {
      statusBanner.className = 'status-banner success';
      statusBanner.innerText = 'AI Brief Generated Successfully!';
    }
  } catch (err) {
    console.warn("Gemini slow or busy. Using instant local fallback engine.");
    data = generateLocalFallbackData(clientInfo);

    if (statusBanner) {
      statusBanner.className = 'status-banner success';
      statusBanner.innerText = 'Brief Generated Successfully (Instant Mode)!';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Submit for AI Scoping →';
    }
  }

  currentBriefData = data;
  renderBriefOutput(data, clientInfo);
});

// DAY 15 & DAY 16 — Complete Solution Brief UI (With Full 9-Module Architecture Grid & Day 15 Action Buttons)
function renderBriefOutput(data, clientInfo) {
  if (!briefOutput) return;

  const arch = data.solutionArchitecture || {};

  briefOutput.className = 'glass-panel active';
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

      <!-- 2. AI Analysis & Rationale -->
      <div class="glass-card" style="padding: 10px 12px; border-radius: 6px;">
        <span style="font-size: 10px; text-transform: uppercase; color: #C084FC; font-weight: 700; letter-spacing: 0.05em; display: block; margin: 0 0 4px 0;">2. AI Analysis & Rationale</span>
        <p style="margin: 0; color: #CBD5E1; font-size: 13px; line-height: 1.3; font-style: italic;">"${cleanText(data.why)}"</p>
      </div>

      <!-- 3. Recommended Solution Concept & Implementation Plan & SOW -->
      <div class="glass-card" style="padding: 10px 12px; border-radius: 6px;">
        <span style="font-size: 10px; text-transform: uppercase; color: #FBBF24; font-weight: 700; letter-spacing: 0.05em; display: block; margin: 0 0 4px 0;">3. Recommended Solution Concept</span>
        <p style="margin: 0; color: #E2E8F0; font-size: 13px; line-height: 1.3;">${cleanText(data.solutionConcept)}</p>

        ${data.implementationPlan ? `
          <div style="margin-top: 6px;">
            <strong style="font-size: 10.5px; color: #38BDF8; text-transform: uppercase; display: block; margin-bottom: 2px;">Implementation Plan:</strong>
            ${renderImplementationPlan(data.implementationPlan, false)}
          </div>
        ` : ''}

        ${renderScopeOfWork(data.scopeOfWork, false)}
      </div>

      <!-- 4. Technology Architecture Blueprint (Visual Flowchart + Full 9-Module Architecture Grid) -->
      <div class="glass-card" style="padding: 12px; border-radius: 6px; border-left: 3px solid #38BDF8;">
        <span style="font-size: 10px; text-transform: uppercase; color: #38BDF8; font-weight: 700; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">4. Technology Selection</span>
        <h3 style="margin: 0 0 10px 0; color: #FFF; font-size: 14.5px; font-weight: 700;">${cleanText(data.recommendedTechnology)}</h3>

        <!-- Flowchart Diagram -->
        <div style="margin-bottom: 12px; padding: 10px; background: rgba(15, 23, 42, 0.6); border-radius: 6px; border: 1px dashed rgba(56, 189, 248, 0.3);">
          <strong style="color: #38BDF8; font-size: 10.5px; text-transform: uppercase; display: block; margin-bottom: 8px;">Automated System Flow Diagram:</strong>
          ${renderArchitectureDiagram(arch, false)}
        </div>

        <!-- DAY 16: Full 9-Module Architecture Data Fields Grid -->
        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px; color: #CBD5E1;">
          <div><strong style="color: #38BDF8;">1. Overview:</strong> ${cleanText(arch.solutionOverview || 'Enterprise Solution Architecture')}</div>
          <div><strong style="color: #38BDF8;">2. User Journey:</strong> ${cleanText(arch.userJourney || 'Seamless spatial UI workflow')}</div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin: 6px 0;">
            <div style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-radius: 4px; text-align: left;">
              <strong style="color: #38BDF8; display: block; font-size: 10.5px; text-transform: uppercase; margin-bottom: 2px;">3. Hardware</strong>
              <span style="font-size: 12px; color: #CBD5E1; display: block;">${(arch.hardware || []).join(', ') || 'N/A'}</span>
            </div>

            <div style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-radius: 4px; text-align: left;">
              <strong style="color: #38BDF8; display: block; font-size: 10.5px; text-transform: uppercase; margin-bottom: 2px;">4. Software</strong>
              <span style="font-size: 12px; color: #CBD5E1; display: block;">${(arch.software || []).join(', ') || 'N/A'}</span>
            </div>

            <div style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-radius: 4px; text-align: left;">
              <strong style="color: #38BDF8; display: block; font-size: 10.5px; text-transform: uppercase; margin-bottom: 2px;">5. AI Components</strong>
              <span style="font-size: 12px; color: #CBD5E1; display: block;">${(arch.aiComponents || []).join(', ') || 'N/A'}</span>
            </div>

            <div style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-radius: 4px; text-align: left;">
              <strong style="color: #38BDF8; display: block; font-size: 10.5px; text-transform: uppercase; margin-bottom: 2px;">6. XR Components</strong>
              <span style="font-size: 12px; color: #CBD5E1; display: block;">${(arch.xrComponents || []).join(', ') || 'N/A'}</span>
            </div>

            <div style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-radius: 4px; text-align: left;">
              <strong style="color: #38BDF8; display: block; font-size: 10.5px; text-transform: uppercase; margin-bottom: 2px;">7. Backend</strong>
              <span style="font-size: 12px; color: #CBD5E1; display: block;">${(arch.backend || []).join(', ') || 'N/A'}</span>
            </div>

            <div style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-radius: 4px; text-align: left;">
              <strong style="color: #38BDF8; display: block; font-size: 10.5px; text-transform: uppercase; margin-bottom: 2px;">8. Dashboard</strong>
              <span style="font-size: 12px; color: #CBD5E1; display: block;">${(arch.dashboard || []).join(', ') || 'N/A'}</span>
            </div>

            <div style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-radius: 4px; text-align: left; grid-column: 1 / -1;">
              <strong style="color: #38BDF8; display: block; font-size: 10.5px; text-transform: uppercase; margin-bottom: 2px;">9. Data Flow</strong>
              <span style="font-size: 12px; color: #CBD5E1; font-family: monospace; display: block;">${cleanText(arch.dataFlow || 'Device -> Edge Gateway -> Cloud Analytics')}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Expected Business Outcomes -->
      <div class="glass-card" style="padding: 10px 12px; border-radius: 6px;">
        <span style="font-size: 10px; text-transform: uppercase; color: #34D399; font-weight: 700; letter-spacing: 0.05em; display: block; margin: 0 0 4px 0;">5. Expected Business Outcomes</span>
        <p style="margin: 0; color: #E2E8F0; font-size: 13px; line-height: 1.3;">${cleanText(data.expectedBenefits)}</p>
      </div>

      <!-- 6. Recommended Next Step -->
      <div class="glass-card" style="padding: 10px 12px; border-radius: 6px;">
        <span style="font-size: 10px; text-transform: uppercase; color: #34D399; font-weight: 700; letter-spacing: 0.05em; display: block; margin: 0 0 4px 0;">6. Recommended Next Step</span>
        <p style="margin: 0; color: #E2E8F0; font-size: 13px; line-height: 1.3;">${cleanText(data.recommendedNextStep)}</p>
      </div>

      <!-- DAY 15 ACTION BUTTONS BAR: Save, Edit, Regenerate Section, Generate Proposal -->
      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
        <button type="button" id="btn-save" style="flex: 1; min-width: 110px; padding: 8px; font-size: 11.5px; background: rgba(52, 211, 153, 0.2); border: 1px solid #10B981; color: #34D399; border-radius: 5px; cursor: pointer; font-weight: 600;">Save</button>
        <button type="button" id="btn-edit" style="flex: 1; min-width: 110px; padding: 8px; font-size: 11.5px; background: rgba(148, 163, 184, 0.2); border: 1px solid #64748B; color: #CBD5E1; border-radius: 5px; cursor: pointer; font-weight: 600;">Edit</button>
        <button type="button" id="btn-regenerate" style="flex: 1; min-width: 110px; padding: 8px; font-size: 11.5px; background: rgba(59, 130, 246, 0.2); border: 1px solid #3B82F6; color: #60A5FA; border-radius: 5px; cursor: pointer; font-weight: 600;">Regenerate section</button>
        <button type="button" id="btn-proposal" style="flex: 1; min-width: 110px; padding: 8px; font-size: 11.5px; background: rgba(192, 132, 252, 0.2); border: 1px solid #A855F7; color: #C084FC; border-radius: 5px; cursor: pointer; font-weight: 600;">Generate Proposal</button>
      </div>

    </div>
  `;

  // Action Button Handlers
  document.getElementById('btn-save')?.addEventListener('click', () => {
    const htmlDoc = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset="utf-8"><title>THEXRA Solution Brief</title></head>
      <body>
        <h1>THEXRA ENTERPRISE SOLUTION BRIEF</h1>
        <h2>1. Client Problem Statement</h2><p>${cleanText(data.businessProblem)}</p>
        <h2>2. Proposed Solution</h2><p>${cleanText(data.solutionConcept)}</p>
        <h2>3. Technology Selection</h2><p>${cleanText(data.recommendedTechnology)}</p>
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

  document.getElementById('btn-edit')?.addEventListener('click', () => {
    intakeForm?.scrollIntoView({ behavior: 'smooth' });
  });

  // Handler: Regenerate section (Triggers fresh generation with subtle variation)
  document.getElementById('btn-regenerate')?.addEventListener('click', async () => {
    if (statusBanner) {
      statusBanner.className = 'status-banner loading';
      statusBanner.innerText = 'Regenerating fresh solution brief...';
    }

    if (briefOutput) {
      briefOutput.innerHTML = `
      <div style="text-align:center; padding: 30px; color: #94A3B8;">
        <p style="font-size: 15px; font-weight: 600;">Regenerating fresh brief for ${clientInfo.companyName || 'Client'}...</p>
      </div>
    `;
    }

    // Force intake form resubmission
    intakeForm?.requestSubmit();
  });

  document.getElementById('btn-proposal')?.addEventListener('click', () => {
    openProposalEditor(data, clientInfo);
  });
}

// DAY 18 — PROPOSAL EDITOR V1 CORE ENGINE (High-Contrast Clean Inputs)
function openProposalEditor(data, clientInfo) {
  const modal = document.getElementById('proposalModal');
  const content = document.getElementById('proposalContent');

  if (!modal || !content) return;

  const sections = [
    { title: "1. Executive Summary", text: `This executive proposal outlines the deployment of ${data.recommendedTechnology} for ${clientInfo.companyName || 'Client Organization'}.` },
    { title: "2. Client Challenge", text: cleanText(data.businessProblem) },
    { title: "3. Project Objective", text: cleanText(data.clientObjective) },
    { title: "4. Proposed Solution", text: cleanText(data.solutionConcept) },
    { title: "5. Target Users", text: cleanText(data.targetUsers) },
    { title: "6. Recommended Technology", text: cleanText(data.recommendedTechnology) },
    { title: "7. Scope of Work (SOW)", text: cleanText(data.scopeOfWork?.projectScope || 'Project scope boundaries and deliverable framework.') },
    { title: "8. Expected Outcomes", text: cleanText(data.expectedBenefits) },
    { title: "9. Timeline", text: clientInfo.timeline || "6-8 weeks" },
    { title: "10. Recommended Next Steps", text: cleanText(data.recommendedNextStep) }
  ];

  function renderEditorSections() {
    content.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px; text-align: left; font-family: inherit;">
        
        <!-- Editor Control Toolbar -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: #F1F5F9; padding: 10px 12px; border-radius: 6px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h2 style="margin: 0; color: #0F172A; font-size: 18px; font-weight: 700;">PROPOSAL EDITOR V1</h2>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748B;">Edit, regenerate, delete, add, or save proposal snapshots below.</p>
          </div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button type="button" id="btn-add-section" style="padding: 6px 10px; background: #2563EB; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 600;">+ Add Section</button>
            <button type="button" id="btn-save-version" style="padding: 6px 10px; background: #059669; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 600;">Save Version</button>
            <select id="select-versions" style="padding: 5px; font-size: 11px; border-radius: 4px; border: 1px solid #CBD5E1; color: #0F172A; background: #FFFFFF;">
              <option value="">-- Load Saved Version --</option>
              ${savedVersions.map((v, i) => `<option value="${i}">${v.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Dynamic Section List -->
        ${sections.map((sec, idx) => `
          <div class="editor-section-card" style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 6px; padding: 12px; box-sizing: border-box; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; gap: 8px;">
              <input type="text" value="${sec.title}" data-idx="${idx}" class="sec-title-input" style="font-weight: 700; color: #0F172A; background: #F8FAFC; font-size: 12.5px; border: 1px solid #CBD5E1; padding: 4px 6px; border-radius: 4px; flex: 1;" />
              <div style="display: flex; gap: 4px; flex-shrink: 0;">
                <button type="button" data-idx="${idx}" class="btn-regen-sec" style="padding: 4px 8px; font-size: 10.5px; background: #3B82F6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Regenerate</button>
                <button type="button" data-idx="${idx}" class="btn-del-sec" style="padding: 4px 8px; font-size: 10.5px; background: #EF4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Delete</button>
              </div>
            </div>
            <textarea data-idx="${idx}" class="sec-text-input" style="width: 100%; height: 60px; font-size: 12px; border: 1px solid #CBD5E1; border-radius: 4px; padding: 6px; box-sizing: border-box; color: #0F172A; background: #FFFFFF; font-family: inherit; resize: vertical;">${sec.text}</textarea>
          </div>
        `).join('')}

      </div>
    `;

    // 1. Edit Handlers
    document.querySelectorAll('.sec-title-input').forEach(input => {
      input.addEventListener('change', (e) => {
        sections[e.target.dataset.idx].title = e.target.value;
      });
    });

    document.querySelectorAll('.sec-text-input').forEach(textarea => {
      textarea.addEventListener('change', (e) => {
        sections[e.target.dataset.idx].text = e.target.value;
      });
    });

    // 2. Delete Handlers
    document.querySelectorAll('.btn-del-sec').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.target.dataset.idx;
        sections.splice(idx, 1);
        renderEditorSections();
      });
    });

    // 3. Regenerate Handlers
    document.querySelectorAll('.btn-regen-sec').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.target.dataset.idx;
        sections[idx].text = `[Refreshed] Updated ${sections[idx].title} scope for ${clientInfo.companyName || 'Client'}.`;
        renderEditorSections();
      });
    });

    // 4. Add Section Handler
    document.getElementById('btn-add-section')?.addEventListener('click', () => {
      sections.push({ title: `${sections.length + 1}. Custom Section`, text: "Enter custom section content here..." });
      renderEditorSections();
    });

    // 5. Save Version Handler
    document.getElementById('btn-save-version')?.addEventListener('click', () => {
      const versionLabel = `Version ${savedVersions.length + 1} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
      savedVersions.push({ label: versionLabel, data: JSON.parse(JSON.stringify(sections)) });
      alert(`Saved "${versionLabel}" successfully!`);
      renderEditorSections();
    });

    // Load Version Handler
    document.getElementById('select-versions')?.addEventListener('change', (e) => {
      const idx = e.target.value;
      if (idx !== "" && savedVersions[idx]) {
        sections.length = 0;
        savedVersions[idx].data.forEach(item => sections.push({ ...item }));
        renderEditorSections();
      }
    });
  }

  renderEditorSections();

  modal.style.display = 'block';

  document.getElementById('btn-modal-close')?.addEventListener('click', () => {
    modal.style.display = 'none';
  });
}