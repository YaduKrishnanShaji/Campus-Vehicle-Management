console.log('Register script loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    const registerForm = document.getElementById('registerForm');
    const errorDisplay = document.getElementById('errorDisplay');

    console.log('Form element:', registerForm);
    console.log('Error display element:', errorDisplay);

    if (!registerForm) {
        console.error('Register form not found!');
        return;
    }

    registerForm.addEventListener('submit', async (e) => {
        console.log('Form submission started');
        e.preventDefault();
        
        // Clear previous error messages
        errorDisplay.style.display = 'none';
        errorDisplay.textContent = '';

        // Get form data
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value,
            department: document.getElementById('department').value.trim(),
            phone_number: document.getElementById('phone_number').value.trim()
        };

        console.log('Form data collected:', { ...formData, password: '[REDACTED]' });

        // Basic validation
        if (!formData.name || !formData.email || !formData.password || !formData.department || !formData.phone_number) {
            console.log('Validation failed: Missing fields');
            showError('All fields are required');
            return;
        }

        if (formData.password.length < 6) {
            console.log('Validation failed: Password too short');
            showError('Password must be at least 6 characters long');
            return;
        }

        try {
            console.log('Sending registration request...');
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            console.log('Response received:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // Registration successful
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Show success message
            showSuccess('Registration successful! Redirecting...');
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);

        } catch (error) {
            console.error('Registration error:', error);
            showError(error.message || 'An error occurred during registration');
        }
    });

    function showError(message) {
        console.log('Showing error:', message);
        errorDisplay.textContent = message;
        errorDisplay.style.display = 'block';
        errorDisplay.style.color = '#dc2626';
    }

    function showSuccess(message) {
        console.log('Showing success:', message);
        errorDisplay.textContent = message;
        errorDisplay.style.display = 'block';
        errorDisplay.style.color = '#059669';
    }
}); 