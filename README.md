# GlowMart Sneaker Price Intelligence Platform

![Java](https://img.shields.io/badge/Java-Backend-orange)
![Spring Boot](https://img.shields.io/badge/SpringBoot-Framework-green)
![Next.js](https://img.shields.io/badge/Next.js-Frontend-black)
![React](https://img.shields.io/badge/React-Frontend-blue)
![MySQL](https://img.shields.io/badge/MySQL-Database-orange)
![Tailwind](https://img.shields.io/badge/TailwindCSS-Styling-38B2AC)
![License](https://img.shields.io/badge/license-MIT-blue)

## Overview

The **GlowMart Platform** is a full-stack sneaker price intelligence and tracking platform designed to provide a comprehensive analytical shopping experience for sneaker enthusiasts.  
The system supports a variety of advanced features including **dynamic size-specific pricing, price history charts, deal scoring algorithms, trend detection, secure user authentication, real-time market data crawling, and automated data seeding**.

The platform is built focusing on a **scalable web architecture using modern backend and frontend technologies**, paired with an elegant, **Apple-inspired UI**. The system follows a **RESTful API architecture with a separated Next.js frontend and Spring Boot backend**, enabling flexible development, high performance, and smooth user experience.

The application emphasizes:

- Sleek, modern, and responsive user interface (Apple-inspired)
- Advanced sneaker analytics and price tracking mechanisms
- Secure authentication and authorization (JWT)
- Modular and maintainable backend architecture
- Automated data generation algorithms

---

## Project Information

| Category | Details |
|--------|--------|
| Project Name | GlowMart Sneaker Price Intelligence Platform |
| Duration | Jan 2026 – Mar 2026 |
| Team Size | 1 Member |
| Role | Project Lead, Full-Stack Developer, Database Designer |

---

## Key Features

### User Features

The platform provides a sophisticated sneaker browsing workflow:

- User registration and login
- Secure authentication using JWT & Spring Security
- Advanced sneaker search and filtering (by Brand Slug, Size, etc.)
- View dynamic pricing based on specific shoe sizes
- Clean, Apple-inspired catalog browsing experience

---

### Authentication & Authorization

The system implements secure access control using **Spring Security** and **JWT**.

Features include:

- User registration and login
- Token-based authentication
- Protected API endpoints
- Sessionless authentication mechanism

User roles control access to the platform's secure API resources.

---

### Sneaker Intelligence & Search

The platform allows users to natively explore the sneaker market:

- Browse by specific brands via dynamic server-rendered pages
- View detailed sneaker characteristics
- Filter products by availability and lowest asking prices
- Perform global searches using a clean, functional header search box

---

### Price History & Trend Detection

At its core, GlowMart performs deep analytics on sneaker prices:

- **Price History Charts:** Visualizing market price fluctuations using Chart.js.
- **Trend Detection:** Identifying trending sneakers based on data patterns.
- Highlighting historical peaks and drops to inform purchasing decisions.

---

### Deal Scoring Algorithm

The platform includes a custom algorithm to calculate the best market deals.

Features include:

- Extracting under-priced sneakers globally
- Real-time deal scoring computation
- Ranking sneakers by highest value-for-money
- Highlighting "Great Deals" directly on the UI

---

### Web Crawling & Data Extraction

The platform is equipped with an automated data crawling mechanism to gather real sneaker prices and trends from the market:

- Scheduled background jobs to extract latest sneaker prices across varying sizes
- Scrapes market data to keep price history tracking highly accurate
- Updates the central database with real-world sneaker information dynamically
- Ensures the deal scoring algorithm runs on fresh, real-time data

---

### Automated Data Seeding (DataSeeder)

To support rapid development and testing, a robust backend data generator is built-in.

Features include:

- Automatic generation of Sneaker categories, brands, and mock availability
- Population of random size-specific prices
- Creation of price history timelines
- Ensures the platform has rich, coherent data immediately upon boot

---

## System Architecture

The application follows a **modern full-stack architecture** consisting of three main layers:

```

Client (Next.js / React)
↓
REST API (Spring Boot)   ← [ ETL Sync ] ←   Data Crawl Service (FastAPI)
↓                                                   ↓
Database (MySQL)                           (RapidAPI / SneakerDB)

```

### Frontend

Built with **Next.js (App Router) and React 19**, providing a server-rendered, responsive user interface utilizing **Tailwind CSS**, communicating with the backend through REST APIs.

### Backend

The backend is developed using **Spring Boot 3.3.5** following the **MVC architecture pattern**.

Layers include:

- Controller layer (REST APIs)
- Service layer (business logic & deal scoring algorithms)
- Repository layer (data access via Spring Data JPA)

### Database

The system uses **MySQL** as the relational database for storing:

- Users
- Products & Brands
- Price History
- Size Availability Data

Database interaction is implemented using **JPA (Hibernate)**.

---

## Technology Stack

### Backend

- Java 21
- Spring Boot 3.3.5
- Spring Security
- JWT Authentication
- Spring Data JPA (Hibernate)
- MapStruct & Lombok
- RESTful API

### Data Crawl Service

- Python 3.10+
- FastAPI & Uvicorn
- httpx & BeautifulSoup4 (Web Scraping)
- APScheduler (Task Scheduling)
- Integation with RapidAPI (TheSneakerDatabase API)

### Frontend

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4 & Bootstrap
- Chart.js & React-Chartjs-2
- TypeScript

### Database

- MySQL

---

# Project Structure

```

GlowMart
│
├── crawl-service             # Python FastAPI Crawling Service
│   ├── api_clients/          # RapidAPI / SneakerDB integration
│   ├── main.py               # FastAPI App & scheduler
│   └── requirements.txt      # Python dependencies
│
├── backend
│   ├── src
│   │   └── main
│   │       ├── java
│   │       │   └── com
│   │       │       └── example
│   │       │           ├── config
│   │       │           │   └── SecurityConfig.java
│   │       │           │
│   │       │           ├── controller
│   │       │           │   ├── ProductController.java
│   │       │           │   └── BrandController.java
│   │       │           │
│   │       │           ├── service
│   │       │           │   └── ProductService.java
│   │       │           │
│   │       │           ├── repository
│   │       │           │   └── ProductRepository.java
│   │       │           │
│   │       │           ├── model
│   │       │           │   └── Product.java
│   │       │           │
│   │       │           └── util
│   │       │               └── DataSeeder.java
│   │       │
│   │       └── resources
│   │           ├── application.properties
│   │           └── .env.example
│   │
│   └── pom.xml
│
├── frontend
│   ├── src
│   │   ├── app
│   │   │   ├── brands
│   │   │   │   ├── [slug]
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── components
│   │   │   ├── Header.tsx
│   │   │   └── ProductCard.tsx
│   │   │
│   │   └── styles
│   │       └── globals.css
│   │
│   ├── public
│   │   └── images
│   │
│   ├── .env
│   ├── tailwind.config.ts
│   └── package.json
│
└── README.md

```

---

# Installation Guide

## Clone Repository

```bash
git clone https://github.com/ThanhTan67/GlowMart.git
```

---

# Backend Setup

## Requirements

* Java 21+
* Maven
* MySQL 8.0+

---

## Configure Database

Create database:

```sql
CREATE DATABASE glowmart;
```

Update `backend/.env` (or `application.properties`):

```properties
spring.application.name=backend
server.port=8080

spring.datasource.url=jdbc:mysql://localhost:3306/glowmart
spring.datasource.username=root
spring.datasource.password=yourpassword
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

---

## Run Backend

Navigate to backend folder:

```bash
cd backend
```

Run project:

```bash
./mvnw spring-boot:run
```

Server will run at:

```
http://localhost:8080
```
*Note: Hệ thống tích hợp sẵn DataSeeder làm fallback nếu service crawl không hoạt động.*

---

# Data Crawl Service Setup

Di chuyển vào thư mục dịch vụ cào dữ liệu:

```bash
cd crawl-service
```

Thiết lập môi trường ảo (Virtual Environment) và cài dependencies:

```bash
python -m venv venv
venv\Scripts\activate      # Dành cho hệ điều hành Windows
# source venv/bin/activate # Dành cho macOS/Linux

pip install -r requirements.txt
```

Cấu hình file `.env` chứa các API Key cần thiết (RapidAPI Key). Sau đó khởi chạy Server:

```bash
uvicorn main:app --host 0.0.0.0 --port 8001
```
*Thao tác này sẽ tự động thu thập dữ liệu sneaker từ API bên thứ 3 và gửi request ETL sang Backend API để xử lý đồng bộ.*

---

# Frontend Setup

Navigate to frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

---

# Environment Variables

Create `.env` file in **frontend root directory**.

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

---

# Run Frontend

Start development server:

```bash
npm run dev
```

Frontend will run at:

```
http://localhost:3000
```

---

# API Overview

Example endpoints:

```
GET /api/brands
GET /api/products?brandSlug={slug}
GET /api/products/{id}/price-history
GET /api/products/trends

POST /api/auth/login
POST /api/auth/register
```

---

## Learning Outcomes

Through this project, several important skills were developed:

- Building Server-Side Rendered (SSR) React applications with Next.js App Router
- Implementing advanced, modern Apple-inspired CSS designs using Tailwind
- Designing scalable backend architecture with Spring Boot 3
- Data visualization techniques on the web using Chart.js
- Implementing robust database seeding mechanisms
- Developing highly responsive filtering and search systems

---

## Interface

### Platform Pages

<p align="center">
  <img src="screenshots/glowmart-home.png" width="45%" alt="Home Page">
  <img src="screenshots/glowmart-catalog.png" width="45%" alt="Catalog Page">
</p>

<p align="center">
  <img src="screenshots/glowmart-product-detail.png" width="45%" alt="Product Detail">
  <img src="screenshots/glowmart-trends.png" width="45%" alt="Price Trends">
</p>

---

## Future Improvements

Potential improvements for future development include:

- Real-time price scraping from marketplace APIs
- Push notifications for price drops
- Social features allowing users to share their sneaker "portfolios"
- Machine learning integration for smarter trend forecasting
- Cloud deployment and containerization (Docker & Kubernetes)

---

## Author

**Cao Thanh Tan - Project Lead / Full-Stack Developer**

Responsible for system architecture, backend development, database design, modern UI/UX implementation, and core feature development.

---

## License

This project is developed for educational purposes and is distributed under the MIT License.