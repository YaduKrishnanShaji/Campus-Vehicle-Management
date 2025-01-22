document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorDisplay = document.getElementById('errorDisplay');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous error messages
        errorDisplay.textContent = '';
        errorDisplay.style.display = 'none';

        // Get form data
        const formData = {
            email: loginForm.email.value.trim(),
            password: loginForm.password.value,
            remember: loginForm.remember.checked
        };

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // If remember me is checked, store credentials
            if (formData.remember) {
                localStorage.setItem('rememberedEmail', formData.email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            // Show success message
            errorDisplay.textContent = 'Login successful! Redirecting...';
            errorDisplay.style.color = '#10B981';
            errorDisplay.style.display = 'block';

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);

        } catch (error) {
            // Display error message
            errorDisplay.textContent = error.message || 'An error occurred during login';
            errorDisplay.style.color = '#EF4444';
            errorDisplay.style.display = 'block';
        }
    });

    // Check for remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        loginForm.email.value = rememberedEmail;
        loginForm.remember.checked = true;
    }
}); 