import { GoogleGenAI } from '@google/genai';

// 1. Initialize Gemini API Client
const GEMINI_API_KEY = "YOUR_API_KEY_HERE";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// 2. DOM Elements
const intakeForm = document.getElementById('intake-form');
const statusBanner = document.getElementById('form-status');
const briefOutput = document.getElementById('aiOutput');

// 3. Attach Form Submit Event Listener
intakeForm?.addEventListener('submit', async (e) => {
    e.preventDefault(); // Stop page refresh

    // Show Loading State
    if (statusBanner) {
        statusBanner.className = 'status-banner loading';
        statusBanner.innerText = 'Sending client data to Gemini...';
    }

    // 4. Read values from form AFTER user submits
    const companyName = document.getElementById('companyName')?.value || 'N/A';
    const industry = document.getElementById('industry')?.value || 'N/A';
    const problem = document.getElementById('problem')?.value || 'N/A';

    // 5. Create System Prompt with collected inputs
    const systemPrompt = `You are an Enterprise AI Architect. Review the following client details and generate a concise AI Solution Brief under 150 words:
    - Company Name: ${companyName}
    - Industry: ${industry}
    - Core Problem: ${problem}`;

    try {
        // 6. Call Gemini API
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: systemPrompt,
        });

        // 7. Display Success Status
        if (statusBanner) {
            statusBanner.className = 'status-banner success';
            statusBanner.innerText = 'AI Response received successfully!';
        }

        // 8. Render plain text output for Day 4
        if (briefOutput) {
            briefOutput.innerText = response.text;
        }

    } catch (err) {
        // 9. Handle Errors
        console.error("Gemini API Error:", err);
        if (statusBanner) {
            statusBanner.className = 'status-banner error';
            statusBanner.innerText = 'API Error: Failed to generate response. Check your API key.';
        }
    }
});