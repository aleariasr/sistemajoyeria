# Guía de Acceso Multi-Dispositivo

## 🎯 Objetivo
Esta guía te ayudará a configurar el sistema para que puedas acceder desde múltiples dispositivos (celulares, tablets, otras computadoras) en tu red local.

## ✅ Lo Que Necesitas

1. Todos los dispositivos deben estar en la **misma red WiFi**
2. El servidor (backend y frontend) debe estar corriendo en una computadora
3. Conocer la IP local de la computadora del servidor

## 📝 Pasos de Configuración

### Paso 1: Configurar la Computadora del Servidor

#### 1.1 Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend (en otra terminal)
cd frontend
npm install
```

#### 1.2 Crear Archivo .env en Frontend

Si no existe, crea el archivo `frontend/.env` con:

```env
HOST=0.0.0.0
```

Este archivo ya está creado por defecto, pero verifica que exista.

#### 1.3 Iniciar el Backend

```bash
cd backend
npm start
```

**Importante**: El backend mostrará algo como esto:

```
🚀 Servidor corriendo en:
   - Local: http://localhost:3001
   - Red local: http://192.168.1.100:3001
📊 Ambiente: development
✅ Conexión a Supabase establecida

📱 Acceso desde otros dispositivos:
   1. Asegúrate que estén en la misma red WiFi
   2. En el frontend, accede a: http://192.168.1.100:3000
   3. El sistema detectará automáticamente la API correcta
```

**Anota la IP de red local** (en este ejemplo: `192.168.1.100`)

#### 1.4 Iniciar el Frontend

En otra terminal:

```bash
cd frontend
npm start
```

El frontend se abrirá en `http://localhost:3000` pero también estará disponible en tu IP de red.

### Paso 2: Acceder desde Otros Dispositivos

#### 2.1 Desde un Celular o Tablet

1. Asegúrate de estar conectado a la **misma red WiFi**
2. Abre el navegador (Chrome, Safari, Firefox)
3. Ingresa la dirección: `http://[IP-DEL-SERVIDOR]:3000`
   - Ejemplo: `http://192.168.1.100:3000`
4. Verás la pantalla de login
5. Inicia sesión con tus credenciales:
   - Admin: `admin` / `admin123`
   - Dependiente: `dependiente` / `dependiente123`

#### 2.2 Desde Otra Computadora

1. Conéctate a la misma red WiFi
2. Abre el navegador
3. Ingresa: `http://[IP-DEL-SERVIDOR]:3000`
4. Inicia sesión normalmente

## 🔧 Cómo Obtener la IP del Servidor

### En Windows:

```cmd
ipconfig
```

Busca la línea "Dirección IPv4" bajo tu adaptador de red WiFi.
Ejemplo: `192.168.1.100`

### En Mac:

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

O ve a: Preferencias del Sistema > Red > WiFi > detalles

### En Linux:

```bash
hostname -I
```

O:

```bash
ip addr show
```

Busca la dirección IP que comience con `192.168.` o `10.`

## 🐛 Solución de Problemas

### "No puedo conectarme desde mi celular"

**Verificar:**
1. ✅ Ambos dispositivos están en la misma red WiFi
2. ✅ El backend está corriendo (`npm start` en backend/)
3. ✅ El frontend está corriendo (`npm start` en frontend/)
4. ✅ Usas la IP correcta (la que muestra el backend al iniciar)
5. ✅ Incluyes el puerto `:3000` en la URL

**Firewall:**
- Windows: El firewall puede bloquear las conexiones
  - Ve a: Panel de Control > Firewall > Permitir una app
  - Permite Node.js en redes privadas
  
- Mac: Ve a Preferencias del Sistema > Seguridad > Firewall
  - Permite Node en conexiones entrantes

### "Veo la pantalla de login pero no puedo iniciar sesión"

**Este problema fue corregido** con los cambios implementados. El sistema ahora detecta automáticamente la IP correcta del servidor backend.

Si aún tienes problemas:

1. **Verifica en la consola del navegador** (F12):
   - Busca errores de red
   - Verifica que las peticiones vayan a la IP correcta

2. **Limpia el caché del navegador**:
   - En el celular, elimina el caché y cookies
   - Recarga la página

3. **Verifica CORS**:
   - El backend ya está configurado para aceptar conexiones de IPs locales
   - Si tienes problemas, revisa la consola del backend por mensajes de error

### "Error de conexión al backend"

1. Verifica que el backend esté corriendo
2. Prueba acceder directamente a: `http://[IP-DEL-SERVIDOR]:3001/health`
   - Deberías ver: `{"status":"ok",...}`
3. Si no funciona, verifica el firewall

### "La página carga muy lento"

- Normal en la primera carga
- Refresca si tarda más de 10 segundos
- Verifica la señal WiFi

## 💡 Consejos

1. **Agrega la página a favoritos** en tu celular para acceso rápido
2. **Mantén el servidor encendido** mientras trabajas
3. **Usa siempre la misma red WiFi** para mejor estabilidad
4. **No cierres las terminales** del backend y frontend
5. **IP dinámica**: Si reinicias el router, la IP puede cambiar

## 🔒 Seguridad

- ✅ El sistema está configurado solo para red local
- ✅ No es accesible desde Internet (más seguro)
- ✅ Todos los dispositivos deben estar en tu red WiFi
- ✅ Las contraseñas están encriptadas
- ✅ Las sesiones son independientes por dispositivo

## 📱 Acceso Permanente (Avanzado)

Si quieres un acceso permanente sin depender de tu computadora:

1. **Opción 1: IP Estática Local**
   - Configura una IP estática en tu router
   - El servidor siempre tendrá la misma IP

2. **Opción 2: Despliegue en la Nube**
   - Despliega en Railway, Heroku, o Render
   - Acceso desde cualquier lugar con Internet
   - Ver guía en `backend/GUIA_COMPLETA.md`

## ✅ Verificación Final

Lista de verificación para confirmar que todo funciona:

- [ ] Backend iniciado correctamente
- [ ] Frontend iniciado correctamente
- [ ] IP del servidor identificada
- [ ] Celular conectado a la misma WiFi
- [ ] Acceso exitoso desde celular a `http://[IP]:3000`
- [ ] Login funciona desde celular
- [ ] Puedo ver el dashboard y las joyas
- [ ] Puedo realizar una venta desde el celular

## 📞 Soporte

Si después de seguir esta guía aún tienes problemas:

1. Revisa los logs del backend en la terminal
2. Abre la consola del navegador (F12) y busca errores
3. Verifica que no haya errores de red o CORS
4. Asegúrate de que ambos servidores (backend y frontend) estén corriendo

---

**Última actualización**: 2025-11-21  
**Versión del sistema**: 2.0
