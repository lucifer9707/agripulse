// js/app.js
const { createApp, ref, computed, watch } = Vue;

const app = createApp({
    setup() {
        // Authentication state
        const isAuthenticated = ref(false);
        const currentUser = ref('');
        const isLoggingIn = ref(false);
        const loginError = ref('');
        
        const loginForm = ref({
            username: '',
            password: '',
            remember: false
        });

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
                // Demo credentials: farmer / agripulse2026
                if (loginForm.value.username === 'farmer' && loginForm.value.password === 'agripulse2026') {
                    isAuthenticated.value = true;
                    currentUser.value = loginForm.value.username;
                    
                    // Save to sessionStorage if remember me is checked
                    if (loginForm.value.remember) {
                        sessionStorage.setItem('agripulse_auth', 'true');
                        sessionStorage.setItem('agripulse_user', loginForm.value.username);
                    }
                } else {
                    loginError.value = 'Invalid username or password. Try farmer / agripulse2026';
                }
                isLoggingIn.value = false;
            }, 800); // Simulate network delay
        };

        // Logout handler
        const logout = () => {
            isAuthenticated.value = false;
            currentUser.value = '';
            loginForm.value = { username: '', password: '', remember: false };
            sessionStorage.removeItem('agripulse_auth');
            sessionStorage.removeItem('agripulse_user');
            
            // Reset main app state
            selectedCrop.value = '';
            csvRows.value = [];
            currentSoil.value = null;
            result.value = null;
        };

        // Check for saved session on mount
        const checkSavedSession = () => {
            const savedAuth = sessionStorage.getItem('agripulse_auth');
            const savedUser = sessionStorage.getItem('agripulse_user');
            if (savedAuth === 'true' && savedUser) {
                isAuthenticated.value = true;
                currentUser.value = savedUser;
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
            loginError,
            loginForm,
            handleLogin,
            logout,
            
            // Main app
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