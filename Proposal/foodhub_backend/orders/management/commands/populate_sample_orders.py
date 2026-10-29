"""
Management command to populate sample orders for testing.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random

from accounts.models import User
from menu.models import MenuItem
from orders.models import Order, OrderItem, OrderStatus, PaymentMethod


class Command(BaseCommand):
    help = 'Populate database with sample orders for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Number of days of sample orders to create (default: 7)'
        )
        parser.add_argument(
            '--orders-per-day',
            type=int,
            default=15,
            help='Average number of orders per day (default: 15)'
        )

    def handle(self, *args, **options):
        days = options['days']
        avg_orders_per_day = options['orders_per_day']

        self.stdout.write(f'Creating sample orders for the last {days} days...')

        # Get admin user
        admin_user = User.objects.filter(email='admin@foodhub.com').first()
        if not admin_user:
            admin_user = User.objects.filter(username='admin').first()
        if not admin_user:
            self.stdout.write(self.style.ERROR('Admin user not found!'))
            return
        self.stdout.write(f'Using admin user: {admin_user.email}')

        # Get available menu items
        menu_items = list(MenuItem.objects.filter(is_active=True, status='AVAILABLE'))
        if not menu_items:
            self.stdout.write(self.style.ERROR('No menu items found! Please run populate_sample_data first.'))
            return
        self.stdout.write(f'Found {len(menu_items)} menu items')

        payment_methods = [PaymentMethod.CASH, PaymentMethod.GCASH, PaymentMethod.MAYA, PaymentMethod.FOODPANDA]
        order_types = ['DINE_IN', 'TAKEOUT']

        # Status distribution (mostly completed for sales data)
        status_weights = {
            OrderStatus.COMPLETED: 0.70,
            OrderStatus.PROCESSING: 0.15,
            OrderStatus.PENDING: 0.10,
            OrderStatus.CANCELLED: 0.05,
        }

        total_orders_created = 0

        for days_ago in range(days):
            order_date = timezone.now() - timedelta(days=days_ago)
            # Vary orders per day (50% to 150% of average)
            num_orders = max(1, int(random.uniform(0.5, 1.5) * avg_orders_per_day))

            for order_num in range(num_orders):
                # Random time during business hours (8 AM - 10 PM)
                hour = random.randint(8, 22)
                minute = random.randint(0, 59)
                second = random.randint(0, 59)
                created_at = order_date.replace(hour=hour, minute=minute, second=second, microsecond=0)

                # Create order
                order = Order.objects.create(
                    status=random.choices(
                        list(status_weights.keys()),
                        weights=list(status_weights.values())
                    )[0],
                    payment_method=random.choice(payment_methods),
                    payment_status='PAID' if random.random() > 0.2 else 'UNPAID',
                    notes=random.choice(['', 'Extra spicy', 'No onions', 'Well done', 'Quick please', '']) if random.random() > 0.7 else '',
                    order_type=random.choice(order_types),
                    created_by=admin_user,
                    created_at=created_at,
                )

                # Add 1-5 items to order
                num_items = random.randint(1, min(5, len(menu_items)))
                selected_items = random.sample(menu_items, k=num_items)

                for menu_item in selected_items:
                    quantity = random.randint(1, 3)
                    OrderItem.objects.create(
                        order=order,
                        menu_item=menu_item,
                        quantity=quantity,
                    )

                # Recalculate totals
                order.save()

                # Set completed_at for completed orders
                if order.status == OrderStatus.COMPLETED:
                    order.completed_at = created_at + timedelta(minutes=random.randint(5, 30))
                    order.save(update_fields=['completed_at'])

                total_orders_created += 1

            self.stdout.write(f'Day {days_ago} ({order_date.strftime("%b %d")}): Created {num_orders} orders')

        self.stdout.write(self.style.SUCCESS(f'Successfully created {total_orders_created} sample orders!'))