let techKnowledge = null;

// Load the THEXRA technology knowledge base
fetch('./technology_knowledge.json')
    .then(response => response.json())
    .then(data => {
        techKnowledge = data;
        console.log("THEXRA technology knowledge base loaded:", techKnowledge);
    })
    .catch(error => {
        console.error("Error loading technology_knowledge.json:", error);
    });

import { GoogleGenAI } from '@google/genai';

// 1. Initialize Gemini API Client
const GEMINI_API_KEY = "GEMINI_API_KEY";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// 2. DOM Elements
const intakeForm = document.getElementById('intake-form');
const statusBanner = document.getElementById('form-status');
const briefOutput = document.getElementById('aiOutput');

// 3. Helper function to call gemini-3.6-flash with automatic 503 retries
async function callGeminiWithRetry(systemPrompt, maxRetries = 3) {
    let delay = 3000; // 3-second delay between retries
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
                        },
                        required: [
                            "businessProblem",
                            "clientObjective",
                            "recommendedTechnology",
                            "solutionConcept",
                            "targetUsers",
                            "expectedBenefits",
                            "complexity",
                            "recommendedNextStep"
                        ],
                    },
                },
            });
        } catch (err) {
            // Automatically retry if a 503 High Demand spike occurs
            if (err.message && err.message.includes('503') && i < maxRetries - 1) {
                console.warn(`503 High Demand on gemini-3.6-flash. Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${maxRetries})`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                delay *= 1.5; // Exponential backoff multiplier
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

    // Make sure techKnowledge is available before making the call
    const knowledgeContext = techKnowledge ? JSON.stringify(techKnowledge) : "";

    const systemPrompt = `You are an Enterprise AI Architect for THEXRA. Analyze the following client submission and populate all structured JSON fields according to the required schema:
    - Company Name: ${companyName}
    - Industry: ${industry}
    - Core Problem: ${problem}
    
   CRITICAL INSTRUCTION:
1. You MUST select the "recommendedTechnology" strictly from THEXRA's official technology knowledge base provided below:
${knowledgeContext}

2. If you select "Combination solution", you MUST specify the technologies being combined in the "recommendedTechnology" field (e.g., "Combination solution (AI + AR)") and explain how they work together in the Solution Concept.

3. In the "Solution Concept", explicitly incorporate and recommend the products listed under the "recommendedProducts" array for the chosen technology in the knowledge base.`;

    try {
        const response = await callGeminiWithRetry(systemPrompt);
        const data = JSON.parse(response.text);

        if (statusBanner) {
            statusBanner.className = 'status-banner success';
            statusBanner.innerText = 'AI Response received successfully!';
        }

        if (briefOutput) {
            briefOutput.className = 'glass-panel active';
            briefOutput.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 1rem; text-align: left;">
                    <div><strong style="color: #60A5FA;">Business Problem:</strong> ${data.businessProblem}</div>
                    <div><strong style="color: #60A5FA;">Client Objective:</strong> ${data.clientObjective}</div>
                    <div><strong style="color: #60A5FA;">Recommended Technology:</strong> ${data.recommendedTechnology}</div>
                    <div><strong style="color: #60A5FA;">Solution Concept:</strong> ${data.solutionConcept}</div>
                    <div><strong style="color: #60A5FA;">Target Users:</strong> ${data.targetUsers}</div>
                    <div><strong style="color: #60A5FA;">Expected Benefits:</strong> ${data.expectedBenefits}</div>
                    <div><strong style="color: #60A5FA;">Complexity:</strong> ${data.complexity}</div>
                    <div><strong style="color: #60A5FA;">Recommended Next Step:</strong> ${data.recommendedNextStep}</div>
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