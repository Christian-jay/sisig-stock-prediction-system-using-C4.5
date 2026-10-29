#!/usr/bin/env python
"""Verify read-only inventory endpoints against development database using force_login."""
import os
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'foodhub_backend.settings.development')

import django
django.setup()

from django.test import Client
from accounts.models import User

def main():
    # Get the existing admin user
    try:
        admin_user = User.objects.get(email='admin@foodhub.local')
        print(f"[1] Found admin user: {admin_user.email} (role={admin_user.role}, is_staff={admin_user.is_staff}, is_superuser={admin_user.is_superuser})")
    except User.DoesNotExist:
        print("Admin user not found")
        return

    client = Client()
    # force_login bypasses password check
    client.force_login(admin_user)
    print("[2] force_login successful")

    endpoints = [
        ('/api/inventory/ingredients/categories/', 'Categories'),
        ('/api/inventory/ingredients/units/', 'Units'),
        ('/api/inventory/ingredients/summary/', 'Summary'),
        ('/api/inventory/ingredients/', 'Ingredients List'),
    ]

    for url, name in endpoints:
        print(f"\n[3] GET {name} ({url})...")
        resp = client.get(url)
        print(f"    Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list):
                print(f"    Count: {len(data)} items")
            elif isinstance(data, dict):
                if 'total_items' in data:
                    print(f"    total_items={data.get('total_items')}, in_stock={data.get('in_stock')}, low_stock={data.get('low_stock')}, out_of_stock={data.get('out_of_stock')}, total_value={data.get('total_value')}")
                else:
                    print(f"    Keys: {list(data.keys())}")
        else:
            print("    Error: Request failed")

if __name__ == '__main__':
    main()