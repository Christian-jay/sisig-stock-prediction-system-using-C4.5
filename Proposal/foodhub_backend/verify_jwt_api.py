#!/usr/bin/env python
"""Verify read-only inventory endpoints using JWT token generated from admin user."""
import os
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'foodhub_backend.settings.development')

import django
django.setup()

from django.test import Client
from accounts.models import User
from rest_framework_simplejwt.tokens import RefreshToken

def main():
    # Get the existing admin user
    try:
        admin_user = User.objects.get(email='admin@foodhub.local')
        print(f"[1] Found admin user: {admin_user.email} (role={admin_user.role}, is_staff={admin_user.is_staff}, is_superuser={admin_user.is_superuser})")
    except User.DoesNotExist:
        print("Admin user not found")
        return

    # Generate JWT token programmatically (no password needed)
    refresh = RefreshToken.for_user(admin_user)
    access_token = str(refresh.access_token)
    print(f"[2] Generated JWT access token: {access_token[:20]}...")

    client = Client()
    auth_header = f"Bearer {access_token}"

    endpoints = [
        ('/api/inventory/ingredients/categories/', 'Categories'),
        ('/api/inventory/ingredients/units/', 'Units'),
        ('/api/inventory/ingredients/summary/', 'Summary'),
        ('/api/inventory/ingredients/', 'Ingredients List'),
        ('/api/inventory/ingredients/low_stock/', 'Low Stock'),
    ]

    all_pass = True
    for url, name in endpoints:
        print(f"\n[3] GET {name} ({url})...")
        resp = client.get(url, HTTP_AUTHORIZATION=auth_header)
        print(f"    Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list):
                print(f"    PASS - Count: {len(data)} items")
                if name == 'Categories' and data:
                    print(f"       Values: {[d.get('value') for d in data]}")
                if name == 'Units' and data:
                    print(f"       Values: {[d.get('value') for d in data]}")
            elif isinstance(data, dict):
                if 'total_items' in data:
                    print(f"    PASS - total_items={data.get('total_items')}, in_stock={data.get('in_stock')}, low_stock={data.get('low_stock')}, out_of_stock={data.get('out_of_stock')}, total_value={data.get('total_value')}")
                elif 'results' in data:  # paginated list
                    print(f"    PASS - Count: {data.get('count')}, Results on page: {len(data.get('results', []))}, Has next: {bool(data.get('next'))}")
                    if data.get('results'):
                        first = data['results'][0]
                        print(f"       First item: {first.get('name')} (qty={first.get('quantity')}, reorder_level={first.get('reorder_level')})")
                else:
                    print(f"    PASS - Keys: {list(data.keys())}")
        else:
            print(f"    FAIL - Status: {resp.status_code}")
            try:
                print(f"       Error: {resp.json()}")
            except:
                print(f"       Error: {resp.content[:200]}")
            all_pass = False

    print("\n" + "="*50)
    if all_pass:
        print("ALL CHECKS PASSED")
    else:
        print("SOME CHECKS FAILED")
    print("="*50)

if __name__ == '__main__':
    main()