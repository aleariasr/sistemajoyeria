# Configuración para Acceso desde Red Local (iPad, Móviles, etc.)

## Problema
Al intentar acceder al sistema desde un iPad u otro dispositivo en la red local, aparece un error de conexión: "No se puede conectar al servidor backend".

## Causa
El frontend React por defecto solo se ejecuta en `localhost`, lo que significa que solo es accesible desde el mismo equipo. Para acceder desde otros dispositivos (móviles, tablets) en la red local, el frontend debe configurarse para escuchar en todas las interfaces de red.

## Solución Rápida

### Configuración Inicial (Solo se hace una vez)

1. **Crear archivo de configuración del frontend:**
   ```bash
   cd frontend
   cp .env.example .env
   ```

   Esto creará un archivo `.env` con `HOST=0.0.0.0`, que permite acceso desde otros dispositivos.

2. **Verificar la configuración:**
   Abra `frontend/.env` y asegúrese de que contenga:
   ```
   HOST=0.0.0.0
   ```

### Uso Diario

1. **Iniciar el backend** (desde la raíz del proyecto):
   ```bash
   npm run start:backend
   ```

   El backend mostrará las IPs disponibles:
   ```
   🚀 Servidor corriendo en puerto 3001
   🌐 Host: 0.0.0.0
   📱 Acceso multi-dispositivo (red local):
      Backend API: http://192.168.1.100:3001
   ```

   **Importante**: Anote la dirección IP mostrada (ej: `192.168.1.100`).

2. **Iniciar el frontend** (desde la raíz del proyecto):
   ```bash
   npm run start:frontend
   ```

   El frontend mostrará:
   ```
   You can now view sistemajoyeria-frontend in the browser.

     Local:            http://localhost:3000
     On Your Network:  http://192.168.1.100:3000
   ```

   **Importante**: Use la dirección "On Your Network" para acceder desde móviles.

3. **Acceder desde su dispositivo móvil/tablet:**
   - Asegúrese de que el dispositivo esté en la **misma red WiFi**
   - Abra el navegador y vaya a: `http://192.168.1.100:3000`
   - Debería ver la pantalla de login
   - El frontend detectará automáticamente el backend en `http://192.168.1.100:3001/api`

## Solución Detallada

### 1. Verificar que Backend esté Ejecutándose

El backend ya está configurado para aceptar conexiones de la red local:

```bash
# Desde la raíz del proyecto
npm run start:backend
```

O si está dentro de la carpeta backend:
```bash
cd backend
npm start
```

El backend debe mostrar algo como:
```
🚀 Servidor corriendo en puerto 3001
🌐 Host: 0.0.0.0
📱 Acceso multi-dispositivo (red local):
   Backend API: http://192.168.1.100:3001
```

**Importante**: Anote la dirección IP mostrada (ej: `192.168.1.100`).

### 2. Configurar Frontend para Red Local

🚨 **PASO CRÍTICO**: El frontend debe tener configurado `HOST=0.0.0.0` para ser accesible desde otros dispositivos.

#### Configuración Requerida (Primera vez)

1. Crear archivo `.env` en la carpeta `frontend/`:
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. Verificar que `frontend/.env` contenga:
   ```
   HOST=0.0.0.0
   ```

   Sin esta configuración, el frontend solo será accesible en `localhost` del mismo equipo.

#### Iniciar el Frontend

1. Desde la raíz del proyecto:
   ```bash
   npm run start:frontend
   ```

   O desde la carpeta frontend:
   ```bash
   cd frontend
   npm start
   ```

2. El frontend mostrará las direcciones disponibles:
   ```
   You can now view sistemajoyeria-frontend in the browser.

     Local:            http://localhost:3000
     On Your Network:  http://192.168.1.100:3000
   ```

3. **Use la dirección "On Your Network"** para acceder desde móviles.

#### Detección Automática de la API

El frontend detecta automáticamente la dirección del backend:
- Si accede desde `localhost:3000` → usará `localhost:3001/api`
- Si accede desde `192.168.1.100:3000` → usará `192.168.1.100:3001/api`

No necesita configurar `REACT_APP_API_URL` en desarrollo local.

#### Opción B: Configuración Manual (Si la automática falla)

Si la detección automática no funciona, puede configurar manualmente:

1. Editar `frontend/.env` y agregar:
   ```
   HOST=0.0.0.0
   REACT_APP_API_URL=http://192.168.1.100:3001/api
   ```
   (Reemplace `192.168.1.100` con la IP de su servidor)

2. Reiniciar el frontend:
   ```bash
   npm run start:frontend
   ```

### 3. Acceder desde iPad u otro Dispositivo

1. Asegúrese de que el dispositivo esté en la **misma red WiFi** que el servidor

2. Abra el navegador en el iPad y vaya a:
   ```
   http://192.168.1.100:3000
   ```
   (Use la IP de su servidor)

3. Debería ver la pantalla de login

4. Si hay error de conexión:
   - Verifique que esté en la misma red WiFi
   - Verifique que el backend esté corriendo (paso 1)
   - Abra la consola del navegador (Safari Developer Tools) para ver mensajes de error
   - Verifique el firewall del servidor (debe permitir conexiones en puerto 3001)

### 4. Verificar Configuración

Para verificar que todo está configurado correctamente:

1. Abra la consola del navegador en el iPad (Safari > Desarrollar > [iPad] > Web Inspector)

2. Busque estos mensajes:
   ```
   🌐 API_URL detectada: http://192.168.1.100:3001/api
   📱 Hostname actual: 192.168.1.100
   🔗 Protocolo: http:
   ```

3. Si ve errores como:
   ```
   ❌ No hay respuesta del backend
   ```
   
   Verifique:
   - Backend está corriendo
   - Firewall permite conexiones
   - Está en la misma red WiFi

## Firewall (Windows/Mac/Linux)

### Windows Firewall

Si el backend/frontend está en Windows, debe permitir conexiones en ambos puertos:

```powershell
# Ejecutar como Administrador en PowerShell
New-NetFirewallRule -DisplayName "Node Backend" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
New-NetFirewallRule -DisplayName "React Frontend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### macOS Firewall

```bash
# macOS normalmente permite conexiones locales por defecto
# Si tiene problemas, vaya a:
# Sistema > Seguridad y Privacidad > Firewall > Opciones
# Y permita conexiones entrantes para Node y React
```

### Linux (ufw)

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
```

## Solución de Problemas

### Error: "No se puede conectar al servidor backend"

**Posibles causas y soluciones:**

1. **Frontend no tiene HOST=0.0.0.0 configurado** ❌ MÁS COMÚN
   - Verificar que existe el archivo `frontend/.env`
   - Verificar que contenga `HOST=0.0.0.0`
   - Si no existe, ejecutar: `cd frontend && cp .env.example .env`
   - Reiniciar el frontend

2. **Backend no está corriendo**
   - Iniciar backend: `npm run start:backend`
   - Verificar que muestre las IPs de red local

3. **IP incorrecta**
   - Verificar IP con `ipconfig` (Windows) o `ifconfig` (Mac/Linux)
   - Usar la IP que muestra el backend al iniciar

4. **Firewall bloqueando**
   - Configurar firewall (ver sección Firewall abajo)
   - Puertos que deben estar abiertos: 3000 (frontend) y 3001 (backend)

5. **Red WiFi diferente**
   - Conectar ambos dispositivos a la misma red
   - Algunos routers tienen "aislamiento de clientes" activado - desactivarlo

6. **VPN activa**
   - Desactivar VPN en uno de los dispositivos

### Error: "CORS bloqueado"

El backend ya está configurado para permitir conexiones desde IPs locales (192.168.x.x, 10.x.x.x, etc.), pero si hay problemas:

1. Verificar en el backend que se ve el mensaje:
   ```
   🚫 CORS bloqueado para origen: http://...
   ```

2. Agregar manualmente en `backend/server.js` si usa un rango de IP no estándar

### Verificar Conectividad

En el iPad, abra Safari y vaya a:
```
http://192.168.1.100:3001/health
```

Si ve un JSON con `"status": "ok"`, el backend es accesible.

## Notas Adicionales

- **Desarrollo**: Use la detección automática de IP (Opción A)
- **Producción**: Configure las variables de entorno `REACT_APP_API_URL` y `FRONTEND_URL` con las URLs de Vercel y Railway
- **Puerto 3000**: El frontend debe estar accesible en puerto 3000 (o configurar en `package.json`)
- **HTTPS**: En red local use `http://`, en producción use `https://`

## Referencia Rápida

| Dispositivo | Backend | Frontend |
|-------------|---------|----------|
| Servidor PC | `npm start` en `backend/` | `npm start` en `frontend/` |
| iPad/Móvil | - | Abrir `http://[IP-SERVIDOR]:3000` |

Ejemplo con IP `192.168.1.100`:
- Backend: Se ejecuta automáticamente en `http://0.0.0.0:3001` (acepta de cualquier IP)
- Frontend: Acceder desde `http://192.168.1.100:3000`
- API: Frontend detecta automáticamente `http://192.168.1.100:3001/api`
