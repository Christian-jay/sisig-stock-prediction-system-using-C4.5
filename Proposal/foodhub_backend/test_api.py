#!/usr/bin/env python
"""Run this in your terminal. It will prompt for password privately via stdin."""
import os
import sys
import json
import getpass

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'foodhub_backend.settings.development')

import django
django.setup()

from django.test import Client

def main():
    email = "admin@foodhub.local"

    # Prompt for password privately (not echoed to terminal)
    password = getpass.getpass(f"Password for {email}: ")
    if not password:
        print("No password entered. Exiting.")
        return

    client = Client()

    # 1. Get JWT token
    print("\n[1] Requesting JWT token...")
    resp = client.post('/api/auth/token/',
        data=json.dumps({'email': email, 'password': password}),
        content_type='application/json')

    print(f"    Status: {resp.status_code}")
    if resp.status_code != 200:
        print("    Error: Authentication failed")
        return

    token_data = resp.json()
    access_token = token_data.get('access')
    if not access_token:
        print("    No access token in response")
        return

    print("    Success: Got access token")

    auth_header = f"Bearer {access_token}"

    # 2. Test read-only endpoints
    endpoints = [
        ('/api/inventory/ingredients/categories/', 'Categories'),
        ('/api/inventory/ingredients/units/', 'Units'),
        ('/api/inventory/ingredients/summary/', 'Summary'),
        ('/api/inventory/ingredients/', 'Ingredients List'),
    ]

    for url, name in endpoints:
        print(f"\n[2] GET {name} ({url})...")
        resp = client.get(url, HTTP_AUTHORIZATION=auth_header)
        print(f"    Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            # Sanitized summary only
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