// ==========================================
// 1. FIREBASE CONFIGURATION (SAME AS BEFORE)
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyDsryBtNKMnCZYUrWF9rk0liOhclnbOJvk",
    authDomain: "cryptoedge-45568.firebaseapp.com",
    projectId: "cryptoedge-45568",
    storageBucket: "cryptoedge-45568.firebasestorage.app",
    messagingSenderId: "818922284690",
    appId: "1:818922284690:web:78db82c62e9c75f6f5684b",
    measurementId: "G-LYLDP2HR3B"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

// ==========================================
// 2. AUTHENTICATION LOGIC
// ==========================================
let isLoginMode = true;

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submit-btn');
    const toggleText = document.getElementById('toggle-text');
    const toggleBtn = document.getElementById('toggle-btn');
    const errorMsg = document.getElementById('error-msg');
    
    if(errorMsg) errorMsg.style.display = 'none';

    if (isLoginMode) {
        formTitle.innerText = "Welcome back! Sign in to continue.";
        submitBtn.innerText = "Sign In →";
        toggleText.innerText = "Don't have an account?";
        toggleBtn.innerText = "Sign up";
    } else {
        formTitle.innerText = "Create an account to get started.";
        submitBtn.innerText = "Create Account →";
        toggleText.innerText = "Already have an account?";
        toggleBtn.innerText = "Sign in";
    }
}

const authForm = document.getElementById('auth-form');
if (authForm) {
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('error-msg');

        if (isLoginMode) {
            auth.signInWithEmailAndPassword(email, password)
                .then(() => window.location.href = "dashboard.html")
                .catch((error) => {
                    errorMsg.style.display = 'block';
                    errorMsg.innerText = "Error: " + error.message;
                });
        } else {
            auth.createUserWithEmailAndPassword(email, password)
                .then(() => window.location.href = "dashboard.html")
                .catch((error) => {
                    errorMsg.style.display = 'block';
                    errorMsg.innerText = "Error: " + error.message;
                });
        }
    });
}

// ==========================================
// 3. DASHBOARD LOGIC
// ==========================================

if (window.location.pathname.includes('dashboard.html')) {
    
    // Auth Check
    auth.onAuthStateChanged((user) => {
        if (user) {
            document.getElementById('user-email').innerText = user.email;
            fetchData();
            loadWatchlist(); // Load saved watchlist on startup
        } else {
            window.location.href = "index.html";
        }
    });

    window.handleLogout = function() {
        auth.signOut().then(() => window.location.href = "index.html");
    }

    // Auto Refresh
    setInterval(() => {
        let count = document.getElementById('countdown');
        if(count && count.offsetParent !== null) { // Only count if visible
            let val = parseInt(count.innerText);
            if(val > 0) count.innerText = val - 1;
            else {
                count.innerText = 60;
                fetchData();
            }
        }
    }, 1000);
}

// ==========================================
// 4. NAVIGATION SYSTEM (NEW!)
// ==========================================

window.switchView = function(viewName) {
    // 1. Hide all views
    const views = ['home', 'coins', 'watchlist', 'chat', 'support', 'about'];
    views.forEach(v => {
        document.getElementById(`view-${v}`).style.display = 'none';
        const navBtn = document.getElementById(`nav-${v}`);
        if(navBtn) navBtn.classList.remove('active');
    });

    // 2. Show selected view
    document.getElementById(`view-${viewName}`).style.display = 'block';
    
    // 3. Highlight nav button
    const activeBtn = document.getElementById(`nav-${viewName}`);
    if(activeBtn) activeBtn.classList.add('active');

    // 4. If Watchlist is opened, refresh its data
    if(viewName === 'watchlist') renderWatchlist();
}

// ==========================================
// 5. CRYPTO DATA & WATCHLIST LOGIC
// ==========================================

const apiURL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,cardano&vs_currencies=inr&include_24hr_change=true';
const exchanges = ['KuCoin', 'Coinbase', 'Bybit', 'Binance', 'Kraken'];
let currentCoin = 'bitcoin';
let coinsData = {};
let watchlist = JSON.parse(localStorage.getItem('cryptoWatchlist')) || []; // Load from local storage

async function fetchData() {
    try {
        const response = await fetch(apiURL);
        coinsData = await response.json();
        updateUI();
        if(document.getElementById('view-watchlist').style.display === 'block') {
            renderWatchlist();
        }
        
        const now = new Date();
        const timeElem = document.getElementById('last-updated');
        if(timeElem) timeElem.innerText = now.toLocaleTimeString();
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

window.selectCoin = function(coin) {
    currentCoin = coin;
    document.querySelectorAll('.coin-btn').forEach(btn => btn.classList.remove('active'));
    
    const btns = document.querySelectorAll('.coin-btn');
    btns.forEach(b => {
        if(b.onclick && b.onclick.toString().includes(coin)) b.classList.add('active');
    });
    updateUI();
}

function updateUI() {
    if(!coinsData[currentCoin]) return;

    const data = coinsData[currentCoin];
    const coinMeta = getCoinMeta(currentCoin);

    document.getElementById('main-coin-name').innerText = coinMeta.name;
    document.getElementById('main-coin-ticker').innerText = coinMeta.ticker;
    document.getElementById('main-coin-img').src = coinMeta.img;
    document.getElementById('main-price').innerText = '₹' + data.inr.toLocaleString();
    
    const changeElem = document.getElementById('price-change');
    const change = data.inr_24h_change.toFixed(2);
    changeElem.innerText = (change > 0 ? '+' : '') + change + '%';
    changeElem.style.color = change >= 0 ? '#00C087' : '#ef4444';

    // Update Watchlist Star State
    const starBtn = document.querySelector('.watchlist-star');
    if(watchlist.includes(currentCoin)) {
        starBtn.classList.add('active');
        starBtn.innerText = "★ In Watchlist";
    } else {
        starBtn.classList.remove('active');
        starBtn.innerText = "☆ Add to Watchlist";
    }

    // Comparison Table
    const tableBody = document.getElementById('comparison-table-body');
    tableBody.innerHTML = '';
    document.getElementById('comparison-title').innerText = `${coinMeta.ticker} Price Comparison`;

    let exchangePrices = exchanges.map(ex => {
        const variance = (Math.random() * 0.01) - 0.005; 
        const exPrice = data.inr * (1 + variance);
        return { name: ex, price: exPrice, diff: variance };
    });

    exchangePrices.sort((a, b) => a.price - b.price);
    document.getElementById('best-exchange-name').innerText = exchangePrices[0].name;

    exchangePrices.forEach((ex, index) => {
        const isCheapest = index === 0;
        const statusClass = isCheapest ? 'cheapest' : 'expensive';
        const statusText = isCheapest ? 'Cheapest' : '+' + (Math.abs(ex.diff * 100)).toFixed(2) + '%';
        
        const row = `
            <tr>
                <td>${index + 1}</td>
                <td class="exchange-cell"><span class="dot" style="background:${getColor(ex.name)}"></span> ${ex.name}</td>
                <td style="color:${isCheapest ? '#00C087' : 'white'}">₹${ex.price.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                <td style="color:#00C087">+${(Math.random() * 5).toFixed(2)}%</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            </tr>`;
        tableBody.innerHTML += row;
    });
}

// Watchlist Functions
window.toggleWatchlist = function(coinOverride) {
    const coinToAdd = coinOverride || currentCoin;
    
    if(watchlist.includes(coinToAdd)) {
        watchlist = watchlist.filter(c => c !== coinToAdd);
    } else {
        watchlist.push(coinToAdd);
    }
    
    localStorage.setItem('cryptoWatchlist', JSON.stringify(watchlist));
    updateUI(); // Refresh star icon
}

function renderWatchlist() {
    const grid = document.getElementById('watchlist-grid');
    const emptyMsg = document.getElementById('empty-watchlist-msg');

    if(watchlist.length === 0) {
        emptyMsg.style.display = 'block';
        grid.innerHTML = '';
        grid.appendChild(emptyMsg);
        return;
    }
    
    emptyMsg.style.display = 'none';
    grid.innerHTML = '';

    watchlist.forEach(coin => {
        if(!coinsData[coin]) return;
        const meta = getCoinMeta(coin);
        const price = coinsData[coin].inr;
        const change = coinsData[coin].inr_24h_change.toFixed(2);
        const color = change >= 0 ? '#00C087' : '#ef4444';

        grid.innerHTML += `
            <div class="watch-card">
                <button onclick="toggleWatchlist('${coin}'); renderWatchlist()" style="float:right; background:none; border:none; color: #ef4444; cursor:pointer;">✕</button>
                <h3><img src="${meta.img}" width="24"> ${meta.name}</h3>
                <h1>₹${price.toLocaleString()}</h1>
                <p style="color:${color}">${change > 0 ? '+' : ''}${change}% (24h)</p>
            </div>
        `;
    });
}

function getCoinMeta(coin) {
    const meta = {
        'bitcoin': { name: 'Bitcoin', ticker: 'BTC', img: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
        'ethereum': { name: 'Ethereum', ticker: 'ETH', img: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
        'solana': { name: 'Solana', ticker: 'SOL', img: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
        'ripple': { name: 'XRP', ticker: 'XRP', img: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
        'cardano': { name: 'Cardano', ticker: 'ADA', img: 'https://assets.coingecko.com/coins/images/975/small/cardano.png' }
    };
    return meta[coin];
}

function getColor(name) {
    if(name === 'Binance') return '#F3BA2F';
    if(name === 'Coinbase') return '#0052FF';
    if(name === 'Kraken') return '#5741D9';
    if(name === 'KuCoin') return '#24AE64';
    if(name === 'Bybit') return '#FFA500';
    return '#fff';
}

// ==========================================
// 6. CHATBOT LOGIC
// ==========================================

const botResponses = {
    "hello": "Hi there! I'm CryptoBot. Ask me about coins or arbitrage.",
    "hi": "Hello! How can I help you today?",
    "arbitrage": "Arbitrage is buying a coin on one exchange where it's cheap and selling it on another where it's expensive to make a profit.",
    "bitcoin": "Bitcoin (BTC) is the first decentralized cryptocurrency. It is often called 'digital gold'.",
    "ethereum": "Ethereum (ETH) is a decentralized platform that runs smart contracts.",
    "safe": "CryptoEdge only shows data. We don't hold your funds, so your money is safe on your own exchanges.",
    "support": "You can contact our human support team using the 'Support' tab in the menu.",
    "price": "You can check real-time prices in the 'Coins' tab."
};

window.sendMessage = function() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim().toLowerCase();
    if(!msg) return;

    // Add User Message
    addChatMessage(input.value, 'user-msg');
    input.value = '';

    // Bot Thinking Delay
    setTimeout(() => {
        let reply = "I'm not sure about that. Try asking about 'Bitcoin', 'Arbitrage', or 'Support'.";
        
        // Simple keyword matching
        for (const [key, value] of Object.entries(botResponses)) {
            if (msg.includes(key)) {
                reply = value;
                break;
            }
        }
        addChatMessage(reply, 'bot-msg');
    }, 800);
}

function addChatMessage(text, className) {
    const box = document.getElementById('chat-box');
    const div = document.createElement('div');
    div.className = `message ${className}`;
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight; // Auto scroll to bottom
}

window.handleChatEnter = function(e) {
    if(e.key === 'Enter') sendMessage();
}

// ==========================================
// 7. SUPPORT FORM LOGIC
// ==========================================

window.handleSupportSubmit = function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;
    
    btn.innerText = "Sending...";
    
    setTimeout(() => {
        alert("Message Sent! Our team will contact you at your registered email.");
        btn.innerText = originalText;
        e.target.reset();
    }, 1500);
}