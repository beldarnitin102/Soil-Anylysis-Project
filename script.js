// ====================== PAGE NAVIGATION ======================
function showPage(event, pageId) {
    if(event) event.preventDefault();

    if (html5QrCode && html5QrCode.isScanning) {
        stopScanner();
    }

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
    }
    if (pageId === 'scanner') {
        setupScannerPage();
    }
    document.getElementById('resultsDashboard').classList.add('hidden');
    window.location.hash = pageId;
    window.scrollTo(0, 0);

    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu && mobileMenu.classList.contains('active')) {
        mobileMenu.classList.remove('active');
    }

    setTimeout(() => {
        const elementsToAnimate = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');
        elementsToAnimate.forEach(el => {
            el.classList.remove('visible');
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    el.classList.add('visible');
                    observer.disconnect();
                }
            }, { threshold: 0.1 });
            observer.observe(el);
        });
    }, 100);
}

// ====================== MOBILE/DROPDOWN MENU ======================
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

function toggleChatbot() {
    const panel = document.getElementById('chatbotPanel');
    if (panel) {
        panel.classList.toggle('active');
    }
}

// ====================== CHATBOT (REAL) ======================
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const messages = document.getElementById('chatMessages');
    const messageText = input.value.trim();
    if (!messageText) return;

    const userMsg = document.createElement('div');
    userMsg.className = 'mb-4 flex justify-end';
    userMsg.innerHTML = `<div class="bg-indigo-500 p-3 rounded-lg max-w-xs"><p class="text-sm">${messageText}</p></div>`;
    messages.appendChild(userMsg);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'mb-4 typing-indicator';
    typingIndicator.innerHTML = `<div class="bg-indigo-500/20 p-3 rounded-lg max-w-xs"><p class="text-sm text-gray-400">Assistant is typing...</p></div>`;
    messages.appendChild(typingIndicator);
    messages.scrollTop = messages.scrollHeight;

    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: messageText }),
        });

        const data = await response.json().catch(() => ({ error: 'Invalid JSON from server' }));

        if (!response.ok) {
            const serverMsg = data && data.error ? data.error : `HTTP ${response.status}`;
            throw new Error(serverMsg);
        }
        const botResponse = data.reply;

        messages.removeChild(typingIndicator);
        const botMsg = document.createElement('div');
        botMsg.className = 'mb-4';
        botMsg.innerHTML = `<div class="bg-indigo-500/20 p-3 rounded-lg max-w-xs"><p class="text-sm">${botResponse}</p></div>`;
        messages.appendChild(botMsg);
        messages.scrollTop = messages.scrollHeight;

    } catch (error) {
        console.error('Error fetching AI response:', error);
        messages.removeChild(typingIndicator);
        const errorMsg = document.createElement('div');
        errorMsg.className = 'mb-4';
        errorMsg.innerHTML = `<div class="bg-red-500/20 p-3 rounded-lg max-w-xs"><p class="text-sm text-red-400">${error?.message || 'Sorry, I could not connect to the assistant.'}</p></div>`;
        messages.appendChild(errorMsg);
        messages.scrollTop = messages.scrollHeight;
    }
}

// ====================== QR CODE SCANNER ======================
let html5QrCode;

function onScanSuccess(decodedText, decodedResult) {
    console.log(`Code matched = ${decodedText}`, decodedResult);
    alert(`Scanned QR Code: ${decodedText}`);
    stopScanner();
    document.getElementById('qr-reader-results').innerText = `Success! Scanned: ${decodedText}`;
}

function onScanFailure(error) {}

function startScanner() {
    const startButton = document.getElementById('startScannerBtn');
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("qr-reader");
    }
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    startButton.disabled = true;
    startButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span> Starting...</span>';
    html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanFailure
    ).then(() => {
        startButton.innerHTML = '<i class="fas fa-stop-circle"></i><span> Stop Camera</span>';
        startButton.disabled = false;
        startButton.onclick = stopScanner;
    }).catch((err) => {
        console.error("Failed to start scanner", err);
        alert("Could not start camera. Please grant camera permissions.");
        startButton.innerHTML = '<i class="fas fa-camera"></i><span> Start Camera</span>';
        startButton.disabled = false;
    });
}

function stopScanner() {
    const startButton = document.getElementById('startScannerBtn');
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            console.log("QR Code scanning stopped.");
            startButton.innerHTML = '<i class="fas fa-camera"></i><span> Start Camera</span>';
            startButton.onclick = startScanner;
        }).catch((err) => {
            console.error("Failed to stop scanner", err);
        });
    }
}

function setupScannerPage() {
    const startButton = document.getElementById('startScannerBtn');
    if (startButton) {
        startButton.onclick = startScanner;
    }
}

// ====================== VOICE ASSISTANT ======================
function toggleVoiceAssistant() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert('Voice recognition is not supported in this browser.');
        return;
    }
    const recognition = new SpeechRecognition();
    const voiceIcon = document.querySelector('a[onclick="toggleVoiceAssistant()"] i');
    voiceIcon.classList.add('text-cyan-400', 'fa-beat');
    recognition.onresult = function(event) {
        const command = event.results[0][0].transcript.toLowerCase();
        if (command.includes('home')) showPage(null, 'home');
        else if (command.includes('upload')) showPage(null, 'upload');
        else if (command.includes('scanner')) showPage(null, 'scanner');
        else if (command.includes('community')) showPage(null, 'community');
        else if (command.includes('about')) showPage(null, 'about');
    };
    recognition.onend = function() {
        voiceIcon.classList.remove('text-cyan-400', 'fa-beat');
    };
    recognition.onerror = function(event) {
        alert('Voice recognition error: ' + event.error);
        voiceIcon.classList.remove('text-cyan-400', 'fa-beat');
    }
    recognition.start();
}

// ====================== FILE UPLOAD + ANALYSIS (DYNAMIC) ======================

// 15+ analysis sets for demo
const analysisSets = [
    {
        metrics: { ph: { value: 6.8, status: "Optimal" }, moisture: { value: 45, status: "Good" }, nitrogen: { value: 78, status: "High" }, phosphorus: { value: 52, status: "Medium" }, potassium: { value: 48, status: "Medium" } },
        crops: [ { name: "Corn", match: 95, emoji: "🌽" }, { name: "Wheat", match: 88, emoji: "🌾" }, { name: "Carrots", match: 82, emoji: "🥕" } ],
        fertilizer: [ { name: "Phosphorus Boost", priority: "High", recommendation: "Apply 15-30-15 NPK fertilizer" }, { name: "Potassium Support", priority: "Medium", recommendation: "Add potash supplement" }, { name: "Organic Matter", priority: "Recommended", recommendation: "Add compost for long-term health" } ]
    },
    {
        metrics: { ph: { value: 5.9, status: "Low" }, moisture: { value: 38, status: "Dry" }, nitrogen: { value: 60, status: "Medium" }, phosphorus: { value: 40, status: "Low" }, potassium: { value: 35, status: "Low" } },
        crops: [ { name: "Potato", match: 90, emoji: "🥔" }, { name: "Tomato", match: 85, emoji: "🍅" }, { name: "Onion", match: 80, emoji: "🧅" } ],
        fertilizer: [ { name: "Nitrogen Boost", priority: "High", recommendation: "Apply urea fertilizer" }, { name: "Phosphorus Support", priority: "Medium", recommendation: "Add bone meal" }, { name: "Watering", priority: "Critical", recommendation: "Increase irrigation" } ]
    },
    {
        metrics: { ph: { value: 7.2, status: "Slightly Alkaline" }, moisture: { value: 52, status: "Good" }, nitrogen: { value: 82, status: "High" }, phosphorus: { value: 70, status: "High" }, potassium: { value: 65, status: "High" } },
        crops: [ { name: "Rice", match: 93, emoji: "🍚" }, { name: "Barley", match: 87, emoji: "🌾" }, { name: "Oats", match: 80, emoji: "🌱" } ],
        fertilizer: [ { name: "Balanced NPK", priority: "Recommended", recommendation: "Apply 20-20-20 NPK" }, { name: "Organic Mix", priority: "Medium", recommendation: "Add compost" }, { name: "Potassium Support", priority: "Low", recommendation: "Add potash" } ]
    },
    // ...add 12+ more sets for variety...
    {
        metrics: { ph: { value: 6.2, status: "Optimal" }, moisture: { value: 60, status: "Wet" }, nitrogen: { value: 70, status: "Medium" }, phosphorus: { value: 55, status: "Medium" }, potassium: { value: 50, status: "Medium" } },
        crops: [ { name: "Peas", match: 88, emoji: "🟢" }, { name: "Beans", match: 85, emoji: "🌱" }, { name: "Spinach", match: 80, emoji: "🥬" } ],
        fertilizer: [ { name: "Organic Matter", priority: "High", recommendation: "Add compost" }, { name: "Nitrogen Support", priority: "Medium", recommendation: "Apply ammonium sulfate" }, { name: "Phosphorus Support", priority: "Low", recommendation: "Add bone meal" } ]
    },
    {
        metrics: { ph: { value: 7.0, status: "Neutral" }, moisture: { value: 50, status: "Good" }, nitrogen: { value: 75, status: "High" }, phosphorus: { value: 60, status: "Medium" }, potassium: { value: 55, status: "Medium" } },
        crops: [ { name: "Sugarcane", match: 92, emoji: "🍬" }, { name: "Maize", match: 89, emoji: "🌽" }, { name: "Sorghum", match: 85, emoji: "🌾" } ],
        fertilizer: [ { name: "Potassium Boost", priority: "High", recommendation: "Apply potash" }, { name: "Balanced NPK", priority: "Medium", recommendation: "Apply 10-10-10 NPK" }, { name: "Organic Mix", priority: "Low", recommendation: "Add compost" } ]
    },
    // ...add more sets as needed...
];

function setupFileUpload() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (!uploadZone) return;

    function handleFile(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = e => {
                previewImg.src = e.target.result;
                imagePreview.classList.remove('hidden');
                analyzeBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        } else { alert("Please select a valid image file."); }
    }
    uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', e => { e.preventDefault(); uploadZone.classList.remove('dragover'); });
    uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('dragover'); if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]); });
    fileInput.addEventListener('change', e => { if (e.target.files.length > 0) handleFile(e.target.files[0]); });
    analyzeBtn.addEventListener('click', () => {
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
        analyzeBtn.disabled = true;
        setTimeout(() => {
            // Pick a random analysis set
            const randomSet = analysisSets[Math.floor(Math.random() * analysisSets.length)];
            displayAnalysisResults(randomSet);
            analyzeBtn.innerHTML = 'Analyze Soil Sample';
            analyzeBtn.disabled = false;
        }, 2500);
    });
}

function displayAnalysisResults(data) {
    const dashboard = document.getElementById('resultsDashboard');
    if (!dashboard) return;
    const metricsContainer = dashboard.querySelector('.glass-card:nth-child(1) .space-y-4');
    metricsContainer.innerHTML = `
        <div class="flex justify-between items-center"><span>pH Level</span><span class="text-indigo-400 font-semibold">${data.metrics.ph.value} (${data.metrics.ph.status})</span></div>
        <div class="flex justify-between items-center"><span>Moisture</span><span class="text-cyan-400 font-semibold">${data.metrics.moisture.value}% (${data.metrics.moisture.status})</span></div>
        <div class="flex justify-between items-center"><span>Nitrogen</span><span class="text-emerald-400 font-semibold">${data.metrics.nitrogen.value}% (${data.metrics.nitrogen.status})</span></div>
        <div class="flex justify-between items-center"><span>Phosphorus</span><span class="text-purple-400 font-semibold">${data.metrics.phosphorus.value}% (${data.metrics.phosphorus.status})</span></div>
        <div class="flex justify-between items-center"><span>Potassium</span><span class="text-amber-400 font-semibold">${data.metrics.potassium.value}% (${data.metrics.potassium.status})</span></div>`;
    const cropsContainer = dashboard.querySelector('.glass-card:nth-child(2) .space-y-4');
    cropsContainer.innerHTML = data.crops.map(crop => `<div class="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20"><div class="flex items-center space-x-3"><span class="text-2xl">${crop.emoji}</span><span class="font-medium">${crop.name}</span></div><span class="text-emerald-400 text-sm">${crop.match}% Match</span></div>`).join('');
    const fertilizerContainer = dashboard.querySelector('.glass-card:nth-child(3) .space-y-4');
    fertilizerContainer.innerHTML = data.fertilizer.map(fert => `<div class="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20"><div class="flex justify-between items-center mb-2"><span class="font-medium">${fert.name}</span><span class="text-amber-400 text-sm">${fert.priority}</span></div><p class="text-sm text-gray-400">${fert.recommendation}</p></div>`).join('');
    dashboard.classList.remove('hidden');
    dashboard.scrollIntoView({ behavior: 'smooth' });
}

function hideResults() {
    document.getElementById('resultsDashboard').classList.add('hidden');
}

// ====================== BACKGROUND & INIT ======================
function initBackgroundSlideshow() {
    const slides = document.querySelectorAll('.bg-slideshow');
    if (slides.length === 0) return;
    let currentSlide = 0;
    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 8000);
}

document.addEventListener('DOMContentLoaded', () => {
    setupFileUpload();
    initBackgroundSlideshow();
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
    }
    const hash = window.location.hash.substring(1);
    const pageId = (hash && document.getElementById(hash + 'Page')) ? hash : 'home';
    showPage(null, pageId);

    // Registration
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;

            try {
                const response = await fetch('http://localhost:3001/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const result = await response.json();
                if (result.success) {
                    alert('Registration successful!');
                    showPage(null, 'home'); // Redirect to home page
                } else {
                    alert(result.message || 'Registration failed.');
                }
            } catch (error) {
                alert('Could not connect to server.');
            }
        });
    }

    // Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('http://localhost:3001/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();
                alert(result.success ? 'Login successful!' : (result.message || 'Login failed.'));
            } catch (error) {
                alert('Could not connect to server.');
            }
        });
    }
});

window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1) || 'home';
    if(document.getElementById(hash + 'Page') && !document.getElementById(hash + 'Page').classList.contains('active')) {
        showPage(null, hash);
    }
});