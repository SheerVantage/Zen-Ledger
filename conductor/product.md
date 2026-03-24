# Initial Concept
Zen Ledger is a personal finance management tool designed to provide clarity and peace of mind over one's wealth.

# Zen Ledger

## Target Users
- Individuals looking for a lightweight, privacy-focused way to track their finances.
- Users who prefer a modern, responsive web application for financial management.
- People who want to categorize and analyze their spending beyond simple bank statements.

## Core Goals
- Provide a clear and immediate overview of current wealth and financial status.
- Simplify the process of recording and categorizing transactions.
- Offer insights into recurring expenses and long-term financial trends.
- Maintain a highly responsive and intuitive user interface.

## Key Features
- **Transaction Card (Core):** The central element of the application. It must be comprehensive, extensible, and include all necessary transaction details in a polished, informative layout.
- **Transaction Input (InputPill):** Uses a configurable version of the `InputPill` component.
    - **Embedded Variant:** Used within the Transaction Card, optimized for in-place editing (no '+' action button).
    - **Global Variant:** Used in the bottom bar for quick entry, maintaining its current behavior and look (including the action button).
- **Embedded Tagging:** Purpose and party tagging features are directly embedded within the `InputPill` component for a seamless entry experience, supporting both inline selection and NLP-driven tagging.
- **Transaction Stream:** A clear, chronological view of all financial activities.
- **Wealth Ledger:** A high-level overview of balances and asset distribution.
- **Categorization & Tagging:** Flexible system for organizing transactions by purpose, category, and party.
- **Recurring Payments:** Automated tracking and management of repeating expenses or income.
- **NLP Transaction Parsing:** Intuitive input method for quickly adding transactions using natural language.
- **Visual Insights:** Graphical representations of spending habits and financial health.
- **Customizable Themes:** Support for different visual styles to suit user preference.
