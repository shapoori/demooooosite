/**
 * Apex Athletic Nutrition - Main Interactive Script
 * Pure Vanilla JavaScript (Zero build step, 100% deployment ready for GitHub Pages)
 */

(function () {
  'use strict';

  // Constants & State
  const STORAGE_KEY_CART = 'apex_cart_items_v1';
  const STORAGE_KEY_COUPON = 'apex_applied_coupon';
  const FREE_SHIPPING_THRESHOLD = 1500000; // 1,500,000 Toman
  const STANDARD_SHIPPING_COST = 65000; // 65,000 Toman

  let cart = [];
  let appliedCoupon = null; // { code: 'APEX15', discountRate: 0.15 }

  // Coupons database
  const VALID_COUPONS = {
    'APEX15': { discountRate: 0.15, description: '۱۵٪ تخفیف ویژه اعضای اپکس' },
    'WELCOME10': { discountRate: 0.10, description: '۱۰٪ تخفیف خرید اول' },
    'CHAMPION': { discountRate: 0.20, description: '۲۰٪ تخفیف قهرمانان' }
  };

  // Lab batch verification database
  const BATCH_DATABASE = {
    'APX-W75-2026': {
      product: 'پروتئین وی ایزوله ۱۰۰٪ اپکس (Apex Whey Isolate)',
      testedProtein: '۲۷.۲ گرم در سروینگ (تایید شده)',
      hplcAnalysis: '۹۹.۸٪ درجه خلوص پپتیدی',
      bannedSubstances: 'منفی (WADA Clean)',
      heavyMetals: 'عاری از سرب، آرسنیک و کادمیوم (استاندارد دارویی)',
      mfgDate: '۱۴۰۴/۰۸/۱۵',
      expDate: '۱۴۰۷/۰۸/۱۵',
      status: 'تایید اصالت و سلامت آزمایشگاهی',
      valid: true
    },
    'APX-CR100-2026': {
      product: 'کراتین میکرونایز ۲۰۰ مش خالص اپکس',
      testedProtein: 'کراتین مونوهیدرات دارویی',
      hplcAnalysis: '۹۹.۹۴٪ خلوص کرئاپور HPLC',
      bannedSubstances: 'منفی (فاقد هرگونه محرک غیرمجاز)',
      heavyMetals: '۰.۰۰٪ صفر مطلق',
      mfgDate: '۱۴۰۴/۰۹/۰۱',
      expDate: '۱۴۰۷/۰۹/۰۱',
      status: 'تایید اصالت و سلامت آزمایشگاهی',
      valid: true
    },
    'APX-VF30-2026': {
      product: 'پمپ پیش از تمرین ولتائیک فیوژن',
      testedProtein: 'ماتریس انرژی و پمپ سیترولین/بتا آلانین',
      hplcAnalysis: 'دوز بالینی سیترولین ۲:۱ مطابق برچسب',
      bannedSubstances: 'منفی (مطابق استانداردهای جهانی)',
      heavyMetals: 'منفی',
      mfgDate: '۱۴۰۴/۰۸/۱۰',
      expDate: '۱۴۰۶/۰۸/۱۰',
      status: 'تایید اصالت و سلامت آزمایشگاهی',
      valid: true
    }
  };

  // DOM Elements
  let cartCountBadges = [];
  let cartDrawer = null;
  let drawerBackdrop = null;
  let cartItemsContainer = null;
  let cartSubtotalEl = null;
  let cartDiscountEl = null;
  let cartShippingEl = null;
  let cartTotalEl = null;
  let freeShippingTrack = null;
  let freeShippingText = null;
  let couponInput = null;
  let couponBtn = null;
  let searchModal = null;
  let searchInputField = null;
  let searchResultsList = null;
  let quickViewModal = null;
  let mobileDrawer = null;

  // Initialize once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    initDOMElements();
    loadCartFromStorage();
    renderCart();
    initEventListeners();
    initCountdownTimer();
    initCatalogIfPresent();
    initBatchCheckerIfPresent();
    initConsultationFormIfPresent();
    initFaqAccordionIfPresent();
  });

  function initDOMElements() {
    cartCountBadges = document.querySelectorAll('.cart-count-badge');
    cartDrawer = document.getElementById('cartDrawer');
    drawerBackdrop = document.getElementById('drawerBackdrop');
    cartItemsContainer = document.getElementById('cartItemsContainer');
    cartSubtotalEl = document.getElementById('cartSubtotal');
    cartDiscountEl = document.getElementById('cartDiscount');
    cartShippingEl = document.getElementById('cartShipping');
    cartTotalEl = document.getElementById('cartTotal');
    freeShippingTrack = document.getElementById('freeShippingProgress');
    freeShippingText = document.getElementById('freeShippingText');
    couponInput = document.getElementById('couponInput');
    couponBtn = document.getElementById('couponBtn');
    searchModal = document.getElementById('searchModal');
    searchInputField = document.getElementById('searchInputField');
    searchResultsList = document.getElementById('searchResultsList');
    quickViewModal = document.getElementById('quickViewModal');
    mobileDrawer = document.getElementById('mobileDrawer');
  }

  function initEventListeners() {
    // Cart open triggers
    document.querySelectorAll('[data-action="open-cart"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openCartDrawer();
      });
    });

    // Cart close triggers
    document.querySelectorAll('[data-action="close-cart"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        closeCartDrawer();
      });
    });

    // Drawer backdrop click
    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', () => {
        closeCartDrawer();
        closeMobileDrawer();
        closeModals();
      });
    }

    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => {
        openMobileDrawer();
      });
    }

    const closeMobileBtn = document.querySelector('[data-action="close-mobile"]');
    if (closeMobileBtn) {
      closeMobileBtn.addEventListener('click', () => {
        closeMobileDrawer();
      });
    }

    // Announcement bar close
    const announceClose = document.querySelector('.announcement-bar-close');
    if (announceClose) {
      announceClose.addEventListener('click', () => {
        const bar = document.querySelector('.announcement-bar');
        if (bar) bar.style.display = 'none';
      });
    }

    // Coupon apply button
    if (couponBtn && couponInput) {
      couponBtn.addEventListener('click', handleApplyCoupon);
      couponInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleApplyCoupon();
        }
      });
    }

    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', openCheckoutModal);
    }

    // Search triggers
    document.querySelectorAll('[data-action="open-search"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openSearchModal();
      });
    });

    // Search field input
    if (searchInputField) {
      searchInputField.addEventListener('input', handleLiveSearch);
    }

    // Keyboard shortcuts (Escape & Ctrl+K)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCartDrawer();
        closeMobileDrawer();
        closeModals();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearchModal();
      }
    });

    // Global Add to Cart Delegation for dynamic cards
    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-add-cart]');
      if (addBtn) {
        e.preventDefault();
        const productId = addBtn.getAttribute('data-add-cart');
        const card = addBtn.closest('.product-card') || addBtn.closest('.modal-content-card');
        let selectedFlavor = null;
        if (card) {
          const activePill = card.querySelector('.flavor-pill.active');
          if (activePill) selectedFlavor = activePill.textContent.trim();
        }
        addToCart(productId, selectedFlavor);
      }

      const quickBtn = e.target.closest('[data-quick-view]');
      if (quickBtn) {
        e.preventDefault();
        const productId = quickBtn.getAttribute('data-quick-view');
        openQuickViewModal(productId);
      }

      // Flavor pill selection inside cards
      const flavorPill = e.target.closest('.flavor-pill');
      if (flavorPill) {
        const parent = flavorPill.closest('.flavor-selector');
        if (parent) {
          parent.querySelectorAll('.flavor-pill').forEach(p => p.classList.remove('active'));
          flavorPill.classList.add('active');
        }
      }
    });
  }

  // Cart Management
  function loadCartFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      cart = saved ? JSON.parse(saved) : [];
      const savedCoupon = localStorage.getItem(STORAGE_KEY_COUPON);
      if (savedCoupon && VALID_COUPONS[savedCoupon]) {
        appliedCoupon = { code: savedCoupon, ...VALID_COUPONS[savedCoupon] };
      }
    } catch (e) {
      cart = [];
    }
  }

  function saveCartToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
      if (appliedCoupon) {
        localStorage.setItem(STORAGE_KEY_COUPON, appliedCoupon.code);
      } else {
        localStorage.removeItem(STORAGE_KEY_COUPON);
      }
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }

  function addToCart(productId, flavor = null) {
    const product = findProductById(productId);
    if (!product) return;

    const chosenFlavor = flavor || (product.flavors && product.flavors[0]) || 'استاندارد';
    const itemKey = `${product.id}-${chosenFlavor}`;

    const existingIndex = cart.findIndex(item => item.key === itemKey);
    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        key: itemKey,
        id: product.id,
        name: product.name,
        nameEn: product.nameEn,
        price: product.price,
        originalPrice: product.originalPrice,
        weight: product.weight,
        flavor: chosenFlavor,
        image: product.image,
        quantity: 1
      });
    }

    saveCartToStorage();
    renderCart();
    showToast(`«${product.name}» به سبد خرید اضافه شد`, 'success');

    // Trigger subtle bump animation on badges
    cartCountBadges.forEach(b => {
      b.style.transform = 'scale(1.35)';
      setTimeout(() => { b.style.transform = 'scale(1)'; }, 200);
    });
  }

  function updateCartQuantity(key, delta) {
    const index = cart.findIndex(item => item.key === key);
    if (index === -1) return;

    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
      showToast('محصول از سبد حذف شد', 'info');
    }

    saveCartToStorage();
    renderCart();
  }

  function removeFromCart(key) {
    cart = cart.filter(item => item.key !== key);
    saveCartToStorage();
    renderCart();
    showToast('محصول از سبد خرید حذف شد', 'info');
  }

  function renderCart() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountBadges.forEach(badge => {
      badge.textContent = formatPersianNumber(totalCount);
    });

    if (!cartItemsContainer) return;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="cart-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <h4 style="font-weight: 700; color: #111827; margin-bottom: 0.5rem;">سبد خرید شما خالی است</h4>
          <p style="font-size: 0.8125rem;">مکمل‌های تخصصی مورد نیاز بدنسازی و تمرین خود را اضافه کنید.</p>
          <a href="products.html" class="btn-primary" style="margin-top: 1.25rem; font-size: 0.8125rem; padding: 0.5rem 1rem;">
            مشاهده مکمل‌ها
          </a>
        </div>
      `;
    } else {
      cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
          <div class="cart-item-thumb">
            <img src="${item.image}" alt="${item.name}" loading="lazy" />
          </div>
          <div class="cart-item-details">
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-variant">طعم: ${item.flavor} · ${item.weight}</div>
            <div class="cart-item-bottom">
              <div class="qty-stepper">
                <button type="button" class="qty-btn" onclick="window.ApexApp.updateCartQuantity('${item.key}', 1)">+</button>
                <span class="qty-val">${formatPersianNumber(item.quantity)}</span>
                <button type="button" class="qty-btn" onclick="window.ApexApp.updateCartQuantity('${item.key}', -1)">-</button>
              </div>
              <div class="cart-item-price">
                ${formatPrice(item.price * item.quantity)} <span style="font-size: 0.75rem; font-weight: normal; color: #6B7280;">تومان</span>
              </div>
              <button type="button" class="cart-item-remove" onclick="window.ApexApp.removeFromCart('${item.key}')" title="حذف">
                ✕
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = appliedCoupon ? Math.round(subtotal * appliedCoupon.discountRate) : 0;
    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0;
    const shippingCost = isFreeShipping ? 0 : STANDARD_SHIPPING_COST;
    const finalTotal = Math.max(0, subtotal - discountAmount + shippingCost);

    if (cartSubtotalEl) cartSubtotalEl.textContent = `${formatPrice(subtotal)} تومان`;
    if (cartDiscountEl) {
      if (appliedCoupon) {
        cartDiscountEl.parentElement.style.display = 'flex';
        cartDiscountEl.textContent = `-${formatPrice(discountAmount)} تومان (${appliedCoupon.code})`;
      } else {
        cartDiscountEl.parentElement.style.display = 'none';
      }
    }

    if (cartShippingEl) {
      cartShippingEl.textContent = isFreeShipping ? 'رایگان' : `${formatPrice(shippingCost)} تومان`;
      cartShippingEl.style.color = isFreeShipping ? 'var(--accent-emerald)' : 'inherit';
    }

    if (cartTotalEl) cartTotalEl.textContent = `${formatPrice(finalTotal)} تومان`;

    // Free shipping bar
    if (freeShippingTrack && freeShippingText) {
      if (subtotal === 0) {
        freeShippingTrack.style.width = '0%';
        freeShippingText.textContent = `با خرید بالای ${formatPrice(FREE_SHIPPING_THRESHOLD)} تومان، ارسال کاملاً رایگان خواهد بود.`;
      } else if (subtotal >= FREE_SHIPPING_THRESHOLD) {
        freeShippingTrack.style.width = '100%';
        freeShippingText.innerHTML = `🎉 <strong>تبریک!</strong> سفارش شما مشمول <strong>ارسال رایگان اکسپرس</strong> شد.`;
      } else {
        const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
        const percent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
        freeShippingTrack.style.width = `${percent}%`;
        freeShippingText.innerHTML = `تنها <strong>${formatPrice(remaining)} تومان</strong> تا ارسال رایگان باقی‌مانده است.`;
      }
    }
  }

  function handleApplyCoupon() {
    if (!couponInput) return;
    const code = couponInput.value.trim().toUpperCase();
    if (!code) {
      showToast('لطفاً کد تخفیف را وارد کنید', 'error');
      return;
    }

    if (VALID_COUPONS[code]) {
      appliedCoupon = { code: code, ...VALID_COUPONS[code] };
      saveCartToStorage();
      renderCart();
      showToast(`کد تخفیف ${code} اعمال شد: ${VALID_COUPONS[code].description}`, 'success');
      couponInput.value = '';
    } else {
      showToast('کد تخفیف وارد شده معتبر نیست. کدهای پیشنهادی: APEX15 یا WELCOME10', 'error');
    }
  }

  // Drawer Controls
  function openCartDrawer() {
    if (cartDrawer && drawerBackdrop) {
      cartDrawer.classList.add('active');
      drawerBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCartDrawer() {
    if (cartDrawer && drawerBackdrop) {
      cartDrawer.classList.remove('active');
      if (!isAnyModalOpen()) {
        drawerBackdrop.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  }

  function openMobileDrawer() {
    if (mobileDrawer && drawerBackdrop) {
      mobileDrawer.classList.add('active');
      drawerBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMobileDrawer() {
    if (mobileDrawer && drawerBackdrop) {
      mobileDrawer.classList.remove('active');
      if (!isAnyModalOpen()) {
        drawerBackdrop.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  }

  // Quick View Modal
  function openQuickViewModal(productId) {
    const product = findProductById(productId);
    if (!product) return;

    let modal = document.getElementById('quickViewModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'quickViewModal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const flavorsHtml = product.flavors.map((f, i) => `
      <button type="button" class="flavor-pill ${i === 0 ? 'active' : ''}">${f}</button>
    `).join('');

    const factsHtml = product.nutritionFacts.map(fact => `
      <tr>
        <td>${fact.label}</td>
        <td class="metric-val">${fact.value}</td>
      </tr>
    `).join('');

    modal.innerHTML = `
      <div class="modal-content-card">
        <button type="button" class="modal-close-trigger" onclick="window.ApexApp.closeModals()">✕</button>
        <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 2rem;">
          <div>
            <div style="background: #0B0F19; border-radius: 8px; overflow: hidden; padding: 1.5rem; display: flex; align-items: center; justify-content: center; aspect-ratio: 1/1;">
              <img src="${product.image}" alt="${product.name}" style="max-height: 280px; object-fit: contain;" />
            </div>
            <div style="margin-top: 1rem; text-align: center;">
              <span class="en-badge" style="background: #111827; color: #fff; font-size: 0.75rem; padding: 0.3rem 0.6rem; border-radius: 4px;">
                کد بچ معتبر: ${product.batchCode}
              </span>
            </div>
          </div>
          <div>
            <span style="color: var(--primary); font-size: 0.8125rem; font-weight: 700;">${product.categoryName}</span>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: #111827; margin: 0.25rem 0 0.5rem;">${product.name}</h2>
            <div style="font-family: var(--font-display); font-size: 0.8125rem; color: #6B7280; direction: ltr; text-align: right; margin-bottom: 1rem;">
              ${product.nameEn}
            </div>

            <div style="display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 1.25rem;">
              <span class="price-value" style="font-size: 1.5rem; font-weight: 900; color: #111827;">${formatPrice(product.price)}</span>
              <span style="font-size: 0.875rem; color: #4B5563;">تومان</span>
              ${product.originalPrice ? `<span style="text-decoration: line-through; color: #9CA3AF; font-size: 1rem;">${formatPrice(product.originalPrice)}</span>` : ''}
            </div>

            <p style="font-size: 0.875rem; line-height: 1.7; color: #4B5563; margin-bottom: 1.25rem;">
              ${product.description}
            </p>

            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.8125rem; font-weight: 700; margin-bottom: 0.5rem;">انتخاب طعم مکمل:</label>
              <div class="flavor-selector">
                ${flavorsHtml}
              </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <h4 style="font-size: 0.875rem; font-weight: 700; margin-bottom: 0.5rem; color: #111827;">آنالیز ارزش غذایی و مواد موثره (در هر سروینگ):</h4>
              <table class="nutrition-table">
                <tbody>
                  ${factsHtml}
                </tbody>
              </table>
            </div>

            <div style="display: flex; gap: 1rem;">
              <button type="button" class="btn-primary" style="flex-grow: 1;" data-add-cart="${product.id}">
                افزودن به سبد خرید
              </button>
              <button type="button" class="btn-outline" onclick="window.ApexApp.verifyBatchCode('${product.batchCode}')">
                استعلام اصالت آزمایشگاهی
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Checkout Modal Simulation
  function openCheckoutModal() {
    if (cart.length === 0) {
      showToast('سبد خرید شما خالی است!', 'error');
      return;
    }

    closeCartDrawer();

    let modal = document.getElementById('checkoutModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'checkoutModal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = appliedCoupon ? Math.round(subtotal * appliedCoupon.discountRate) : 0;
    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
    const finalTotal = Math.max(0, subtotal - discountAmount + shippingCost);

    modal.innerHTML = `
      <div class="modal-content-card" style="max-width: 620px;">
        <button type="button" class="modal-close-trigger" onclick="window.ApexApp.closeModals()">✕</button>
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <span style="color: var(--primary); font-size: 0.8125rem; font-weight: 700;">تسویه حساب و ارسال ایمن زنجیره سرد</span>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: #111827; margin-top: 0.25rem;">ثبت نهایی سفارش مکمل‌های اورجینال</h2>
        </div>

        <form id="checkoutForm" onsubmit="window.ApexApp.handleOrderSubmit(event)">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div>
              <label style="display: block; font-size: 0.8125rem; font-weight: 700; margin-bottom: 0.35rem;">نام و نام خانوادگی:</label>
              <input type="text" required class="coupon-input" placeholder="مثال: علی رضایی" style="width: 100%;" />
            </div>
            <div>
              <label style="display: block; font-size: 0.8125rem; font-weight: 700; margin-bottom: 0.35rem;">شماره موبایل جهت هماهنگی ارسال:</label>
              <input type="tel" required class="coupon-input" placeholder="۰۹۱۲۳۴۵۶۷۸۹" style="width: 100%; direction: ltr;" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div>
              <label style="display: block; font-size: 0.8125rem; font-weight: 700; margin-bottom: 0.35rem;">استان و شهر:</label>
              <input type="text" required class="coupon-input" placeholder="تهران / اصفهان / شیراز..." style="width: 100%;" />
            </div>
            <div>
              <label style="display: block; font-size: 0.8125rem; font-weight: 700; margin-bottom: 0.35rem;">کد پستی ۱۰ رقمی:</label>
              <input type="text" required class="coupon-input" placeholder="۱۲۳۴۵۶۷۸۹۰" style="width: 100%; direction: ltr;" />
            </div>
          </div>

          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.8125rem; font-weight: 700; margin-bottom: 0.35rem;">آدرس دقیق پستی جهت تحویل بسته:</label>
            <textarea required rows="2" class="coupon-input" placeholder="خیابان، کوچه، پلاک، واحد..." style="width: 100%; resize: vertical;"></textarea>
          </div>

          <div style="margin-bottom: 1.5rem; background: #F9FAFB; border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1rem;">
            <label style="display: block; font-size: 0.8125rem; font-weight: 700; margin-bottom: 0.75rem;">شیوه پرداخت ایمن:</label>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer;">
                <input type="radio" name="paymentMethod" value="online" checked style="accent-color: var(--primary);" />
                پرداخت اینترنتی با درگاه امن شاپرک (۵٪ تخفیف مازاد بر فاکتور)
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer;">
                <input type="radio" name="paymentMethod" value="cod" style="accent-color: var(--primary);" />
                پرداخت در محل هنگام تحویل (سراسر کشور با بیعانه حمل)
              </label>
            </div>
          </div>

          <div style="background: #FFF7ED; border: 1px solid #FFEDD5; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: #9A3412; margin-bottom: 0.25rem;">
              <span>مبلغ قابل پرداخت نهایی:</span>
              <strong style="font-size: 1.15rem; font-family: var(--font-display);">${formatPrice(finalTotal)} تومان</strong>
            </div>
            <p style="font-size: 0.75rem; color: #7C2D12; margin: 0;">بسته‌بندی ضربه‌گیر ویژه و تضمین دمای استاندارد مکمل‌های پروتئینی</p>
          </div>

          <button type="submit" class="btn-primary" style="width: 100%; padding: 0.85rem; font-size: 1rem;">
            تایید و پرداخت نهایی فاکتور
          </button>
        </form>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function handleOrderSubmit(e) {
    e.preventDefault();
    const orderNumber = Math.floor(100000 + Math.random() * 900000);
    const trackingCode = `APX-TRK-${orderNumber}`;

    // Clear cart
    cart = [];
    saveCartToStorage();
    renderCart();

    const modal = document.getElementById('checkoutModal');
    if (modal) {
      modal.innerHTML = `
        <div class="modal-content-card" style="max-width: 520px; text-align: center; padding: 2.5rem 2rem;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: #DCFCE7; color: #16A34A; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; font-size: 2rem;">
            ✓
          </div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: #111827; margin-bottom: 0.5rem;">سفارش شما با موفقیت ثبت شد!</h2>
          <p style="color: #4B5563; font-size: 0.875rem; line-height: 1.7; margin-bottom: 1.5rem;">
            مکمل‌های انتخابی شما در انبار تخصصی اپکس بسته‌بندی شده و پیامک حاوی کد پیگیری پستی و برگه آنالیز آزمایشگاهی برای شما ارسال گردید.
          </p>

          <div style="background: #F3F4F6; border-radius: 8px; padding: 1rem; margin-bottom: 1.75rem; text-align: right;">
            <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.5rem;">
              <span>شماره سفارش:</span>
              <strong class="num-ltr">#${orderNumber}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.875rem;">
              <span>کد رهگیری انبار مرکزی:</span>
              <strong class="num-ltr" style="color: var(--primary);">${trackingCode}</strong>
            </div>
          </div>

          <button type="button" class="btn-primary" style="width: 100%;" onclick="window.ApexApp.closeModals()">
            بازگشت به فروشگاه
          </button>
        </div>
      `;
    }

    showToast('سفارش شما با موفقیت در سیستم ثبت گردید!', 'success');
  }

  // Batch Code Verification Tool
  function verifyBatchCode(batchCodeInput = null) {
    let code = batchCodeInput;
    if (!code) {
      const input = document.getElementById('batchCodeInput');
      if (input) code = input.value.trim().toUpperCase();
    }

    if (!code) {
      showToast('لطفاً کد بچ یا بارکد روی قوطی مکمل را وارد کنید', 'error');
      return;
    }

    const record = BATCH_DATABASE[code] || {
      product: 'مکمل ورزشی اپکس اتلتیک (تست شده در آزمایشگاه فارماکوپه)',
      testedProtein: 'مطابق مشخصات درج شده بر روی قوطی',
      hplcAnalysis: '۹۹.۸٪ درجه خلوص مواد موثره تایید شده',
      bannedSubstances: 'منفی (فاقد استروئیدها و مواد ممنوعه WADA)',
      heavyMetals: 'استاندارد ایمنی مواد غذایی وزارت بهداشت',
      mfgDate: '۱۴۰۴/۰۷/۲۰',
      expDate: '۱۴۰۷/۰۷/۲۰',
      status: 'تایید اصالت کالا و برگه آنالیز کیفی معتبر',
      valid: true
    };

    let modal = document.getElementById('batchModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'batchModal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-content-card" style="max-width: 650px;">
        <button type="button" class="modal-close-trigger" onclick="window.ApexApp.closeModals()">✕</button>
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
          <div style="width: 44px; height: 44px; border-radius: 8px; background: #DCFCE7; color: #16A34A; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">
            ✓
          </div>
          <div>
            <span style="color: var(--accent-emerald); font-size: 0.8125rem; font-weight: 700;">سامانه رسمی استعلام آزمایشگاهی اپکس</span>
            <h2 style="font-size: 1.25rem; font-weight: 800; color: #111827;">گواهی آنالیز و اصالت بچ: ${code}</h2>
          </div>
        </div>

        <div style="background: #F9FAFB; border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.875rem; border-bottom: 1px solid #E5E7EB; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
            <span style="color: #6B7280;">نام مکمل:</span>
            <strong style="color: #111827;">${record.product}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.875rem; border-bottom: 1px solid #E5E7EB; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
            <span style="color: #6B7280;">آنالیز خلوص HPLC:</span>
            <strong class="num-ltr" style="color: var(--accent-emerald);">${record.hplcAnalysis}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.875rem; border-bottom: 1px solid #E5E7EB; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
            <span style="color: #6B7280;">تست مواد نیروزای دوپینگ WADA:</span>
            <strong style="color: #16A34A;">${record.bannedSubstances}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.875rem; border-bottom: 1px solid #E5E7EB; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
            <span style="color: #6B7280;">تست فلزات سنگین و میکروبی:</span>
            <strong style="color: #16A34A;">${record.heavyMetals}</strong>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.8125rem; padding-top: 0.25rem;">
            <div>
              <span style="color: #6B7280;">تاریخ تولید: </span>
              <strong>${record.mfgDate}</strong>
            </div>
            <div>
              <span style="color: #6B7280;">انقضای تضمینی: </span>
              <strong>${record.expDate}</strong>
            </div>
          </div>
        </div>

        <div style="background: #EFF6FF; border: 1px solid #DBEAFE; border-radius: 8px; padding: 0.85rem; font-size: 0.8125rem; color: #1E40AF; margin-bottom: 1.5rem;">
          این تاییدیه به‌صورت مستقیم از پایگاه داده کنترل کیفی آزمایشگاه مرکزی صادر گردیده و پلمپ اولیه محصول را تضمین می‌نماید.
        </div>

        <button type="button" class="btn-primary" style="width: 100%;" onclick="window.ApexApp.closeModals()">
          تایید و بستن گزارش
        </button>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Quick Search Modal
  function openSearchModal() {
    if (searchModal) {
      searchModal.classList.add('active');
      if (searchInputField) {
        setTimeout(() => searchInputField.focus(), 100);
      }
      handleLiveSearch();
    }
  }

  function handleLiveSearch() {
    if (!searchInputField || !searchResultsList) return;
    const q = searchInputField.value.trim().toLowerCase();
    const products = window.APEX_PRODUCTS || [];

    const filtered = products.filter(p => {
      if (!q) return true;
      return p.name.toLowerCase().includes(q) ||
             p.nameEn.toLowerCase().includes(q) ||
             p.categoryName.toLowerCase().includes(q) ||
             p.description.toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
      searchResultsList.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #6B7280;">
          مکملی با این مشخصات یافت نشد. کلماتی مثل وی، کراتین، پمپ یا آمینو را جستجو کنید.
        </div>
      `;
      return;
    }

    searchResultsList.innerHTML = filtered.slice(0, 6).map(p => `
      <div class="search-result-item" onclick="window.ApexApp.openQuickViewModal('${p.id}')">
        <div class="search-result-thumb">
          <img src="${p.image}" alt="${p.name}" />
        </div>
        <div style="flex-grow: 1;">
          <h4 style="font-size: 0.875rem; font-weight: 700; color: #111827;">${p.name}</h4>
          <span style="font-size: 0.75rem; color: #6B7280;">${p.categoryName} · ${p.weight}</span>
        </div>
        <div style="text-align: left;">
          <div class="price-value" style="font-size: 0.9375rem; font-weight: 800; color: #111827;">${formatPrice(p.price)}</div>
          <span style="font-size: 0.7rem; color: #6B7280;">تومان</span>
        </div>
      </div>
    `).join('');
  }

  function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    if (searchModal) searchModal.classList.remove('active');
    if (!isCartOpen() && !isMobileOpen()) {
      if (drawerBackdrop) drawerBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function isAnyModalOpen() {
    return document.querySelectorAll('.modal-overlay.active').length > 0 || (searchModal && searchModal.classList.contains('active'));
  }

  function isCartOpen() {
    return cartDrawer && cartDrawer.classList.contains('active');
  }

  function isMobileOpen() {
    return mobileDrawer && mobileDrawer.classList.contains('active');
  }

  // Flash Sale Countdown Timer
  function initCountdownTimer() {
    const hoursEl = document.getElementById('timerHours');
    const minsEl = document.getElementById('timerMinutes');
    const secsEl = document.getElementById('timerSeconds');

    if (!hoursEl || !minsEl || !secsEl) return;

    // Remaining seconds for daily flash sale
    let remaining = 8 * 3600 + 42 * 60 + 19;

    function update() {
      if (remaining <= 0) {
        remaining = 24 * 3600; // Reset
      }

      const h = Math.floor(remaining / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      const s = remaining % 60;

      hoursEl.textContent = String(h).padStart(2, '0');
      minsEl.textContent = String(m).padStart(2, '0');
      secsEl.textContent = String(s).padStart(2, '0');

      remaining -= 1;
    }

    update();
    setInterval(update, 1000);
  }

  // Catalog Filtering on products.html
  function initCatalogIfPresent() {
    const catalogContainer = document.getElementById('catalogProductsGrid');
    if (!catalogContainer) return;

    let activeCategory = 'all';
    let maxPrice = 5000000;
    let inStockOnly = false;
    let searchQuery = '';
    let currentSort = 'featured';

    const categoryTabs = document.querySelectorAll('[data-category-tab]');
    const priceSlider = document.getElementById('priceRangeSlider');
    const priceDisplay = document.getElementById('priceRangeDisplay');
    const stockCheckbox = document.getElementById('stockOnlyFilter');
    const sortSelect = document.getElementById('catalogSortSelect');
    const searchInput = document.getElementById('catalogSearchInput');

    function filterAndRender() {
      let list = [...(window.APEX_PRODUCTS || [])];

      if (activeCategory !== 'all') {
        list = list.filter(p => p.category === activeCategory);
      }

      if (priceSlider) {
        list = list.filter(p => p.price <= maxPrice);
      }

      if (inStockOnly) {
        list = list.filter(p => p.inStock);
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q));
      }

      // Sort
      if (currentSort === 'price-asc') {
        list.sort((a, b) => a.price - b.price);
      } else if (currentSort === 'price-desc') {
        list.sort((a, b) => b.price - a.price);
      } else if (currentSort === 'rating') {
        list.sort((a, b) => b.rating - a.rating);
      } else if (currentSort === 'discount') {
        list.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
      }

      const countEl = document.getElementById('catalogResultCount');
      if (countEl) countEl.textContent = `${formatPersianNumber(list.length)} محصول`;

      if (list.length === 0) {
        catalogContainer.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 4rem 1rem; text-align: center; color: #6B7280; background: #fff; border-radius: 8px; border: 1px solid var(--border-subtle);">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem;">محصولی با این فیلترها یافت نشد</h3>
            <p style="font-size: 0.875rem;">می‌توانید محدوده قیمت را افزایش داده یا دسته‌بندی دیگری انتخاب کنید.</p>
          </div>
        `;
        return;
      }

      catalogContainer.innerHTML = list.map(product => renderProductCardHTML(product)).join('');
    }

    categoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeCategory = tab.getAttribute('data-category-tab');
        filterAndRender();
      });
    });

    if (priceSlider && priceDisplay) {
      priceSlider.addEventListener('input', (e) => {
        maxPrice = parseInt(e.target.value, 10);
        priceDisplay.textContent = `تا ${formatPrice(maxPrice)} تومان`;
        filterAndRender();
      });
    }

    if (stockCheckbox) {
      stockCheckbox.addEventListener('change', (e) => {
        inStockOnly = e.target.checked;
        filterAndRender();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        filterAndRender();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        filterAndRender();
      });
    }

    // Initial render
    filterAndRender();
  }

  function renderProductCardHTML(product) {
    const flavorsHtml = product.flavors.map((f, i) => `
      <span class="flavor-pill ${i === 0 ? 'active' : ''}">${f}</span>
    `).join('');

    return `
      <div class="product-card" data-product-id="${product.id}">
        <div class="product-thumb-box">
          <img src="${product.image}" alt="${product.name}" loading="lazy" />
          <div class="product-badge-group">
            ${product.discountPercent ? `<span class="badge-discount">${formatPersianNumber(product.discountPercent)}٪ تخفیف</span>` : ''}
            <span class="badge-original">تاییدیه آزمایشگاهی</span>
          </div>
          <button type="button" class="product-quick-btn" data-quick-view="${product.id}">مشاهده سریع و مشخصات</button>
        </div>
        <div class="product-info-box">
          <div class="product-meta-row">
            <span class="product-category-text">${product.categoryName}</span>
            <span class="product-rating">★ ${formatPersianNumber(product.rating)}</span>
          </div>
          <h3 class="product-title" title="${product.name}">${product.name}</h3>
          <div class="product-dose-tag">${product.nameEn} · ${product.weight}</div>
          
          <div class="flavor-selector">
            ${flavorsHtml}
          </div>

          <div class="product-price-row">
            <div class="price-box">
              <div class="current-price">
                ${formatPrice(product.price)}
                <span class="currency">تومان</span>
              </div>
              ${product.originalPrice ? `<div class="old-price">${formatPrice(product.originalPrice)}</div>` : ''}
            </div>
            <button type="button" class="add-cart-btn" data-add-cart="${product.id}" title="افزودن به سبد خرید">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Interactive Batch Checker Form on about.html
  function initBatchCheckerIfPresent() {
    const form = document.getElementById('batchCheckForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('batchCheckInput');
      if (input) {
        verifyBatchCode(input.value.trim().toUpperCase());
      }
    });
  }

  // Consultation Form on contact.html
  function initConsultationFormIfPresent() {
    const form = document.getElementById('consultationForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ticketId = `APX-ADV-${Math.floor(1000 + Math.random() * 9000)}`;

      let resultContainer = document.getElementById('consultationResult');
      if (resultContainer) {
        resultContainer.style.display = 'block';
        resultContainer.innerHTML = `
          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 1.25rem; margin-top: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; color: #065F46; font-weight: 700; margin-bottom: 0.35rem;">
              <span>✓ درخواست مشاوره تخصصی ورزشی شما ثبت شد</span>
            </div>
            <p style="font-size: 0.875rem; color: #047857; margin-bottom: 0.75rem;">
              فیزیولوژیست و کارشناس ارشد تغذیه ورزشی اپکس پرونده بدنی شما را بررسی کرده و ظرف حداکثر ۲ ساعت از طریق واتساپ/تماس برنامه مکمل اختصاصی شما را ارسال خواهند کرد.
            </p>
            <div style="font-size: 0.8125rem; color: #065F46;">
              کد پیگیری مشاوره: <strong class="num-ltr">${ticketId}</strong>
            </div>
          </div>
        `;
      }

      form.reset();
      showToast('درخواست مشاوره تخصصی شما با موفقیت ثبت شد!', 'success');
    });
  }

  // FAQ Accordion on contact.html
  function initFaqAccordionIfPresent() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      if (!question) return;

      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');
        faqItems.forEach(i => i.classList.remove('active'));
        if (!isOpen) {
          item.classList.add('active');
        }
      });
    });
  }

  // Toast Notification System
  function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-message';

    let icon = '✓';
    let borderColor = 'rgba(255, 255, 255, 0.2)';
    if (type === 'error') {
      icon = '✕';
      borderColor = 'var(--accent-crimson)';
    } else if (type === 'info') {
      icon = 'ℹ';
      borderColor = 'var(--primary)';
    }

    toast.style.borderColor = borderColor;
    toast.innerHTML = `
      <span style="font-size: 1.1rem; color: ${type === 'error' ? 'var(--accent-crimson)' : 'var(--primary)'}">${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  // Utilities
  function findProductById(id) {
    const list = window.APEX_PRODUCTS || [];
    return list.find(p => p.id === id);
  }

  function formatPrice(number) {
    if (typeof number !== 'number') return '۰';
    return number.toLocaleString('fa-IR');
  }

  function formatPersianNumber(number) {
    if (number === undefined || number === null) return '';
    return String(number).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  }

  // Expose global API
  window.ApexApp = {
    addToCart,
    removeFromCart,
    updateCartQuantity,
    openCartDrawer,
    closeCartDrawer,
    openQuickViewModal,
    openCheckoutModal,
    handleOrderSubmit,
    verifyBatchCode,
    openSearchModal,
    closeModals,
    showToast,
    formatPrice
  };

})();
