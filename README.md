# Hucha 🪙

Tracker de gastos personal mobile-first con Supabase.

## Contraseña de acceso
`hucha2025`

Para cambiarla: edita la constante `PASSWORD` en `src/components/Login.jsx`.

## Setup Supabase
1. Ve al SQL Editor de tu proyecto en Supabase
2. Ejecuta el contenido de `SUPABASE.sql`
3. Listo — las credenciales ya están en `src/lib/supabase.js`

## Deploy en Vercel
1. Sube esta carpeta a un repo de GitHub
2. En Vercel → New Project → importa el repo
3. Framework: Vite (lo detecta solo)
4. Deploy

## Desarrollo local
```bash
npm install
npm run dev
```
