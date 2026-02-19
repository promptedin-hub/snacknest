// --- 1. CONFIGURATION ---
const MY_NUMBER = "919963827311"; // Your WhatsApp Number (Country Code + 10 Digits)
const USERS = {
    "admin1": { pass: "chips123", role: "ADMIN" },
    "boss01": { pass: "super99", role: "SUPER_ADMIN" }
};

// Initial Products List
let products = JSON.parse(localStorage.getItem('sn_products')) || [
    { id: 1, name: 'Lays Chips', price: 20, stock: 10, img: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300' },
    { id: 2, name: 'Oreo Biscuits', price: 30, stock: 5, img: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=300' }
];

let cart = [];
let currentUser = null;

// --- 2. INITIALIZE ---
function init() {
    renderProducts();
    updateUI();
    updateAdminUI();
}

// --- 3. SHOP UI ---
function renderProducts() {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = products.map(p => `
        <div class="card">
            <span class="product-id">ID: ${p.id}</span>
            <img src="${p.img}" alt="${p.name}" onerror="this.src='https://placehold.co/150x150?text=No+Image'">
            <h3>${p.name}</h3>
            <p>₹${p.price} | Stock: ${p.stock}</p>
            <div class="qty-controls">
                <button class="qty-btn" onclick="changeQtyUI(${p.id}, -1)">-</button>
                <input type="number" id="qty-input-${p.id}" class="qty-input" value="1" readonly>
                <button class="qty-btn" onclick="changeQtyUI(${p.id}, 1)">+</button>
            </div>
            <button class="btn-primary" ${p.stock <= 0 ? 'disabled' : ''} onclick="addToCart(${p.id})">
                ${p.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
        </div>
    `).join('');
}

function changeQtyUI(id, delta) {
    const input = document.getElementById(`qty-input-${id}`);
    const product = products.find(p => p.id === id);
    let val = parseInt(input.value) + delta;
    if (val >= 1 && val <= product.stock) input.value = val;
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    const qty = parseInt(document.getElementById(`qty-input-${id}`).value);
    const existing = cart.find(item => item.id === id);

    if (existing) {
        if (existing.qty + qty <= product.stock) existing.qty += qty;
        else alert("Not enough stock!");
    } else {
        cart.push({ ...product, qty });
    }
    updateUI();
}

function updateUI() {
    document.getElementById('cart-count').innerText = cart.reduce((s, i) => s + i.qty, 0);
    document.getElementById('cart-total-price').innerText = '₹' + cart.reduce((s, i) => s + (i.price * i.qty), 0);
}

// --- 4. WHATSAPP ENGINE ---
function placeOrder() {
    const mobile = document.getElementById('user-mobile').value;
    const room = document.getElementById('user-room').value;
    const note = document.getElementById('user-note').value || "None";

    if (!/^[0-9]{10}$/.test(mobile)) return alert("Enter 10-digit mobile number!");
    if (!room) return alert("Room number required!");
    if (cart.length === 0) return alert("Cart is empty!");

    let text = `*--- NEW ORDER: SnackNest ---*%0A`;
    text += `*Room:* ${room}%0A*Phone:* ${mobile}%0A*Note:* ${note}%0A%0A*Items:*%0A`;
    cart.forEach(item => { text += `- ${item.name} x ${item.qty} (₹${item.price * item.qty})%0A`; });
    text += `%0A*TOTAL: ₹${cart.reduce((s, i) => s + (i.price * i.qty), 0)}*`;

    window.open(`https://wa.me/${MY_NUMBER}?text=${text}`, '_blank');
    cart = []; updateUI(); toggleCart();
}

// --- 5. ADMIN CORE LOGIC ---
function openLogin() { document.getElementById('login-modal').style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function toggleCart() { 
    const m = document.getElementById('cart-modal');
    m.style.display = m.style.display === 'block' ? 'none' : 'block';
    if (m.style.display === 'block') renderCartItems();
}

function renderCartItems() {
    const list = document.getElementById('cart-items-list');
    list.innerHTML = cart.length === 0 ? "<p>Empty</p>" : cart.map((item, i) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <span>${item.name} (x${item.qty})</span>
            <span>₹${item.price * item.qty} <button onclick="removeItem(${i})" style="color:red;border:none;background:none;cursor:pointer;">✕</button></span>
        </div>
    `).join('');
}

function removeItem(i) { cart.splice(i, 1); updateUI(); renderCartItems(); }

function processLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    if (USERS[user] && USERS[user].pass === pass) {
        currentUser = USERS[user];
        closeModal('login-modal');
        updateAdminUI();
    } else alert("Invalid Login Credentials");
}

function logout() { currentUser = null; updateAdminUI(); }

function updateAdminUI() {
    const panel = document.getElementById('admin-panel');
    const controls = document.getElementById('admin-controls');
    if (!currentUser) { panel.style.display = 'none'; return; }
    panel.style.display = 'block';
    document.getElementById('role-indicator').innerText = `Role: ${currentUser.role}`;

    let html = `<button onclick="adminUpdateStock()" class="btn-primary">Update Stock</button>`;
    if (currentUser.role === 'SUPER_ADMIN') {
        html += `<button onclick="adminUpdateCost()" class="btn-primary" style="background:#2e7d32">Change Price</button>`;
        html += `<button onclick="adminAddItem()" class="btn-primary" style="background:#6a1b9a">Add New Item</button>`;
        html += `<button onclick="adminDeleteItem()" class="btn-primary" style="background:#c62828">Delete Item</button>`;
    }
    controls.innerHTML = html;
}

// --- ADMIN MANAGEMENT ACTIONS ---
function adminAddItem() {
    const name = prompt("Enter Snack Name:");
    const price = prompt("Enter Price (₹):");
    const stock = prompt("Enter Initial Stock Quantity:");
    const img = prompt("Paste Photo Link (Image URL):");
    
    if (name && price && img) {
        products.push({ id: products.length + 1, name, price: parseInt(price), stock: parseInt(stock), img });
        saveAndRefresh();
    }
}

function adminDeleteItem() {
    const id = prompt("Enter Product ID to delete:");
    products = products.filter(p => p.id != id);
    products.forEach((p, i) => p.id = i + 1); // Maintain 1,2,3 order
    saveAndRefresh();
}

function adminUpdateStock() {
    const id = prompt("Enter Product ID:");
    const p = products.find(prod => prod.id == id);
    if (p) {
        const val = prompt(`Enter new stock for ${p.name}:`, p.stock);
        if (val !== null) { p.stock = parseInt(val); saveAndRefresh(); }
    }
}

function adminUpdateCost() {
    const id = prompt("Enter Product ID:");
    const p = products.find(prod => prod.id == id);
    if (p) {
        const val = prompt(`Enter new price for ${p.name}:`, p.price);
        if (val !== null) { p.price = parseInt(val); saveAndRefresh(); }
    }
}

function saveAndRefresh() {
    localStorage.setItem('sn_products', JSON.stringify(products));
    renderProducts();
}

init();
