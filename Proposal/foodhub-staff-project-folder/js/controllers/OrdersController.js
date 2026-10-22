import { OrderService } from '../services/OrderService.js';
import { CartItem } from '../models/OrderModel.js';

import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';


/**
 * FOODHUB
 * Orders Controller
 *
 * Handles:
 * - Menu rendering
 * - Search
 * - Categories
 * - Cart
 * - Quantity
 * - Payment
 */
class OrdersController {


    constructor() {

        this.orderService = new OrderService();

        this.menuItems = [];

        this.cart = [];

        this.currentCategory = 'sisig';

        this.searchQuery = '';

    }


    /**
     * Initialize page.
     */
    async init() {

        try {

            await this.loadMenu();

            this.bindEvents();

            this.renderMenu();

            this.renderCart();

        } catch (error) {

            console.error(
                'OrdersController initialization failed:',
                error
            );

        }

    }


    /**
     * Load menu data.
     */
    async loadMenu() {

        this.menuItems =
            await this.orderService.getMenuItems();

    }


    /* =====================================================
       MENU
       ===================================================== */


    /**
     * Render menu.
     */
    renderMenu() {

        const container =
            document.getElementById(
                'menuGridContainer'
            );

        if (!container) return;


        const search =
            this.searchQuery
                .trim()
                .toLowerCase();


        const filteredItems =
            this.menuItems.filter(item => {

                const categoryMatch =
                    item.category === this.currentCategory;


                const searchMatch =
                    !search ||
                    item.name
                        .toLowerCase()
                        .includes(search);


                return categoryMatch && searchMatch;

            });


        if (filteredItems.length === 0) {

            container.innerHTML = `

                <div class="menu-empty">

                    <div class="menu-empty-icon">

                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <circle
                                cx="11"
                                cy="11"
                                r="7"
                            ></circle>

                            <line
                                x1="20"
                                y1="20"
                                x2="16"
                                y2="16"
                            ></line>
                        </svg>

                    </div>

                    <h3>No menu items found</h3>

                    <p>
                        Try another menu item or category.
                    </p>

                </div>

            `;

            return;

        }


        container.innerHTML =
            filteredItems
                .map(item => this.createMenuCard(item))
                .join('');


        this.bindMenuCards();

    }


    /**
     * Create menu card.
     */
    createMenuCard(item) {

        return `

            <article
                class="menu-item-box"
                data-menu-id="${item.id}"
                tabindex="0"
                role="button"
                aria-label="Add ${item.name}"
            >

                <img
                    src="${item.image}"
                    alt="${item.name}"
                    class="menu-item-img"
                    loading="lazy"
                >

                <div class="menu-item-details">

                    <span class="menu-item-name">
                        ${item.name}
                    </span>

                    <span class="menu-item-price">
                        ₱${item.price.toFixed(2)}
                    </span>

                </div>

            </article>

        `;

    }


    /**
     * Bind menu card click events.
     */
    bindMenuCards() {

        const cards =
            document.querySelectorAll(
                '.menu-item-box'
            );


        cards.forEach(card => {

            card.addEventListener(
                'click',
                () => {

                    const itemId =
                        Number(
                            card.dataset.menuId
                        );

                    this.addToCart(itemId);

                }
            );


            card.addEventListener(
                'keydown',
                event => {

                    if (
                        event.key === 'Enter' ||
                        event.key === ' '
                    ) {

                        event.preventDefault();

                        const itemId =
                            Number(
                                card.dataset.menuId
                            );

                        this.addToCart(itemId);

                    }

                }
            );

        });

    }


    /* =====================================================
       CART
       ===================================================== */


    /**
     * Add menu item to cart.
     */
    addToCart(itemId) {

        const menuItem =
            this.menuItems.find(
                item => item.id === itemId
            );


        if (!menuItem) return;


        const existing =
            this.cart.find(
                item =>
                    item.menuItem.id === itemId
            );


        if (existing) {

            existing.increase();

        } else {

            this.cart.push(
                new CartItem(menuItem)
            );

        }


        this.renderCart();

    }


    /**
     * Remove entire cart item.
     */
    removeFromCart(itemId) {

        this.cart =
            this.cart.filter(
                item =>
                    item.menuItem.id !== itemId
            );


        this.renderCart();

    }


    /**
     * Increase quantity.
     */
    increaseQuantity(itemId) {

        const item =
            this.cart.find(
                cartItem =>
                    cartItem.menuItem.id === itemId
            );


        if (!item) return;


        item.increase();

        this.renderCart();

    }


    /**
     * Decrease quantity.
     */
    decreaseQuantity(itemId) {

        const item =
            this.cart.find(
                cartItem =>
                    cartItem.menuItem.id === itemId
            );


        if (!item) return;


        const canDecrease =
            item.decrease();


        if (!canDecrease) {

            this.removeFromCart(itemId);

            return;

        }


        this.renderCart();

    }


    /**
     * Clear entire cart.
     */
    clearCart() {

        this.cart = [];

        this.renderCart();

    }


    /**
     * Render cart.
     */
    renderCart() {

        const container =
            document.getElementById(
                'cartItemsContainer'
            );


        const quantityElement =
            document.getElementById(
                'totalQuantity'
            );


        const amountElement =
            document.getElementById(
                'totalAmount'
            );


        const paymentButton =
            document.getElementById(
                'btnPayment'
            );


        if (
            !container ||
            !quantityElement ||
            !amountElement ||
            !paymentButton
        ) {

            return;

        }


        if (this.cart.length === 0) {

            this.renderEmptyCart();

            quantityElement.textContent = '0';

            amountElement.textContent = '₱0.00';

            paymentButton.disabled = true;

            return;

        }


        let totalQuantity = 0;

        let totalAmount = 0;


        const items =
            this.cart.map(cartItem => {

                totalQuantity +=
                    cartItem.quantity;


                totalAmount +=
                    cartItem.getTotalPrice();


                return this.createCartItem(
                    cartItem
                );

            });


        container.innerHTML = `

            <div class="cart-list">

                ${items.join('')}

            </div>

        `;


        quantityElement.textContent =
            totalQuantity;


        amountElement.textContent =
            `₱${totalAmount.toFixed(2)}`;


        paymentButton.disabled = false;


        this.bindCartEvents();

    }


    /**
     * Empty cart state.
     */
    renderEmptyCart() {

        const container =
            document.getElementById(
                'cartItemsContainer'
            );


        container.innerHTML = `

            <div class="empty-cart-state">

                <div class="empty-icon-box">

                    <svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                    >
                        <path d="M3 8h18v13H3z"></path>
                        <path d="M1 3h22v5H1z"></path>
                        <path d="M10 12h4"></path>
                    </svg>

                </div>

                <h3>No Records</h3>

                <p>
                    Add items from the menu
                    to start an order.
                </p>

            </div>

        `;

    }


    /**
     * Create cart item HTML.
     */
    createCartItem(cartItem) {

        const item =
            cartItem.menuItem;


        return `

            <article
                class="cart-item"
                data-cart-id="${item.id}"
            >

                <img
                    src="${item.image}"
                    alt="${item.name}"
                    class="cart-item-image"
                >


                <div class="cart-item-info">

                    <div class="cart-item-name">
                        ${item.name}
                    </div>

                    <div class="cart-item-price">
                        ₱${item.price.toFixed(2)}
                        each
                    </div>

                </div>


                <div class="cart-item-right">

                    <strong class="cart-item-total">
                        ₱${cartItem
                .getTotalPrice()
                .toFixed(2)}
                    </strong>


                    <div class="quantity-control">

                        <button
                            class="quantity-btn decrease-btn"
                            type="button"
                            data-action="decrease"
                            data-id="${item.id}"
                            aria-label="Decrease quantity"
                        >
                            −
                        </button>


                        <span class="quantity-value">
                            ${cartItem.quantity}
                        </span>


                        <button
                            class="quantity-btn increase-btn"
                            type="button"
                            data-action="increase"
                            data-id="${item.id}"
                            aria-label="Increase quantity"
                        >
                            +
                        </button>


                        <button
                            class="remove-item-btn"
                            type="button"
                            data-action="remove"
                            data-id="${item.id}"
                            aria-label="Remove item"
                        >
                            ✕
                        </button>

                    </div>

                </div>

            </article>

        `;

    }


    /**
     * Bind cart controls.
     */
    bindCartEvents() {

        const buttons =
            document.querySelectorAll(
                '[data-action]'
            );


        buttons.forEach(button => {

            button.addEventListener(
                'click',
                event => {

                    event.stopPropagation();


                    const action =
                        button.dataset.action;


                    const itemId =
                        Number(
                            button.dataset.id
                        );


                    switch (action) {

                        case 'increase':

                            this.increaseQuantity(
                                itemId
                            );

                            break;


                        case 'decrease':

                            this.decreaseQuantity(
                                itemId
                            );

                            break;


                        case 'remove':

                            this.removeFromCart(
                                itemId
                            );

                            break;

                    }

                }
            );

        });

    }


    /* =====================================================
       EVENTS
       ===================================================== */


    bindEvents() {

        /* ---------------------------------------------
           CATEGORY
           --------------------------------------------- */

        const categoryTabs =
            document.querySelectorAll(
                '.cat-tab'
            );


        categoryTabs.forEach(tab => {

            tab.addEventListener(
                'click',
                () => {

                    categoryTabs.forEach(
                        button =>
                            button.classList.remove(
                                'active'
                            )
                    );


                    tab.classList.add('active');


                    this.currentCategory =
                        tab.dataset.category;


                    this.renderMenu();

                }
            );

        });


        /* ---------------------------------------------
           SEARCH
           --------------------------------------------- */

        const searchInput =
            document.getElementById(
                'menuSearchInput'
            );


        searchInput?.addEventListener(
            'input',
            event => {

                this.searchQuery =
                    event.target.value;


                this.renderMenu();

            }
        );


        /* ---------------------------------------------
           CLEAR CART
           --------------------------------------------- */

        document
            .getElementById('btnClearCart')
            ?.addEventListener(
                'click',
                () => {

                    this.clearCart();

                }
            );


        /* ---------------------------------------------
           PAYMENT
           --------------------------------------------- */

        document
            .getElementById('btnPayment')
            ?.addEventListener(
                'click',
                () => {

                    this.processPayment();

                }
            );


        /* ---------------------------------------------
           CUSTOMER
           --------------------------------------------- */

        document
            .getElementById('btnSelectCustomer')
            ?.addEventListener(
                'click',
                () => {

                    alert(
                        'Customer selection will be connected here.'
                    );

                }
            );

    }


    /* =====================================================
       PAYMENT
       ===================================================== */


    processPayment() {
        if (this.cart.length === 0) return;

        const orderType = document.getElementById('orderTypeSelect')?.value || 'Takeout';

        const orderData = {
            orderId: '#' + Math.floor(1000 + Math.random() * 9000),
            timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            customerName: 'Juan Dela Cruz',
            orderType: orderType, // <-- Added orderType here
            items: this.cart.map(cartItem => ({
                name: cartItem.menuItem.name,
                quantity: cartItem.quantity,
                price: cartItem.menuItem.price
            }))
        };

        localStorage.setItem('foodhub_current_order', JSON.stringify(orderData));
        window.location.href = 'payment.html';
    }

}


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        loadSidebarNav();

        loadTopNavbar();


        const controller =
            new OrdersController();


        await controller.init();

    }
);