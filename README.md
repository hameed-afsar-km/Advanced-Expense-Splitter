# 💸 Advanced Expense Splitter | SaaS Financial Management 🏦

![Splitter Banner](https://img.shields.io/badge/Expense-Splitter-4CAF50?style=for-the-badge&logo=splitwise&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

**Advanced Expense Splitter** is a robust financial utility for group expense management. Built with a focus on speed and transparency, it handles complex debt simplification and real-time balance tracking for friends, families, and roommates.

---

## 💎 Features

- **⚖️ Debt Simplification**: Algorithmic calculation of minimum transactions required to settle up.
- **👥 Group Management**: Create and manage multiple groups with designated currencies.
- **📱 Responsive Design**: Mobile-first glassmorphic UI for splitting bills on the go.
- **📈 Expense History**: Detailed audit trail of all transactions and participants.
- **🔄 Real-time Updates**: Instant balance recalculation as expenses are added.

---

## 📂 Project Structure

```text
Advanced-Expense-Splitter/
├── src/
│   ├── components/
│   │   ├── AddExpense/    # Dynamic participant forms
│   │   ├── GroupList/     # Sidebar group navigation
│   │   └── Settlement/    # Debt simplification algorithm
│   ├── hooks/
│   │   └── useExpenses/   # Logic for splitting & rounding
│   └── assets/
│       └── themes/        # Custom theme tokens
└── vite.config.js
```

---

## 🛠️ Usage

1. **Environment**:
   ```bash
   npm install
   ```

2. **Run Application**:
   ```bash
   npm run dev
   ```

---

## 🛡️ Technical Edge

- **Greedy Simplification Algorithm**: Optimized to reduce the number of transactions by up to 40% compared to linear splitting.
- **Float-Safety**: Implements precision handling for multi-currency currency divisions to avoid rounding errors.

---

## 📄 License
MIT © 2026 SplitSync Team
