document.getElementById('intake-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const statusBanner = document.getElementById('form-status');
    const requiredInputs = Array.from(this.querySelectorAll('[required]'));
    let isValid = true;

    // Track checked radio groups to avoid duplicate work
    const validatedRadioNames = new Set();

    requiredInputs.forEach(input => {
        if (input.type === 'radio') {
            if (validatedRadioNames.has(input.name)) return;
            validatedRadioNames.add(input.name);

            const radioGroup = Array.from(document.querySelectorAll(`input[name="${input.name}"]`));
            const isChecked = radioGroup.some(r => r.checked);

            radioGroup.forEach(r => {
                const card = r.closest('.radio-card');
                if (card) {
                    if (!isChecked) {
                        card.classList.add('input-error');
                    } else {
                        card.classList.remove('input-error');
                    }
                }
            });

            if (!isChecked) isValid = false;
        } else {
            // Handles text, select, and textarea elements
            if (!input.value || !input.value.trim()) {
                isValid = false;
                input.classList.add('input-error');
            } else {
                input.classList.remove('input-error');
            }
        }
    });

    if (isValid) {
        statusBanner.className = 'status-banner success';
        statusBanner.innerText = 'Form submitted successfully! Proceeding to AI solution scoping...';

        setTimeout(() => {
            this.reset();
            // Clear remaining error highlights
            document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
            statusBanner.className = 'status-banner';
        }, 3000);
    } else {
        statusBanner.className = 'status-banner error';
        statusBanner.innerText = 'Please complete all required fields before submitting.';
    }
});