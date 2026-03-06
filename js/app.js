// Main Vue Application
const { createApp, ref, watch } = Vue;

const app = createApp({
    setup() {
        // ===== AUTH STATE =====
        const isAuthenticated = ref(false);
        const currentUser = ref({});
        const authMode = ref('login');
        
        // Login form
        const loginForm = ref({
            username: '',
            password: '',
            remember: false
        });
        
        // Register form
        const registerForm = ref({
            fullName: '',
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            agreeTerms: false
        });
        
        // UI states
        const isLoggingIn = ref(false);
        const isRegistering = ref(false);
        const loginError = ref('');
        const registerError = ref('');
        const registerSuccess = ref('');
        
        // Store registered users
        const users = ref([
            {
                fullName: 'Demo Farmer',
                username: 'farmer',
                email: 'farmer@agripulse.demo',
                password: 'agripulse2026'
            }
        ]);

        // ===== DASHBOARD STATE =====
        const selectedCrop = ref('');
        const csvRows = ref([]);
        const currentSoil = ref(null);
        const result = ref(null);
        
        // ===== COMPUTED =====
        const passwordStrength = ref(0);
        
        // Watch password for strength
        watch(() => registerForm.value.password, (newVal) => {
            if (!newVal) {
                passwordStrength.value = 0;
                return;
            }
            
            let strength = 0;
            if (newVal.length >= 6) strength += 25;
            if (newVal.length >= 8) strength += 15;
            if (/[A-Z]/.test(newVal)) strength += 15;
            if (/[0-9]/.test(newVal)) strength += 15;
            if (/[^A-Za-z0-9]/.test(newVal)) strength += 15;
            if (/[a-z]/.test(newVal) && /[A-Z]/.test(newVal)) strength += 15;
            
            passwordStrength.value = Math.min(100, strength);
        });

        // Health color class
        const healthColorClass = ref('');
        
        watch(() => result.value, (newVal) => {
            if (!newVal) {
                healthColorClass.value = '';
                return;
            }
            const health = newVal.health_metrics.overall_health;
            if (health === 'Optimal') healthColorClass.value = 'green';
            else if (health === 'Deficient') healthColorClass.value = 'yellow';
            else healthColorClass.value = 'red';
        });

        // ===== AUTH METHODS =====
        const switchMode = (mode) => {
            authMode.value = mode;
            loginError.value = '';
            registerError.value = '';
            registerSuccess.value = '';
        };
        
        const handleLogin = () => {
            isLoggingIn.value = true;
            loginError.value = '';
            
            setTimeout(() => {
                const user = users.value.find(
                    u => u.username === loginForm.value.username && 
                         u.password === loginForm.value.password
                );
                
                if (user) {
                    currentUser.value = user;
                    isAuthenticated.value = true;
                    
                    if (loginForm.value.remember) {
                        sessionStorage.setItem('agripulse_user', JSON.stringify(user));
                    }
                    
                    // Reset login form
                    loginForm.value = { username: '', password: '', remember: false };
                } else {
                    loginError.value = 'Invalid username or password. Try: farmer / agripulse2026';
                }
                
                isLoggingIn.value = false;
            }, 800);
        };
        
        const handleRegister = () => {
            isRegistering.value = true;
            registerError.value = '';
            registerSuccess.value = '';
            
            setTimeout(() => {
                // Validation
                if (registerForm.value.password.length < 6) {
                    registerError.value = 'Password must be at least 6 characters';
                    isRegistering.value = false;
                    return;
                }
                
                if (registerForm.value.password !== registerForm.value.confirmPassword) {
                    registerError.value = 'Passwords do not match';
                    isRegistering.value = false;
                    return;
                }
                
                if (!registerForm.value.agreeTerms) {
                    registerError.value = 'You must agree to the Terms & Conditions';
                    isRegistering.value = false;
                    return;
                }
                
                // Check if username exists
                if (users.value.some(u => u.username === registerForm.value.username)) {
                    registerError.value = 'Username already taken';
                    isRegistering.value = false;
                    return;
                }
                
                // Check if email exists
                if (users.value.some(u => u.email === registerForm.value.email)) {
                    registerError.value = 'Email already registered';
                    isRegistering.value = false;
                    return;
                }
                
                // Create new user
                const newUser = {
                    fullName: registerForm.value.fullName,
                    username: registerForm.value.username,
                    email: registerForm.value.email,
                    password: registerForm.value.password
                };
                
                users.value.push(newUser);
                registerSuccess.value = 'Registration successful! You can now login.';
                
                // Clear form
                registerForm.value = {
                    fullName: '',
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    agreeTerms: false
                };
                
                // Switch to login after 2 seconds
                setTimeout(() => {
                    authMode.value = 'login';
                    registerSuccess.value = '';
                }, 2000);
                
                isRegistering.value = false;
            }, 800);
        };
        
        const logout = () => {
            isAuthenticated.value = false;
            currentUser.value = {};
            sessionStorage.removeItem('agripulse_user');
            
            // Reset dashboard state
            selectedCrop.value = '';
            csvRows.value = [];
            currentSoil.value = null;
            result.value = null;
        };
        
        const showForgotPassword = () => {
            alert('🔐 Password Recovery\n\nDemo credentials: farmer / agripulse2026');
        };
        
        const showTerms = () => {
            alert('📋 Terms & Conditions\n\nDemo application for Hackarena 2026');
        };

        // ===== DASHBOARD METHODS =====
        const loadSampleSoil = (id) => {
            if (id === 'SOIL_001') {
                currentSoil.value = { 
                    soil_id: 'SOIL_001', 
                    nitrogen: 25, 
                    phosphorus: 20, 
                    potassium: 180, 
                    ph_level: 6.5 
                };
            } else {
                currentSoil.value = { 
                    soil_id: 'SOIL_002', 
                    nitrogen: 12, 
                    phosphorus: 18, 
                    potassium: 160, 
                    ph_level: 6.2 
                };
            }
            if (selectedCrop.value) runEvaluation();
        };

        const handleFileUpload = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const rows = window.CsvParser.parse(e.target.result);
                    csvRows.value = rows;
                    if (rows.length) {
                        currentSoil.value = rows[0];
                    }
                    if (selectedCrop.value) runEvaluation();
                } catch (err) {
                    alert('CSV Error: ' + err.message);
                }
            };
            reader.readAsText(file);
        };

        const runEvaluation = () => {
            if (!selectedCrop.value || !currentSoil.value) return;
            
            const logicRes = window.LogicEngine.evaluate(currentSoil.value, selectedCrop.value);
            if (!logicRes) return;
            
            const aiText = window.AiExplanation.generate(currentSoil.value, selectedCrop.value, logicRes);
            
            result.value = {
                soil_id: currentSoil.value.soil_id,
                target_crop: selectedCrop.value,
                health_metrics: logicRes.health_metrics,
                recommendation: logicRes.recommendation,
                ai_explanation: aiText
            };
        };

        const healthClass = (health) => {
            if (health === 'Optimal') return 'optimal';
            if (health === 'Deficient') return 'deficient';
            return 'critical';
        };

        // Watch for changes
        watch([selectedCrop, currentSoil], () => {
            if (selectedCrop.value && currentSoil.value) runEvaluation();
        });

        // Check for saved session
        const savedUser = sessionStorage.getItem('agripulse_user');
        if (savedUser) {
            try {
                currentUser.value = JSON.parse(savedUser);
                isAuthenticated.value = true;
            } catch (e) {
                // Ignore parse error
            }
        }

        return {
            // Auth
            isAuthenticated,
            currentUser,
            authMode,
            loginForm,
            registerForm,
            isLoggingIn,
            isRegistering,
            loginError,
            registerError,
            registerSuccess,
            passwordStrength,
            switchMode,
            handleLogin,
            handleRegister,
            logout,
            showForgotPassword,
            showTerms,
            
            // Dashboard
            selectedCrop,
            currentSoil,
            result,
            healthColorClass,
            loadSampleSoil,
            handleFileUpload,
            healthClass
        };
    }
});

app.mount('#app');

// Initialize Vanilla Tilt
document.addEventListener('DOMContentLoaded', () => {
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(document.querySelector('[data-tilt]'), {
            max: 3,
            speed: 400,
            glare: true,
            'max-glare': 0.2,
            scale: 1.02
        });
    }
});