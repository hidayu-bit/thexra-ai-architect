// Global state variables
let currentBriefData = null;
let savedVersions = [];
let techKnowledge = {};
let industryKnowledge = {};

// Global helper to clean whitespace safely everywhere
const cleanText = (str) => (str || '').replace(/\s+/g, ' ').trim();

// Force browser to cache and decode the logo immediately on page load
const logoPreload = new Image();
logoPreload.src = 'thexralogo.jpg';
if ('decode' in logoPreload) {
  logoPreload.decode().catch(() => { });
}

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

// Visual Architecture Flowchart Generator
function renderArchitectureDiagram(architectureData, isProposal = false) {
  if (!architectureData) return '';

  // Get current company/industry context from form if available
  const company = document.getElementById('company_name')?.value?.trim() || 'Client';
  const industry = document.getElementById('industryVertical')?.value?.trim() || 'Enterprise';

  // Smart extractions with rich contextual defaults
  const hw = (architectureData.hardware || []).filter(Boolean).join(', ') || `${company} Workstations & Mobile Devices`;
  const xr = (architectureData.xrComponents || []).filter(Boolean).join(', ') || `Interactive ${industry} UI`;
  const sw = (architectureData.software || []).filter(Boolean).join(', ') || `THEXRA ${industry} Engine`;
  const aiComponents = (architectureData.aiComponents || []).filter(Boolean).join(', ') || 'Automated Process Engine';
  const backend = (architectureData.backend || []).filter(Boolean).join(', ') || 'Secure Enterprise Cloud';
  const dash = (architectureData.dashboard || []).filter(Boolean).join(', ') || 'Real-Time Analytics Portal';

  const steps = [
    { label: 'Step 1: Device', val: hw, color: '#38BDF8', border: isProposal ? '#38BDF8' : 'rgba(56, 189, 248, 0.3)' },
    { label: 'Step 2: Experience', val: xr, color: '#F43F5E', border: isProposal ? '#38BDF8' : 'rgba(56, 189, 248, 0.3)' },
    { label: 'Step 3: App & AI', val: `${sw} (${aiComponents})`, color: '#C084FC', border: isProposal ? '#C084FC' : 'rgba(192, 132, 252, 0.3)' },
    { label: 'Step 4: Cloud & DB', val: backend, color: '#F59E0B', border: isProposal ? '#34D399' : 'rgba(52, 211, 153, 0.3)' },
    { label: 'Step 5: Dashboard', val: dash, color: '#34D399', border: isProposal ? '#34D399' : 'rgba(52, 211, 153, 0.3)' }
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
    <ol style="margin: 0; padding-left: 16px; color: ${textColor}; font-size: 12px; line-height: 1.4;">
      ${planData.map((item) => {
    const deliverablesText = Array.isArray(item.deliverables) ? item.deliverables.join(' • ') : item.deliverables;
    return `<li style="margin: 4px 0;"><strong style="color: ${stageColor};">${cleanText(item.stage)}</strong> <span style="color: ${durationColor};">(${cleanText(item.duration)}): </span>${cleanText(deliverablesText)}</li>`;
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

// Dynamic High-Quality Local Fallback Engine
function generateLocalFallbackData(clientInfo) {
  const comp = clientInfo.companyName !== 'N/A' ? clientInfo.companyName : 'Client Organization';
  const indName = clientInfo.industry !== 'N/A' ? clientInfo.industry : 'General Enterprise';
  const prob = clientInfo.problem !== 'N/A' ? clientInfo.problem : 'operational bottlenecks';
  const process = clientInfo.currentProcess !== 'N/A' ? clientInfo.currentProcess : 'legacy operational procedures';
  const outcome = clientInfo.desiredOutcome !== 'N/A' ? clientInfo.desiredOutcome : 'efficiency improvements';
  const target = clientInfo.targetPersona !== 'N/A' ? clientInfo.targetPersona : 'End Users';
  const userScale = clientInfo.targetUserCount !== 'N/A' ? clientInfo.targetUserCount : 'Active Users';
  const timeline = clientInfo.timeline !== 'N/A' ? clientInfo.timeline : '6-8 weeks';

  const probText = prob.toLowerCase();
  let category = "AR";
  let productName = "Spatial Vision";

  if (probText.includes('train') || probText.includes('simulat') || probText.includes('hazard') || probText.includes('lab') || indName === 'Education') {
    category = "VR";
    productName = "Immersive Training Simulator";
  } else if (probText.includes('surg') || probText.includes('repair') || probText.includes('remot') || probText.includes('assist') || probText.includes('hands-free')) {
    category = "MR";
    productName = "Remote Assist Expert";
  } else if (probText.includes('twin') || probText.includes('prototype') || probText.includes('building') || probText.includes('facility') || probText.includes('off-plan')) {
    category = "Digital Twin";
    productName = "Spatial Twin Operations";
  } else if (probText.includes('predict') || probText.includes('data') || probText.includes('analytic') || probText.includes('inspection')) {
    category = "AI Engine";
    productName = "Predictive Intelligence Unit";
  } else if (probText.includes('overcrowd') || probText.includes('tour') || probText.includes('navigation') || probText.includes('landmark') || indName.toLowerCase().includes('tourism')) {
    category = "Location-Based";
    productName = "Spatial Guide";
  }

  const recommendedTech = `${category} — THEXRA ${productName} (${indName} Enterprise Edition)`;

  return {
    businessProblem: `In the ${indName} sector, ${comp} faces significant operational bottlenecks characterized by "${prob}". This issue stems directly from reliance on ${process}, which severely hampers throughput and scales errors.`,
    clientObjective: `Transition ${comp} away from ${process} by deploying an enterprise spatial ecosystem, specifically targeted to achieve "${outcome}" for ${target} (${userScale}) within a ${timeline} timeline.`,
    recommendedTechnology: recommendedTech,
    solutionConcept: `Custom THEXRA ${category} spatial framework designed specifically for ${comp}. It digitizes and automates ${process} into an interactive, real-time spatial workflow that directly resolves "${prob}".`,
    targetUsers: `${target} (${userScale} active users)`,
    expectedBenefits: `Directly targets ${outcome} while replacing inefficient ${process}, driving up to a 40% reduction in operational friction and downtime.`,
    why: `The ${category} architecture solves "${prob}" by converting ${process} into an intuitive spatial experience. THEXRA ${productName} provides the ideal enterprise foundation for ${comp}'s operational requirements.`,
    solutionArchitecture: {
      solutionOverview: `Integrated cloud-native and spatial edge framework custom-engineered for ${comp}.`,
      userJourney: `${target} authenticates -> Scans environment -> Interacts with digitized ${process} workflow -> Syncs real-time telemetry to management console.`,
      hardware: ["Enterprise Smart Headset / Mobile Tablet"],
      software: [`THEXRA ${indName} Core Module`],
      aiComponents: ["Automated Process Inspection Engine"],
      xrComponents: [`Interactive ${category} Spatial UI`],
      backend: ["Encrypted Enterprise Cloud Repository"],
      dashboard: ["Real-time Operations & Telemetry Dashboard"],
      dataFlow: "Edge Device -> Secure Gateway -> Real-time Analytics Engine -> Executive Dashboard"
    },
    implementationApproach: [
      `Phase 1: ${process} Digitization & Spatial Mapping`,
      `Phase 2: Targeted Pilot Rollout for ${target}`,
      `Phase 3: Production Scale & Enterprise Deployment`
    ],
    implementationPlan: [
      { stage: "Discovery", duration: "1 week", deliverables: [`Audit report & technical specifications tailored to ${comp}`] },
      { stage: "Design", duration: "1 week", deliverables: ["Spatial UI/UX wireframes & architectural standards"] },
      { stage: "Prototype", duration: "1 week", deliverables: ["Working functional prototype & user testing report"] },
      { stage: "Development", duration: "2 weeks", deliverables: ["Core module feature build & cloud pipeline setup"] },
      { stage: "Testing", duration: "1 week", deliverables: ["Cross-device QA & performance benchmark"] },
      { stage: "Deployment", duration: "1 week", deliverables: [`Production release for ${target}`] },
      { stage: "Support", duration: "Ongoing", deliverables: ["Dedicated SLA technical support & monthly updates"] }
    ],
    scopeOfWork: {
      projectScope: `Turnkey delivery of customized THEXRA platform engineered to eliminate ${prob} for ${comp}.`,
      features: ["Real-time spatial tracking", "Automated telemetry reporting"],
      deliverables: ["THEXRA Spatial App Access", "Admin Analytics Portal"],
      hardware: ["THEXRA-validated enterprise devices"],
      software: [`THEXRA ${indName} Enterprise License`],
      content: ["Customized UI Asset Pack"],
      training: `1-Day Operational Workshop for ${target}`,
      deployment: "Managed Enterprise Cloud Infrastructure",
      support: "Dedicated SLA Technical Support",
      exclusions: ["Third-party legacy physical infrastructure modification"]
    },
    recommendedNextStep: `Schedule a 30-minute technical scoping review with THEXRA architects and ${comp} leadership.`
  };
}

// Single-Model Helper locked to gemini-3.8-flash with JSON Enforcement & Exponential Backoff
async function callGeminiWithRetry(prompt, maxRetries = 3, baseDelayMs = 2000) {
  const modelName = 'gemini-3.8-flash';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Gemini API Call — Attempt ${attempt + 1} of ${maxRetries} using model: ${modelName}...`);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json", // Mandates clean JSON output from Gemini
          temperature: 0.2
        }
      });

      return response; // Success!
    } catch (err) {
      console.warn(`Gemini API Attempt ${attempt + 1} (${modelName}) failed:`, err.message || err);

      if (attempt === maxRetries - 1) {
        throw new Error(`Gemini failed after ${maxRetries} attempts: ${err.message}`);
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      const delaySeconds = delay / 1000;

      for (let sec = delaySeconds; sec > 0; sec--) {
        if (statusBanner) {
          statusBanner.className = 'status-banner loading';
          statusBanner.innerText = `Gemini server busy. Retrying attempt ${attempt + 2}/${maxRetries} in ${sec}s...`;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}

// Automatically clear red error borders when user types
document.querySelectorAll('input, select, textarea').forEach(element => {
  element.addEventListener('input', () => {
    element.style.borderColor = '';
    element.classList.remove('input-error');
  });
});

// Form Submission Handler with Field Validation & Red Outlines
intakeForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Reset all previous error states
  const allFormInputs = intakeForm.querySelectorAll('input, select, textarea, label, .radio-card, .radio-group');
  allFormInputs.forEach(el => {
    el.style.borderColor = '';
    el.classList.remove('input-error');
  });

  let hasError = false;
  let firstErrorField = null;

  const markError = (element) => {
    if (!element) return;
    hasError = true;
    element.style.borderColor = '#EF4444';
    element.classList.add('input-error');
    if (!firstErrorField) firstErrorField = element;
  };

  // Helper to safely fetch elements by multiple potential IDs or Names
  const getEl = (...identifiers) => {
    for (const id of identifiers) {
      const el = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
      if (el) return el;
    }
    return null;
  };

  // 1. Company Name *
  const companyInput = getEl('companyName', 'company_name', 'clientCompany');
  if (!companyInput || !companyInput.value.trim()) markError(companyInput);

  // 2. Industry Vertical *
  const industrySelect = getEl('industry', 'industryVertical', 'industry_vertical');
  if (!industrySelect || !industrySelect.value || industrySelect.value.toLowerCase().includes('select')) markError(industrySelect);

  // 3. Target User Count (Scale) *
  const targetUserRadio = document.querySelector('input[name="targetUserCount"]:checked') || document.querySelector('input[name="scale"]:checked');
  if (!targetUserRadio) {
    const radioInputs = document.querySelectorAll('input[name="targetUserCount"], input[name="scale"]');
    radioInputs.forEach(radio => {
      const parentCard = radio.closest('label') || radio.parentElement;
      if (parentCard) markError(parentCard);
    });
  }

  // 4. Core Business Problem *
  const problemInput = getEl('problem', 'coreProblem', 'businessProblem', 'frictionPoints');
  if (!problemInput || !problemInput.value.trim()) markError(problemInput);

  // 5. Target End-Users *
  const targetUsersInput = getEl('targetEndUsers', 'targetUser', 'target_end_users', 'endUsers');
  if (!targetUsersInput || !targetUsersInput.value.trim()) markError(targetUsersInput);

  // 6. Desired Business Outcome / KPIs *
  const outcomeInput = getEl('desiredOutcome', 'kpis', 'businessOutcome', 'desired_outcome');
  if (!outcomeInput || !outcomeInput.value.trim()) markError(outcomeInput);

  // 7. Estimated Budget Range *
  const budgetSelect = getEl('budgetRange', 'estimatedBudget', 'budget_range', 'budget');
  if (budgetSelect && (!budgetSelect.value || budgetSelect.value.toLowerCase().includes('select'))) {
    markError(budgetSelect);
  }

  // 8. Delivery Timeline *
  const timelineSelect = getEl('timeline', 'deliveryTimeline', 'delivery_timeline');
  if (timelineSelect && (!timelineSelect.value || timelineSelect.value.toLowerCase().includes('select'))) {
    markError(timelineSelect);
  }

  // Halt execution if any required field is missing
  if (hasError) {
    if (statusBanner) {
      statusBanner.className = 'status-banner error';
      statusBanner.innerText = 'Please complete all required fields (*).';
      statusBanner.style.display = 'block';
    }
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return; // STOP execution
  }

  // Build clientInfo mapping strictly to index.html IDs
  const clientInfo = {
    companyName: document.getElementById('company_name')?.value.trim() || 'N/A',
    industry: document.getElementById('industryVertical')?.value.trim() || 'N/A',
    location: document.getElementById('location')?.value.trim() || 'N/A',
    problem: document.getElementById('problem')?.value.trim() || 'N/A',
    targetPersona: document.getElementById('end_users')?.value.trim() || 'N/A',
    targetUserCount: targetUserRadio?.value || 'N/A',
    currentProcess: document.getElementById('current_process')?.value.trim() || 'N/A',
    desiredOutcome: document.getElementById('outcomes')?.value.trim() || 'N/A',
    budgetRange: document.getElementById('budget')?.value.trim() || 'N/A',
    timeline: document.getElementById('timeline')?.value.trim() || 'N/A',
    specialRequirements: document.getElementById('security')?.value.trim() || 'N/A'
  };

  const submitBtn = intakeForm.querySelector('button[type="submit"]');

  if (statusBanner) {
    statusBanner.className = 'status-banner loading';
    statusBanner.innerText = 'Analyzing requirements with Gemini live AI...';
  }
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = 'Generating Brief...';
  }

  const industryList = industryKnowledge.industries || [];
  const selectedIndustryData = industryList.find(
    i => i.name.toLowerCase() === clientInfo.industry.toLowerCase()
  );

  const techContext = Object.keys(techKnowledge).length ? JSON.stringify(techKnowledge) : "Standard THEXRA Product Catalog";
  const industryContext = selectedIndustryData ? JSON.stringify(selectedIndustryData) : "Standard Enterprise Domain";

  let data = null;

  try {
    const prompt = `Role: Expert Enterprise AI & Solution Architect for THEXRA.
Task: Analyze client intake data using grounded technology knowledge (${techContext}) and industry knowledge (${industryContext}). Be concise, clear, and direct.

CLIENT DATA:
Company Name: ${clientInfo.companyName}
Industry: ${clientInfo.industry}
Core Business Problem: ${clientInfo.problem}
Current Operational Process: ${clientInfo.currentProcess}
Target Users: ${clientInfo.targetPersona} (${clientInfo.targetUserCount} active users)
Desired Business Outcome: ${clientInfo.desiredOutcome}
Budget Range: ${clientInfo.budgetRange}
Target Timeline: ${clientInfo.timeline}

CRITICAL FORMAT & GROUNDING RULES:
1. "recommendedTechnology": You MUST analyze the specific Core Business Problem (${clientInfo.problem}) alongside the Suitable Technologies from ${industryContext}. Select the single technology category that directly solves this exact problem (e.g., use VR for simulation/training/hazards, MR for surgical/remote/hands-free assistance, AR for visual overlays/wayfinding, Digital Twin for prototyping/facilities, or AI for predictive analytics/data). Format: "[Category] — THEXRA [Product Name] (${clientInfo.industry} Edition)".
2. "why": Exactly 2 concise sentences: (1) Why tech category solves ${clientInfo.problem}, (2) Why THEXRA suits ${clientInfo.companyName}.
3. "implementationPlan": MUST contain exactly 7 sequential stages: Discovery, Design, Prototype, Development, Testing, Deployment, Support. 
   - Durations MUST be formatted cleanly (e.g., "1 week", "1.5 weeks", "2 weeks", "Ongoing").
   - Deliverables MUST be straightforward, clear business items that anyone can understand.
   - Cumulative time across stages 1 to 6 MUST strictly fit the target timeline (${clientInfo.timeline}).
4. DO NOT output code blocks, system confirmation phrases, or chatter. Return ONLY raw valid JSON matching this schema:

{
  "businessProblem": "Detailed summary of ${clientInfo.companyName}'s problem in ${clientInfo.industry}, specifically how ${clientInfo.currentProcess} creates bottlenecks.",
  "clientObjective": "Specific goal to achieve ${clientInfo.desiredOutcome} for ${clientInfo.targetPersona} within ${clientInfo.timeline}.",
  "recommendedTechnology": "[Category] — THEXRA [Product Name] (${clientInfo.industry} Edition)",
  "solutionConcept": "High-level architectural concept explaining how THEXRA replaces ${clientInfo.currentProcess} to solve ${clientInfo.problem}.",
  "targetUsers": "${clientInfo.targetPersona} (${clientInfo.targetUserCount} active users)",
  "expectedBenefits": "Concrete operational outcomes focusing on ${clientInfo.desiredOutcome}.",
  "why": "Sentence 1 explaining why the technology category addresses ${clientInfo.problem}. Sentence 2 explaining why THEXRA suits ${clientInfo.companyName}.",
  "solutionArchitecture": {
    "solutionOverview": "Specific 1-sentence technical architecture overview tailored for ${clientInfo.companyName} in ${clientInfo.industry}.",
    "userJourney": "${clientInfo.targetPersona} authenticates -> Scans workspace -> Executes digitized ${clientInfo.currentProcess} workflow -> Syncs real-time data.",
    "hardware": ["Specific Hardware Model/Device tailored for ${clientInfo.companyName}"],
    "software": ["THEXRA ${clientInfo.industry} Module"],
    "aiComponents": ["Specific AI Automation Engine for ${clientInfo.problem}"],
    "xrComponents": ["Custom Spatial UI for ${clientInfo.companyName}"],
    "backend": ["Enterprise Cloud Repository"],
    "dashboard": ["Real-time Operational Dashboard"],
    "dataFlow": "Edge Device -> Secure API Gateway -> Analytics Engine -> Executive Dashboard"
  },
  "implementationApproach": ["Phase 1 description", "Phase 2 description", "Phase 3 description"],
  "implementationPlan": [
    { "stage": "Discovery", "duration": "1 week", "deliverables": ["Audit report", "Technical specs"] },
    { "stage": "Design", "duration": "1 week", "deliverables": ["UI mockups", "Spatial standards"] },
    { "stage": "Prototype", "duration": "1 week", "deliverables": ["Working prototype", "Validation report"] },
    { "stage": "Development", "duration": "2 weeks", "deliverables": ["Core feature build", "Backend sync setup"] },
    { "stage": "Testing", "duration": "1 week", "deliverables": ["Cross-device QA", "Performance benchmark"] },
    { "stage": "Deployment", "duration": "1 week", "deliverables": ["Production release", "Telemetry verification"] },
    { "stage": "Support", "duration": "Ongoing", "deliverables": ["SLA maintenance", "Monthly analytics report"] }
  ],
  "scopeOfWork": {
    "projectScope": "Delivery of customized THEXRA platform to automate ${clientInfo.currentProcess} for ${clientInfo.companyName}.",
    "features": ["Core Feature 1", "Core Feature 2"],
    "deliverables": ["Deliverable 1", "Deliverable 2"],
    "hardware": ["Client-supplied enterprise devices"],
    "software": ["THEXRA Enterprise License"],
    "content": ["Customized UI Asset Pack"],
    "training": "1-Day Operational Workshop for ${clientInfo.targetPersona}",
    "deployment": "Managed Cloud Release",
    "support": "Dedicated SLA Technical Support",
    "exclusions": ["Legacy third-party hardware refactoring"]
  },
  "recommendedNextStep": "Schedule a 30-minute technical scoping review for ${clientInfo.companyName}."
}`;

    const response = await callGeminiWithRetry(prompt, 3);
    const rawText = response.text ? (typeof response.text === 'function' ? response.text() : response.text) : '';
    data = JSON.parse(rawText.replace(/```json|```/g, "").trim());

    if (statusBanner) {
      statusBanner.className = 'status-banner success';
      statusBanner.innerText = 'AI Brief Generated Successfully (Live Gemini)!';
    }
  } catch (err) {
    console.warn("Gemini API error or timeout. Falling back to Instant Engine:", err);
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

// Render Solution Brief UI
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

      <!-- 4. Technology Architecture Blueprint -->
      <div class="glass-card" style="padding: 12px; border-radius: 6px; border-left: 3px solid #38BDF8;">
        <span style="font-size: 10px; text-transform: uppercase; color: #38BDF8; font-weight: 700; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">4. Technology Selection</span>
        <h3 style="margin: 0 0 10px 0; color: #FFF; font-size: 14.5px; font-weight: 700;">${cleanText(data.recommendedTechnology)}</h3>

        <!-- Flowchart Diagram -->
        <div style="margin-bottom: 12px; padding: 10px; background: rgba(15, 23, 42, 0.6); border-radius: 6px; border: 1px dashed rgba(56, 189, 248, 0.3);">
          <strong style="color: #38BDF8; font-size: 10.5px; text-transform: uppercase; display: block; margin-bottom: 8px;">Automated System Flow Diagram:</strong>
          ${renderArchitectureDiagram(arch, false)}
        </div>

        <!-- 9-Module Architecture Grid -->
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

      <!-- Action Buttons Bar -->
      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
        <button type="button" id="btn-save" style="flex: 1; min-width: 110px; padding: 8px; font-size: 11.5px; background: rgba(52, 211, 153, 0.2); border: 1px solid #10B981; color: #34D399; border-radius: 5px; cursor: pointer; font-weight: 600;">Save</button>
        <button type="button" id="btn-edit" style="flex: 1; min-width: 110px; padding: 8px; font-size: 11.5px; background: rgba(148, 163, 184, 0.2); border: 1px solid #64748B; color: #CBD5E1; border-radius: 5px; cursor: pointer; font-weight: 600;">Edit</button>
        <button type="button" id="btn-regenerate" style="flex: 1; min-width: 110px; padding: 8px; font-size: 11.5px; background: rgba(59, 130, 246, 0.2); border: 1px solid #3B82F6; color: #60A5FA; border-radius: 5px; cursor: pointer; font-weight: 600;">Regenerate section</button>
        <button type="button" id="btn-proposal" style="flex: 1; min-width: 110px; padding: 8px; font-size: 11.5px; background: rgba(192, 132, 252, 0.2); border: 1px solid #A855F7; color: #C084FC; border-radius: 5px; cursor: pointer; font-weight: 600;">Generate Proposal</button>
      </div>

    </div>
  `;

  // Action Button Handlers
  document.getElementById('btn-save')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const arch = data.solutionArchitecture || {};
    const htmlDoc = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset="utf-8"><title>THEXRA Solution Brief</title></head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #1E3A8A; border-bottom: 2px solid #2563EB; padding-bottom: 8px;">THEXRA ENTERPRISE SOLUTION BRIEF</h1>
        
        <h2 style="color: #2563EB;">1. Client Problem Statement</h2>
        <p>${cleanText(data.businessProblem)}</p>
        <p><strong>Target Users:</strong> ${cleanText(data.targetUsers || 'N/A')}</p>
        
        <h2 style="color: #2563EB;">2. AI Analysis & Rationale</h2>
        <p><em>"${cleanText(data.why)}"</em></p>
        
        <h2 style="color: #2563EB;">3. Recommended Solution Concept</h2>
        <p>${cleanText(data.solutionConcept)}</p>
        
        <h2 style="color: #2563EB;">4. Technology Selection & Architecture</h2>
        <h3>${cleanText(data.recommendedTechnology)}</h3>
        <p><strong>Overview:</strong> ${cleanText(arch.solutionOverview || 'N/A')}</p>
        <p><strong>User Journey:</strong> ${cleanText(arch.userJourney || 'N/A')}</p>
        <p><strong>Hardware:</strong> ${(arch.hardware || []).join(', ') || 'N/A'}</p>
        <p><strong>Software:</strong> ${(arch.software || []).join(', ') || 'N/A'}</p>
        <p><strong>AI Components:</strong> ${(arch.aiComponents || []).join(', ') || 'N/A'}</p>
        <p><strong>XR Components:</strong> ${(arch.xrComponents || []).join(', ') || 'N/A'}</p>
        <p><strong>Backend:</strong> ${(arch.backend || []).join(', ') || 'N/A'}</p>
        <p><strong>Dashboard:</strong> ${(arch.dashboard || []).join(', ') || 'N/A'}</p>
        <p><strong>Data Flow:</strong> ${cleanText(arch.dataFlow || 'N/A')}</p>
        
        <h2 style="color: #2563EB;">5. Expected Business Outcomes</h2>
        <p>${cleanText(data.expectedBenefits)}</p>
        
        <h2 style="color: #2563EB;">6. Recommended Next Step</h2>
        <p>${cleanText(data.recommendedNextStep)}</p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlDoc], { type: 'application/msword' });
    const fileName = `THEXRA-Solution-Brief-${Date.now()}.doc`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);

    if (statusBanner) {
      statusBanner.className = 'status-banner success';
      statusBanner.innerText = `Brief saved as ${fileName}! Check your browser downloads.`;
      statusBanner.style.display = 'block';
    }
  });

  document.getElementById('btn-edit')?.addEventListener('click', () => {
    intakeForm?.scrollIntoView({ behavior: 'smooth' });
  });

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

    intakeForm?.requestSubmit();
  });

  document.getElementById('btn-proposal')?.addEventListener('click', () => {
    openProposalEditor(data, clientInfo);
  });
}

// Proposal Editor Modal Handler
function openProposalEditor(data, clientInfo) {
  const modal = document.getElementById('proposalModal');
  const content = document.getElementById('proposalContent');

  if (!modal || !content) return;

  const realCompany = clientInfo.companyName && clientInfo.companyName !== 'N/A'
    ? clientInfo.companyName
    : 'Client Organization';

  // Dynamic header metadata calculations
  const companyInput = document.getElementById('company_name')?.value?.trim();
  const industryInput = document.getElementById('industryVertical')?.value?.trim();
  const clientName = companyInput || realCompany;
  const projectTitle = companyInput
    ? `${companyInput} - ${industryInput || 'Enterprise'} Solution Proposal`
    : 'Enterprise Solution Proposal';
  const todayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const sections = [
    { title: "1. Executive Summary", text: `This executive proposal outlines the deployment of ${data.recommendedTechnology || 'THEXRA Spatial View'} for ${realCompany} to solve critical operational bottlenecks.` },
    { title: "2. Client Challenge", text: cleanText(data.businessProblem) },
    { title: "3. Project Objectives", text: cleanText(data.clientObjective) },
    { title: "4. Proposed Solution", text: cleanText(data.solutionConcept) },
    { title: "5. User Experience", text: `Intuitive spatial interface engineered specifically for ${cleanText(data.targetUsers)}, accelerating user onboarding and minimizing operational learning curves.` },
    { title: "6. Solution Architecture", text: cleanText(data.solutionArchitecture?.solutionOverview || 'Cloud-managed spatial edge architecture with secure API integration and real-time telemetry.') },
    { title: "7. Scope of Work", text: cleanText(data.scopeOfWork?.projectScope || 'Project scope boundaries and deliverable framework.') },
    { title: "8. Deliverables", text: Array.isArray(data.scopeOfWork?.deliverables) ? data.scopeOfWork.deliverables.join('\n') : 'THEXRA Platform Access, Admin Portal, Onboarding Documentation' },
    { title: "9. Implementation Plan", text: renderImplementationPlan(data.implementationPlan, false) ? 'Phase 1: Discovery & Architecture\nPhase 2: Spatial Customization\nPhase 3: Integration & Testing\nPhase 4: Final Deployment' : 'Structured multi-phase implementation roadmap.' },
    { title: "10. Timeline", text: clientInfo.timeline || "3-6 months" },
    { title: "11. Assumptions", text: "1. Key stakeholder availability for bi-weekly milestone sign-offs.\n2. Sandbox environment API credentials provided during Phase 1." },
    { title: "12. Optional Add-ons", text: "1. Premium 24/7 SLA Technical Support\n2. Advanced Custom Analytics Dashboard\n3. On-Site Staff Training Workshops" },
    { title: "13. Next Steps", text: cleanText(data.recommendedNextStep) }
  ];

  function renderEditorSections() {
    content.innerHTML = `
      <!-- 1. Executive Print Header (Injected upon opening modal) -->
      <div class="print-header-metadata" style="border-bottom: 2px solid #2563EB; padding-bottom: 12px; margin-bottom: 20px; font-family: Arial, sans-serif; width: 100%;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
              <tr>
                  <td style="vertical-align: middle;">
                      <div style="display: flex; align-items: center; gap: 10px;">
                          <img src="thexralogo.jpg" alt="THEXRA Logo" class="thexra-print-logo" style="height: 28px; width: auto; max-height: 28px; object-fit: contain; display: inline-block; vertical-align: middle;" />
                          <span style="color: #1E3A8A; font-size: 18px; font-weight: 800; letter-spacing: 0.5px; white-space: nowrap; vertical-align: middle;">THEXRA ENTERPRISE SOLUTIONS</span>
                      </div>
                  </td>
                  <td style="text-align: right; vertical-align: middle;">
                      <span style="font-size: 11px; font-weight: 700; color: #2563EB; background: #EFF6FF; border: 1px solid #BFDBFE; padding: 4px 10px; border-radius: 4px; white-space: nowrap; text-transform: uppercase;">SOLUTION PROPOSAL</span>
                  </td>
              </tr>
          </table>
          <table style="width: 100%; border-collapse: collapse; background: #F8FAFC; border-radius: 6px; font-size: 11px; color: #334155;">
            <tr>
                <td style="padding: 6px 8px; width: 28%; vertical-align: top;"><strong>Client:</strong> ${clientName}</td>
                <td style="padding: 6px 8px; width: 52%; vertical-align: top;"><strong>Project:</strong> ${projectTitle}</td>
                <td style="padding: 6px 8px; width: 20%; text-align: right; vertical-align: top; white-space: nowrap;"><strong>Date:</strong> ${todayDate}</td>
            </tr>
        </table>
      </div>

      <!-- 2. Proposal Editor Controls -->
      <div style="display: flex; flex-direction: column; gap: 14px; text-align: left; font-family: inherit;">
        
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

        ${sections.map((sec, idx) => `
          <div class="editor-section-card" style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 6px; padding: 12px; box-sizing: border-box; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; gap: 8px;">
              <input type="text" value="${sec.title}" data-idx="${idx}" class="sec-title-input" style="font-weight: 700; color: #0F172A; background: #F8FAFC; font-size: 12.5px; border: 1px solid #CBD5E1; padding: 4px 6px; border-radius: 4px; flex: 1;" />
              <div style="display: flex; gap: 4px; flex-shrink: 0;">
                <button type="button" data-idx="${idx}" class="btn-regen-sec" style="padding: 4px 8px; font-size: 10.5px; background: #3B82F6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Regenerate</button>
                <button type="button" data-idx="${idx}" class="btn-del-sec" style="padding: 4px 8px; font-size: 10.5px; background: #EF4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Delete</button>
              </div>
            </div>
            <textarea data-idx="${idx}" class="sec-text-input" style="width: 100%; min-height: 85px; font-size: 12px; line-height: 1.4; border: 1px solid #CBD5E1; border-radius: 4px; padding: 8px; box-sizing: border-box; color: #0F172A; background: #FFFFFF; font-family: inherit; resize: vertical;">${sec.text}</textarea>
          </div>
        `).join('')}

      </div>
    `;

    // Input change listeners
    document.querySelectorAll('.sec-title-input').forEach(input => {
      input.addEventListener('change', (e) => { sections[e.target.dataset.idx].title = e.target.value; });
    });

    document.querySelectorAll('.sec-text-input').forEach(textarea => {
      textarea.addEventListener('change', (e) => { sections[e.target.dataset.idx].text = e.target.value; });
    });

    document.querySelectorAll('.btn-del-sec').forEach(btn => {
      btn.addEventListener('click', (e) => {
        sections.splice(e.target.dataset.idx, 1);
        renderEditorSections();
      });
    });

    // Real-time Async Section Regenerator with N/A Sanitization & Unique Fallbacks
    document.querySelectorAll('.btn-regen-sec').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const idx = e.target.dataset.idx;
        const targetBtn = e.target;
        const targetSection = sections[idx];
        const sectionTitle = targetSection.title;
        const currentText = targetSection.text;

        targetBtn.disabled = true;
        targetBtn.innerText = 'Refreshing...';

        const targetTextarea = document.querySelector(`textarea[data-idx="${idx}"]`);
        if (targetTextarea) {
          targetTextarea.value = `[AI Refresher] Generating dynamic updates for ${sectionTitle}...`;
          targetTextarea.style.background = '#F8FAFC';
        }

        // Sanitize "N/A" values into professional context strings
        const company = (realCompany && realCompany !== 'N/A') ? realCompany : 'Client Organization';
        const industry = (clientInfo.industry && clientInfo.industry !== 'N/A') ? clientInfo.industry : 'Healthcare & Life Sciences';
        const problem = (clientInfo.problem && clientInfo.problem !== 'N/A') ? clientInfo.problem : 'high physical training costs and operational risks';
        const process = (clientInfo.currentProcess && clientInfo.currentProcess !== 'N/A') ? clientInfo.currentProcess : 'legacy manual training workflows';
        const outcome = (clientInfo.desiredOutcome && clientInfo.desiredOutcome !== 'N/A') ? clientInfo.desiredOutcome : 'surgical precision and reduced training overhead';

        try {
          const sectionPrompt = `Role: Expert Enterprise Solution Architect for THEXRA.
Task: Write a single, highly detailed, professional paragraph for the proposal section titled "${sectionTitle}".

CLIENT CONTEXT:
- Company Name: ${company}
- Industry: ${industry}
- Core Business Problem: ${problem}
- Current Operational Process: ${process}
- Target Outcome: ${outcome}
- Existing Content: "${currentText}"

CRITICAL INSTRUCTIONS:
1. Write 2-3 concise, realistic sentences specifically tailored to "${sectionTitle}".
2. Do NOT use generic templates. Address ${company}'s specific situation.
3. Return raw plain text ONLY. Do NOT use markdown, JSON wrappers, or quotation marks.`;

          // Call Gemini API directly for plain text generation
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: sectionPrompt,
            config: { temperature: 0.4 }
          });

          let freshText = '';
          if (response && response.text) {
            freshText = typeof response.text === 'function' ? response.text() : response.text;
          }

          freshText = cleanText(freshText.replace(/```json|```/g, "").replace(/^["']|["']$/g, ""));

          if (freshText && freshText.length > 15) {
            sections[idx].text = freshText;
          } else {
            throw new Error('Response too short or empty');
          }
        } catch (err) {
          console.warn(`Section regeneration fallback triggered for "${sectionTitle}":`, err);

          // Granular, section-specific fallbacks (Guarantees unique text across all 10 sections!)
          const titleLower = sectionTitle.toLowerCase();

          if (titleLower.includes('summary') || titleLower.includes('executive')) {
            sections[idx].text = `This executive proposal outlines the strategic deployment of THEXRA technologies for ${company}. By digitizing ${process}, the solution directly eliminates operational bottlenecks to deliver sustainable enterprise efficiency in the ${industry} sector.`;
          } else if (titleLower.includes('challenge') || titleLower.includes('problem')) {
            sections[idx].text = `${company} currently experiences severe operational friction caused by ${problem}. Continued reliance on ${process} limits scaling and increases overall execution risk.`;
          } else if (titleLower.includes('objective') || titleLower.includes('goal')) {
            sections[idx].text = `The strategic goal for ${company} is to replace ${process} with an automated spatial platform, unlocking "${outcome}" across key operational performance metrics.`;
          } else if (titleLower.includes('proposed solution') || titleLower.includes('concept')) {
            sections[idx].text = `THEXRA delivers an integrated spatial computing framework tailored specifically for ${company}. By transforming ${process} into an interactive digital workflow, the platform mitigates physical risks and modernizes team operations.`;
          } else if (titleLower.includes('user experience') || titleLower.includes('ux')) {
            sections[idx].text = `Tailored user interface engineered for ${clientInfo.targetPersona && clientInfo.targetPersona !== 'N/A' ? clientInfo.targetPersona : 'end users'}, featuring zero-install accessibility and interactive spatial controls.`;
          } else if (titleLower.includes('architecture')) {
            sections[idx].text = `Scalable enterprise cloud architecture custom-engineered for ${company}, featuring edge rendering, encrypted data pipelines, and telemetry dashboards.`;
          } else if (titleLower.includes('scope of work') || titleLower.includes('sow')) {
            sections[idx].text = `Scope encompasses end-to-end platform customization for ${company}, including spatial asset creation, cloud repository setup, administrative analytics dashboard integration, and technical user onboarding.`;
          } else if (titleLower.includes('deliverables')) {
            sections[idx].text = `1. Custom THEXRA Enterprise License\n2. Administrative Analytics Portal Access\n3. User Onboarding & Operations Documentation\n4. SLA Technical Support Integration`;
          } else if (titleLower.includes('plan')) {
            sections[idx].text = `Phase 1: Discovery & Requirements Audit (Weeks 1-2)\nPhase 2: Platform Customization (Weeks 3-5)\nPhase 3: Integration & UAT (Weeks 6-7)\nPhase 4: Production Release (Week 8+)`;
          } else if (titleLower.includes('timeline')) {
            sections[idx].text = `Project rollout for ${company} is structured across a ${clientInfo.timeline && clientInfo.timeline !== 'N/A' ? clientInfo.timeline : '3-6 month'} phased plan, covering discovery, design, prototyping, QA testing, and production deployment.`;
          } else if (titleLower.includes('assumptions')) {
            sections[idx].text = `1. ${company} provides access to necessary sandbox APIs during Phase 1.\n2. Key project stakeholders attend weekly progress reviews.`;
          } else if (titleLower.includes('add-on') || titleLower.includes('optional')) {
            sections[idx].text = `1. Dedicated On-Premises Air-Gapped Deployment\n2. 24/7 SLA Priority Support\n3. Bi-Annual Custom Feature Upgrades`;
          } else if (titleLower.includes('next step')) {
            sections[idx].text = `Recommended next step: Schedule a 30-minute technical scoping review with THEXRA solution architects and ${company} leadership.`;
          } else {
            sections[idx].text = `Customized ${sectionTitle} module for ${company}: Deploys THEXRA enterprise tools to streamline ${process} and achieve measurable operational improvements.`;
          }
        } finally {
          renderEditorSections();
        }
      });
    });

    document.getElementById('btn-add-section')?.addEventListener('click', () => {
      sections.push({ title: `${sections.length + 1}. Custom Section`, text: "Enter custom section details..." });
      renderEditorSections();
    });

    document.getElementById('btn-save-version')?.addEventListener('click', () => {
      const versionLabel = `Version ${savedVersions.length + 1} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
      savedVersions.push({ label: versionLabel, data: JSON.parse(JSON.stringify(sections)) });
      alert(`Saved "${versionLabel}" successfully!`);
      renderEditorSections();
    });

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

  // Direct print click handler with download popup notification
  document.addEventListener('click', (e) => {
    const isDownloadBtn = e.target.id === 'btn-modal-print' ||
      e.target.innerText?.includes('Export to PDF') ||
      e.target.closest('#btn-modal-print');

    if (!isDownloadBtn) return;

    e.preventDefault();
    e.stopPropagation();

    // Listen for when the user completes or cancels the print/save dialog
    window.addEventListener('afterprint', () => {
      // 1. Show alert popup
      alert('Proposal export complete!\n\nIf you clicked Save, your PDF is now stored in your downloads folder.'
      );
    }, { once: true }); // { once: true } ensures the popup only triggers once per print

    window.print();
  });
  document.getElementById('btn-modal-close')?.addEventListener('click', () => {
    modal.style.display = 'none';
  });
}