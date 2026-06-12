# 🐾 PETID — Plataforma SaaS de Gestión y Automatización para Negocios Basados en Citas

> **Menos ausencias. Menos trabajo administrativo. Más ingresos.**

PETID es una plataforma SaaS moderna y multi-industria para gestionar citas, clientes, automatizaciones y recuperación de ingresos. Diseñada inicialmente para el sector veterinario, con arquitectura preparada para expandirse a consultorios médicos, odontólogos, centros estéticos y cualquier negocio que trabaje por reservas.

---

## ✨ Funcionalidades MVP

### 🔐 Autenticación Completa
- Registro, inicio de sesión, logout
- Recuperación y restablecimiento de contraseña por email
- Multi-empresa: cada negocio ve únicamente sus datos (Row Level Security)

### 👥 Gestión de Clientes
- Crear, editar y buscar clientes
- Campos: nombre, teléfono, WhatsApp, correo, dirección, notas
- Vista detallada con mascotas asociadas e historial de citas

### 🐕 Módulo Veterinario (Mascotas)
- Registro de mascotas: especie, raza, sexo, peso, color, estado
- Historial médico: consultas, diagnósticos, tratamientos, medicamentos
- Control de vacunas con fechas de vencimiento y recordatorios
- Control de desparasitación con fechas de próxima aplicación

### 📅 Agenda de Citas
- Vista semanal y diaria interactiva
- Crear, editar, reagendar y cancelar citas
- Cambio de estado inline (programada → confirmada → completada)
- Asignación de servicio, cliente y mascota

### 🤖 Automatizaciones
- Recordatorio 24h antes de la cita
- Recordatorio 2h antes de la cita
- Seguimiento post-consulta (24-48h después)
- Recordatorio de vacunas pendientes
- Recordatorio de desparasitación
- Recuperación de espacios cancelados
- Cola de automatizaciones con estado (pendiente / enviado / fallido)

### 🟢 Horarios Disponibles
- Detección automática de espacios cancelados con horario futuro
- Visualización del potencial de ingresos recuperables
- Reasignación de cita con un clic
- Indicadores de urgencia (vence hoy / pronto / disponible)

### 📊 Dashboard
- Estadísticas: clientes totales, mascotas, citas del día, próximas citas
- Vacunas pendientes, horarios disponibles
- Citas de hoy con estado y acceso rápido

---

## 🛠 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite |
| Backend / DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Routing | React Router v6 |
| Fechas | date-fns |
| Iconos | Lucide React |
| Deploy | Vercel |

---

## 📁 Estructura del Proyecto

```
petid/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── .env.example
├── schema.sql              ← Base de datos completa
├── README.md
├── SETUP.md                ← Guía de instalación paso a paso
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles/
    │   └── globals.css     ← Design system completo
    ├── lib/
    │   └── supabase.js
    ├── context/
    │   └── AuthContext.jsx
    ├── components/
    │   ├── layout/
    │   │   ├── AppLayout.jsx + .module.css
    │   │   └── AuthLayout.jsx + .module.css
    │   ├── appointments/
    │   │   └── AppointmentModal.jsx
    │   ├── clients/
    │   │   └── CustomerModal.jsx
    │   ├── medical/
    │   │   ├── MedicalRecordModal.jsx
    │   │   ├── VaccineModal.jsx
    │   │   └── DewormingModal.jsx
    │   └── pets/
    │       └── PetModal.jsx
    └── pages/
        ├── LoginPage.jsx
        ├── RegisterPage.jsx
        ├── ForgotPasswordPage.jsx
        ├── ResetPasswordPage.jsx
        ├── SetupOrganizationPage.jsx
        ├── DashboardPage.jsx + .module.css
        ├── CustomersPage.jsx
        ├── CustomerDetailPage.jsx
        ├── PetsPage.jsx
        ├── PetDetailPage.jsx
        ├── AppointmentsPage.jsx + .module.css
        ├── AutomationsPage.jsx
        └── AvailableSlotsPage.jsx
```

---

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de Supabase

# 3. Ejecutar base de datos
# Copia el contenido de schema.sql y ejecútalo en Supabase SQL Editor

# 4. Iniciar servidor de desarrollo
npm run dev

# 5. Abrir en el navegador
# http://localhost:5173
```

> 📖 Para instrucciones detalladas paso a paso, consulta [SETUP.md](./SETUP.md)

---

## 🗺 Roadmap

### ✅ Versión 1.0 (MVP Actual)
- Autenticación completa
- Multi-empresa con RLS
- Clientes y mascotas
- Historial médico, vacunas, desparasitación
- Agenda semanal/diaria
- Automatizaciones (cola)
- Dashboard y métricas básicas
- Horarios disponibles (recuperación)

### 🔜 Versión 2.0
- Integración WhatsApp Business API
- Envío automático de recordatorios
- Recuperación automática: notificar lista de espera
- Campañas de reactivación de clientes inactivos
- Confirmación de asistencia por enlace

### 🔮 Versión 3.0
- Reportes avanzados y métricas financieras
- Automatizaciones configurables por el usuario
- Segmentación de clientes
- Múltiples sucursales

### 🤖 Versión 4.0
- Inteligencia artificial
- Predicción de ausencias
- Recomendación automática de citas
- Asistente virtual para negocios

---

## 🏗 Arquitectura Multi-Industria

PETID está diseñado para funcionar con cualquier tipo de negocio basado en citas:

**Módulos genéricos** (siempre activos):
- Organizations, Profiles, Customers, Services, Appointments, Automations

**Módulos específicos veterinarios** (desacoplados):
- Pets, Vaccines, Dewormings, Medical Records

Al crear una organización se selecciona el tipo de industria (`veterinary`, `medical`, `dental`, etc.), lo que activa los módulos correspondientes.

---

## 📄 Licencia

Proyecto privado — todos los derechos reservados.
