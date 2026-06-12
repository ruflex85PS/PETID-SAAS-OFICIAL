# 📖 SETUP.md — Guía de Instalación Completa para PETID

> Esta guía está escrita para personas sin experiencia técnica. Sigue cada paso exactamente como se indica.

---

## ¿Qué necesitas?

1. Una **Chromebook con Linux activado** (Crostini)
2. Conexión a internet
3. Una cuenta en **Supabase** (gratis)
4. Una cuenta en **Vercel** (gratis, para el deploy)

---

## PARTE 1 — Activar Linux en tu Chromebook

Si ya tienes Linux activado, salta a la Parte 2.

1. Haz clic en el reloj (esquina inferior derecha)
2. Ve a **Configuración** → busca **"Linux"**
3. Haz clic en **"Activar Linux"**
4. Sigue el asistente de instalación (elige espacio en disco: mínimo 10 GB)
5. Al terminar, se abrirá una ventana negra llamada **"Terminal"** — es tu herramienta principal

---

## PARTE 2 — Instalar Node.js

Node.js es el motor que ejecuta React y las herramientas de desarrollo.

Abre la Terminal de Linux y ejecuta estos comandos **uno por uno** (copia, pega y presiona Enter):

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y
```

```bash
# Instalar curl (herramienta para descargar)
sudo apt install curl -y
```

```bash
# Instalar NVM (gestor de versiones de Node)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

```bash
# Recargar la configuración del terminal
source ~/.bashrc
```

```bash
# Instalar Node.js versión 20 (LTS estable)
nvm install 20
```

```bash
# Verificar que Node.js se instaló correctamente
node --version
```

Deberías ver algo como: `v20.x.x`

```bash
# Verificar npm (gestor de paquetes)
npm --version
```

Deberías ver algo como: `10.x.x`

✅ **Si ves números de versión, Node.js está instalado correctamente.**

---

## PARTE 3 — Crear Proyecto en Supabase

Supabase es tu base de datos y sistema de autenticación en la nube.

### 3.1 Crear cuenta

1. Ve a [supabase.com](https://supabase.com)
2. Haz clic en **"Start your project"**
3. Regístrate con tu cuenta de GitHub o Google
4. Confirma tu correo si es necesario

### 3.2 Crear nuevo proyecto

1. En el dashboard, haz clic en **"New project"**
2. Completa los campos:
   - **Organization**: tu nombre o empresa
   - **Project name**: `petid` (o el nombre que quieras)
   - **Database Password**: crea una contraseña segura — **guárdala en un lugar seguro**
   - **Region**: elige el más cercano a tu país (ej: `South America (São Paulo)`)
3. Haz clic en **"Create new project"**
4. Espera 1-2 minutos mientras Supabase configura todo

### 3.3 Configurar la base de datos

1. En tu proyecto de Supabase, busca en el menú izquierdo: **SQL Editor**
2. Haz clic en **"New query"**
3. Abre el archivo `schema.sql` de tu proyecto PETID
4. Copia **todo** el contenido del archivo
5. Pégalo en el editor SQL de Supabase
6. Haz clic en **"Run"** (botón verde, o Ctrl+Enter)
7. Deberías ver: `Success. No rows returned`

✅ **Esto crea todas las tablas, relaciones, índices, RLS y datos de prueba.**

### 3.4 Obtener las credenciales de API

1. En Supabase, ve a **Settings** (ícono de engranaje en el menú izquierdo)
2. Haz clic en **"API"**
3. Anota estos dos valores (los necesitarás en el Paso 5):
   - **Project URL**: algo como `https://abcdefghij.supabase.co`
   - **anon public key**: una clave larga que empieza con `eyJ...`

---

## PARTE 4 — Descargar y Preparar el Proyecto

### 4.1 Copiar los archivos del proyecto

Mueve la carpeta `petid` a tu directorio de Linux. La forma más fácil:

1. En el Administrador de Archivos de Chrome OS, navega hasta donde está la carpeta `petid`
2. Cópiala a la carpeta **"Linux files"** (aparece en el panel izquierdo del explorador de archivos)

O desde la terminal, si ya está en Linux:

```bash
# Navegar a donde está el proyecto
cd ~/petid

# Verificar que los archivos están ahí
ls -la
```

Deberías ver: `package.json`, `src/`, `schema.sql`, etc.

---

## PARTE 5 — Configurar Variables de Entorno

Las variables de entorno son como llaves secretas que conectan tu app con Supabase.

### 5.1 Crear el archivo .env

```bash
# Asegúrate de estar en la carpeta del proyecto
cd ~/petid

# Copiar el archivo de ejemplo
cp .env.example .env
```

### 5.2 Editar el archivo .env

```bash
# Abrir el archivo para editarlo
nano .env
```

Verás algo así:
```
VITE_SUPABASE_URL=tu_url_aqui
VITE_SUPABASE_ANON_KEY=tu_clave_aqui
```

Reemplaza los valores con los que obtuviste en el Paso 3.4:

```
VITE_SUPABASE_URL=https://abcdefghij.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Para guardar en nano:
- Presiona **Ctrl + X**
- Presiona **Y** (para confirmar)
- Presiona **Enter**

### 5.3 Verificar el archivo

```bash
cat .env
```

Deberías ver tus credenciales sin las comillas de ejemplo.

---

## PARTE 6 — Instalar Dependencias

```bash
# Asegúrate de estar en la carpeta del proyecto
cd ~/petid

# Instalar todas las dependencias
npm install
```

Este proceso descarga todas las librerías necesarias (React, Supabase, etc.).
Puede tardar 1-3 minutos según tu conexión.

Al terminar verás algo como: `added 300 packages in 45s`

---

## PARTE 7 — Ejecutar en Modo Desarrollo

```bash
npm run dev
```

Verás algo como:
```
  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

### 7.1 Abrir en el navegador

1. Abre **Google Chrome** en tu Chromebook
2. Ve a la dirección: `http://localhost:5173`
3. ¡Deberías ver PETID funcionando!

### 7.2 Probar con los datos de prueba

Los datos de prueba ya están cargados (se instalaron con el `schema.sql`).

1. Haz clic en **"Crear cuenta"**
2. Registra una nueva cuenta con tu correo
3. Confirma tu correo (revisa tu bandeja de entrada)
4. Inicia sesión
5. Configura tu organización en la pantalla de bienvenida
6. ¡Explora el sistema!

> **Nota sobre los datos de prueba:** El `schema.sql` incluye datos ficticios de la Clínica Veterinaria PetCare (clientes, mascotas, citas, vacunas). Estos son solo datos de referencia — tu nueva cuenta tendrá su propio espacio vacío donde puedes empezar a cargar tus datos reales.

---

## PARTE 8 — Deploy en Vercel (Publicar en Internet)

### 8.1 Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en **"Sign Up"**
3. Regístrate con tu cuenta de GitHub (recomendado)

### 8.2 Subir el proyecto a GitHub

Si no tienes Git instalado:

```bash
sudo apt install git -y
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

Crear repositorio en GitHub:
1. Ve a [github.com](https://github.com)
2. Haz clic en el **+** → **"New repository"**
3. Nombre: `petid`
4. Déjalo en **Private**
5. Haz clic en **"Create repository"**

Subir el código:

```bash
cd ~/petid
git init
git add .
git commit -m "PETID MVP inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/petid.git
git push -u origin main
```

### 8.3 Conectar con Vercel

1. En [vercel.com/dashboard](https://vercel.com/dashboard), haz clic en **"Add New Project"**
2. Selecciona **"Import Git Repository"**
3. Elige tu repositorio `petid`
4. En la sección **"Environment Variables"**, agrega:
   - `VITE_SUPABASE_URL` → tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` → tu clave de Supabase
5. Haz clic en **"Deploy"**

Vercel construirá y publicará tu app automáticamente.

Al terminar recibirás una URL como: `https://petid-xxx.vercel.app`

### 8.4 Configurar URL en Supabase (importante)

1. Ve a tu proyecto en Supabase → **Authentication** → **URL Configuration**
2. En **Site URL**, pon tu URL de Vercel: `https://petid-xxx.vercel.app`
3. En **Redirect URLs**, agrega: `https://petid-xxx.vercel.app/**`
4. Guarda los cambios

---

## 🔧 Solución de Errores Comunes

### Error: "command not found: nvm"
```bash
# Recargar la configuración
source ~/.bashrc
# o
source ~/.profile
```

### Error: "EACCES permission denied" al instalar npm
```bash
# Usar nvm en lugar de npm global
nvm use 20
npm install
```

### Error: "Failed to load resource: 401" en el navegador
- Verifica que copiaste correctamente las credenciales en `.env`
- Asegúrate de que el archivo no tiene espacios extra o comillas

### Error: "relation does not exist" en Supabase
- El schema.sql no se ejecutó correctamente
- Ve al SQL Editor de Supabase y vuelve a ejecutar el schema.sql completo

### La página muestra "Loading..." indefinidamente
1. Abre las DevTools (F12 en Chrome)
2. Ve a la pestaña **Console**
3. Busca mensajes de error en rojo
4. Los errores más comunes son credenciales incorrectas de Supabase

### Error al confirmar email (no llega el correo)
1. Revisa la carpeta de Spam
2. En Supabase → Authentication → Email Templates, verifica que están habilitados
3. En desarrollo local, puedes deshabilitar la confirmación de email temporalmente:
   - Supabase → Authentication → Providers → Email
   - Desactiva **"Confirm email"**

### Error al hacer `npm run dev`: "port 5173 already in use"
```bash
# Usar otro puerto
npm run dev -- --port 3000
```

### La app funciona localmente pero no en Vercel
1. Verifica que las variables de entorno están configuradas en Vercel
2. Las variables deben empezar con `VITE_` para que funcionen en el frontend
3. Después de agregar variables en Vercel, haz un nuevo deploy

---

## 📱 Acceder desde el Celular (desarrollo local)

Para ver la app en tu celular conectado a la misma red WiFi:

```bash
npm run dev -- --host
```

Verás una dirección como `http://192.168.1.x:5173` — ábrela en el navegador de tu celular.

---

## 🔄 Flujo de Trabajo Diario

Cuando quieras continuar desarrollando:

```bash
# 1. Abrir terminal
# 2. Ir al proyecto
cd ~/petid

# 3. Iniciar el servidor
npm run dev

# 4. Abrir http://localhost:5173 en Chrome
```

Para publicar cambios en Vercel:

```bash
# Guardar cambios
git add .
git commit -m "Descripción de los cambios"
git push
# Vercel detecta el push y despliega automáticamente
```

---

## 📞 Estructura de Archivos Importantes

| Archivo | Para qué sirve |
|---------|----------------|
| `.env` | Credenciales privadas (nunca subir a GitHub) |
| `schema.sql` | Estructura completa de la base de datos |
| `src/lib/supabase.js` | Conexión con Supabase |
| `src/context/AuthContext.jsx` | Manejo de sesión y usuario |
| `src/styles/globals.css` | Estilos y colores del sistema |
| `vite.config.js` | Configuración del servidor de desarrollo |
| `vercel.json` | Configuración para el deploy |

---

## 🆘 ¿Necesitas Ayuda?

Si algo no funciona:

1. Lee el mensaje de error completo (en rojo en la terminal)
2. Busca ese mensaje exacto en Google
3. Consulta la documentación oficial:
   - [Supabase Docs](https://supabase.com/docs)
   - [Vite Docs](https://vitejs.dev/guide/)
   - [React Docs](https://react.dev)

---

*PETID v1.0 — Guía actualizada*
