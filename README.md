# Sisig Corner: Stock Prediction & Inventory Management System using C4.5 Algorithm

An intelligent, data-driven Point of Sale (POS) and inventory management system engineered specifically for food businesses specializing in sisig and Filipino comfort food. The platform integrates real-time front-of-house order handling with advanced machine learning capabilities powered by the C4.5 decision tree algorithm to predict ingredient demand, automate stock replenishment, and minimize operational food waste.

---

## 📌 Executive Summary

Modern restaurant operations require tight coupling between sales activity and supply chain decisions. **Sisig Corner / FOODHUB** bridges this gap by utilizing historical transaction logs, item categorizations, seasonal ordering spikes, and order fulfilment types (*Dine-in* vs. *Takeout*) to generate predictive inventory models. Through the C4.5 algorithm, the system transforms raw transaction data into decision trees that accurately forecast raw material requirements, allowing management to make data-backed procurement decisions.

---

## ✨ Key Features

### 🛒 Point of Sale (POS) & Order Handling
- **Dynamic Menu & Categorization:** Swift navigation across core item groups (e.g., *Sisig*, *Extras*, *Beverages*) with quick item search functionality and smooth vertical scrolling.
- **Order Type Management:** Explicit tracking for *Dine-in* and *Takeout* transactions to evaluate portioning and packaging material demands.
- **Streamlined Cart Operations:** Dynamic total calculations, quantity adjustments, and responsive order items management.

### 💳 Transaction & Payment Processing
- **Itemized Billing Summaries:** Clean table layouts displaying item names, quantities, unit pricing, subtotals, and calculated total amounts due.
- **Payment Confirmation Screen:** Dedicated checkout and payment summary view featuring order IDs, timestamps, customer details, and completion statuses.
- **Customer & Metadata Tracking:** Full audit trail captured per transaction including unique Order IDs, staff roles, and customer identifiers.

### 📊 Machine Learning & Predictive Analytics
- **C4.5 Decision Tree Integration:** Analyzes high-dimensional sales data to classify consumption patterns.
- **Automated Demand Forecasting:** Predicts upcoming ingredient requirements based on daily, weekly, and seasonal sales trends.
- **Waste Reduction Engine:** Generates low-stock and over-stock alerts to reduce food spoilage and control holding costs.

### 📦 Inventory & Back-Office Administration
- **Real-time Stock Deductions:** Automatically adjusts raw inventory counts upon order confirmation.
- **Administrative Suite:** Unified dashboard tracking daily revenue, operational expenses, staff settings, and itemized sales histories.

---

## 🛠️ Technical Stack

- **Frontend:** HTML5, Modern Modular CSS (Flexbox & CSS Grid)
- **Application Logic:** JavaScript (ES6+ Modules)
- **Architecture:** Component-based pattern utilizing dedicated Controllers, Services, and Models (`OrdersController`, `OrderService`, `MenuItem`, `CartItem`)
- **Machine Learning Engine:** C4.5 Decision Tree Classifier (Information Gain Ratio evaluation)
- **Persistence Layer:** Client-side modular storage for seamless cart transfer and multi-page workflow support, with backend REST API readiness

---
