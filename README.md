# Jastip Management System

**An internal full-stack management application for a Korea–Indonesia personal shopping (Jastip) business.**

## Project Overview

Jastip Management System is designed for business owners and administrators to manage product catalogs, customer orders, pricing, and order statuses in one place. It supports KRW-to-IDR currency conversion and configurable service fees to assist with day-to-day operations.

> **Scope:** This is an internal admin/owner tool, not a public customer-facing shopping website.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React.js, JavaScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI, RESTful APIs |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Other | Axios, external exchange-rate API |

## Key Features

- **Product catalog and ordering:** Browse products, switch between character themes, and create customer orders.
- **Service fee calculator:** Set an adjustable Jastip service fee percentage and calculate estimated order totals.
- **Product management:** Create, edit, and delete products, including image uploads or image URLs.
- **Currency conversion:** Retrieve KRW-to-IDR exchange rates to calculate product costs, with a fallback rate when the rate service is unavailable.
- **Order management:** View and filter orders, edit order details, and update payment/shipping statuses.

## Application Screenshots

### 1. Product Catalog & Order Management

<img src="https://github.com/user-attachments/assets/49df4575-fa20-4066-ac2e-46058f582b30" width="800" alt="Product catalog and order management screenshot 1" />

<img src="https://github.com/user-attachments/assets/f6f37d14-65a0-4a1b-8a07-9157855bd2fa" width="800" alt="Product catalog and order management screenshot 2" />

Allows administrators to browse products, switch between character themes, create orders, and calculate estimated totals with an adjustable Jastip service fee.

### 2. Product Management & Currency Conversion

<img src="https://github.com/user-attachments/assets/c74554dc-4dae-47d4-9a8b-32551437f144" width="800" alt="Product management and currency conversion screenshot 1" />

<img src="https://github.com/user-attachments/assets/2396e003-e29f-41ad-921b-b506157badc2" width="800" alt="Product management and currency conversion screenshot 2" />

Allows administrators to add, edit, and delete products, upload images, and convert KRW prices to IDR using exchange-rate data.

### 3. Order & Payment Management

<img src="https://github.com/user-attachments/assets/7c52ada3-0d73-4185-b6c4-020e1fd62a9e" width="800" alt="Order and payment management screenshot 1" />

<img src="https://github.com/user-attachments/assets/40dd79d5-bf21-488c-a571-ef5717e3f947" width="800" alt="Order and payment management screenshot 2" />

Allows administrators to review customer orders, filter by status, edit order details, and update order progress from Pending to Completed.

## Installation & Setup

### Prerequisites

- Python and pip
- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Yukris33/Jastip-KOR-INDO.git
cd Jastip-KOR-INDO
```

### 2. Set up PostgreSQL

Create an empty database named `jastip_db` using pgAdmin or the PostgreSQL command line:

```sql
CREATE DATABASE jastip_db;
```

### 3. Configure the backend

The FastAPI backend files (`main.py`, `database.py`, etc.) are located in the **repository root**, not in a separate `backend/` directory.

Create a Python virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows (PowerShell):

```powershell
.venv\Scripts\Activate.ps1
```

Or on macOS/Linux:

```bash
source .venv/bin/activate
```

Install backend packages:

```bash
python -m pip install fastapi uvicorn sqlalchemy psycopg2-binary python-dotenv
```

Create a `.env` file in the repository root and set your local database connection:

```dotenv
DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/jastip_db
```

Replace `YOUR_PASSWORD` with your own local PostgreSQL password. **Never commit `.env` to GitHub.**

Start the backend:

```bash
uvicorn main:app --reload
```

The API normally runs at `http://127.0.0.1:8000`. Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### 4. Run the frontend

Open another terminal in the repository root, then run:

```bash
npm install
npm run dev
```

Open the local URL shown by Vite (normally `http://localhost:5173`). Keep the FastAPI backend running in the first terminal.

> **Development note:** The current frontend uses `http://127.0.0.1:8000` as its local API address, and the FastAPI CORS settings allow `http://localhost:5173`. If you run either service at a different address, update the matching API/CORS settings. The repository does not yet contain a `requirements.txt`, so the Python installation command above lists the principal backend packages explicitly. These setup steps are based on the source code and have not been independently run end to end.

## Project Structure

```text
Jastip-KOR-INDO/
├── src/                # React components and frontend code
├── main.py             # FastAPI routes and business logic
├── database.py         # Database connection and session
├── models.py           # SQLAlchemy database models
├── schemas.py          # API request/response schemas
├── package.json        # Frontend dependencies and Vite scripts
├── index.html          # Frontend HTML entry point
├── .gitignore          # Ignored local and generated files
└── README.md           # Project documentation
```

## Notes

- The field names `tax_percent` and `tax_idr` remain in parts of the existing API/database for compatibility, but the amount represents a **Jastip service fee**, not a government tax.
- This repository is intended to demonstrate full-stack development, CRUD operations, database integration, pricing logic, and order administration.

## Author

**Yukris Chandra** — [GitHub Profile](https://github.com/Yukris33)
