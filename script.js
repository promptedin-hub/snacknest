// --- 1. CONFIGURATION & DATABASE ---
const USERS = {
    "admin1": { pass: "chips123", role: "ADMIN" },
    "boss01": { pass: "super99", role: "SUPER_ADMIN" }
};

let products = JSON.parse(localStorage.getItem('sn_products')) || [
    { id: 1, name: 'Lays Magic Masala', price: 20, stock: 10, img: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300' },
    { id: 2, name: 'Oreo Biscuits', price: 30, stock: 5, img: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=300' },
    { id: 3, name: 'Dairy Milk', price: 40, stock: 12, img: 'https://images.unsplash.com/photo-1582176604447-aa5144675a69?w=300' }
];

let orders = JSON.parse(localStorage.getItem('sn_orders')) || [];
let cart = [];
let currentUser = JSON.parse(localStorage.getItem('sn_user')) || null;

// --- 2. INITIALIZE ---
function init() {
    renderProducts();
    updateCartUI();
    updateAdminUI();
}

// --- 3. SHOP FRONT LOGIC ---
function renderProducts() {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = products.map(p => `
        <div class="card">
            <span class="product-id">ID: ${p.id}</span>
            <img src="${p.img}" alt="${p.name}" onerror="this.src='https://placehold.co/150x150?text=No+Image'">
            <h3>${p.name}</h3>
            <p>₹${p.price} | Stock: <span id="stock-${p.id}">${p.stock}</span></p>
            
            <div class="qty-controls">
                <button class="qty-btn" onclick="changeQtyUI(${p.id}, -1)">-</button>
                <input type="number" id="qty-input-${p.id}" class="qty-input" value="1" min="1" max="${p.stock}" readonly>
                <button class="qty-btn" onclick="changeQtyUI(${p.id}, 1)">+</button>
            </div>

            <button class="btn-primary" ${p.stock <= 0 ? 'disabled' : ''} onclick="handleAddToCart(${p.id})">
                ${p.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
        </div>
    `).join('');
}

// Manage the +/- buttons on the product card
function changeQtyUI(id, delta) {
    const input = document.getElementById(`qty-input-${id}`);
    const product = products.find(p => p.id === id);
    let newVal = parseInt(input.value) + delta;
    
    if (newVal >= 1 && newVal <= product.stock) {
        input.value = newVal;
    }
}

function handleAddToCart(id) {
    const product = products.find(p => p.id === id);
    const qtyInput = document.getElementById(`qty-input-${id}`);
    const requestedQty = parseInt(qtyInput.value);
    
    const cartItem = cart.find(item => item.id === id);

    if (cartItem) {
        if ((cartItem.qty + requestedQty) <= product.stock) {
            cartItem.qty += requestedQty;
        } else {
            alert(`Only ${product.stock} items available in total.`);
            cartItem.qty = product.stock;
        }
    } else {
        cart.push({ ...product, qty: requestedQty });
    }
    
    qtyInput.value = 1; // Reset selector
    updateCartUI();
    alert(`Added ${requestedQty} ${product.name} to cart!`);
}

function updateCartUI() {
    document.getElementById('cart-count').innerText = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cart-total-price').innerText = '₹' + cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    const isVisible = modal.style.display === 'block';
    modal.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) renderCartItems();
}

function renderCartItems() {
    const list = document.getElementById('cart-items-list');
    if (cart.length === 0) {
        list.innerHTML = "<p>Your cart is empty.</p>";
        return;
    }
    list.innerHTML = cart.map((item, idx) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:10px; align-items:center;">
            <span>${item.name} (x${item.qty})</span>
            <div>
                <span style="margin-right:10px;">₹${item.price * item.qty}</span>
                <button onclick="removeFromCart(${idx})" style="color:red; border:none; background:none; cursor:pointer;">✕</button>
            </div>
        </div>
    `).join('');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
    renderCartItems();
}

// --- 4. ORDER PLACEMENT (10-Digit Phone) ---
function placeOrder() {
    const mobile = document.getElementById('user-mobile').value;
    const room = document.getElementById('user-room').value;
    const mobileRegex = /^[0-9]{10}$/;

    if (!mobileRegex.test(mobile)) return alert("Enter a valid 10-digit mobile number.");
    if (!room) return alert("Room number is required.");
    if (cart.length === 0) return alert("Cart is empty.");

    const orderID = 'SN' + Math.floor(1000 + Math.random() * 9000);
    const newOrder = {
        id: orderID,
        customer: { mobile, room, note: document.getElementById('user-note').value },
        items: [...cart],
        total: cart.reduce((sum, i) => sum + (i.price * i.qty), 0),
        time: new Date().toLocaleTimeString(),
        status: 'Pending'
    };

    orders.push(newOrder);
    localStorage.setItem('sn_orders', JSON.stringify(orders));

    // Reduce stock
    cart.forEach(item => {
        const p = products.find(prod => prod.id === item.id);
        if (p) p.stock -= item.qty;
    });

    saveProducts();
    alert(`Order Placed! ID: ${orderID}`);
    cart = [];
    updateCartUI();
    toggleCart();
}

// --- 5. STAFF ADMIN PANEL ---
function openLogin() { document.getElementById('login-modal').style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function processLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    if (USERS[user] && USERS[user].pass === pass) {
        currentUser = { username: user, role: USERS[user].role };
        localStorage.setItem('sn_user', JSON.stringify(currentUser));
        closeModal('login-modal');
        updateAdminUI();
    } else alert("Invalid Login");
}

function logout() {
    currentUser = null;
    localStorage.removeItem('sn_user');
    updateAdminUI();
}

function updateAdminUI() {
    const panel = document.getElementById('admin-panel');
    const controls = document.getElementById('admin-controls');
    if (!currentUser) { panel.style.display = 'none'; return; }

    panel.style.display = 'block';
    document.getElementById('role-indicator').innerText = `Role: ${currentUser.role}`;

    let html = `<button onclick="adminUpdateStock()" class="btn-primary">Update Stock</button>`;
    if (currentUser.role === 'SUPER_ADMIN') {
        html += `<button onclick="adminUpdateCost()" class="btn-primary" style="background:#2e7d32">Update Cost</button>`;
        html += `<button onclick="adminAddItem()" class="btn-primary" style="background:#6a1b9a">Add New Item</button>`;
        html += `<button onclick="adminDeleteItem()" class="btn-primary" style="background:#c62828">Delete Item</button>`;
    }
    controls.innerHTML = html;
    renderAdminOrders();
}

// --- 6. ADMIN ACTIONS (1, 2, 3 ID Logic) ---
function adminAddItem() {
    const name = prompt("Item Name:");
    const price = prompt("Price (₹):");
    const stock = prompt("Initial Stock:");
    const imgUrl = prompt("Paste Photo Link (URL):");

    if (name && price && imgUrl) {
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ id: newId, name, price: parseInt(price), stock: parseInt(stock) || 0, img: imgUrl });
        saveProducts();
    }
}

function adminDeleteItem() {
    const id = prompt("Enter ID to Delete:");
    const index = products.findIndex(p => p.id == id);
    if (index !== -1 && confirm("Delete this item?")) {
        products.splice(index, 1);
        products.forEach((p, i) => p.id = i + 1); // Re-index to 1,2,3
        saveProducts();
    }
}

function adminUpdateStock() {
    const id = prompt("Enter ID:");
    const p = products.find(prod => prod.id == id);
    if (p) {
        const val = prompt(`New stock for ${p.name}:`, p.stock);
        if (val !== null) { p.stock = parseInt(val); saveProducts(); }
    }
}

function adminUpdateCost() {
    const id = prompt("Enter ID:");
    const p = products.find(prod => prod.id == id);
    if (p) {
        const val = prompt(`New price for ${p.name}:`, p.price);
        if (val !== null) { p.price = parseInt(val); saveProducts(); }
    }
}

// --- 7. ORDER MANAGEMENT ---
function renderAdminOrders() {
    const container = document.getElementById('order-list-container');
    if (orders.length === 0) {
        container.innerHTML = "<p>No orders yet.</p>";
        return;
    }
    container.innerHTML = orders.map((o, idx) => `
        <div class="order-card" style="border-left: 5px solid ${o.status === 'Delivered' ? '#2ecc71' : '#e67e22'}; background: white; padding: 12px; margin-bottom: 10px; border-radius: 8px; color: #333;">
            <div style="display:flex; justify-content:space-between;">
                <strong>ID: ${o.id}</strong>
                <label><input type="checkbox" ${o.status === 'Delivered' ? 'checked' : ''} onchange="toggleStatus(${idx})"> Delivered</label>
            </div>
            <p>Room: ${o.customer.room} | <a href="tel:${o.customer.mobile}">${o.customer.mobile}</a></p>
            <p style="font-size:13px;">${o.items.map(i => i.name + ' x' + i.qty).join(', ')}</p>
            <p><strong>Total: ₹${o.total}</strong></p>
        </div>
    `).reverse().join(''); 
}

function toggleStatus(idx) {
    orders[idx].status = orders[idx].status === 'Delivered' ? 'Pending' : 'Delivered';
    localStorage.setItem('sn_orders', JSON.stringify(orders));
    renderAdminOrders();
}

function clearAllOrders() {
    if(confirm("Wipe history?")) {
        orders = [];
        localStorage.setItem('sn_orders', JSON.stringify(orders));
        renderAdminOrders();
    }
}

function saveProducts() {
    localStorage.setItem('sn_products', JSON.stringify(products));
    renderProducts();
}

init();