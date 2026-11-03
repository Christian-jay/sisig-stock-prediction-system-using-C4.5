import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';
import { MenuService } from '../services/MenuService.js';

class MenuController {
    constructor() {
        this.menuService = new MenuService();
        this.menuItems = [];
        this.categories = [];
        this.ingredients = [];
        this.selectedIngredients = [];
        this.currentEditId = null;
        this.currentViewId = null;
        this.currentDeleteId = null;

        this.initLayout();
        this.loadInitialData();
        this.setupEventListeners();
    }

    initLayout() {
        loadSidebarNav();
        loadTopNavbar();
    }

    async loadInitialData() {
        try {
            const [menuItems, categories, ingredients] = await Promise.all([
                this.menuService.getMenuItems(),
                this.menuService.getCategories(),
                this.menuService.fetchIngredients()
            ]);
            this.menuItems = menuItems;
            this.categories = categories;
            this.ingredients = ingredients;
            this.renderMenuTable(menuItems);
            this.updateMetrics();
            this.populateCategorySelect();
            this.setupIngredientSearch();
        } catch (error) {
            console.error("Failed to load initial data", error);
        }
    }

    setupEventListeners() {
        // Add Menu Button
        const addBtn = document.getElementById('addMenuBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openAddMenuModal());
        }

        // Modal Close Buttons
        document.getElementById('modalClose')?.addEventListener('click', () => this.closeModal('menuModal'));
        document.getElementById('modalCancel')?.addEventListener('click', () => this.closeModal('menuModal'));
        document.getElementById('viewModalClose')?.addEventListener('click', () => this.closeModal('viewMenuModal'));
        document.getElementById('viewModalCloseBtn')?.addEventListener('click', () => this.closeModal('viewMenuModal'));
        document.getElementById('deleteModalClose')?.addEventListener('click', () => this.closeModal('deleteModal'));
        document.getElementById('deleteCancel')?.addEventListener('click', () => this.closeModal('deleteModal'));

        // Modal Save/Submit
        document.getElementById('addMenuForm')?.addEventListener('submit', (e) => this.handleFormSubmit(e));
        document.getElementById('deleteConfirm')?.addEventListener('click', () => this.confirmDelete());
        document.getElementById('viewModalEdit')?.addEventListener('click', () => this.editFromView());

        // Image Upload
        this.setupImageUpload();

        // Close modal on overlay click
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                    this.closeModal(modal.id);
                });
            }
        });
    }

    setupImageUpload() {
        // Tab switching
        document.querySelectorAll('.image-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                document.querySelectorAll('.image-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.querySelector(`.tab-pane[data-pane="${tabName}"]`).classList.add('active');
            });
        });

        // File input
        const fileInput = document.getElementById('imageFileInput');
        const uploadArea = document.getElementById('imageUploadArea');
        const preview = uploadArea?.querySelector('.upload-preview');
        const previewImg = document.getElementById('imagePreview');
        const removeBtn = uploadArea?.querySelector('.remove-image-btn');

        if (fileInput && uploadArea) {
            // Click to upload
            uploadArea.addEventListener('click', (e) => {
                if (!preview?.classList.contains('active') && e.target !== removeBtn) {
                    fileInput.click();
                }
            });

            // File selected
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.handleImageFile(file);
            });

            // Drag and drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    this.handleImageFile(file);
                }
            });

            // Remove image
            removeBtn?.addEventListener('click', () => {
                this.clearImageUpload();
            });
        }
    }

    handleImageFile(file) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB.');
            return;
        }

        const uploadArea = document.getElementById('imageUploadArea');
        const placeholder = uploadArea?.querySelector('.upload-placeholder');
        const preview = uploadArea?.querySelector('.upload-preview');
        const previewImg = document.getElementById('imagePreview');
        const fileInput = document.getElementById('imageFileInput');

        if (placeholder) placeholder.style.display = 'none';
        if (preview) preview.style.display = 'flex';
        if (previewImg) {
            previewImg.src = URL.createObjectURL(file);
        }
        uploadArea?.classList.add('has-file');

        // Set file on hidden input (files property is read-only, use DataTransfer)
        if (fileInput) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
        }

        // Switch to upload tab
        document.querySelectorAll('.image-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        document.querySelector('.image-tab[data-tab="upload"]').classList.add('active');
        document.querySelector('.tab-pane[data-pane="upload"]').classList.add('active');
    }

    clearImageUpload() {
        const uploadArea = document.getElementById('imageUploadArea');
        const placeholder = uploadArea?.querySelector('.upload-placeholder');
        const preview = uploadArea?.querySelector('.upload-preview');
        const previewImg = document.getElementById('imagePreview');
        const fileInput = document.getElementById('imageFileInput');
        const urlInput = document.querySelector('input[name="image_url"]');

        if (placeholder) placeholder.style.display = 'block';
        if (preview) preview.style.display = 'none';
        if (previewImg) previewImg.src = '';
        if (fileInput) fileInput.value = '';
        if (urlInput) urlInput.value = '';
        uploadArea?.classList.remove('has-file');

        // Switch to URL tab
        document.querySelectorAll('.image-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        document.querySelector('.image-tab[data-tab="url"]').classList.add('active');
        document.querySelector('.tab-pane[data-pane="url"]').classList.add('active');
    }

    // ==================== MODAL MANAGEMENT ====================
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    openAddMenuModal() {
        this.currentEditId = null;
        this.selectedIngredients = [];
        document.getElementById('modalTitle').textContent = 'Add New Menu';
        document.getElementById('addMenuForm').reset();
        document.getElementById('isActiveInput').value = 'true';
        this.clearImageUpload();
        this.updateSelectedIngredientsUI();
        this.populateCategorySelect();
        this.openModal('menuModal');
    }

    openEditMenuModal(item) {
        this.currentEditId = item.id;
        this.selectedIngredients = (item.recipe_ingredients || []).map(ri => ({
            id: ri.ingredient_id || ri.ingredient,
            name: ri.ingredient_name || ri.name,
            unit: ri.unit || ri.ingredient_unit,
            quantity: ri.quantity
        }));
        document.getElementById('modalTitle').textContent = 'Edit Menu';

        const form = document.getElementById('addMenuForm');
        form.name.value = item.name;
        form.price.value = item.price;
        form.category.value = item.category_id || '';
        form.status.value = item.status || 'AVAILABLE';
        form.description.value = item.description || '';
        // Set is_active (default true since list doesn't include it)
        document.getElementById('isActiveInput').value = item.is_active !== false ? 'true' : 'false';

        // Handle existing image
        this.clearImageUpload();
        if (item.image_url) {
            const uploadArea = document.getElementById('imageUploadArea');
            const placeholder = uploadArea?.querySelector('.upload-placeholder');
            const preview = uploadArea?.querySelector('.upload-preview');
            const previewImg = document.getElementById('imagePreview');
            const urlInput = document.querySelector('input[name="image_url"]');

            urlInput.value = item.image_url;
            if (placeholder) placeholder.style.display = 'none';
            if (preview) preview.style.display = 'flex';
            if (previewImg) previewImg.src = item.image_url;
            uploadArea?.classList.add('has-file');
        }

        this.updateSelectedIngredientsUI();
        this.populateCategorySelect();
        this.openModal('menuModal');
    }

    openViewMenuModal(item) {
        this.currentViewId = item.id;
        const body = document.getElementById('viewModalBody');
        const ingredientsHtml = (item.recipe_ingredients || []).map(ri => `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-light);">
                <span>${ri.ingredient_name || ri.name}</span>
                <span>${ri.quantity} ${ri.unit || ri.ingredient_unit}</span>
            </div>
        `).join('') || '<p style="color: var(--slate-muted);">No ingredients assigned</p>';

        body.innerHTML = `
            <div style="display: grid; gap: 16px;">
                <div style="text-align: center;">
                    <img src="${item.image_url || ''}" alt="${item.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiByeD0iMTIiIGZpbGw9IiNmMWY1ZjkiLz4KPHBhdGggZD0iTTEyIDE2TDE4IDIyTTI0IDhIMTYgTDEyIDE2TDggMjJNMTIgMTZMMTYgMjIiIHN0cm9rZT0iIzlhM2I4IiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4='"
                        style="width: 120px; height: 120px; border-radius: 12px; object-fit: cover; background: var(--bg-main);">
                </div>
                <div>
                    <h3 style="font-size: 20px; font-weight: 700; color: var(--slate-dark);">${item.name}</h3>
                    <span class="badge ${(item.status || '').toLowerCase()}" style="margin-top: 8px; display: inline-block;">${item.status || 'AVAILABLE'}</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
                    <div><strong>Category:</strong> ${item.category_name || 'N/A'}</div>
                    <div><strong>Price:</strong> ₱${parseFloat(item.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                    <div><strong>Status:</strong> ${item.status || 'AVAILABLE'}</div>
                </div>
                <div>
                    <strong>Description:</strong>
                    <p style="margin-top: 4px; color: var(--slate-muted);">${item.description || 'No description'}</p>
                </div>
                <div>
                    <strong>Recipe Ingredients:</strong>
                    <div style="margin-top: 8px;">${ingredientsHtml}</div>
                </div>
            </div>
        `;
        this.openModal('viewMenuModal');
    }

    openDeleteModal(item) {
        this.currentDeleteId = item.id;
        document.getElementById('deleteMenuName').textContent = item.name;
        this.openModal('deleteModal');
    }

    editFromView() {
        const item = this.menuItems.find(i => i.id === this.currentViewId);
        if (item) {
            this.closeModal('viewMenuModal');
            this.openEditMenuModal(item);
        }
    }

    // ==================== FORM HANDLING ====================
    async handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        // Backend doesn't accept image_url (it's a read-only serializer method field)
        // Remove it from FormData
        formData.delete('image_url');

        // Backend doesn't accept recipe_ingredients in MenuItem create/update (read_only in serializer)
        // We'll skip sending it for now - recipe ingredients would need a separate API endpoint
        formData.delete('recipe_ingredients');

        // Ensure category field name is correct (backend expects 'category', not 'category_id')
        // The form now uses name="category" so this should be automatic

        try {
            let savedItem;
            if (this.currentEditId) {
                savedItem = await this.menuService.updateMenuItem(this.currentEditId, formData);
            } else {
                savedItem = await this.menuService.createMenuItem(formData);
            }
            this.closeModal('menuModal');

            // Update local menuItems with the response (which has image_url)
            // instead of re-fetching the list (which doesn't have image_url)
            if (this.currentEditId) {
                const index = this.menuItems.findIndex(item => item.id === this.currentEditId);
                if (index !== -1) {
                    this.menuItems[index] = savedItem;
                }
            } else {
                this.menuItems.unshift(savedItem);
            }
            this.renderMenuTable(this.menuItems);
            this.updateMetrics();

            // Show success notification
            this.showToast(this.currentEditId ? 'Menu item updated successfully' : 'Menu item created successfully');
        } catch (error) {
            console.error('Failed to save menu item:', error);
            alert('Failed to save menu item. Please try again.');
        }
    }

    async confirmDelete() {
        if (!this.currentDeleteId) return;
        try {
            await this.menuService.deleteMenuItem(this.currentDeleteId);
            this.closeModal('deleteModal');
            // Remove from local array
            this.menuItems = this.menuItems.filter(item => item.id !== this.currentDeleteId);
            this.renderMenuTable(this.menuItems);
            this.updateMetrics();
        } catch (error) {
            console.error('Failed to delete menu item:', error);
            alert('Failed to delete menu item. Please try again.');
        }
    }

    // ==================== INGREDIENT MANAGEMENT ====================
    setupIngredientSearch() {
        const searchInput = document.getElementById('ingredientSearch');
        const dropdown = document.getElementById('ingredientDropdown');

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length < 1) {
                dropdown.classList.remove('active');
                return;
            }

            const filtered = this.ingredients.filter(ing =>
                ing.name.toLowerCase().includes(query) &&
                !this.selectedIngredients.find(si => si.id === ing.id)
            );

            if (filtered.length > 0) {
                dropdown.innerHTML = filtered.map(ing => `
                    <div class="ingredient-option" data-id="${ing.id}" data-name="${ing.name}" data-unit="${ing.unit}">
                        <div class="ingredient-option-name">${ing.name}</div>
                        <div class="ingredient-option-unit">${ing.unit}</div>
                    </div>
                `).join('');

                dropdown.querySelectorAll('.ingredient-option').forEach(opt => {
                    opt.addEventListener('click', () => this.addIngredient(opt.dataset));
                });
                dropdown.classList.add('active');
            } else {
                dropdown.classList.remove('active');
            }
        });

        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });

        // Clear search on focus
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.length >= 1) {
                searchInput.dispatchEvent(new Event('input'));
            }
        });
    }

    addIngredient(data) {
        if (this.selectedIngredients.find(i => i.id === data.id)) return;

        this.selectedIngredients.push({
            id: data.id,
            name: data.name,
            unit: data.unit,
            quantity: 1
        });

        document.getElementById('ingredientSearch').value = '';
        document.getElementById('ingredientDropdown').classList.remove('active');
        this.updateSelectedIngredientsUI();
    }

    removeIngredient(id) {
        this.selectedIngredients = this.selectedIngredients.filter(i => i.id !== id);
        this.updateSelectedIngredientsUI();
    }

    updateSelectedIngredientsUI() {
        const list = document.getElementById('selectedIngredientsList');
        list.innerHTML = this.selectedIngredients.map(i => `
            <div class="selected-ingredient-row">
                <div class="selected-ingredient-info">
                    <div class="selected-ingredient-name">${i.name}</div>
                    <div class="selected-ingredient-unit">${i.unit}</div>
                </div>
                <input type="number" class="selected-ingredient-qty" value="${i.quantity}" min="0.01" step="0.01" data-id="${i.id}">
                <button type="button" class="selected-ingredient-remove" data-id="${i.id}" title="Remove">×</button>
            </div>
        `).join('');

        // Add event listeners for quantity inputs and remove buttons
        list.querySelectorAll('.selected-ingredient-qty').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const ingredient = this.selectedIngredients.find(i => i.id === id);
                if (ingredient) {
                    ingredient.quantity = parseFloat(e.target.value) || 0;
                }
            });
        });

        list.querySelectorAll('.selected-ingredient-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.removeIngredient(e.target.dataset.id);
            });
        });
    }

    // ==================== DATA RENDERING ====================
    populateCategorySelect() {
        const select = document.getElementById('categorySelect');
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select category...</option>' +
            this.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        select.value = currentValue;
    }

    updateMetrics() {
        document.getElementById('totalMenuItems').textContent = this.menuItems.length;
        document.getElementById('availableItems').textContent = this.menuItems.filter(i => i.status === 'AVAILABLE' && i.is_active !== false).length;
        document.getElementById('unavailableItems').textContent = this.menuItems.filter(i => i.status === 'UNAVAILABLE' || i.is_active === false).length;
        document.getElementById('categoryCount').textContent = this.categories.length;
    }

    showToast(message) {
        // Create toast element
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: var(--success);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;

        // Add animation keyframes if not exists
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    renderMenuTable(items) {
        const tbody = document.getElementById('menuTableBody');
        if (!tbody) return;

        tbody.innerHTML = items.map(item => `
            <tr>
                <td>
                    <div class="menu-item-thumb">
                        <img src="${item.image_url || ''}" alt="${item.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iI2YxZjVmOSIvPgo8cGF0aCBkPSJNMTIgMTZMMTggMjJNMjQgOEgxNk0xMiAxNkw4IDIyTTEyIDE2TDE2IDIyIiBzdHJva2U9IiM5NGEzYjgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg=='">
                    </div>
                </td>
                <td>
                    <div class="menu-item-cell">
                        <div>
                            <div class="menu-item-name">${item.name}</div>
                            ${item.description ? `<div class="menu-item-category">${item.description.substring(0, 50)}${item.description.length > 50 ? '...' : ''}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td>${item.category_name || 'N/A'}</td>
                <td>₱${parseFloat(item.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                <td>
                    <span class="badge ${(item.status || 'AVAILABLE').toLowerCase()}">${item.status || 'AVAILABLE'}</span>
                </td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-sm" onclick="viewMenu(${item.id})">View</button>
                        <button class="btn-sm" onclick="editMenu(${item.id})">Edit</button>
                        <button class="btn-sm-danger" onclick="deleteMenu(${item.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Update stats
        document.getElementById('totalMenuItems').textContent = items.length;
        document.getElementById('availableItems').textContent = items.filter(i => i.status === 'AVAILABLE').length;
        document.getElementById('unavailableItems').textContent = items.filter(i => i.status === 'UNAVAILABLE').length;

        // Calculate unique categories
        const uniqueCategories = new Set(items.map(i => i.category_id).filter(Boolean));
        document.getElementById('categoryCount').textContent = uniqueCategories.size;
    }
}

// Global functions for onclick handlers
window.viewMenu = function(id) {
    const controller = window.menuController;
    if (controller) {
        const item = controller.menuItems.find(i => i.id === id);
        if (item) controller.openViewMenuModal(item);
    }
};

window.editMenu = function(id) {
    const controller = window.menuController;
    if (controller) {
        const item = controller.menuItems.find(i => i.id === id);
        if (item) controller.openEditMenuModal(item);
    }
};

window.deleteMenu = function(id) {
    const controller = window.menuController;
    if (controller) {
        const item = controller.menuItems.find(i => i.id === id);
        if (item) controller.openDeleteModal(item);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.menuController = new MenuController();
});