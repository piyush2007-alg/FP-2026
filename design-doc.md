# Design Document
## Poultry Farm Management System (G-7)

---

## 1. System Architecture

```
┌───────────────────────┐
│      Client (Browser)   │
│  HTML/CSS/JS Frontend   │
└───────────┬─────────────┘
            │ HTTP/REST API
┌───────────▼─────────────┐
│     Application Server    │
│   (Backend: Flask/Django/ │
│      Node.js/PHP)          │
├───────────────────────────┤
│  Auth │ Feed │ Egg │ Vacc  │
│  Module│Module│Module│Module│
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│        Database             │
│     (MySQL / SQLite)        │
└───────────────────────────┘
```

---

## 2. Module Design

### 2.1 Authentication Module
- Handles login, session/token management, role verification
- Middleware checks role before allowing access to Admin-only routes

### 2.2 Feed Management Module
- **Inputs:** feed type, quantity, date, supplier (stock-in); batch, quantity used, date (consumption)
- **Logic:** `remaining_stock = total_stock_in - total_consumption`
- **Output:** stock level, low-stock alert flag

### 2.3 Egg Production Module
- **Inputs:** batch/shed ID, date, eggs collected, eggs damaged
- **Logic:** `net_eggs = eggs_collected - eggs_damaged`; `production_rate = net_eggs / hen_count`
- **Output:** daily/weekly/monthly production trend data

### 2.4 Vaccination Module
- **Inputs:** vaccine name, batch, due date, dosage, administered date
- **Logic:** compares `due_date` to current date → status: `upcoming` / `overdue` / `completed`
- **Output:** alert list, historical log per batch

### 2.5 Reports/Dashboard Module
- Aggregates data from all modules
- Renders charts (production trends, stock levels) and tables (vaccination status)
- Export handler converts dashboard data to PDF/Excel

---

## 3. Database Schema (ER Overview)

**Users**
| Field | Type |
|---|---|
| id | INT (PK) |
| name | VARCHAR |
| role | ENUM(Admin, Staff, Vet) |
| password_hash | VARCHAR |

**FeedStock**
| Field | Type |
|---|---|
| id | INT (PK) |
| type | VARCHAR |
| quantity | FLOAT |
| date_received | DATE |
| supplier | VARCHAR |

**FeedConsumption**
| Field | Type |
|---|---|
| id | INT (PK) |
| batch_id | INT (FK) |
| quantity_used | FLOAT |
| date | DATE |

**EggProduction**
| Field | Type |
|---|---|
| id | INT (PK) |
| batch_id | INT (FK) |
| date | DATE |
| eggs_collected | INT |
| eggs_damaged | INT |

**Vaccination**
| Field | Type |
|---|---|
| id | INT (PK) |
| batch_id | INT (FK) |
| vaccine_name | VARCHAR |
| due_date | DATE |
| administered_date | DATE (nullable) |
| administered_by | VARCHAR |
| status | ENUM(upcoming, overdue, completed) |

**Batch**
| Field | Type |
|---|---|
| id | INT (PK) |
| shed_name | VARCHAR |
| hen_count | INT |

---

## 4. Relationships

- `Batch` (1) → (many) `FeedConsumption`
- `Batch` (1) → (many) `EggProduction`
- `Batch` (1) → (many) `Vaccination`
- `Users` (1) → (many) actions logged (audit trail, optional)

---

## 5. API Endpoints (Suggested)

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/login | Authenticate user |
| GET | /api/feed/stock | Get current feed stock |
| POST | /api/feed/stock | Add feed stock entry |
| POST | /api/feed/consumption | Log feed consumption |
| GET | /api/eggs | Get egg production records |
| POST | /api/eggs | Log daily egg collection |
| GET | /api/vaccinations | Get vaccination records/status |
| POST | /api/vaccinations | Create/update vaccination entry |
| GET | /api/reports/export | Export dashboard report (PDF/Excel) |

---

## 6. UI Screens (Suggested)

1. **Login screen** — role-based redirect
2. **Dashboard** — summary cards (stock level, today's eggs, upcoming vaccinations)
3. **Feed management screen** — stock table + add/consume forms
4. **Egg production screen** — entry form + trend chart
5. **Vaccination screen** — schedule table with status badges (upcoming/overdue/done)
6. **Reports screen** — filters + export button

---

## 7. Error Handling & Validation

- Reject negative or non-numeric quantities on entry forms
- Prevent duplicate vaccination entries for the same batch/date
- Show inline validation errors on all forms
- Log failed submissions for admin review

---

## 8. Security Considerations

- Passwords hashed (bcrypt) before storage
- Role-based access control on all API routes
- Input sanitization to prevent SQL injection/XSS
- Session/token expiry for inactive users
