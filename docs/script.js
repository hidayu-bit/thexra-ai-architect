import { GoogleGenAI } from '@google/genai';

// 1. Initialize Gemini API Client
const GEMINI_API_KEY = "AQ.Ab8RN6LLDUL6gdN4iHKTJjAaP_eMZf1qjaKKQRFam0TFqtXpOQ";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// 2. System Prompt Definition
const SYSTEM_PROMPT = `You are an expert Enterprise AI Solution Architect specializing in Extended Reality (XR), Spatial Computing, and AI/ML integrations.
Analyze the following client intake payload and generate a structured "AI Solution Brief" in plain text / Markdown format.

Your output must include:
1. Executive Summary & Problem Diagnosis
2. Recommended Architecture & Technology Stack
3. Implementation Plan & Timeline Realism
4. Risk Analysis & Platform Compatibility Constraints

Keep the tone professional, technical, and actionable.`;

// 3. DOM Elements (Matching HTML IDs)
const intakeForm = document.getElementById('intake-form');
const submitBtn = document.getElementById('submit-btn');
const statusBanner = document.getElementById('form-status');
const briefOutput = document.getElementById('aiOutput');

// 4. Form Submit Handler
if (intakeForm) {
    intakeForm.addEventListener('submit', async (e) => {
        // Prevent default browser page refresh
        e.preventDefault();

        // UI Loading State
        if (statusBanner) {
            statusBanner.style.display = 'block';
            statusBanner.className = 'status-banner loading';
            statusBanner.innerText = 'Analyzing Client Payload & Generating Brief...';
        }
        if (submitBtn) submitBtn.disabled = true;

        // Extract Form Data
        const formData = new FormData(intakeForm);
        const ecosystemChecked = Array.from(document.querySelectorAll('input[name="ecosystem"]:checked')).map(el => el.value);

        const clientPayload = {
            companyName: formData.get('company_name') || 'N/A',
            industry: formData.get('industry') || 'N/A',
            location: formData.get('location') || 'N/A',
            targetScale: formData.get('scale') || 'N/A',
            problem: formData.get('problem') || 'N/A',
            endUsers: formData.get('end_users') || 'N/A',
            currentProcess: formData.get('current_process') || 'N/A',
            outcomes: formData.get('outcomes') || 'N/A',
            budget: formData.get('budget') || 'N/A',
            timeline: formData.get('timeline') || 'N/A',
            ecosystem: ecosystemChecked,
            securityRequirements: formData.get('security') || 'N/A'
        };

        console.log("Structured Client Intake Payload:", clientPayload);

        // 5. Call Gemini API via SDK
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: [
                    SYSTEM_PROMPT,
                    `Client Intake Payload:\n${JSON.stringify(clientPayload, null, 2)}`
                ],
            });

            const resultText = response.text;

            // Success UI State
            if (statusBanner) {
                statusBanner.className = 'status-banner success';
                statusBanner.innerText = 'AI Solution Brief Generated Successfully!';
            }
            if (briefOutput) {
                briefOutput.innerText = resultText;
            }

        } catch (error) {
            console.error("Gemini API Error:", error);
            if (statusBanner) {
                statusBanner.className = 'status-banner error';
                statusBanner.innerText = `Failed to generate response: ${error.message}`;
            }
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}