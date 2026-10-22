/**
 * FOODHUB
 * Order Models
 */


/**
 * Menu Item
 */
export class MenuItem {

    constructor(
        id,
        name,
        price,
        category,
        image
    ) {

        this.id = id;
        this.name = name;
        this.price = Number(price);
        this.category = category;
        this.image = image;
    }

}


/**
 * Cart Item
 */
export class CartItem {

    constructor(menuItem, quantity = 1) {

        this.menuItem = menuItem;
        this.quantity = quantity;
    }


    getTotalPrice() {

        return this.menuItem.price * this.quantity;
    }


    increase() {

        this.quantity++;
    }


    decrease() {

        if (this.quantity > 1) {

            this.quantity--;

            return true;
        }

        return false;
    }

}