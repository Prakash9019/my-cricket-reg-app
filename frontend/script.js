/**
 * script_new_id.js - Complete Frontend Logic for IDCS Cricket Registration
 * Enhanced with all features, validation, and UI management
 */

class PlayerRegistration {
    constructor() {
        this.form = document.getElementById('playerRegistrationForm');
        this.registrationForm = document.getElementById('registrationForm');
        this.successPage = document.getElementById('successPage');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.errorContainer = document.getElementById('errorContainer');
        this.submitBtn = document.getElementById('submitBtn');
        
        // API configuration
        this.apiBaseUrl = 'https://my-cricket-reg-app.vercel.app';
        
        // Registration data storage
        this.registrationData = null;
        
        // Initialize the application
        this.init();
    }

    /**
     * Initialize all functionality
     */
    init() {
        console.log('🚀 Initializing IDCS Registration System');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up real-time validation
        this.setupRealTimeValidation();
        
        // Set up password validation
        this.setupPasswordValidation();
        
        // Load saved draft if available
        this.loadSavedDraft();
        
        // Preview next Player ID
        this.previewNextPlayerId();
        
        // Setup auto-save
        this.setupAutoSave();
        
        console.log('✅ Registration system initialized successfully');
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Form reset
        window.resetForm = () => this.reset();
        window.downloadPlayerDetails = () => this.downloadPlayerDetails();
        
        // Real-time form validation
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.handleInputChange(input));
            input.addEventListener('focus', () => this.handleInputFocus(input));
        });

        // Enhanced keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    /**
     * Set up real-time validation for all fields
     */
    setupRealTimeValidation() {
        const requiredFields = this.form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            field.addEventListener('blur', () => {
                this.validateField(field);
            });
            
            field.addEventListener('input', () => {
                // Clear previous validation states on input
                if (field.classList.contains('invalid') && field.validity.valid) {
                    field.classList.remove('invalid');
                    field.classList.add('valid');
                }
            });
        });

        // Special validation for specific fields
        this.setupEmailValidation();
        this.setupPhoneValidation();
        this.setupUsernameValidation();
        this.setupDateValidation();
    }

    /**
     * Set up password validation with strength checking
     */
    setupPasswordValidation() {
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');

        const validatePasswords = () => {
            const pwd = password.value;
            const confirmPwd = confirmPassword.value;

            // Password strength validation
            if (pwd.length > 0) {
                if (pwd.length < 6) {
                    password.setCustomValidity('Password must be at least 6 characters long');
                    this.showFieldError(password, 'Password too short');
                } else {
                    password.setCustomValidity('');
                    this.clearFieldError(password);
                }
            }

            // Password confirmation validation
            // if (confirmPwd.length > 0) {
            //     if (pwd !== confirmPwd) {
            //         confirmPassword.setCustomValidity('Passwords do not match');
            //         this.showFieldError(confirmPassword, 'Passwords do not match');
            //     } else {
            //         confirmPassword.setCustomValidity('');
            //         this.clearFieldError(confirmPassword);
            //     }
            // }
        };

        password.addEventListener('input', validatePasswords);
        confirmPassword.addEventListener('input', validatePasswords);
    }

    /**
     * Set up email validation
     */
    setupEmailValidation() {
        const emailInput = document.getElementById('email');
        
        emailInput.addEventListener('blur', () => {
            const email = emailInput.value.trim();
            if (email && !this.isValidEmail(email)) {
                this.showFieldError(emailInput, 'Please enter a valid email address');
            } else {
                this.clearFieldError(emailInput);
            }
        });
    }

    /**
     * Set up phone validation
     */
    setupPhoneValidation() {
        const phoneInput = document.getElementById('phone');
        
        phoneInput.addEventListener('blur', () => {
            const phone = phoneInput.value.trim();
            if (phone && !this.isValidPhone(phone)) {
                this.showFieldError(phoneInput, 'Please enter a valid phone number (10-15 digits)');
            } else {
                this.clearFieldError(phoneInput);
            }
        });
    }

    /**
     * Set up username validation
     */
    setupUsernameValidation() {
        const usernameInput = document.getElementById('username');
        
        usernameInput.addEventListener('blur', () => {
            const username = usernameInput.value.trim();
            if (username && !this.isValidUsername(username)) {
                this.showFieldError(usernameInput, 'Username can only contain letters, numbers, and underscores (3-30 characters)');
            } else {
                this.clearFieldError(usernameInput);
            }
        });
    }

    /**
     * Set up date of birth validation
     */
    setupDateValidation() {
        const dobInput = document.getElementById('dateOfBirth');
        
        dobInput.addEventListener('change', () => {
            const dob = new Date(dobInput.value);
            const age = this.calculateAge(dob);
            
            if (age < 10 || age > 65) {
                this.showFieldError(dobInput, 'Age must be between 10 and 65 years');
            } else {
                this.clearFieldError(dobInput);
            }
        });
    }

    /**
     * Validate individual field
     */
    validateField(field) {
        if (field.validity.valid && field.value.trim()) {
            field.classList.remove('invalid');
            field.classList.add('valid');
            this.clearFieldError(field);
        } else if (field.value.trim() && !field.validity.valid) {
            field.classList.remove('valid');
            field.classList.add('invalid');
        }
    }

    /**
     * Handle input changes for real-time feedback
     */
    handleInputChange(input) {
        // Auto-save on input change
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        this.autoSaveTimer = setTimeout(() => this.saveFormDraft(), 2000);

        // Clear validation errors on input
        if (input.classList.contains('invalid')) {
            this.clearFieldError(input);
        }
    }

    /**
     * Handle input focus for better UX
     */
    handleInputFocus(input) {
        // Add focus styling
        input.parentElement.style.transform = 'translateY(-2px)';
        input.parentElement.style.transition = 'transform 0.2s ease';
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Ctrl+Enter or Cmd+Enter to submit form
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (this.form.style.display !== 'none') {
                this.handleSubmit(e);
            }
        }
    }

    /**
     * Preview next Player ID
     */
    async previewNextPlayerId() {
        try {
            console.log('🔮 Fetching next Player ID preview...');
            
            const response = await fetch(`${this.apiBaseUrl}/api/sequence`);
            const data = await response.json();
            
            if (data.success && data.nextPlayerId) {
                console.log('📋 Next Player ID:', data.nextPlayerId);
                this.displayNextPlayerIdPreview(data.nextPlayerId);
            }
        } catch (error) {
            console.warn('⚠️ Could not fetch next Player ID preview:', error.message);
        }
    }

    /**
     * Display next Player ID preview
     */
    displayNextPlayerIdPreview(nextId) {
        const submitContainer = document.querySelector('.submit-container');
        if (submitContainer) {
            // Remove existing preview
            const existingPreview = submitContainer.querySelector('.next-id-preview');
            if (existingPreview) {
                existingPreview.remove();
            }

            // Add new preview
            const previewDiv = document.createElement('div');
            previewDiv.className = 'next-id-preview';
            previewDiv.innerHTML = `
                <div class="preview-content">
                    <span class="preview-label">Your Player ID will be:</span>
                    <strong class="preview-id">${nextId}</strong>
                    <small class="preview-note">Sequential ID generated in real-time</small>
                </div>
            `;
            
            submitContainer.appendChild(previewDiv);
            
            // Animate the preview
            setTimeout(() => {
                previewDiv.style.opacity = '1';
                previewDiv.style.transform = 'translateY(0)';
            }, 100);
        }
    }

    /**
     * Handle form submission
     */
    async handleSubmit(event) {
        event.preventDefault();
        
        console.log('📝 Form submission initiated');
        
        // Validate form before submission
        if (!this.validateForm()) {
            return;
        }

        // Show loading state
        this.showLoading();

        try {
            // Collect form data
            const formData = this.collectFormData();
            
            // Add client-side metadata
            formData.clientTimestamp = Date.now();
            formData.clientRandom = this.generateRandomString(12);
            
            console.log('🚀 Submitting registration data...');
            
            // Submit to API
            const result = await this.submitRegistration(formData);
            
            // Show success page
            this.showSuccess(result, formData);
            
            // Clear saved draft
            this.clearFormDraft();
            
            console.log('✅ Registration completed successfully');
            
        } catch (error) {
            console.error('❌ Registration error:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Comprehensive form validation
     */
    validateForm() {
        console.log('🔍 Validating form...');
        
        const errors = [];
        
        // Get form values
        const formData = this.collectFormData();
        
        // Required field validation
        const requiredFields = {
            firstName: 'First name',
            lastName: 'Last name',
            dateOfBirth: 'Date of birth',
            gender: 'Gender',
            email: 'Email address',
            phone: 'Phone number',
            streetAddress: 'Street address',
            city: 'City',
            state: 'State',
            postalCode: 'Postal code',
            role: 'Playing role',
            battingOrderPreference: 'Batting order preference',
            battingStyle: 'Batting style',
            username: 'Username',
            password: 'Password'
        };

        // Check for missing required fields
        Object.keys(requiredFields).forEach(field => {
            if (!formData[field] || String(formData[field]).trim() === '') {
                errors.push(`${requiredFields[field]} is required`);
            }
        });

        // Specific validations
        if (formData.password && formData.password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }

        // if (formData.password !== formData.confirmPassword) {
        //     errors.push('Passwords do not match');
        // }

        if (formData.email && !this.isValidEmail(formData.email)) {
            errors.push('Please enter a valid email address');
        }

        if (formData.phone && !this.isValidPhone(formData.phone)) {
            errors.push('Please enter a valid phone number');
        }

        if (formData.username && !this.isValidUsername(formData.username)) {
            errors.push('Username must be 3-30 characters and contain only letters, numbers, and underscores');
        }

        if (formData.postalCode && !/^[0-9]{6}$/.test(formData.postalCode)) {
            errors.push('Postal code must be 6 digits');
        }

        // Age validation
        if (formData.dateOfBirth) {
            const age = this.calculateAge(new Date(formData.dateOfBirth));
            if (age < 10 || age > 65) {
                errors.push('Age must be between 10 and 65 years');
            }
        }

        // Terms agreement
        const agreeToTerms = document.getElementById('agreeToTerms').checked;
        if (!agreeToTerms) {
            errors.push('Please agree to the Terms & Conditions');
        }

        // Show errors if any
        if (errors.length > 0) {
            console.warn('⚠️ Form validation errors:', errors);
            this.showError(errors.join('\n'));
            return false;
        }

        console.log('✅ Form validation passed');
        return true;
    }

    /**
     * Collect form data into object
     */
    collectFormData() {
        const formData = new FormData(this.form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            if (key !== 'confirmPassword' && key !== 'agreeToTerms') {
                data[key] = value;
            }
        }

        return data;
    }

    /**
     * Submit registration data to API
     */
    async submitRegistration(data) {
        try {
            console.log('📡 Making API call to:', `${this.apiBaseUrl}/api/players/register`);
            
            const response = await fetch(`${this.apiBaseUrl}/api/players/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            console.log('📡 Response status:', response.status);
            
            const responseData = await response.json();
            console.log('📋 Response data:', responseData);

            if (!response.ok) {
                // Display backend warnings if present
                if (responseData.warning) {
                    this.displayBackendWarning(responseData.warning);
                }
                throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
            }

            return responseData;
        } catch (error) {
            console.error('❌ API call failed:', error);
            throw error;
        }
    }

    /**
     * Display backend warnings in the UI
     */
    displayBackendWarning(warning) {
        console.warn('⚠️ Backend warning:', warning);
        
        const warningDiv = document.createElement('div');
        warningDiv.className = 'backend-warning';
        warningDiv.innerHTML = `
            <div class="warning-content">
                <span class="warning-icon">⚠️</span>
                <span class="warning-text">${warning}</span>
                <button class="warning-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(warningDiv, container.firstChild);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (warningDiv.parentElement) {
                    warningDiv.remove();
                }
            }, 10000);
        }
    }

    /**
     * Show loading state with progress steps
     */
    showLoading() {
        this.loadingOverlay.style.display = 'flex';
        this.submitBtn.disabled = true;
        this.submitBtn.innerHTML = `
            <div class="btn-loading">
                <div class="spinner-small"></div>
                <span>Processing Registration...</span>
            </div>
        `;
        
        // Simulate loading steps
        this.simulateLoadingSteps();
    }

    /**
     * Simulate loading steps for better UX
     */
    simulateLoadingSteps() {
        const steps = ['step1', 'step2', 'step3', 'step4'];
        let currentStep = 0;
        
        const updateStep = () => {
            if (currentStep < steps.length) {
                const stepElement = document.getElementById(steps[currentStep]);
                if (stepElement) {
                    stepElement.classList.add('active');
                    if (currentStep > 0) {
                        const prevStep = document.getElementById(steps[currentStep - 1]);
                        if (prevStep) {
                            prevStep.classList.add('completed');
                            prevStep.classList.remove('active');
                        }
                    }
                }
                currentStep++;
                
                if (currentStep < steps.length) {
                    setTimeout(updateStep, 800);
                }
            }
        };
        
        updateStep();
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        this.loadingOverlay.style.display = 'none';
        this.submitBtn.disabled = false;
        this.submitBtn.innerHTML = `
            <span class="btn-icon">🏏</span>
            <span class="btn-text">Complete Registration</span>
        `;
        
        // Reset loading steps
        const steps = document.querySelectorAll('.step');
        steps.forEach(step => {
            step.classList.remove('active', 'completed');
        });
    }

    /**
     * Show success page with registration details
     */
    showSuccess(data, formData) {
        console.log('🎉 Showing success page');
        
        // Hide registration form
        document.getElementById('registrationForm').style.display = 'none';
        
        // Show success page
        this.successPage.style.display = 'block';

        // Populate success page data
        const playerId = data.playerId || this.generateFallbackPlayerId();
        const userId = data.userId || this.generateFallbackUserId(formData);
        const sequenceNumber = data.sequenceNumber || 1;
        
        const registrationDate = data.registrationDate ? 
            new Date(data.registrationDate).toLocaleDateString('en-GB') : 
            new Date().toLocaleDateString('en-GB');

        // Update success page elements
        this.updateSuccessPageElement('playerName', this.getFullName(formData));
        this.updateSuccessPageElement('playerId', playerId);
        this.updateSuccessPageElement('registrationDate', registrationDate);
        this.updateSuccessPageElement('playerEmail', formData.email);
        this.updateSuccessPageElement('userId', userId);
        this.updateSuccessPageElement('sequenceNumber', String(sequenceNumber).padStart(2, '0'));
        this.updateSuccessPageElement('sequenceInBreakdown', String(sequenceNumber).padStart(2, '0'));
        this.updateSuccessPageElement('sequenceText', this.getOrdinalNumber(sequenceNumber));

        // Store registration data for download
        this.registrationData = {
            playerId,
            userId,
            sequenceNumber,
            fullName: this.getFullName(formData),
            email: formData.email,
            phone: formData.phone,
            city: formData.city,
            state: formData.state,
            role: formData.role,
            registrationDate,
            ...data
        };

        // Add celebration effects
        this.addCelebrationEffects();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Animate success page
        this.successPage.style.animation = 'fadeInUp 0.8s ease-out';
        
        console.log('✅ Success page displayed successfully');
    }

    /**
     * Update success page element safely
     */
    updateSuccessPageElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            if (element.tagName === 'INPUT') {
                element.value = value;
            } else {
                element.textContent = value;
            }
        }
    }

    /**
     * Add celebration effects to success page
     */
    addCelebrationEffects() {
        // Player ID glow animation
        const playerIdElement = document.getElementById('playerId');
        if (playerIdElement) {
            playerIdElement.style.animation = 'glow 2s ease-in-out infinite alternate';
        }

        // Confetti effect (simple implementation)
        this.createConfetti();
    }

    /**
     * Create simple confetti effect
     */
    createConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 3 + 's';
                
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    if (confetti.parentElement) {
                        confetti.remove();
                    }
                }, 4000);
            }, Math.random() * 1000);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('❌ Showing error:', message);
        
        // Remove existing errors
        const existingErrors = document.querySelectorAll('.error-message');
        existingErrors.forEach(error => error.remove());

        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div class="error-content">
                <div class="error-icon">⚠️</div>
                <div class="error-text">
                    <strong>Registration Error</strong>
                    <p>${message}</p>
                </div>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 10000);

        // Scroll error into view
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /**
     * Show field-specific error
     */
    showFieldError(field, message) {
        this.clearFieldError(field);
        
        const errorSpan = document.createElement('span');
        errorSpan.className = 'field-error';
        errorSpan.textContent = message;
        
        field.parentElement.appendChild(errorSpan);
        field.classList.add('invalid');
    }

    /**
     * Clear field-specific error
     */
    clearFieldError(field) {
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        field.classList.remove('invalid');
    }

    /**
     * Reset form to initial state
     */
    reset() {
        console.log('🔄 Resetting form');
        
        // Reset form
        this.form.reset();
        
        // Show registration form
        document.getElementById('registrationForm').style.display = 'block';
        this.successPage.style.display = 'none';
        
        // Clear validation states
        const fields = this.form.querySelectorAll('input, select');
        fields.forEach(field => {
            field.classList.remove('valid', 'invalid');
            this.clearFieldError(field);
        });

        // Clear registration data
        this.registrationData = null;

        // Clear saved draft
        this.clearFormDraft();

        // Refresh Player ID preview
        this.previewNextPlayerId();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log('✅ Form reset completed');
    }

    /**
     * Download player registration details
     */
    downloadPlayerDetails() {
        if (!this.registrationData) {
            this.showError('No registration data available for download');
            return;
        }

        console.log('📥 Generating player details download');

        const data = this.registrationData;
        const downloadDate = new Date().toLocaleString('en-IN');
        
        const content = `
IDCS Cricket Player Registration Details
======================================

Player Information:
- Full Name: ${data.fullName}
- Player ID: ${data.playerId}
- User ID: ${data.userId}
- Sequence Number: ${data.sequenceNumber}
- Email: ${data.email}
- Phone: ${data.phone}
- Location: ${data.city}, ${data.state}
- Role: ${data.role}
- Registration Date: ${data.registrationDate}

ID Format Explanation:
- Player ID Format: idsc + sequence number + ddmmyyyy
- Your Player ID "${data.playerId}" breakdown:
  * idsc = IDCS Cricket prefix
  * ${String(data.sequenceNumber).padStart(2, '0')} = You are player number ${data.sequenceNumber}
  * ${data.playerId ? data.playerId.slice(-8) : 'DDMMYYYY'} = Registration date

Important Notes:
- Your Player ID (${data.playerId}) is your public identification for tournaments and events
- Your User ID (${data.userId}) is used internally for secure data management
- Both IDs are unique and permanently linked to your account
- Your sequence number (${data.sequenceNumber}) shows your registration order for the day
- Keep this information safe for future reference

Contact Information:
- IDCS Website: https://idcs-cricket.com
- Support Email: support@idcs-cricket.com
- Phone: +91-XXX-XXX-XXXX

Terms & Conditions:
- This registration is subject to IDCS Terms & Conditions
- All information provided must be accurate and verifiable
- IDCS reserves the right to verify player information
- Player ID cannot be changed once assigned

Next Steps:
1. Your profile will be reviewed by our registration committee
2. You'll receive tournament and training program information via email
3. Complete your profile setup by logging into the IDCS portal
4. Begin your journey with IDCS development programs

Generated on: ${downloadDate}
System: IDCS Cricket Registration v2.0

======================================
IDCS - Indian Domestic Champion Sports
Building Champions, Creating Legends
======================================
        `;

        // Create and download file
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `IDCS_Player_${data.playerId}_Details.txt`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Player details download completed');
    }

    /**
     * Auto-save functionality
     */
    setupAutoSave() {
        // Save form data every 30 seconds
        setInterval(() => {
            if (this.form.style.display !== 'none' && this.hasFormData()) {
                this.saveFormDraft();
            }
        }, 30000);
    }

    /**
     * Check if form has data
     */
    hasFormData() {
        const inputs = this.form.querySelectorAll('input, select');
        return Array.from(inputs).some(input => input.value.trim() !== '' && input.type !== 'password');
    }

    /**
     * Save form draft to localStorage
     */
    saveFormDraft() {
        try {
            const formData = this.collectFormData();
            
            // Remove sensitive data
            delete formData.password;
            delete formData.confirmPassword;
            
            localStorage.setItem('idcs_registration_draft', JSON.stringify({
                data: formData,
                timestamp: Date.now()
            }));
            
            console.log('💾 Form draft saved');
        } catch (error) {
            console.warn('⚠️ Could not save form draft:', error.message);
        }
    }

    /**
     * Load saved form draft
     */
    loadSavedDraft() {
        try {
            const savedDraft = localStorage.getItem('idcs_registration_draft');
            if (savedDraft) {
                const { data, timestamp } = JSON.parse(savedDraft);
                
                // Only load if less than 24 hours old
                const age = Date.now() - timestamp;
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                
                if (age < maxAge) {
                    Object.keys(data).forEach(key => {
                        const field = document.getElementById(key);
                        if (field && field.type !== 'password') {
                            field.value = data[key];
                        }
                    });
                    
                    console.log('📋 Loaded saved draft data');
                    
                    // Show notification
                    this.showDraftLoadedNotification();
                } else {
                    // Remove old draft
                    this.clearFormDraft();
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not load saved draft:', error.message);
            this.clearFormDraft();
        }
    }

    /**
     * Clear saved form draft
     */
    clearFormDraft() {
        localStorage.removeItem('idcs_registration_draft');
    }

    /**
     * Show draft loaded notification
     */
    showDraftLoadedNotification() {
        const notification = document.createElement('div');
        notification.className = 'draft-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">💾</span>
                <span class="notification-text">Previous form data restored</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Utility Methods

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    /**
     * Validate phone format
     */
    isValidPhone(phone) {
        const regex = /^[+]?[0-9\s\-\(\)]{10,15}$/;
        return regex.test(phone);
    }

    /**
     * Validate username format
     */
    isValidUsername(username) {
        const regex = /^[a-zA-Z0-9_]{3,30}$/;
        return regex.test(username);
    }

    /**
     * Calculate age from date of birth
     */
    calculateAge(dob) {
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    /**
     * Get full name from form data
     */
    getFullName(formData) {
        let fullName = formData.firstName;
        if (formData.middleName) {
            fullName += ` ${formData.middleName}`;
        }
        fullName += ` ${formData.lastName}`;
        return fullName;
    }

    /**
     * Get ordinal number (1st, 2nd, 3rd, etc.)
     */
    getOrdinalNumber(num) {
        const suffix = ['th', 'st', 'nd', 'rd'];
        const value = num % 100;
        return num + (suffix[(value - 20) % 10] || suffix[value] || suffix[0]);
    }

    /**
     * Generate random string
     */
    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Generate fallback Player ID (client-side only)
     */
    generateFallbackPlayerId() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const dateStr = `${day}${month}${year}`;
        
        const randomSeq = Math.floor(Math.random() * 99) + 1;
        const seqStr = String(randomSeq).padStart(2, '0');
        
        return `idsc${seqStr}${dateStr}`;
    }

    /**
     * Generate fallback User ID (client-side only)
     */
    generateFallbackUserId(userData) {
        const timestamp = Date.now();
        const nameHash = this.simpleHash(userData.firstName + userData.lastName);
        const emailHash = this.simpleHash(userData.email);
        const random = this.generateRandomString(6);
        
        return `USER_${timestamp}_${nameHash}_${emailHash}_${random}`.toUpperCase();
    }

    /**
     * Simple hash function
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36).substring(0, 6);
    }
}

// Global functions for HTML onclick handlers
function resetForm() {
    if (window.playerRegistration) {
        window.playerRegistration.reset();
    }
}

function downloadPlayerDetails() {
    if (window.playerRegistration) {
        window.playerRegistration.downloadPlayerDetails();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏏 IDCS Registration System Loading...');
    
    // Initialize main registration class
    window.playerRegistration = new PlayerRegistration();

    // Enhanced form animations
    const formCards = document.querySelectorAll('.form-card');
    formCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in-up');
    });

    // Enhanced input interactions
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
            this.parentElement.style.transition = 'transform 0.2s ease';
        });

        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
        });
    });

    // Enhanced card hover effects
    const cards = document.querySelectorAll('.form-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
            this.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });
    });

    console.log('✅ IDCS Registration System Loaded Successfully');
});

// Handle page visibility for auto-save
document.addEventListener('visibilitychange', function() {
    if (document.hidden && window.playerRegistration) {
        // Save draft when page becomes hidden
        window.playerRegistration.saveFormDraft();
    }
});

// Handle page unload
window.addEventListener('beforeunload', function(e) {
    if (window.playerRegistration) {
        const successPage = document.getElementById('successPage');
        if (successPage && successPage.style.display !== 'none') {
            // Clear draft if registration was successful
            window.playerRegistration.clearFormDraft();
        } else if (window.playerRegistration.hasFormData()) {
            // Save draft if form has data
            window.playerRegistration.saveFormDraft();
            
            // Show confirmation dialog for unsaved changes
            const message = 'You have unsaved changes. Are you sure you want to leave?';
            e.returnValue = message;
            return message;
        }
    }
});

// Add CSS for animations and effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    /* Enhanced Animations and Effects */
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes glow {
        from {
            box-shadow: 0 0 20px rgba(37, 99, 235, 0.3);
        }
        to {
            box-shadow: 0 0 30px rgba(37, 99, 235, 0.6);
        }
    }
    
    @keyframes confettiFall {
        0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
    
    .fade-in-up {
        animation: fadeInUp 0.6s ease-out;
        animation-fill-mode: both;
    }
    
    .confetti {
        position: fixed;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        animation: confettiFall 4s linear;
        z-index: 10000;
        pointer-events: none;
    }
    
    .next-id-preview {
        background: linear-gradient(135deg, #eff6ff, #dbeafe);
        border: 1px solid #3b82f6;
        border-radius: 0.75rem;
        padding: 1rem;
        margin-top: 1rem;
        text-align: center;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
    }
    
    .preview-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .preview-label {
        font-size: 0.875rem;
        color: #6b7280;
    }
    
    .preview-id {
        font-family: 'Courier New', monospace;
        font-size: 1.125rem;
        color: #2563eb;
        letter-spacing: 1px;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        display: inline-block;
    }
    
    .preview-note {
        font-size: 0.75rem;
        color: #9ca3af;
    }
    
    .backend-warning {
        background: #fef3c7;
        border: 2px solid #f59e0b;
        border-radius: 0.75rem;
        padding: 1rem;
        margin: 1rem 0;
        animation: slideInDown 0.3s ease-out;
    }
    
    .warning-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .warning-icon {
        font-size: 1.5rem;
        color: #d97706;
    }
    
    .warning-text {
        flex: 1;
        color: #92400e;
        font-weight: 500;
    }
    
    .warning-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #6b7280;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 0.25rem;
        transition: background-color 0.2s;
    }
    
    .warning-close:hover {
        background: rgba(0, 0, 0, 0.1);
    }
    
    .error-message {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 2px solid #ef4444;
        border-radius: 0.75rem;
        padding: 1.5rem;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    }
    
    .error-content {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
    }
    
    .error-icon {
        font-size: 1.5rem;
        color: #ef4444;
        flex-shrink: 0;
    }
    
    .error-text {
        flex: 1;
    }
    
    .error-text strong {
        color: #dc2626;
        font-size: 1.125rem;
        display: block;
        margin-bottom: 0.5rem;
    }
    
    .error-text p {
        color: #6b7280;
        margin: 0;
        line-height: 1.5;
        white-space: pre-line;
    }
    
    .error-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        color: #9ca3af;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 0.25rem;
        transition: all 0.2s;
        flex-shrink: 0;
    }
    
    .error-close:hover {
        background: #f3f4f6;
}

`