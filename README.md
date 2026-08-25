# FBA Manager — Logistics Management System

A full-stack web application for managing FBA (Fulfillment by Amazon) warehouse operations.

## Features

- **Inbound**: Track incoming containers with CTNS, SKIDs, client, destination FC
- **Inventory**: Real-time stock levels (Inbound − Outbound with auto-calculation)
- **Outbound**: Manage deliveries to Amazon FCs with carrier, ISA#, POD tracking
- **FBA Appointments**: Track carrier appointments with Amazon (appointment ID, scheduled times, status)
- **Docking Form**: Dock door assignment tracking
- **Clients**: Client/customer management
- **Users**: Multi-user with Admin/Manager/Staff roles
- **Excel Export**: Export any module to formatted .xlsx

## Stack

| Layer | Technology |
|---|---|
| Backend | Python FastAPI |
| Database | SQLite (zero-config, file-based) |
| Frontend | React + Ant Design |
| Auth | JWT (8-hour sessions) |

## Quick Start

### First-time Setup
1. Install Python 3.10+ from https://python.org
2. Install Node.js 18+ from https://nodejs.org
3. Double-click **install.bat**

### Daily Use
- Double-click **start.bat**
- Open browser to **http://localhost:8000**
- Default login: `admin` / `admin123`

### Development Mode (hot reload)
- Double-click **start_dev.bat**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/docs

## Network Access (LAN)
To allow your team (10 people) to access from other computers:
1. Find your IP: `ipconfig` in Command Prompt
2. Share the URL: `http://YOUR-IP:8000`
3. Make sure Windows Firewall allows port 8000

## Default Accounts

| Username | Password | Role |
|---|---|---|
| admin | admin123 | Admin (full access) |

## Database
- Location: `backend/fba.db` (SQLite file)
- **Backup**: Just copy `fba.db` to back up all data
- Supports 10 concurrent users with zero configuration

## API Documentation
Available at http://localhost:8000/api/docs (Swagger UI)

## Upgrade to PostgreSQL (Optional)
When your data grows large, edit `backend/database.py`:
```python
DATABASE_URL = "postgresql://user:password@localhost/fbadb"
```
