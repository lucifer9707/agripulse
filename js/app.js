// js/app.js
const { createApp, ref, computed, watch } = Vue;

const app = createApp({
    setup() {
        // Authentication state
        const isAuthenticated = ref(false);
        const currentUser = ref({});
        const isLoggingIn = ref(false);
        const isRegistering = ref(false);
        const loginError = ref('');
        const registerError = ref('');
        const registerSuccess = ref('');
        
        // Auth mode: 'login' or 'register'
        const authMode = ref('login');
        
        const loginForm = ref({
            username: '',
            password: '',
            remember: false
        });

        const registerForm = ref({
            fullName: '',
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            agreeTerms: false
        });

        // Store registered users (in memory for demo)
        const users = ref([]);

        // Main app state
        const selectedCrop = ref('');
        const csvRows = ref([]);
        const currentSoil = ref(null);
        const result = ref(null);

        // Login handler
        const handleLogin = () => {
            isLoggingIn.value = true;
            loginError.value = '';
            
            // Simulate API call with setTimeout
            setTimeout(() => {
                // Check against registered users OR demo credentials
                const user = users.value.find(u => u.username === loginForm.value.username);
                
                if (user && user.password === loginForm.value.password) {
                    // Registered user found
                    isAuthenticated.value = true;
                    currentUser.value = user;
                    
                    if (loginForm.value.remember) {
                        sessionStorage.setItem('agripulse_auth', 'true');
                        sessionStorage.setItem('agripulse_user', JSON.stringify(user));
                    }
                } 
                // Demo credentials
                else if (loginForm.value.username === 'farmer' && loginForm.value.password === 'agripulse2026') {
                    const demoUser = {
                        fullName: 'Demo Farmer',
                        username: 'farmer',
                        email: 'farmer@agripulse.demo'
                    };
                    isAuthenticated.value = true;
                    currentUser.value = demoUser;
                    
                    if (loginForm.value.remember) {
                        sessionStorage.setItem('agripulse_auth', 'true');
                        sessionStorage.setItem('agripulse_user', JSON.stringify(demoUser));
                    }
                } else {
                    loginError.value = 'Invalid username or password';
                }
                
                isLoggingIn.value = false;
            }, 800);
        };

        // Register handler
        const handleRegister = () => {
            isRegistering.value = true;
            registerError.value = '';
            registerSuccess.value = '';
            
            // Simulate API call
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
                
                // Check if username already exists
                if (users.value.some(u => u.username === registerForm.value.username)) {
                    registerError.value = 'Username already exists';
                    isRegistering.value = false;
                    return;
                }
                
                // Check if email already exists
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
                    password: registerForm.value.password, // In real app, this would be hashed
                    registeredAt: new Date().toISOString()
                };
                
                users.value.push(newUser);
                
                // Show success message
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
                
                // Switch to login tab after 2 seconds
                setTimeout(() => {
                    authMode.value = 'login';
                    registerSuccess.value = '';
                }, 2000);
                
                isRegistering.value = false;
            }, 800);
        };

        // Forgot password handler
        const showForgotPassword = () => {
            alert('Please contact support at support@agripulse.com for password recovery.');
        };

        // Show terms
        const showTerms = () => {
            alert('Terms & Conditions:\n\n1. Demo application for Hackarena 2026\n2. Data is not stored permanently\n3. Use responsibly');
        };

        // Logout handler
        const logout = () => {
            isAuthenticated.value = false;
            currentUser.value = {};
            loginForm.value = { username: '', password: '', remember: false };
            sessionStorage.removeItem('agripulse_auth');
            sessionStorage.removeItem('agripulse_user');
            
            // Reset main app state
            selectedCrop.value = '';
            csvRows.value = [];
            currentSoil.value = null;
            result.value = null;
            
            // Reset to login tab
            authMode.value = 'login';
        };

        // Check for saved session on mount
        const checkSavedSession = () => {
            const savedAuth = sessionStorage.getItem('agripulse_auth');
            const savedUser = sessionStorage.getItem('agripulse_user');
            if (savedAuth === 'true' && savedUser) {
                try {
                    currentUser.value = JSON.parse(savedUser);
                    isAuthenticated.value = true;
                } catch (e) {
                    // Handle error
                }
            }
        };

        // Call checkSavedSession immediately
        checkSavedSession();

        // load sample soil by id
        const loadSampleSoil = (id) => {
            let sampleData;
            if (id === 'SOIL_001') {
                sampleData = { soil_id: 'SOIL_001', nitrogen: 25, phosphorus: 20, potassium: 180, ph_level: 6.5 };
            } else {
                sampleData = { soil_id: 'SOIL_002', nitrogen: 12, phosphorus: 18, potassium: 160, ph_level: 6.2 };
            }
            currentSoil.value = sampleData;
            if (selectedCrop.value) runEvaluation();
        };

        // file upload handler
        const handleFileUpload = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            UiController.readCSVFile(file, (err, rows) => {
                if (err) {
                    alert('csv error: ' + err.message);
                    return;
                }
                csvRows.value = rows;
                if (rows.length) {
                    currentSoil.value = rows[0];
                }
                if (selectedCrop.value) runEvaluation();
            });
        };

        // run logic engine + AI
        const runEvaluation = () => {
            if (!selectedCrop.value || !currentSoil.value) return;
            const logicRes = LogicEngine.evaluate(currentSoil.value, selectedCrop.value);
            if (!logicRes) return;
            const aiText = AiExplanation.generate(currentSoil.value, selectedCrop.value, logicRes);
            result.value = {
                soil_id: currentSoil.value.soil_id,
                target_crop: selectedCrop.value,
                health_metrics: logicRes.health_metrics,
                recommendation: logicRes.recommendation,
                ai_explanation: aiText
            };
        };

        // watch for changes
        watch([selectedCrop, currentSoil], () => {
            if (selectedCrop.value && currentSoil.value) runEvaluation();
        });

        // health color class
        const healthColorClass = computed(() => {
            if (!result.value) return '';
            const health = result.value.health_metrics.overall_health;
            if (health === 'Optimal') return 'green';
            if (health === 'Deficient') return 'yellow';
            return 'red';
        });

        const healthClass = (health) => {
            if (health === 'Optimal') return 'optimal';
            if (health === 'Deficient') return 'deficient';
            return 'critical';
        };

        return {
            // Auth
            isAuthenticated,
            currentUser,
            isLoggingIn,
            isRegistering,
            loginError,
            registerError,
            registerSuccess,
            authMode,
            loginForm,
            registerForm,
            handleLogin,
            handleRegister,
            showForgotPassword,
            showTerms,
            logout,
            
            // Main app view ...
            selectedCrop,
            csvRows,
            currentSoil,
            result,
            loadSampleSoil,
            handleFileUpload,
            healthColorClass,
            healthClass
        };
    }
}).mount('#app');

// vanilla tilt for 3d cards (exec after dom ready)
document.addEventListener('DOMContentLoaded', () => {
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(document.querySelectorAll('[data-tilt]'), {
            max: 4,
            speed: 400,
            glare: true,
            'max-glare': 0.25,
        });
    }
});