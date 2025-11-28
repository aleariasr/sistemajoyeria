---
applyTo: "frontend/**/*.{js,jsx}"
---

# Frontend React Guidelines

Al escribir código React para el frontend, sigue estas convenciones:

## Estructura de Código

1. **Componentes**: En `src/components/`
2. **Servicios API**: En `src/services/`
3. **Context**: En `src/context/`
4. **Assets**: En `public/`

## Convenciones

1. **Componentes funcionales**: Usar hooks en lugar de clases
   ```jsx
   const MiComponente = ({ prop1, prop2 }) => {
     const [state, setState] = useState(initialValue);
     
     useEffect(() => {
       // efectos
     }, [dependencies]);
     
     return <div>...</div>;
   };
   ```

2. **Estado global**: Usar Context API (AuthContext para autenticación)

3. **Llamadas API**: Usar servicios en `src/services/` con axios

4. **Routing**: Usar react-router-dom v6

5. **Estilos**: CSS en línea o archivos CSS separados

## Testing

- Tests con React Testing Library
- Ejecutar con: `npm run test --workspace=frontend`

## Conexión al Backend

- API base URL configurable via `REACT_APP_API_URL`
- Por defecto detecta IP automáticamente para multi-dispositivo
