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
                delay *= 1.5; // Exponential backoff delay multiplier
            } else {
                throw err;
            }
        }
    }
}

// 4. Attach Event Listener to Intake Form
intakeForm?.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent full page refresh

    const submitBtn = intakeForm.querySelector('button[type="submit"]');

    // Display Loading State immediately
    if (statusBanner) {
        statusBanner.className = 'status-banner loading';
        statusBanner.innerText = 'Sending client data to Gemini...';
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Generating Brief...';
    }

    // Force browser repaint to show blue loading state instantly
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Read form input values
    const companyName = document.getElementById('companyName')?.value || 'N/A';
    const industry = document.getElementById('industry')?.value || 'N/A';
    const problem = document.getElementById('problem')?.value || 'N/A';

    // Construct prompt for Gemini
    const systemPrompt = `You are an Enterprise AI Architect. Analyze the following client submission and populate all structured JSON fields according to the required schema:
    - Company Name: ${companyName}
    - Industry: ${industry}
    - Core Problem: ${problem}`;

    try {
        // Step A: Make API call with retry wrapper
        const response = await callGeminiWithRetry(systemPrompt);

        // Step B: Parse JSON text output
        const data = JSON.parse(response.text);

        // Step C: Update Status Banner to Green Success
        if (statusBanner) {
            statusBanner.className = 'status-banner success';
            statusBanner.innerText = 'AI Response received successfully!';
        }

        // Step D: Render 8 structured fields into the HTML container
        if (briefOutput) {
            briefOutput.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 1rem; text-align: left; padding: 1rem;">
                    <div><strong>Business Problem:</strong> ${data.businessProblem}</div>
                    <div><strong>Client Objective:</strong> ${data.clientObjective}</div>
                    <div><strong>Recommended Technology:</strong> ${data.recommendedTechnology}</div>
                    <div><strong>Solution Concept:</strong> ${data.solutionConcept}</div>
                    <div><strong>Target Users:</strong> ${data.targetUsers}</div>
                    <div><strong>Expected Benefits:</strong> ${data.expectedBenefits}</div>
                    <div><strong>Complexity:</strong> ${data.complexity}</div>
                    <div><strong>Recommended Next Step:</strong> ${data.recommendedNextStep}</div>
                </div>
            `;
        }

        // Step E: Smooth scroll to status banner so green message & brief render together
        statusBanner?.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        console.error("Gemini API Error:", err);
        if (statusBanner) {
            statusBanner.className = 'status-banner error';
            statusBanner.innerText = err.message || 'API Error: Failed to generate response.';
        }
    } finally {
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Submit for AI Scoping →';
        }
    }
});
