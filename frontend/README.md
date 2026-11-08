# Clínica Piedra Azul — Frontend Angular (Fase 3)

Aplicación web construida en **Angular (Standalone Components + SCSS)** bajo metodología **Atomic Design**, diseñada con enfoque de **Accesibilidad para Adultos Mayores (Tercera Edad)**:
- **Paleta:** Azul Celeste Claro (`#F0F8FF` / `#E6F4FE`) y Blanco (`#FFFFFF`) para fondos y paneles, Azul Fuerte (`#0277BD` / `#035388`) para botones principales, y Azul Marino Oscuro (`#0B2545`) para textos de máximo contraste.
- **Tipografía y Botones:** Fuente base de `18px–20px` y botones con área de clic mínima `>= 48x48px` (`min-height: 52px`).
- **Formularios Reactivos (`ReactiveFormsModule`):** `MedicoFormComponent`, `PacienteFormComponent` (con `AsyncValidatorFn` usando `debounceTime(500)` y `switchMap` contra `GET /api/pacientes/verificar-cedula/:cedula`) y `CitaFormComponent`.
- **Seguridad JWT:** `authInterceptor`, `authGuard` y `roleGuard`.

---

## 1. Credenciales de Prueba (Cargadas en el Seed del Backend)

| Rol Embebido en JWT | Correo Electrónico | Contraseña | Detalles |
| :--- | :--- | :--- | :--- |
| `Administrador` | `admin@piedraazul.com` | `Admin123*` | Acceso a `/admin`, `/admin/medicos`, `/admin/pacientes` y `/admin/citas`. |
| `Paciente` | `paciente@piedraazul.com` | `Paciente123*` | Cédula `1020304050` (Camila Andrea Gómez) — **3 citas registradas**. Acceso a `/paciente`. |
| `Paciente` | `carlos.ruiz@piedraazul.com` | `Paciente123*` | Cédula `1098765432` (Carlos Eduardo Ruiz) — **1 cita registrada**. |

---

## 2. Instalación y Ejecución

Asegúrate de tener el servidor `backend/` corriendo en `http://localhost:3000`, y en otra terminal ejecuta:

```powershell
cd frontend
npm install
npm start
```

Abre `http://localhost:4200` en el navegador.

Para compilar para producción:

```powershell
npm run build
```
