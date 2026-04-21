let cart = [];
let total = 0;
let orderHistory = [];

function loadCartFromStorage() {
  const storedCart = localStorage.getItem('cart');
  const storedTotal = localStorage.getItem('total');

  if (storedCart) {
    try {
      cart = JSON.parse(storedCart);
    } catch (error) {
      cart = [];
    }
  }

  if (storedTotal) {
    total = parseFloat(storedTotal) || 0;
  }

  loadOrderHistoryFromStorage();
}

function saveCartToStorage() {
  localStorage.setItem('cart', JSON.stringify(cart));
  localStorage.setItem('total', total.toString());
}

function loadOrderHistoryFromStorage() {
  const storedHistory = localStorage.getItem('orderHistory');
  if (storedHistory) {
    try {
      orderHistory = JSON.parse(storedHistory);
    } catch (error) {
      orderHistory = [];
    }
  }
}

function saveOrderHistoryToStorage() {
  localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
}

function checkAdminPassword() {
  const password = document.getElementById('adminPassword')?.value || '';
  const message = document.getElementById('adminMessage');
  const ADMIN_PASSWORD = 'fit2026';

  if (password === ADMIN_PASSWORD) {
    if (message) message.textContent = '';
    showAdminArea();
  } else if (message) {
    message.textContent = 'Incorrect password. Please try again.';
  }
}

function showAdminArea() {
  const loginSection = document.getElementById('adminLoginSection');
  const ordersSection = document.getElementById('adminOrdersSection');
  if (loginSection) loginSection.style.display = 'none';
  if (ordersSection) ordersSection.style.display = 'block';
  loadAdminOrders();
}

/* Password is fit2026 */
function logoutAdmin() {
  const loginSection = document.getElementById('adminLoginSection');
  const ordersSection = document.getElementById('adminOrdersSection');
  if (loginSection) loginSection.style.display = 'block';
  if (ordersSection) ordersSection.style.display = 'none';
  const passwordInput = document.getElementById('adminPassword');
  if (passwordInput) passwordInput.value = '';
  const message = document.getElementById('adminMessage');
  if (message) message.textContent = '';
}

function loadAdminOrders() {
  loadOrderHistoryFromStorage();
  const list = document.getElementById('adminOrderList');
  if (!list) return;

  list.innerHTML = '';
  if (!orderHistory.length) {
    list.innerHTML = '<li>No customer orders yet.</li>';
    return;
  }

  orderHistory.slice().reverse().forEach(order => {
    const li = document.createElement('li');
    li.className = 'admin-order';

    const currentStatus = order.status || 'Ordered';
    const orderHeader = document.createElement('div');
    orderHeader.innerHTML = `<strong>Order #${order.id}</strong> — ${order.date} — $${parseFloat(order.total).toFixed(2)} — <em>${currentStatus}</em>`;
    li.appendChild(orderHeader);

    const orderDetails = document.createElement('p');
    orderDetails.textContent = `Customer: ${order.name} | Method: ${order.deliveryMethod}`;
    li.appendChild(orderDetails);

    if (order.address) {
      const addressLine = document.createElement('p');
      addressLine.textContent = `Address: ${order.address}`;
      li.appendChild(addressLine);
    }

    if (order.special) {
      const notes = document.createElement('p');
      notes.textContent = `Notes: ${order.special}`;
      li.appendChild(notes);
    }

    const itemList = document.createElement('ul');
    order.items.forEach(item => {
      const itemLi = document.createElement('li');
      const itemPrice = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity, 10) || 1;
      itemLi.textContent = `${quantity}x ${item.name} — $${(itemPrice * quantity).toFixed(2)}`;
      itemList.appendChild(itemLi);
    });
    li.appendChild(itemList);

    const statusWrapper = document.createElement('div');
    statusWrapper.className = 'order-status';
    statusWrapper.innerHTML = `Status: `;
    const statusSelect = document.createElement('select');
    ['Ordered', 'Processing', 'Shipped', 'Completed', 'Cancelled'].forEach(statusValue => {
      const option = document.createElement('option');
      option.value = statusValue;
      option.textContent = statusValue;
      if (order.status === statusValue) option.selected = true;
      statusSelect.appendChild(option);
    });
    statusSelect.onchange = () => updateOrderStatus(order.id, statusSelect.value);
    statusWrapper.appendChild(statusSelect);
    li.appendChild(statusWrapper);

    list.appendChild(li);
  });
}

function updateOrderStatus(orderId, newStatus) {
  if (newStatus === 'Completed' || newStatus === 'Cancelled') {
    orderHistory = orderHistory.filter(o => o.id !== orderId);
  } else {
    const order = orderHistory.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
    }
  }
  saveOrderHistoryToStorage();
  loadAdminOrders();
}

function parseItemFromElement(button) {
  const card = button.closest('.card');
  if (!card) return { name: 'Item', price: 0 };

  const name = card.querySelector('h3, h2, h1')?.textContent.trim() || 'Item';
  const priceText = Array.from(card.querySelectorAll('p'))
    .map(p => p.textContent.trim())
    .find(text => text.startsWith('$'));
  let price = 0;
  if (priceText) {
    price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
  }

  const sizeSelect = card.querySelector('.item-size');
  const colorSelect = card.querySelector('.item-color');
  const quantityInput = card.querySelector('.item-quantity-input');
  const options = [];
  if (sizeSelect && sizeSelect.value) options.push(sizeSelect.value);
  if (colorSelect && colorSelect.value) options.push(colorSelect.value);

  const quantity = Math.max(1, parseInt(quantityInput?.value, 10) || 1);
  const displayName = options.length > 0 ? `${name} (${options.join(', ')})` : name;
  return { name: displayName, price, quantity };
}

function getCartCount() {
  loadCartFromStorage();
  return cart.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 1), 0);
}

function updateCartCount() {
  const countEl = document.getElementById('cartCount');
  if (countEl) {
    countEl.textContent = getCartCount();
  }
}

function addToCart(buttonOrName, price) {
  loadCartFromStorage();

  let itemName = buttonOrName;
  let itemPrice = price;
  let itemQuantity = 1;

  if (buttonOrName instanceof Element) {
    const item = parseItemFromElement(buttonOrName);
    itemName = item.name;
    itemPrice = item.price;
    itemQuantity = item.quantity || 1;
  }

  if (typeof itemName !== 'string') {
    itemName = 'Item';
  }

  itemPrice = parseFloat(itemPrice) || 0;

  cart.push({ name: itemName, price: itemPrice.toFixed(2), quantity: itemQuantity });
  total += itemPrice * itemQuantity;
  saveCartToStorage();
  alert(itemName + ' added!');
  updateTotal();
  updateCartCount();
}

function updateTotal() {
  const totalDisplay = document.getElementById('total');
  if (totalDisplay) totalDisplay.textContent = total;
}

// SHOW ORDER PAGE ITEMS
function loadOrder() {
  loadCartFromStorage();

  const list = document.getElementById('orderList');
  const totalDisplay = document.getElementById('orderTotal');

  if (!list) return;

  list.innerHTML = "";
  total = cart.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity, 10) || 1;
    return sum + price * quantity;
  }, 0);

  cart.forEach(item => {
    const li = document.createElement('li');
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity, 10) || 1;
    const subtotal = price * quantity;
    li.textContent = `${quantity}x ${item.name} - $${subtotal.toFixed(2)}`;
    list.appendChild(li);
  });

  if (totalDisplay) totalDisplay.textContent = total.toFixed(2);
  saveCartToStorage();
}

// PLACE ORDER
function placeOrder() {
  const name = document.getElementById('name').value.trim();
  const deliveryMethod = document.getElementById('deliveryMethod')?.value || 'Home Delivery';
  const addressInput = document.getElementById('address');
  const address = addressInput ? addressInput.value.trim() : '';
  const specialInput = document.getElementById('specialInstructions');
  const special = specialInput ? specialInput.value.trim() : '';
  const message = document.getElementById('orderMessage');

  if (name === "" || cart.length === 0) {
    message.textContent = "Please fill out your name and add something to the cart.";
    return;
  }

  if (deliveryMethod === 'Home Delivery' && address === "") {
    message.textContent = "Please provide an address for home delivery.";
    return;
  }

  const order = {
    id: Date.now(),
    name,
    address,
    deliveryMethod,
    special,
    status: 'Ordered',
    total: total.toFixed(2),
    date: new Date().toLocaleString(),
    items: cart.map(item => ({ ...item }))
  };

  orderHistory.push(order);
  saveOrderHistoryToStorage();

  let confirmation = `Order placed! Thanks ${name}.`;
  if (special) {
    confirmation += ` Special instructions: ${special}`;
  }

  message.textContent = confirmation;
  cart = [];
  total = 0;
  saveCartToStorage();
  loadOrder();
  updateCartCount();
}

// EVENTS + MEMBERSHIP (keep these)
function joinEvent(event) {
  document.getElementById('eventMessage').textContent = "Joined " + event;
}

function selectPlan(plan) {
  const priceMap = {
    Basic: 30,
    Pro: 50,
  };
  const price = priceMap[plan] || 0;

  document.getElementById('planMessage').textContent = plan + ' selected';
  addToCart(`${plan} Membership`, price);
}

// TESTIMONIAL SLIDER
let current = 0;
const slides = document.querySelectorAll('.slide');

function showSlide(i) {
  if (!slides.length) return;
  slides.forEach(s => s.classList.remove('active'));
  slides[i].classList.add('active');
}

function nextSlide() {
  current = (current + 1) % slides.length;
  showSlide(current);
}

function prevSlide() {
  current = (current - 1 + slides.length) % slides.length;
  showSlide(current);
}

setInterval(() => {
  if (slides.length) nextSlide();
}, 3000);

// LOAD ORDER PAGE
function insertItemQuantityControls() {
  document.querySelectorAll('.card').forEach(card => {
    if (card.querySelector('.item-quantity-input')) return;
    const button = card.querySelector('[onclick^="addToCart"]');
    if (!button) return;

    const label = document.createElement('label');
    label.className = 'item-quantity';
    label.innerHTML = 'Qty <input type="number" class="item-quantity-input" min="1" value="1">';
    button.parentNode.insertBefore(label, button);
  });
}

window.onload = function() {
  insertItemQuantityControls();
  loadOrder();
  updateCartCount();
};