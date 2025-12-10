# Configuración para Acceso desde Red Local (iPad, Móviles, etc.)

## Problema
Al intentar acceder al sistema desde un iPad u otro dispositivo en la red local, aparece un error de conexión.

## Causa
El sistema necesita que tanto el backend como el frontend estén accesibles desde la misma red local, y el frontend debe saber cómo conectarse al backend usando la IP de la red local.

## Solución

### 1. Verificar que Backend esté Ejecutándose

El backend debe estar corriendo en modo que acepte conexiones de la red local:

```bash
# En el servidor/PC donde corre el backend
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

El frontend tiene **detección automática de IP**, pero para asegurar funcionamiento óptimo:

#### Opción A: Detección Automática (Recomendado)

El frontend detecta automáticamente la IP cuando se accede desde un navegador. Solo necesita:

1. Iniciar el frontend:
   ```bash
   cd frontend
   npm start
   ```

2. En lugar de abrir `localhost:3000`, use la IP del servidor:
   ```
   http://192.168.1.100:3000
   ```
   (Reemplace `192.168.1.100` con su IP real)

3. El frontend automáticamente detectará que está accediendo por IP y usará:
   ```
   http://192.168.1.100:3001/api
   ```

#### Opción B: Configuración Manual (Si la automática falla)

Si la detección automática no funciona:

1. Crear archivo `.env` en la carpeta `frontend/`:
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. Editar `frontend/.env` y configurar:
   ```
   REACT_APP_API_URL=http://192.168.1.100:3001/api
   ```
   (Reemplace `192.168.1.100` con la IP de su servidor)

3. Reiniciar el frontend:
   ```bash
   npm start
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

Si el backend está en Windows, debe permitir conexiones:

```powershell
# Ejecutar como Administrador en PowerShell
New-NetFirewallRule -DisplayName "Node Backend" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

### macOS Firewall

```bash
# macOS normalmente permite conexiones locales por defecto
# Si tiene problemas, vaya a:
# Sistema > Seguridad y Privacidad > Firewall > Opciones
# Y permita conexiones entrantes para Node
```

### Linux (ufw)

```bash
sudo ufw allow 3001/tcp
```

## Solución de Problemas

### Error: "No se puede conectar al servidor backend"

**Posibles causas:**
1. Backend no está corriendo → Iniciar backend
2. IP incorrecta → Verificar IP con `ipconfig` (Windows) o `ifconfig` (Mac/Linux)
3. Firewall bloqueando → Configurar firewall (ver arriba)
4. Red WiFi diferente → Conectar ambos dispositivos a la misma red
5. VPN activa → Desactivar VPN en uno de los dispositivos

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
