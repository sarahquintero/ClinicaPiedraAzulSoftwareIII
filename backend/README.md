# Clínica Piedra Azul — Backend API (Fase 1)

API RESTful construida con **Node.js**, **Express**, **TypeScript**, **Prisma ORM** y **SQLite** para la gestión de médicos, pacientes y citas médicas con autenticación **JWT** y control de acceso basado en roles (**RBAC**: `Público`, `Paciente`, `Administrador`).

---

## Requisitos Previos

- **Node.js** `v20+` (verificado en `v24.21.0`)
- **npm** `v10+` (verificado en `v11.19.0`)

---

## 1. Instalación y Configuración

Desde la raíz del repositorio (`ClinicaPiedraAzul/`), ingresa a la carpeta `backend/`:

```powershell
cd backend
npm install
```

Verifica el archivo `.env` (puedes copiar `.env.example` si configuras un entorno limpio):

```powershell
Copy-Item .env.example .env -Force
```

Variables por defecto en `.env`:

```env
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="clinica_piedra_azul_super_secret_jwt_key_2026_secure"
JWT_EXPIRES_IN="4h"
CORS_ORIGIN="http://localhost:4200"
```

---

## 2. Migración de Base de Datos y Datos Semilla (Seed)

Ejecuta la generación del cliente Prisma, la migración SQLite y la carga de datos semilla:

```powershell
npx prisma migrate dev --name init
npm run prisma:seed
```

> **Atajo rápido todo-en-uno:** `npm run db:setup`

### Credenciales Cargadas en el Seed

| Rol Embebido en JWT | Correo Electrónico | Contraseña | Detalles en Seed |
| :--- | :--- | :--- | :--- |
| `Administrador` | `admin@piedraazul.com` | `Admin123*` | Acceso administrativo total |
| `Paciente` | `paciente@piedraazul.com` | `Paciente123*` | Cédula `1020304050` — **3 citas registradas** (2 programadas y 1 completada) |
| `Paciente` | `carlos.ruiz@piedraazul.com` | `Paciente123*` | Cédula `1098765432` — **1 cita registrada** (control de aislamiento RBAC) |

También se registran **4 especialidades** (*Cardiología*, *Pediatría*, *Medicina Interna*, *Dermatología*) y **4 médicos activos**.

---

## 3. Ejecución del Servidor y Pruebas

### Modo Desarrollo (con recarga automática)
```powershell
npm run dev
```
El servidor quedará disponible en `http://localhost:3000`.

### Compilación y Producción
```powershell
npm run build
npm start
```

### Suite de Pruebas Automatizadas (Vitest + Supertest)
Verifica automáticamente rutas públicas, login JWT, `401` sin token, `403` por rol no autorizado, aislamiento de `mis-citas` y CRUD de administrador:
```powershell
npm test
```

---

## 4. Resumen de Endpoints y Seguridad RBAC

- **`verifyToken`**: Devuelve **`401 Unauthorized`** si no se envía `Authorization: Bearer <token>` o si el JWT es inválido/expirado.
- **`checkRole([...])`**: Devuelve **`403 Forbidden`** si el rol embebido en el JWT (`Paciente` o `Administrador`) no coincide con los roles autorizados.

| Método | Ruta | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Público | Estado operativo del servicio |
| `POST` | `/api/auth/login` | Público | Inicia sesión y devuelve `{ token, user }` con `role` embebido |
| `POST` | `/api/auth/register` | Público | Autorregistro transaccional de nuevo `Paciente` |
| `GET` | `/api/auth/me` | Autenticado | Perfil del usuario en sesión (`401` sin token) |
| `GET` | `/api/especialidades` | Público | Catálogo de especialidades médicas activas |
| `GET` | `/api/medicos` | Público | Directorio de médicos activos para consulta y formularios reactivos |
| `GET` | `/api/pacientes/verificar-cedula/:cedula` | Público | Verifica disponibilidad reactiva (`{ cedula, existe, disponible }`) |
| `GET` | `/api/citas/mis-citas` | `Paciente` | Lista únicamente las citas propias del paciente autenticado |
| `GET` | `/api/medicos/admin` | `Administrador` | Listado administrativo completo de médicos (activos/inactivos y métricas) |
| `POST` | `/api/medicos` | `Administrador` | Registra un nuevo médico en la clínica |
| `PATCH` | `/api/medicos/:id/estado` | `Administrador` | Activa o inactiva un médico |
| `GET` | `/api/pacientes` | `Administrador` | Lista todos los pacientes registrados |
| `POST` | `/api/pacientes` | `Administrador` | Registra un paciente desde administración |
| `GET` | `/api/citas` | `Administrador` | Lista todas las citas médicas de la clínica |
| `POST` | `/api/citas` | `Administrador` | Agenda una cita validando disponibilidad horaria (`409` si se solapa) |
| `PATCH` | `/api/citas/:id/estado` | `Administrador` | Actualiza el estado de una cita (`PROGRAMADA`, `COMPLETADA`, `CANCELADA`) |

---

## 5. Verificación Rápida con `curl` / Postman

Puedes importar directamente la colección lista para usar ubicada en:
`backend/postman/ClinicaPiedraAzul.postman_collection.json`

O probar desde terminal con `curl.exe`:

```powershell
# 1. Rutas públicas (200 OK)
curl.exe -i http://localhost:3000/api/medicos
curl.exe -i http://localhost:3000/api/pacientes/verificar-cedula/1020304050

# 2. Ruta privada sin token -> 401 Unauthorized
curl.exe -i http://localhost:3000/api/pacientes

# 3. Login Paciente y guardar token
$pacLogin = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -ContentType "application/json" -Body '{"email":"paciente@piedraazul.com","password":"Paciente123*"}'
$pacToken = $pacLogin.token

# 4. Paciente consulta sus propias citas -> 200 OK (3 citas)
curl.exe -i -H "Authorization: Bearer $pacToken" http://localhost:3000/api/citas/mis-citas

# 5. Paciente intenta acceder a ruta de Administrador -> 403 Forbidden
curl.exe -i -H "Authorization: Bearer $pacToken" http://localhost:3000/api/pacientes

# 6. Login Administrador y consulta global -> 200 OK
$admLogin = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -ContentType "application/json" -Body '{"email":"admin@piedraazul.com","password":"Admin123*"}'
$admToken = $admLogin.token
curl.exe -i -H "Authorization: Bearer $admToken" http://localhost:3000/api/citas
```
