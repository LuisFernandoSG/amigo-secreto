# Navidad entre Amigos

Aplicación web para organizar intercambios de regalos navideños (Secret Santa) construida con **React**, **Tailwind CSS** y **MongoDB Atlas**. Permite crear grupos privados, invitar participantes, generar emparejamientos sin repeticiones, controlar cuándo se revela el amigo secreto y gestionar listas de deseos conectadas a productos de Amazon.

## Características principales

- 🎄 Creación de grupos con código único para compartir
- 🧑‍🤝‍🧑 Registro de participantes por parte del anfitrión o mediante enlace directo
- 🔁 Sorteo automático de amigos secretos evitando auto-asignaciones o duplicados
- 🔐 Control de revelación para que sólo el anfitrión determine cuándo se muestran los resultados
- 🎁 Listas de deseos personales con enlaces a Amazon y previsualización usando el ASIN del producto
- 📬 Panel individual para cada participante con acceso al amigo secreto cuando el anfitrión lo habilite

## Requisitos previos

- Node.js 18+
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas/database) con una base de datos y usuario creados

## Configuración rápida

1. Clona el repositorio y entra a la carpeta del proyecto.
2. Crea un archivo `.env` dentro de `server/` siguiendo el formato de `.env.example`:

   ```env
   MONGODB_URI=mongodb+srv://<usuario>:<contraseña>@<cluster>.mongodb.net/secret-santa
   PORT=4000
   CLIENT_ORIGIN=http://localhost:5173
   ```

3. Instala las dependencias (usa tu gestor preferido, por ejemplo `npm` o `pnpm`).

   ```bash
   npm install
   ```

   > Este comando ejecutará la instalación en los directorios `server/` y `client/` gracias a los workspaces configurados en la raíz.

4. Inicia los servidores de desarrollo en paralelo:

   ```bash
   # Terminal 1
   cd server
   npm run dev

   # Terminal 2
   cd client
   npm run dev
   ```

5. Abre `http://localhost:5173` en tu navegador. El frontend utiliza un proxy para reenviar las peticiones `/api` al servidor Express que corre en `http://localhost:4000`.

## Scripts disponibles

### Frontend (`client/`)

- `npm run dev`: inicia Vite en modo desarrollo
- `npm run build`: genera la versión de producción
- `npm run preview`: sirve la compilación de producción

### Backend (`server/`)

- `npm run dev`: inicia el servidor Express con recarga en caliente usando `nodemon`
- `npm run start`: ejecuta la API en modo producción

## Estructura de carpetas

```
.
├── client/          # Aplicación React + Tailwind CSS
├── server/          # API REST con Express y MongoDB
└── README.md
```

## Notas sobre despliegue

- Define `VITE_API_BASE_URL` en la configuración de tu hosting del frontend si la API se expone en un dominio distinto.
- Asegúrate de configurar las reglas de CORS mediante la variable `CLIENT_ORIGIN` en producción.
- El algoritmo de emparejamiento ejecuta un shuffle y garantiza que nadie se asigne a sí mismo; si no encuentra una combinación válida lanzará un error para que el anfitrión lo intente nuevamente.

¡Listo! Con esto podrás coordinar intercambios memorables y sin estrés para tus celebraciones navideñas. 🎅🎁
