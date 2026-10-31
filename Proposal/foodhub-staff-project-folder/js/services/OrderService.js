import { MenuItem } from '../models/OrderModel.js';
import { apiGet, apiPost } from '../utils/api.js';

/**
 * FOODHUB
 * Order Service
 *
 * Responsible for retrieving menu data from Django API.
 */
export class OrderService {

    /**
     * Get all menu items from Django backend.
     */
    async getMenuItems() {
        try {
            const response = await apiGet('/menu/menu-items/');

            // Handle paginated response
            const items = response.results || response;

            // Map database categories to frontend categories (sisig, extra)
            const categoryMap = {
                'Sisig Specials': 'sisig',
                'Rice Meals': 'sisig',
                'Appetizers': 'extra',
                'Beverages': 'extra',
                'Desserts': 'extra',
                'sisig': 'sisig',
                'extra': 'extra'
            };

            return items.map(item => new MenuItem(
                item.id,
                item.name,
                parseFloat(item.price),
                categoryMap[item.category_name] || 'sisig',
                item.image_url || item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80'
            ));
        } catch (error) {
            console.error('Failed to fetch menu items from API:', error);

            // Fallback to mock data if API fails
            console.warn('Falling back to mock menu data');
            return this.getMockMenuItems();
        }
    }

    /**
     * Fallback mock menu items (used when API is unavailable).
     */
    getMockMenuItems() {
        return [
            // ==========================================
            // KATEGORYANG: sisig
            // ==========================================
            new MenuItem(1, "Sisig", 55.00, "sisig", "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(2, "Sizzler", 99.00, "sisig", "https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(3, "Meal", 85.00, "sisig", "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(4, "Solo", 100.00, "sisig", "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(5, "Duo", 120.00, "sisig", "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(6, "Family", 145.00, "sisig", "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(7, "Dabarkads", 205.00, "sisig", "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(8, "Party", 255.00, "sisig", "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(9, "Lichon kawali", 150.00, "sisig", "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(10, "Pork Sisig Special", 135.00, "sisig", "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(11, "Tofu Sisig", 110.00, "sisig", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(12, "Bangus Sisig", 140.00, "sisig", "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(15, "Special Tuna Sisig", 155.00, "sisig", "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(16, "Crispy Dinuguan Sisig", 145.00, "sisig", "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(17, "Beef Sisig Rice", 165.00, "sisig", "https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(18, "Chili Sisig Master", 130.00, "sisig", "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(19, "Cheesy Baked Sisig", 175.00, "sisig", "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(20, "Overload Sisig Bowl", 190.00, "sisig", "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(21, "Spicy Mushroom Sisig", 115.00, "sisig", "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(22, "Ultimate Barkada Sisig", 320.00, "sisig", "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&auto=format&fit=crop&q=80"),

            // ==========================================
            // KATEGORYANG: extra
            // ==========================================
            new MenuItem(23, "Small Bilao", 750.00, "extra", "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(24, "Medium Bilao", 950.00, "extra", "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(25, "Large Bilao", 1250.00, "extra", "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(26, "Extra Rice", 25.00, "extra", "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(27, "Plain Egg", 20.00, "extra", "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(28, "Iced Tea (Glass)", 35.00, "extra", "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(29, "Soda in Can", 50.00, "extra", "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(30, "Garlic Rice", 35.00, "extra", "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(31, "Bottled Water", 25.00, "extra", "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(33, "Calamansi Dip", 10.00, "extra", "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(34, "Hot Sauce Pack", 10.00, "extra", "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(36, "Red Horse Stallion", 85.00, "extra", "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(37, "Blue Lemonade Pitcher", 120.00, "extra", "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(38, "Cucumber Juice Pitcher", 110.00, "extra", "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(39, "Extra Gravy", 20.00, "extra", "https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80"),
            new MenuItem(40, "Steamed Okra", 30.00, "extra", "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&auto=format&fit=crop&q=80")
        ];
    }

    /**
     * Create a new order via Django API.
     */
    async createOrder(orderData) {
        try {
            return await apiPost('/orders/orders/', orderData);
        } catch (error) {
            console.error('Failed to create order:', error);
            throw error;
        }
    }
}