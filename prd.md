# Product Requirements Document (PRD)
## Poultry Farm Management System (G-7)

---

## 1. Overview

**Project Name:** Poultry Farm Management System
**Prepared for:** Ms. Swati Thakur
**Location/Batch:** Bodhala
**One-line description:** A system to manage feed stock, egg production, and vaccination records for a poultry farm.

---

## 2. Problem Statement

Poultry farms currently track feed usage, egg production, and vaccination schedules manually (registers/spreadsheets), which leads to:
- Delayed or missed vaccination schedules
- Inaccurate feed stock tracking, leading to shortages or waste
- No consolidated view of egg production trends
- Difficulty generating reports for decision-making

---

## 3. Goals & Objectives

- Digitize feed, egg production, and vaccination record-keeping
- Provide real-time visibility into stock levels and production trends
- Automate vaccination due-date alerts to reduce missed doses
- Generate exportable reports for farm management/decision-making

### Non-Goals (out of scope for v1)
- Financial/accounting management
- Multi-farm/franchise management
- Mobile app (web-first for v1)

---

## 4. Target Users

| User | Needs |
|---|---|
| Farm Admin/Owner | Full visibility, reports, alerts, stock control |
| Staff/Worker | Simple daily data entry (feed, eggs, vaccination) |
| Vet (optional) | Manage vaccination schedules and history |

---

## 5. User Stories

- As a **Staff member**, I want to log daily feed consumption so stock levels stay accurate.
- As a **Staff member**, I want to enter daily egg collection so production is tracked automatically.
- As an **Admin**, I want to be alerted when feed stock is low so I can reorder in time.
- As an **Admin/Vet**, I want to see upcoming/overdue vaccinations so no batch is missed.
- As an **Admin**, I want to export reports so I can review farm performance periodically.

---

## 6. Functional Requirements

### 6.1 Authentication
- FR1: Users must log in with a username/password
- FR2: System restricts access based on role (Admin/Staff/Vet)

### 6.2 Feed Management
- FR3: Admin can add feed stock entries (type, quantity, date, supplier)
- FR4: Staff can log daily feed consumption per batch/shed
- FR5: System auto-calculates remaining stock
- FR6: System sends alert when stock falls below defined threshold

### 6.3 Egg Production
- FR7: Staff can log daily egg collection (total, damaged, batch, date)
- FR8: System calculates net eggs and production rate per hen
- FR9: System displays production trends (daily/weekly/monthly)

### 6.4 Vaccination Records
- FR10: Admin/Vet can create vaccination schedules (vaccine, batch, due date, dosage)
- FR11: Staff/Vet can mark vaccination as administered
- FR12: System flags upcoming and overdue vaccinations
- FR13: System retains historical vaccination log per batch

### 6.5 Reports & Dashboard
- FR14: Dashboard shows consolidated view (feed, eggs, vaccination status)
- FR15: Admin can export reports as PDF/Excel

---

## 7. Non-Functional Requirements

- **Usability:** Simple data-entry forms usable by non-technical farm staff
- **Performance:** Dashboard loads within 2-3 seconds for typical data volumes
- **Reliability:** No data loss on submission; validated inputs
- **Security:** Role-based access control; passwords stored hashed
- **Scalability:** Support multiple sheds/batches per farm

---

## 8. Success Metrics

- Reduction in missed/late vaccinations (tracked via overdue count)
- Reduction in feed stockouts
- Time saved on manual report generation
- Staff adoption rate (daily active data entries)

---

## 9. Assumptions & Constraints

- Single-farm deployment (v1)
- Internet/local network access available for staff to log data
- Users have basic device literacy (desktop/tablet)

---

## 10. Milestones (Suggested)

| Phase | Deliverable |
|---|---|
| Phase 1 | Auth + role-based dashboard |
| Phase 2 | Feed management module |
| Phase 3 | Egg production module |
| Phase 4 | Vaccination module + alerts |
| Phase 5 | Reports/export + testing |
