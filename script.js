// --- CONFIGURATION ---
const MY_NUMBER = "919963827311"; // Country Code (91) + 10 Digits. No + or spaces.

const products = [
    { id: 1, name: 'Lays Magic Masala', price: 20, img: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300' },
    { id: 2, name: 'Oreo Biscuits', price: 30, img: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=300' },
    { id: 3, name: 'Dairy Milk', price: 40, img: 'https://images.unsplash.com/photo-1582176604447-aa5144675a69?w=300' },
    { id: 4, name: 'Coca Cola', price: 45, img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300' }
];

let cart = [];

// --- RENDER SHOP ---
function renderProducts() {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = products.map(p => `
        <div class="card">
            <img src="${p.img}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p>₹${p.price}</p>
            <div class="qty-controls">
                <button class="qty-btn" onclick="changeQtyUI(${p.id}, -1)">-</button>
                <input type="number" id="qty-input-${p.id}" class="qty-input" value="1" readonly>
                <button class="qty-btn" onclick="changeQtyUI(${p.id}, 1)">+</button>
            </div>
            <button class="btn-primary" onclick="addToCart(${p.id})">Add to Cart</button>
        </div>
    `).join('');
}

function changeQtyUI(id, delta) {
    const input = document.getElementById(`qty-input-${id}`);
    let val = parseInt(input.value) + delta;
    if (val >= 1 && val <= 10) input.value = val;
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    const qty = parseInt(document.getElementById(`qty-input-${id}`).value);
    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ ...product, qty });
    }
    updateUI();
    document.getElementById(`qty-input-${id}`).value = 1; // Reset UI
}

function updateUI() {
    document.getElementById('cart-count').innerText = cart.reduce((s, i) => s + i.qty, 0);
    document.getElementById('cart-total-price').innerText = '₹' + cart.reduce((s, i) => s + (i.price * i.qty), 0);
}

function toggleCart() {
    const m = document.getElementById('cart-modal');
    m.style.display = m.style.display === 'block' ? 'none' : 'block';
    if (m.style.display === 'block') renderCartItems();
}

function renderCartItems() {
    const list = document.getElementById('cart-items-list');
    if (cart.length === 0) { list.innerHTML = "<p>Cart is empty</p>"; return; }
    list.innerHTML = cart.map((item, index) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <span>${item.name} (x${item.qty})</span>
            <span>₹${item.price * item.qty} <button onclick="removeItem(${index})" style="color:red; background:none; border:none; cursor:pointer; margin-left:10px;">✕</button></span>
        </div>
    `).join('');
}

function removeItem(index) {
    cart.splice(index, 1);
    updateUI();
    renderCartItems();
}

// --- THE WHATSAPP ENGINE ---
function placeOrder() {
    const mobile = document.getElementById('user-mobile').value;
    const room = document.getElementById('user-room').value;
    const note = document.getElementById('user-note').value || "None";

    if (!/^[0-9]{10}$/.test(mobile)) return alert("Enter 10-digit mobile number!");
    if (!room) return alert("Room number required!");
    if (cart.length === 0) return alert("Cart is empty!");

    // Construct message
    let text = `*--- NEW ORDER: SnackNest ---*%0A`;
    text += `*Room:* ${room}%0A`;
    text += `*Customer Phone:* ${mobile}%0A`;
    text += `*Note:* ${note}%0A%0A`;
    text += `*Items Ordered:*%0A`;

    cart.forEach(item => {
        text += `- ${item.name} x ${item.qty} (₹${item.price * item.qty})%0A`;
    });

    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    text += `%0A*TOTAL AMOUNT: ₹${total}*%0A`;
    text += `--------------------------%0A`;
    text += `_Please confirm if you have these items available!_`;

    // Launch WhatsApp
    const url = `https://wa.me/${MY_NUMBER}?text=${text}`;
    window.open(url, '_blank').focus();

    // Reset
    cart = [];
    updateUI();
    toggleCart();
}

renderProducts();
