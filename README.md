# 👟 Shoe Customizer

### Design Your Shoes. Your Style. Your Identity.

Shoe Customizer is an interactive web application that allows users to explore, design, and customize shoes through an immersive 3D experience.

Users can experiment with different colors, materials, finishes, and customization options to create unique shoe designs. The project combines modern frontend technologies, 3D visualization, and backend services to deliver an engaging customization experience.

🌐 **Live Demo:** https://shoe-customizer.vercel.app/

---

## ✨ Key Features

### 🎨 3D Shoe Customization
- Interactive 3D shoe visualization.
- Customize individual shoe components.
- Choose different colors and materials.
- Change material finishes.
- Explode and assemble shoe components.
- Rotate, zoom, and explore shoes from different angles.
- Camera presets for different viewing perspectives.
- Reset customization options.

### 🛍️ Shopping Experience
- Product catalog and shoe collection showcase.
- Product pricing and quote functionality.
- Shopping cart interface.
- Checkout interface.
- Order management interface.

### 🔐 User & Design Features
- Authentication API.
- Save and manage customized designs.
- Share customized designs.
- Access shared designs through unique links.

### 📱 User Interface
- Interactive landing page.
- Responsive application layout.
- Reusable UI components.
- Navigation bar and footer.
- Modern animations and visual interactions.

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- JavaScript
- Tailwind CSS
- Three.js
- React Three Fiber
- React Three Drei
- Zustand
- React Router
- TanStack Query

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Zod Validation

### Tools & Deployment
- Git & GitHub
- Vercel – Frontend Deployment
- Render – Backend Deployment
- npm Workspaces

---

## 📂 Project Structure

```text
shoe-customizer/
│
├── apps/
│   ├── web/
│   │   ├── public/
│   │   │   ├── models/
│   │   │   └── draco/
│   │   └── src/
│   │       ├── api/
│   │       ├── features/
│   │       ├── landing/
│   │       ├── layout/
│   │       ├── pages/
│   │       ├── store/
│   │       ├── three/
│   │       ├── styles/
│   │       └── ui/
│   │
│   └── api/
│       ├── prisma/
│       ├── src/
│       │   ├── config/
│       │   ├── middleware/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── utils/
│       │   └── validators/
│       └── tests/
│
├── contracts/
├── docs/
├── package.json
├── package-lock.json
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- Git
- PostgreSQL (for local backend development)

### 1. Clone the Repository

```bash
git clone https://github.com/Mannii-yi/shoe-customizer.git
```

### 2. Navigate to the Project

```bash
cd shoe-customizer
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside `apps/web`.

Add:

```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_USE_FIXTURES=false
```

For backend configuration, refer to:

```text
apps/api/.env.example
```

Create `apps/api/.env` and configure the required database connection and authentication variables.

**Important:** Never commit `.env` files or expose database credentials, JWT secrets, or other sensitive information.

### 5. Run the Frontend

From the project root:

```bash
npm run dev -w web
```

Open your browser:

```text
http://localhost:5173
```

### 6. Run the Backend

From the project root:

```bash
npm run dev -w api
```

The backend runs on the configured API port.

---

## 🚀 Deployment

### Frontend – Vercel

The frontend is deployed using Vercel.

Configuration:

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `apps/web` |
| Build Output Directory | `dist` |

Configure these environment variables in Vercel:

```env
VITE_API_BASE_URL=https://shoe-customizer-jo19.onrender.com/api/v1
VITE_USE_FIXTURES=false
```

### Backend – Render

The backend is deployed using Render.

**API Base URL:**

```text
https://shoe-customizer-jo19.onrender.com/api/v1
```

**Health Check Endpoint:**

```text
/health
```

---

## 🧪 Testing & Quality Checks

### Frontend Linting

```bash
npm run lint -w web
```

### Frontend Production Build

```bash
npm run build -w web
```

### Backend Tests

```bash
npm test -w api
```

---

## 👥 Team Contributions & Work Division

The Shoe Customizer project was collaboratively developed by a team of four developers. Each developer was responsible for specific modules, ensuring smooth integration of the frontend, backend, and 3D customization experience.

### Developer A – Namrata

**Focus: 3D Development & Scene Architecture**

Responsibilities:
- Set up the 3D shoe visualization environment.
- Implemented the 3D scene architecture.
- Worked on camera controls and 3D model integration.
- Established scene API contracts.
- Supported integration of the 3D shoe model with the frontend.

### Developer B – Kanika Khati

**Focus: UI/UX & Frontend Components**

Responsibilities:
- Developed shared application layout components.
- Worked on navigation bar and footer integration.
- Built reusable UI components.
- Contributed to frontend styling and design consistency.
- Supported integration of shared frontend components.

### Developer C – Manshi Rawat

**Focus: Backend Development & Database Integration**

Responsibilities:
- Developed backend APIs using Node.js and Express.js.
- Implemented database architecture using Prisma ORM and PostgreSQL.
- Developed authentication functionality.
- Implemented product catalog and pricing services.
- Developed cart and checkout APIs.
- Implemented design sharing and order management services.
- Supported backend deployment and API integration.

### Developer D – Dikshita

**Focus: Frontend Integration & Project Coordination**

Responsibilities:
- Integrated frontend pages and application routing.
- Worked on landing page integration.
- Integrated the 3D customizer experience into the frontend.
- Implemented frontend customization interactions.
- Established frontend API integration foundation.
- Integrated shared routes and application structure.
- Coordinated GitHub branch integration and pull requests.
- Managed merge conflict resolution and integration with the main branch.
- Coordinated frontend deployment and production setup.

### 🤝 Team Collaboration

All four developers collaborated to bring together the 3D visualization system, frontend application, backend services, and database into a unified Shoe Customizer platform.

The project involved collaborative development, GitHub-based version control, pull request reviews, integration testing, and deployment.

---

## 🔮 Future Improvements

- Complete authentication experience.
- Persistent user profiles and saved designs.
- Real payment gateway integration.
- Enhanced shoe model library.
- Additional customization options.
- Improved mobile experience.
- Advanced order tracking.
- Product recommendations.
- Enhanced design-sharing experience.

---

## 📌 Project Status

The application has been integrated and deployed with its frontend and backend architecture.

Some features, including checkout and parts of the authentication experience, may require further development and integration.

---

## 📄 License

This project was developed for educational and demonstration purposes.

---

## ⭐ Show Your Support

If you like this project, consider giving the repository a star!

### Design It. Customize It. Make It Yours. 👟
