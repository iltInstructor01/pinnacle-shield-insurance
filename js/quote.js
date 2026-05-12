/* ============================================
   Pinnacle Shield Insurance - Quote Builder
   ============================================ */

(function () {
    // ---- DOM References ----
    var typeRadios = document.querySelectorAll('input[name="insuranceType"]');
    var quoteForm = document.getElementById('quoteForm');
    var submitSection = document.getElementById('submit-section');
    var resultsSection = document.getElementById('quote-results');
    var formSection = document.getElementById('quote-form-section');
    var newQuoteBtn = document.getElementById('new-quote-btn');

    var autoFields = document.getElementById('auto-fields');
    var homeFields = document.getElementById('home-fields');
    var lifeFields = document.getElementById('life-fields');

    // Bonus feature DOM references
    var loadingSpinner = document.getElementById('loading-spinner');
    var saveQuoteBtn = document.getElementById('save-quote-btn');
    var compareQuoteBtn = document.getElementById('compare-quote-btn');
    var printQuoteBtn = document.getElementById('print-quote-btn');
    var comparisonSection = document.getElementById('comparison-section');
    var clearComparisonBtn = document.getElementById('clear-comparison-btn');

    // Bonus A: Comparison state
    var comparisonQuotes = [];

    // Track the last calculated quote data
    var lastQuoteData = null;

    if (!quoteForm) return;

    // ---- Insurance Type Switching ----
    typeRadios.forEach(function (radio) {
        radio.addEventListener('change', function () {
            // Hide all field sections
            autoFields.classList.add('hidden');
            homeFields.classList.add('hidden');
            lifeFields.classList.add('hidden');

            // Show matching section
            var selected = this.value + '-fields';
            document.getElementById(selected).classList.remove('hidden');

            // Show submit button
            submitSection.classList.remove('hidden');

            // Clear previous errors
            clearAllErrors();

            // Hide type error
            document.getElementById('type-error').classList.add('hidden');

            // Bonus E: Update progress indicator to step 2
            updateProgressIndicator(2);
        });
    });

    // ---- Form Submission ----
    quoteForm.addEventListener('submit', function (e) {
        e.preventDefault();
        clearAllErrors();

        var selectedType = getSelectedType();
        if (!selectedType) {
            var typeError = document.getElementById('type-error');
            typeError.textContent = 'Please select an insurance type above.';
            typeError.classList.remove('hidden');
            return;
        }

        var isValid = false;
        var quoteData = null;

        if (selectedType === 'auto') {
            isValid = validateAutoForm();
            if (isValid) quoteData = calculateAutoQuote();
        } else if (selectedType === 'home') {
            isValid = validateHomeForm();
            if (isValid) quoteData = calculateHomeQuote();
        } else if (selectedType === 'life') {
            isValid = validateLifeForm();
            if (isValid) quoteData = calculateLifeQuote();
        }

        if (isValid && quoteData) {
            // Bonus D: Show loading spinner with delay
            lastQuoteData = quoteData;
            formSection.classList.add('hidden');
            loadingSpinner.classList.remove('hidden');
            loadingSpinner.scrollIntoView({ behavior: 'smooth' });

            setTimeout(function () {
                loadingSpinner.classList.add('hidden');
                formSection.classList.remove('hidden');
                displayResults(quoteData);
                // Bonus E: Update progress to step 3
                updateProgressIndicator(3);
            }, 1500);
        }
    });

    // ---- New Quote Button ----
    if (newQuoteBtn) {
        newQuoteBtn.addEventListener('click', function () {
            resetForm();
        });
    }

    // ============================================
    // Helper Functions
    // ============================================

    function getSelectedType() {
        var selected = document.querySelector('input[name="insuranceType"]:checked');
        return selected ? selected.value : null;
    }

    function getSelectedRadioValue(name) {
        var selected = document.querySelector('input[name="' + name + '"]:checked');
        return selected ? selected.value : '';
    }

    function validateZipCode(zip) {
        return /^\d{5}$/.test(zip);
    }

    function showError(element, message) {
        element.classList.add('is-invalid');
        var feedback = element.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.textContent = message;
        }
    }

    function showRadioError(errorId, message) {
        var errorEl = document.getElementById(errorId);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
        }
    }

    function clearAllErrors() {
        var invalids = document.querySelectorAll('.is-invalid');
        invalids.forEach(function (el) {
            el.classList.remove('is-invalid');
        });

        var radioErrors = document.querySelectorAll('[id$="-error"]');
        radioErrors.forEach(function (el) {
            el.classList.add('hidden');
        });
    }

    function formatCurrency(amount) {
        return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function formatMultiplier(multiplier) {
        if (multiplier === 1.0) return 'No impact (×1.0)';
        if (multiplier < 1.0) {
            var discount = Math.round((1 - multiplier) * 100);
            return '-' + discount + '% discount (×' + multiplier.toFixed(2) + ')';
        }
        var surcharge = Math.round((multiplier - 1) * 100);
        return '+' + surcharge + '% surcharge (×' + multiplier.toFixed(2) + ')';
    }

    // ============================================
    // Auto Insurance Validation & Calculation
    // ============================================

    function validateAutoForm() {
        var valid = true;

        var name = document.getElementById('auto-name');
        if (name.value.trim().length < 2) {
            showError(name, 'Please enter your full name (at least 2 characters).');
            valid = false;
        }

        var age = document.getElementById('auto-age');
        var ageVal = parseInt(age.value);
        if (isNaN(ageVal) || ageVal < 16 || ageVal > 100) {
            showError(age, 'Age must be between 16 and 100.');
            valid = false;
        }

        var zip = document.getElementById('auto-zip');
        if (!validateZipCode(zip.value)) {
            showError(zip, 'Please enter a valid 5-digit ZIP code.');
            valid = false;
        }

        var vehicleYear = document.getElementById('auto-vehicle-year');
        var yearVal = parseInt(vehicleYear.value);
        if (isNaN(yearVal) || yearVal < 1990 || yearVal > 2026) {
            showError(vehicleYear, 'Vehicle year must be between 1990 and 2026.');
            valid = false;
        }

        var make = document.getElementById('auto-vehicle-make');
        if (make.value === '') {
            showError(make, 'Please select a vehicle make.');
            valid = false;
        }

        var model = document.getElementById('auto-vehicle-model');
        if (model.value.trim() === '') {
            showError(model, 'Please enter a vehicle model.');
            valid = false;
        }

        var mileage = document.getElementById('auto-mileage');
        if (mileage.value === '') {
            showError(mileage, 'Please select your annual mileage.');
            valid = false;
        }

        var record = document.getElementById('auto-driving-record');
        if (record.value === '') {
            showError(record, 'Please select your driving record.');
            valid = false;
        }

        var coverage = getSelectedRadioValue('auto-coverage');
        if (coverage === '') {
            showRadioError('auto-coverage-error', 'Please select a coverage level.');
            valid = false;
        }

        return valid;
    }

    function calculateAutoQuote() {
        var baseRate = 75;
        var age = parseInt(document.getElementById('auto-age').value);
        var vehicleYear = parseInt(document.getElementById('auto-vehicle-year').value);
        var mileage = document.getElementById('auto-mileage').value;
        var record = document.getElementById('auto-driving-record').value;
        var coverage = getSelectedRadioValue('auto-coverage');
        var name = document.getElementById('auto-name').value.trim();
        var make = document.getElementById('auto-vehicle-make').value;
        var model = document.getElementById('auto-vehicle-model').value.trim();

        // Age factor
        var ageFactor = 1.0;
        var ageLabel = '';
        if (age < 25) {
            ageFactor = 1.5;
            ageLabel = 'Under 25 — young driver surcharge';
        } else if (age <= 65) {
            ageFactor = 1.0;
            ageLabel = '25–65 — standard rate';
        } else {
            ageFactor = 1.3;
            ageLabel = 'Over 65 — senior surcharge';
        }

        // Vehicle age factor
        var currentYear = 2026;
        var vehicleAge = currentYear - vehicleYear;
        var vehicleFactor = 1.0;
        var vehicleLabel = '';
        if (vehicleAge < 3) {
            vehicleFactor = 1.3;
            vehicleLabel = 'Under 3 years old — newer vehicle';
        } else if (vehicleAge <= 10) {
            vehicleFactor = 1.0;
            vehicleLabel = '3–10 years old — standard rate';
        } else {
            vehicleFactor = 0.8;
            vehicleLabel = 'Over 10 years old — lower value';
        }

        // Mileage factor
        var mileageFactor = 1.0;
        var mileageLabel = '';
        var mileageMap = {
            'under5k': { factor: 0.8, label: 'Under 5,000 — low mileage discount' },
            '5k-10k': { factor: 1.0, label: '5,000–10,000 — standard' },
            '10k-15k': { factor: 1.1, label: '10,001–15,000 — moderate mileage' },
            '15k-20k': { factor: 1.3, label: '15,001–20,000 — high mileage' },
            'over20k': { factor: 1.5, label: 'Over 20,000 — very high mileage' }
        };
        if (mileageMap[mileage]) {
            mileageFactor = mileageMap[mileage].factor;
            mileageLabel = mileageMap[mileage].label;
        }

        // Driving record factor
        var recordFactor = 1.0;
        var recordLabel = '';
        var recordMap = {
            'clean': { factor: 1.0, label: 'Clean record — best rate' },
            '1ticket': { factor: 1.2, label: '1 ticket' },
            '2tickets': { factor: 1.5, label: '2+ tickets' },
            'accident': { factor: 1.8, label: 'Accident in last 3 years' }
        };
        if (recordMap[record]) {
            recordFactor = recordMap[record].factor;
            recordLabel = recordMap[record].label;
        }

        // Coverage level factor
        var coverageFactor = 1.0;
        var coverageLabel = '';
        var coverageMap = {
            'basic': { factor: 0.8, label: 'Basic coverage' },
            'standard': { factor: 1.0, label: 'Standard coverage' },
            'premium': { factor: 1.4, label: 'Premium coverage' }
        };
        if (coverageMap[coverage]) {
            coverageFactor = coverageMap[coverage].factor;
            coverageLabel = coverageMap[coverage].label;
        }

        var monthly = baseRate * ageFactor * vehicleFactor * mileageFactor * recordFactor * coverageFactor;

        return {
            name: name,
            type: 'Auto Insurance',
            monthly: monthly,
            annual: monthly * 12,
            breakdown: [
                { factor: 'Base Rate', value: formatCurrency(baseRate) + '/month', impact: 'Starting rate' },
                { factor: 'Age (' + age + ')', value: ageLabel, impact: formatMultiplier(ageFactor) },
                { factor: 'Vehicle (' + vehicleYear + ' ' + make + ' ' + model + ')', value: vehicleLabel, impact: formatMultiplier(vehicleFactor) },
                { factor: 'Annual Mileage', value: mileageLabel, impact: formatMultiplier(mileageFactor) },
                { factor: 'Driving Record', value: recordLabel, impact: formatMultiplier(recordFactor) },
                { factor: 'Coverage Level', value: coverageLabel, impact: formatMultiplier(coverageFactor) }
            ]
        };
    }

    // ============================================
    // Home Insurance Validation & Calculation
    // ============================================

    function validateHomeForm() {
        var valid = true;

        var name = document.getElementById('home-name');
        if (name.value.trim().length < 2) {
            showError(name, 'Please enter your full name (at least 2 characters).');
            valid = false;
        }

        var age = document.getElementById('home-age');
        var ageVal = parseInt(age.value);
        if (isNaN(ageVal) || ageVal < 18 || ageVal > 100) {
            showError(age, 'Age must be between 18 and 100.');
            valid = false;
        }

        var zip = document.getElementById('home-zip');
        if (!validateZipCode(zip.value)) {
            showError(zip, 'Please enter a valid 5-digit ZIP code.');
            valid = false;
        }

        var homeValue = document.getElementById('home-value');
        var homeVal = parseFloat(homeValue.value);
        if (isNaN(homeVal) || homeVal < 50000) {
            showError(homeValue, 'Home value must be at least $50,000.');
            valid = false;
        }

        var yearBuilt = document.getElementById('home-year-built');
        var yearVal = parseInt(yearBuilt.value);
        if (isNaN(yearVal) || yearVal < 1900 || yearVal > 2026) {
            showError(yearBuilt, 'Year built must be between 1900 and 2026.');
            valid = false;
        }

        var sqft = document.getElementById('home-sqft');
        var sqftVal = parseInt(sqft.value);
        if (isNaN(sqftVal) || sqftVal < 500 || sqftVal > 10000) {
            showError(sqft, 'Square footage must be between 500 and 10,000.');
            valid = false;
        }

        var construction = document.getElementById('home-construction');
        if (construction.value === '') {
            showError(construction, 'Please select a construction type.');
            valid = false;
        }

        var coverage = getSelectedRadioValue('home-coverage');
        if (coverage === '') {
            showRadioError('home-coverage-error', 'Please select a coverage level.');
            valid = false;
        }

        return valid;
    }

    function calculateHomeQuote() {
        var homeValue = parseFloat(document.getElementById('home-value').value);
        var yearBuilt = parseInt(document.getElementById('home-year-built').value);
        var sqft = parseInt(document.getElementById('home-sqft').value);
        var construction = document.getElementById('home-construction').value;
        var hasSecurity = document.getElementById('home-security').checked;
        var hasSprinklers = document.getElementById('home-sprinklers').checked;
        var coverage = getSelectedRadioValue('home-coverage');
        var name = document.getElementById('home-name').value.trim();

        // Base rate: home value × 0.003 / 12
        var baseRate = (homeValue * 0.003) / 12;

        // Year built factor
        var yearFactor = 1.0;
        var yearLabel = '';
        if (yearBuilt < 1970) {
            yearFactor = 1.4;
            yearLabel = 'Before 1970 — older construction';
        } else if (yearBuilt < 2000) {
            yearFactor = 1.1;
            yearLabel = '1970–1999 — moderate age';
        } else {
            yearFactor = 1.0;
            yearLabel = '2000+ — modern construction';
        }

        // Construction factor
        var constructionFactor = 1.0;
        var constructionLabel = '';
        var constructionMap = {
            'wood': { factor: 1.2, label: 'Wood frame — higher risk' },
            'brick': { factor: 1.0, label: 'Brick — standard' },
            'concrete': { factor: 0.9, label: 'Concrete — lower risk' },
            'steel': { factor: 0.85, label: 'Steel — lowest risk' }
        };
        if (constructionMap[construction]) {
            constructionFactor = constructionMap[construction].factor;
            constructionLabel = constructionMap[construction].label;
        }

        // Size factor: +$0.01 per sqft per month
        var sizeAdditional = sqft * 0.01;

        // Security discount
        var securityFactor = hasSecurity ? 0.95 : 1.0;

        // Sprinkler discount
        var sprinklerFactor = hasSprinklers ? 0.92 : 1.0;

        // Coverage level factor
        var coverageFactor = 1.0;
        var coverageLabel = '';
        var coverageMap = {
            'basic': { factor: 0.8, label: 'Basic coverage' },
            'standard': { factor: 1.0, label: 'Standard coverage' },
            'premium': { factor: 1.4, label: 'Premium coverage' }
        };
        if (coverageMap[coverage]) {
            coverageFactor = coverageMap[coverage].factor;
            coverageLabel = coverageMap[coverage].label;
        }

        var monthly = (baseRate * yearFactor * constructionFactor * securityFactor * sprinklerFactor * coverageFactor) + sizeAdditional;

        return {
            name: name,
            type: 'Home Insurance',
            monthly: monthly,
            annual: monthly * 12,
            breakdown: [
                { factor: 'Base Rate', value: formatCurrency(homeValue) + ' home × 0.3%/yr', impact: formatCurrency(baseRate) + '/month' },
                { factor: 'Year Built (' + yearBuilt + ')', value: yearLabel, impact: formatMultiplier(yearFactor) },
                { factor: 'Construction (' + construction + ')', value: constructionLabel, impact: formatMultiplier(constructionFactor) },
                { factor: 'Size (' + sqft.toLocaleString() + ' sq ft)', value: sqft.toLocaleString() + ' × $0.01', impact: '+' + formatCurrency(sizeAdditional) + '/month' },
                { factor: 'Security System', value: hasSecurity ? 'Yes' : 'No', impact: hasSecurity ? '-5% discount (×0.95)' : 'No discount' },
                { factor: 'Fire Sprinklers', value: hasSprinklers ? 'Yes' : 'No', impact: hasSprinklers ? '-8% discount (×0.92)' : 'No discount' },
                { factor: 'Coverage Level', value: coverageLabel, impact: formatMultiplier(coverageFactor) }
            ]
        };
    }

    // ============================================
    // Life Insurance Validation & Calculation
    // ============================================

    function validateLifeForm() {
        var valid = true;

        var name = document.getElementById('life-name');
        if (name.value.trim().length < 2) {
            showError(name, 'Please enter your full name (at least 2 characters).');
            valid = false;
        }

        var age = document.getElementById('life-age');
        var ageVal = parseInt(age.value);
        if (isNaN(ageVal) || ageVal < 18 || ageVal > 85) {
            showError(age, 'Age must be between 18 and 85.');
            valid = false;
        }

        var zip = document.getElementById('life-zip');
        if (!validateZipCode(zip.value)) {
            showError(zip, 'Please enter a valid 5-digit ZIP code.');
            valid = false;
        }

        var gender = document.getElementById('life-gender');
        if (gender.value === '') {
            showError(gender, 'Please select a gender.');
            valid = false;
        }

        var smoker = getSelectedRadioValue('life-smoker');
        if (smoker === '') {
            showRadioError('life-smoker-error', 'Please select smoker status.');
            valid = false;
        }

        var coverageAmount = document.getElementById('life-coverage-amount');
        if (coverageAmount.value === '') {
            showError(coverageAmount, 'Please select a coverage amount.');
            valid = false;
        }

        var exercise = document.getElementById('life-exercise');
        if (exercise.value === '') {
            showError(exercise, 'Please select your exercise frequency.');
            valid = false;
        }

        var coverage = getSelectedRadioValue('life-coverage');
        if (coverage === '') {
            showRadioError('life-coverage-error', 'Please select a coverage level.');
            valid = false;
        }

        return valid;
    }

    function calculateLifeQuote() {
        var age = parseInt(document.getElementById('life-age').value);
        var gender = document.getElementById('life-gender').value;
        var smoker = getSelectedRadioValue('life-smoker');
        var coverageAmount = parseFloat(document.getElementById('life-coverage-amount').value);
        var exercise = document.getElementById('life-exercise').value;
        var hasConditions = document.getElementById('life-conditions').checked;
        var coverage = getSelectedRadioValue('life-coverage');
        var name = document.getElementById('life-name').value.trim();

        // Base rate: coverage × 0.0005 / 12
        var baseRate = (coverageAmount * 0.0005) / 12;

        // Age factor
        var ageFactor = 1.0;
        var ageLabel = '';
        if (age <= 30) {
            ageFactor = 1.0;
            ageLabel = '18–30 — lowest risk';
        } else if (age <= 45) {
            ageFactor = 1.5;
            ageLabel = '31–45 — moderate risk';
        } else if (age <= 60) {
            ageFactor = 2.5;
            ageLabel = '46–60 — higher risk';
        } else {
            ageFactor = 4.0;
            ageLabel = '61–85 — highest risk';
        }

        // Smoker factor
        var smokerFactor = (smoker === 'yes') ? 2.0 : 1.0;
        var smokerLabel = (smoker === 'yes') ? 'Smoker — doubled rate' : 'Non-smoker — standard rate';

        // Exercise factor
        var exerciseFactor = 1.0;
        var exerciseLabel = '';
        var exerciseMap = {
            'rarely': { factor: 1.3, label: 'Rarely exercises' },
            '1-2': { factor: 1.1, label: '1–2 times/week' },
            '3-4': { factor: 1.0, label: '3–4 times/week — standard' },
            '5+': { factor: 0.9, label: '5+ times/week — active discount' }
        };
        if (exerciseMap[exercise]) {
            exerciseFactor = exerciseMap[exercise].factor;
            exerciseLabel = exerciseMap[exercise].label;
        }

        // Pre-existing conditions
        var conditionsFactor = hasConditions ? 1.5 : 1.0;

        // Gender factor
        var genderFactor = 1.0;
        var genderLabel = '';
        var genderMap = {
            'male': { factor: 1.1, label: 'Male' },
            'female': { factor: 1.0, label: 'Female' },
            'nonbinary': { factor: 1.05, label: 'Non-binary' }
        };
        if (genderMap[gender]) {
            genderFactor = genderMap[gender].factor;
            genderLabel = genderMap[gender].label;
        }

        // Coverage level factor
        var coverageLevelFactor = 1.0;
        var coverageLevelLabel = '';
        var coverageLevelMap = {
            'basic': { factor: 0.8, label: 'Basic coverage' },
            'standard': { factor: 1.0, label: 'Standard coverage' },
            'premium': { factor: 1.4, label: 'Premium coverage' }
        };
        if (coverageLevelMap[coverage]) {
            coverageLevelFactor = coverageLevelMap[coverage].factor;
            coverageLevelLabel = coverageLevelMap[coverage].label;
        }

        var monthly = baseRate * ageFactor * smokerFactor * exerciseFactor * conditionsFactor * genderFactor * coverageLevelFactor;

        return {
            name: name,
            type: 'Life Insurance',
            monthly: monthly,
            annual: monthly * 12,
            breakdown: [
                { factor: 'Base Rate', value: formatCurrency(coverageAmount) + ' coverage × 0.05%/yr', impact: formatCurrency(baseRate) + '/month' },
                { factor: 'Age (' + age + ')', value: ageLabel, impact: formatMultiplier(ageFactor) },
                { factor: 'Smoker Status', value: smokerLabel, impact: formatMultiplier(smokerFactor) },
                { factor: 'Exercise Frequency', value: exerciseLabel, impact: formatMultiplier(exerciseFactor) },
                { factor: 'Pre-existing Conditions', value: hasConditions ? 'Yes' : 'No', impact: hasConditions ? '+50% surcharge (×1.50)' : 'No impact (×1.0)' },
                { factor: 'Gender', value: genderLabel, impact: formatMultiplier(genderFactor) },
                { factor: 'Coverage Level', value: coverageLevelLabel, impact: formatMultiplier(coverageLevelFactor) }
            ]
        };
    }

    // ============================================
    // Display Results
    // ============================================

    function displayResults(data) {
        // Populate summary - use textContent for user-provided values (XSS prevention)
        document.getElementById('result-name').textContent = data.name;
        document.getElementById('result-type').textContent = data.type;
        document.getElementById('result-monthly').textContent = formatCurrency(data.monthly);
        document.getElementById('result-annual').textContent = formatCurrency(data.annual);

        // Build breakdown table
        var tbody = document.getElementById('breakdown-body');
        tbody.innerHTML = '';

        data.breakdown.forEach(function (item) {
            var row = document.createElement('tr');

            var factorCell = document.createElement('td');
            factorCell.textContent = item.factor;
            row.appendChild(factorCell);

            var valueCell = document.createElement('td');
            valueCell.textContent = item.value;
            row.appendChild(valueCell);

            var impactCell = document.createElement('td');
            impactCell.textContent = item.impact;
            row.appendChild(impactCell);

            tbody.appendChild(row);
        });

        // Show results with fade-in animation, scroll to them
        resultsSection.classList.remove('hidden');
        // Re-trigger animation by removing and re-adding the class
        resultsSection.classList.remove('fade-in');
        void resultsSection.offsetWidth; // force reflow
        resultsSection.classList.add('fade-in');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // ============================================
    // Reset Form
    // ============================================

    function resetForm() {
        quoteForm.reset();
        clearAllErrors();

        // Hide all sections
        autoFields.classList.add('hidden');
        homeFields.classList.add('hidden');
        lifeFields.classList.add('hidden');
        submitSection.classList.add('hidden');
        resultsSection.classList.add('hidden');

        // Clear breakdown table
        document.getElementById('breakdown-body').innerHTML = '';

        // Reset last quote data
        lastQuoteData = null;

        // Bonus E: Reset progress indicator to step 1
        updateProgressIndicator(1);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ============================================
    // Bonus E: Progress Indicator
    // ============================================

    function updateProgressIndicator(currentStep) {
        for (var i = 1; i <= 3; i++) {
            var stepEl = document.getElementById('step-indicator-' + i);
            var lineEl = document.getElementById('progress-line-' + (i - 1));

            if (!stepEl) continue;

            stepEl.classList.remove('active', 'completed');

            if (i < currentStep) {
                stepEl.classList.add('completed');
            } else if (i === currentStep) {
                stepEl.classList.add('active');
            }

            // Update connecting lines
            if (lineEl) {
                if (i <= currentStep) {
                    lineEl.classList.add('active');
                } else {
                    lineEl.classList.remove('active');
                }
            }
        }
    }

    // ============================================
    // Bonus B: Save Quotes to localStorage
    // ============================================

    function getSavedQuotes() {
        try {
            return JSON.parse(localStorage.getItem('pinnacleShieldQuotes')) || [];
        } catch (e) {
            return [];
        }
    }

    function saveQuotesToStorage(quotes) {
        localStorage.setItem('pinnacleShieldQuotes', JSON.stringify(quotes));
    }

    function saveCurrentQuote() {
        if (!lastQuoteData) return;

        var quotes = getSavedQuotes();
        var quoteToSave = {
            id: Date.now(),
            name: lastQuoteData.name,
            type: lastQuoteData.type,
            monthly: lastQuoteData.monthly,
            annual: lastQuoteData.annual,
            breakdown: lastQuoteData.breakdown,
            savedAt: new Date().toLocaleString()
        };
        quotes.push(quoteToSave);
        saveQuotesToStorage(quotes);
        renderSavedQuotes();

        // Visual feedback
        if (saveQuoteBtn) {
            saveQuoteBtn.textContent = '✅ Saved!';
            saveQuoteBtn.disabled = true;
            setTimeout(function () {
                saveQuoteBtn.textContent = '💾 Save Quote';
                saveQuoteBtn.disabled = false;
            }, 2000);
        }
    }

    function deleteSavedQuote(quoteId) {
        var quotes = getSavedQuotes();
        quotes = quotes.filter(function (q) {
            return q.id !== quoteId;
        });
        saveQuotesToStorage(quotes);
        renderSavedQuotes();
    }

    function renderSavedQuotes() {
        var container = document.getElementById('saved-quotes-container');
        var noQuotesMsg = document.getElementById('no-saved-quotes');
        if (!container) return;

        var quotes = getSavedQuotes();

        // Clear existing cards (but not the "no quotes" message)
        var existingCards = container.querySelectorAll('.saved-quote-card-wrapper');
        existingCards.forEach(function (card) {
            card.remove();
        });

        if (quotes.length === 0) {
            if (noQuotesMsg) noQuotesMsg.classList.remove('hidden');
            return;
        }

        if (noQuotesMsg) noQuotesMsg.classList.add('hidden');

        quotes.forEach(function (quote) {
            var col = document.createElement('div');
            col.className = 'col-md-4 saved-quote-card-wrapper';

            var card = document.createElement('div');
            card.className = 'card saved-quote-card h-100';

            var badgeClass = 'bg-primary';
            if (quote.type === 'Home Insurance') badgeClass = 'bg-success';
            if (quote.type === 'Life Insurance') badgeClass = 'bg-danger';

            var cardBody = document.createElement('div');
            cardBody.className = 'card-body p-3';

            var badge = document.createElement('span');
            badge.className = 'badge ' + badgeClass + ' mb-2';
            badge.textContent = quote.type;
            cardBody.appendChild(badge);

            var nameEl = document.createElement('h6');
            nameEl.className = 'card-title';
            nameEl.textContent = quote.name;
            cardBody.appendChild(nameEl);

            var monthlyEl = document.createElement('p');
            monthlyEl.className = 'mb-1';
            var monthlyStrong = document.createElement('strong');
            monthlyStrong.textContent = formatCurrency(quote.monthly) + '/mo';
            monthlyEl.appendChild(monthlyStrong);
            cardBody.appendChild(monthlyEl);

            var annualEl = document.createElement('p');
            annualEl.className = 'text-muted small mb-2';
            annualEl.textContent = formatCurrency(quote.annual) + '/year';
            cardBody.appendChild(annualEl);

            var dateEl = document.createElement('p');
            dateEl.className = 'text-muted small mb-2';
            dateEl.textContent = 'Saved: ' + quote.savedAt;
            cardBody.appendChild(dateEl);

            var deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-outline-danger btn-sm';
            deleteBtn.textContent = '🗑️ Delete';
            deleteBtn.addEventListener('click', function () {
                deleteSavedQuote(quote.id);
            });
            cardBody.appendChild(deleteBtn);

            card.appendChild(cardBody);
            col.appendChild(card);
            container.appendChild(col);
        });
    }

    // Wire up save button
    if (saveQuoteBtn) {
        saveQuoteBtn.addEventListener('click', saveCurrentQuote);
    }

    // Load saved quotes on page load
    renderSavedQuotes();

    // ============================================
    // Bonus A: Side-by-Side Comparison
    // ============================================

    function addToComparison(quoteData) {
        if (comparisonQuotes.length >= 2) {
            comparisonQuotes = [comparisonQuotes[1]];
        }
        comparisonQuotes.push({
            name: quoteData.name,
            type: quoteData.type,
            monthly: quoteData.monthly,
            annual: quoteData.annual,
            breakdown: quoteData.breakdown
        });
        renderComparison();
    }

    function renderComparison() {
        if (!comparisonSection) return;

        comparisonSection.classList.remove('hidden');

        for (var i = 0; i < 2; i++) {
            var bodyEl = document.getElementById('compare-body-' + (i + 1));
            if (!bodyEl) continue;

            if (i < comparisonQuotes.length) {
                var q = comparisonQuotes[i];
                bodyEl.innerHTML = '';

                var nameP = document.createElement('p');
                nameP.className = 'fw-bold';
                nameP.textContent = q.name;
                bodyEl.appendChild(nameP);

                var typeP = document.createElement('p');
                typeP.className = 'text-muted';
                typeP.textContent = q.type;
                bodyEl.appendChild(typeP);

                var monthlyH = document.createElement('h4');
                monthlyH.className = (i === 0) ? 'text-primary' : 'text-success';
                monthlyH.textContent = formatCurrency(q.monthly) + '/mo';
                bodyEl.appendChild(monthlyH);

                var annualP = document.createElement('p');
                annualP.textContent = formatCurrency(q.annual) + '/year';
                bodyEl.appendChild(annualP);

                // Show mini breakdown
                var list = document.createElement('ul');
                list.className = 'list-unstyled small mt-2';
                q.breakdown.forEach(function (item) {
                    var li = document.createElement('li');
                    li.textContent = item.factor + ': ' + item.impact;
                    list.appendChild(li);
                });
                bodyEl.appendChild(list);
            } else {
                bodyEl.innerHTML = '<p class="text-muted text-center">Get another quote to compare</p>';
            }
        }

        // Highlight the cheaper quote if both exist
        if (comparisonQuotes.length === 2) {
            var cheaper = comparisonQuotes[0].monthly <= comparisonQuotes[1].monthly ? 0 : 1;
            var cheaperBody = document.getElementById('compare-body-' + (cheaper + 1));
            var savingsP = document.createElement('p');
            savingsP.className = 'compare-highlight text-center mt-2';
            var savings = Math.abs(comparisonQuotes[0].monthly - comparisonQuotes[1].monthly);
            savingsP.textContent = '✓ Lower by ' + formatCurrency(savings) + '/mo';
            cheaperBody.appendChild(savingsP);
        }

        comparisonSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Wire up compare button
    if (compareQuoteBtn) {
        compareQuoteBtn.addEventListener('click', function () {
            if (lastQuoteData) {
                addToComparison(lastQuoteData);
            }
        });
    }

    // Wire up clear comparison button
    if (clearComparisonBtn) {
        clearComparisonBtn.addEventListener('click', function () {
            comparisonQuotes = [];
            if (comparisonSection) comparisonSection.classList.add('hidden');
        });
    }

    // ============================================
    // Bonus C: Print Quote
    // ============================================

    if (printQuoteBtn) {
        printQuoteBtn.addEventListener('click', function () {
            window.print();
        });
    }

})();
