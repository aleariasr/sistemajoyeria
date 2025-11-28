# Sistema de Joyería - Copilot Instructions

Este es un repositorio monorepo con backend (Node.js + Express) y frontend (React). El sistema es una aplicación completa de gestión para joyerías con base de datos PostgreSQL en Supabase.

## Estructura del Proyecto

```
sistemajoyeria/
├── backend/              # API Node.js + Express
│   ├── models/          # Modelos de datos
│   ├── routes/          # Rutas API
│   ├── middleware/      # Middleware de autenticación
│   ├── utils/           # Utilidades y validaciones
│   ├── tests/           # Tests del backend
│   ├── server.js        # Servidor principal
│   └── supabase-db.js   # Configuración de base de datos
├── frontend/            # Aplicación React
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── services/    # Servicios API
│   │   └── context/     # Context de autenticación
│   └── public/
├── Procfile            # Configuración Railway
├── railway.json        # Configuración Railway
└── package.json        # Root package con workspaces
```

## Comandos de Desarrollo

### Instalación
```bash
npm install                    # Instala dependencias de root y workspaces
npm run install:backend        # Instala solo backend
npm run install:frontend       # Instala solo frontend
```

### Ejecución
```bash
npm run start:backend          # Inicia el servidor backend (puerto 3001)
npm run start:frontend         # Inicia el frontend React (puerto 3000)
npm run dev:backend            # Backend con nodemon (desarrollo)
```

### Testing
```bash
npm run test:backend           # Ejecuta tests del backend
node production-readiness-test.js  # Verificación pre-deploy
```

### Build
```bash
npm run build:frontend         # Build de producción del frontend
```

## Convenciones de Código

### Backend (Node.js/Express)
- Usar Express Router para organizar rutas por recurso
- Validar datos de entrada en cada endpoint
- Usar middleware de autenticación para rutas protegidas
- Manejar errores con try/catch y respuestas JSON consistentes
- Usar bcryptjs para encriptación de contraseñas
- Configurar CORS apropiadamente para el frontend

### Frontend (React)
- Componentes funcionales con hooks
- Context API para estado global (autenticación)
- Servicios separados para llamadas a la API
- Usar react-router-dom para navegación
- Seguir las convenciones de ESLint de react-app

### Base de Datos
- PostgreSQL con Supabase
- Migraciones en `backend/migrations/`
- Schema principal en `backend/supabase-migration.sql`

## Variables de Entorno

### Backend (.env)
```bash
PORT=3001
NODE_ENV=development
HOST=0.0.0.0
SUPABASE_URL=<url>
SUPABASE_KEY=<key>
CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
SESSION_SECRET=<secret>
```

### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:3001/api
```

## Despliegue

El proyecto usa Railway para despliegue:
- `railway.json` contiene la configuración de build y deploy
- `Procfile` define el comando de inicio
- Usar `npm run start:backend` para iniciar (workspace command)

## Seguridad

- Autenticación con sesiones Express
- Contraseñas encriptadas con bcrypt
- Control de acceso por roles (admin/dependiente)
- Validación de datos de entrada
- CORS configurado para frontend específico

## Notas Importantes

1. Este es un monorepo con npm workspaces - usar `npm run start:backend` en lugar de `cd backend && npm start` para asegurar que las dependencias y el entorno se resuelvan correctamente
2. El backend corre en puerto 3001, frontend en 3000
3. Ejecutar migraciones SQL antes de iniciar en un nuevo ambiente
4. Cloudinary se usa para almacenar imágenes de productos
