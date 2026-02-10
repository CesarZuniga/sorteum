<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm" alt="pnpm" />
  <img src="https://img.shields.io/badge/i18n-es%20%7C%20en-blueviolet" alt="i18n es|en" />
  <img src="https://img.shields.io/badge/license-Private-red" alt="License" />
</p>

# Sorteum Digital

Plataforma de rifas digitales que permite a administradores crear rifas, gestionar boletos y seleccionar ganadores de forma transparente. Los usuarios pueden explorar rifas activas, reservar boletos y verificar su estado en tiempo real.

---

## Screenshots

| Landing | Detalle de Rifa | Panel Admin |
|---------|----------------|-------------|
| ![Landing](docs/screenshots/landing.png) | ![Raffle Detail](docs/screenshots/raffle-detail.png) | ![Admin Panel](docs/screenshots/admin-panel.png) |

> Coloca capturas en `docs/screenshots/` para que se muestren correctamente.

---

## Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| UI | React 18, shadcn/ui (Radix), Tailwind CSS, lucide-react |
| Backend | Supabase (PostgreSQL, Auth, Storage, RLS, pg_cron) |
| Formularios | React Hook Form + Zod |
| Internacionalizacion | next-intl (Espanol / Ingles) |
| Package Manager | pnpm 10 |

---

## Arquitectura

```
src/
├── app/                          # App Router pages
│   ├── page.tsx                  # Landing (rifas activas, FAQ, metodos de pago)
│   ├── raffles/[id]/page.tsx     # Detalle de rifa + seleccion de boletos
│   ├── check-status/page.tsx     # Verificar estado de boleto
│   ├── contact/page.tsx          # Formulario de contacto
│   ├── login/page.tsx            # Login de admin
│   └── admin/                    # Panel de administracion
│       ├── page.tsx              # Dashboard con metricas
│       ├── raffles/              # CRUD de rifas
│       ├── faqs/                 # CRUD de FAQs
│       ├── payment-methods/      # CRUD de metodos de pago
│       └── settings/             # Configuracion (duracion de reserva)
├── components/                   # Componentes reutilizables
├── lib/
│   ├── data.ts                   # Todas las queries a Supabase (client-side)
│   ├── actions.ts                # Server actions para formularios admin
│   └── definitions.ts            # Tipos TypeScript
├── messages/
│   ├── en.json                   # Traducciones ingles
│   └── es.json                   # Traducciones espanol
└── middleware.ts                  # Proteccion de rutas /admin/*
```

### Base de datos (Supabase)

| Tabla | Descripcion |
|-------|------------|
| `raffles` | Rifas con imagenes, precio, cantidad de boletos, fecha limite |
| `tickets` | Boletos con estado (available/reserved/paid/winner), datos del comprador |
| `faqs` | Preguntas frecuentes con orden personalizable |
| `payment_methods` | Metodos de pago (banco, cuenta, imagen) |
| `settings` | Configuracion del sistema (duracion de reserva) |

### Funciones RPC

- `draw_random_winners(p_raffle_id, p_winner_count)` — Seleccion atomica de ganadores con `FOR UPDATE`
- `get_random_available_tickets(p_raffle_id, p_count, p_exclude_numbers)` — Seleccion aleatoria de boletos disponibles
- `release_expired_reservations()` — Libera boletos con reserva expirada (pg_cron cada minuto)
- `process_pending_raffle_tickets()` — Crea boletos en lotes para rifas nuevas (pg_cron)
- `deactivate_expired_raffles()` — Desactiva rifas cuya fecha limite ya paso (pg_cron)

---

## Requisitos previos

- **Node.js** >= 18
- **pnpm** >= 10
- Cuenta en [Supabase](https://supabase.com) (plan gratuito funciona)

---

## Instalacion

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/sorteum.git
cd sorteum
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

Crea el archivo `.env.local` en la raiz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL="https://TU_PROYECTO.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu_anon_key_aqui"
```

Obtiene estos valores desde tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard) > Settings > API.

### 4. Configurar base de datos

Ejecuta las migraciones SQL en el **SQL Editor** de Supabase Dashboard en este orden:

1. Crea las tablas (`raffles`, `tickets`, `faqs`, `payment_methods`, `settings`) con sus columnas
2. Ejecuta `supabase/migrations/settings_and_expired_reservations.sql` (tabla settings + funciones pg_cron)
3. Ejecuta `supabase/migrations/rls_policies.sql` (politicas de seguridad RLS)

> **Importante:** Habilita la extension `pg_cron` en Supabase Dashboard > Database > Extensions antes de ejecutar las migraciones de pg_cron.

### 5. Crear usuario admin

En Supabase Dashboard > Authentication > Users, crea un usuario con email y contrasena. Este sera tu acceso al panel de administracion.

### 6. Iniciar servidor de desarrollo

```bash
pnpm dev
```

La aplicacion estara disponible en `http://localhost:9005`.

---

## Scripts disponibles

| Comando | Descripcion |
|---------|------------|
| `pnpm dev` | Inicia servidor de desarrollo con Turbopack (puerto 9005) |
| `pnpm build` | Genera build de produccion |
| `pnpm start` | Inicia servidor de produccion |
| `pnpm lint` | Ejecuta ESLint |
| `pnpm typecheck` | Verifica tipos con TypeScript |

---

## Uso

### Flujo publico

1. **Explorar rifas** — La landing muestra todas las rifas activas con precio y cantidad de boletos
2. **Seleccionar boletos** — Entra a una rifa, selecciona boletos manualmente o usa "Quick Select" para seleccion aleatoria
3. **Reservar** — Completa nombre, email y telefono para reservar. Los boletos se reservan por un tiempo configurable (por defecto 15 min)
4. **Pagar** — Realiza la transferencia al metodo de pago indicado
5. **Verificar estado** — En `/check-status` puedes verificar el estado de cualquier boleto

### Flujo admin (`/admin`)

1. **Dashboard** — Metricas generales (ingresos, rifas activas, boletos vendidos)
2. **Rifas** — Crear, editar, eliminar rifas. Los boletos se generan automaticamente via pg_cron
3. **Gestion de boletos** — Por cada rifa: ver boletos paginados, buscar por numero, confirmar pagos, liberar reservas, marcar ganadores
4. **Sorteo** — Seleccionar ganadores aleatoriamente desde boletos pagados
5. **FAQs** — Gestionar preguntas frecuentes
6. **Metodos de pago** — Gestionar bancos/cuentas para transferencias
7. **Configuracion** — Ajustar duracion de reserva de boletos

---

## Seguridad

- **RLS (Row Level Security)** en todas las tablas de Supabase
- **Middleware** protege todas las rutas `/admin/*` verificando sesion server-side
- **Auth checks** en todas las funciones de mutacion en `data.ts` (defensa en profundidad)
- **Validacion Zod** en todos los inputs con limites de longitud
- **Sanitizacion** de errores: no se exponen detalles internos de la BD al cliente
- **Crypto seguro**: `crypto.getRandomValues()` + Fisher-Yates shuffle para seleccion aleatoria
- **Reserva anonima** restringida por RLS: solo puede cambiar `available` -> `reserved`

---

## Internacionalizacion (i18n)

El idioma por defecto es **espanol**. El usuario puede cambiar a ingles desde el selector de idioma en la interfaz. La implementacion es 100% client-side usando `localStorage` + React Context.

Para agregar traducciones:
1. Edita `src/messages/es.json` (espanol)
2. Edita `src/messages/en.json` (ingles)
3. Usa `useTranslations('Namespace')` en componentes

---

## Estructura de la base de datos

```sql
-- Tablas principales
raffles         (id, admin_id, name, description, image_url[], price, total_tickets, tickets_created, end_date, is_active)
tickets         (id, raffle_id, ticket_number, status, purchaser_name, purchaser_email, purchaser_phone_number, purchase_date, reservation_expires_at, is_winner)
faqs            (id, question, answer, order_index)
payment_methods (id, bank_name, account_number, recipient_name, bank_image_url)
settings        (id, reservation_duration_minutes, updated_at)

-- Indices de rendimiento
idx_tickets_raffle_status        ON tickets (raffle_id, status)
idx_tickets_raffle_number        ON tickets (raffle_id, ticket_number)
idx_tickets_raffle_status_number ON tickets (raffle_id, status, ticket_number)
```

---

## Roadmap

- [x] CRUD de rifas con imagenes multiples
- [x] Generacion automatica de boletos via pg_cron
- [x] Reserva de boletos con expiracion automatica
- [x] Seleccion aleatoria de boletos (Quick Select)
- [x] Sorteo de ganadores (manual y automatico)
- [x] Paginacion server-side en admin + infinite scroll en publico
- [x] Busqueda de boletos por numero (admin y publico)
- [x] Internacionalizacion (ES/EN)
- [x] Seguridad: RLS, auth checks, validacion Zod, crypto seguro
- [x] Configuracion de duracion de reserva
- [x] Liberacion automatica de reservas expiradas (pg_cron)
- [ ] Notificaciones por email (confirmacion de reserva, recordatorio de pago)
- [ ] Pasarela de pago integrada (Stripe / MercadoPago)
- [ ] Dashboard con graficas de ventas en tiempo real
- [ ] Exportar lista de boletos/ganadores a CSV
- [ ] PWA (Progressive Web App) con notificaciones push
- [ ] Modo oscuro completo
- [ ] Roles de admin (super admin / operador)

---

## Contribucion

1. Haz fork del repositorio
2. Crea una rama para tu feature:
   ```bash
   git checkout -b feature/mi-nueva-feature
   ```
3. Realiza tus cambios siguiendo las convenciones del proyecto:
   - Componentes en `src/components/`
   - Queries a Supabase en `src/lib/data.ts`
   - Server actions en `src/lib/actions.ts`
   - Tipos en `src/lib/definitions.ts`
   - Traducciones en ambos archivos `src/messages/*.json`
4. Verifica que el proyecto compila:
   ```bash
   pnpm build
   ```
5. Crea un Pull Request con descripcion clara de los cambios

### Convenciones

- **UI**: shadcn/ui + Tailwind CSS. No agregar librerias de componentes adicionales sin justificacion
- **Estado**: `useState`/`useEffect` para estado local. Sin Redux ni Zustand
- **i18n**: Todas las cadenas visibles al usuario deben estar en los archivos de mensajes
- **Seguridad**: Toda funcion de mutacion debe incluir `requireAuthForMutation()` (excepto reserva publica)
- **Validacion**: Zod con `.max()` en todos los campos de entrada

---

## Licencia

Proyecto privado. Todos los derechos reservados.
