import { apiGet, apiDelete } from '../utils/api.js';
import { API_BASE_URL } from '../utils/config.js';

const MENU_API_BASE = '/menu/menu-items';
const CATEGORIES_API_BASE = '/menu/categories';
const INGREDIENTS_API_BASE = '/inventory/ingredients';

/**
 * MenuService
 * Handles all API communications for Menu Management
 */
export class MenuService {
    async getMenuItems() {
        const response = await apiGet(`${MENU_API_BASE}/?page_size=100&is_active=true`);
        // Handle paginated response
        return response.results || response || [];
    }

    async getCategories() {
        const response = await apiGet(`${CATEGORIES_API_BASE}/`);
        return response.results || response || [];
    }

    async createMenuItem(formData) {
        // For FormData (with image upload), we need to use a custom request
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}${MENU_API_BASE}/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Create menu item error:', response.status, errorText);
            throw new Error(`Failed to create menu item: ${errorText}`);
        }
        return await response.json();
    }

    async updateMenuItem(id, formData) {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}${MENU_API_BASE}/${id}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Update menu item error:', response.status, errorText);
            throw new Error(`Failed to update menu item: ${errorText}`);
        }
        return await response.json();
    }

    async fetchIngredients() {
        const response = await apiGet(`${INGREDIENTS_API_BASE}/?page_size=100`);
        return response.results || response || [];
    }

    async deleteMenuItem(id) {
        return apiDelete(`${MENU_API_BASE}/${id}/`);
    }
}