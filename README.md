# 📦 Control de Stock Web - Fábrica de Aberturas

Sistema de control de inventario simple y eficiente para fábricas de aberturas. 
**100% web** - no necesita servidor, funciona directamente en el navegador.

## 🚀 Características

- ✅ **Sin servidor** - Todo se guarda en el LocalStorage del navegador
- ✅ **Totalmente responsive** - Funciona en PC, tablet y celular
- ✅ **CRUD completo** - Crear, Leer, Actualizar y Eliminar productos
- ✅ **Alertas visuales** - Productos con stock bajo se destacan en rojo
- ✅ **Exportar a CSV** - Descarga todos los datos en formato CSV
- ✅ **Búsqueda en tiempo real** - Busca por nombre, categoría o descripción
- ✅ **Datos persistentes** - Los datos se guardan automáticamente
- ✅ **Diseño moderno** - Interfaz limpia y profesional

## 🎯 ¿Cómo usar?

### Opción 1: Usar directamente (recomendado)
1. Clona o descarga este repositorio
2. Abre `index.html` en tu navegador web
3. ¡Listo! Comienza a gestionar tu stock

### Opción 2: Desplegar en GitHub Pages
1. Sube los archivos a un repositorio en GitHub
2. Activa GitHub Pages en la configuración del repositorio
3. Accede a tu aplicación desde cualquier dispositivo

## 📋 Funcionalidades

### 📊 Panel de Estadísticas
- Total de productos
- Productos con stock bajo (≤ 5 unidades)
- Valor total del inventario

### ➕ Agregar Producto
- Nombre (obligatorio)
- Categoría (obligatorio)
- Stock (obligatorio)
- Precio (obligatorio)
- Descripción (opcional)

### 📋 Tabla de Productos
- Visualización de todos los productos
- Fila en rojo para productos con stock bajo
- Botones de acción:
  - **Stock**: Actualizar cantidad (sumar/restar)
  - **Eliminar**: Quitar producto del inventario

### 🔍 Búsqueda
- Busca en tiempo real por nombre, categoría o descripción

### 📤 Exportar
- Exporta todos los datos a un archivo CSV descargable

## 🛠️ Tecnologías

- HTML5
- CSS3 (Flexbox, Grid, Animaciones)
- JavaScript ES6+
- LocalStorage (persistencia de datos)

## 📁 Estructura del Proyecto

control-stock-web/
├── index.html # Estructura principal
├── style.css # Estilos y diseño
├── script.js # Lógica de la aplicación
└── README.md # Documentación


## 💡 Tips de Uso

1. **Carga ejemplos**: Usa el botón "Cargar Ejemplos" para ver cómo funciona
2. **Actualiza stock**: Haz clic en el botón "Stock" de cualquier producto
3. **Busca rápido**: Usa la barra de búsqueda para encontrar productos
4. **Exporta datos**: Descarga un CSV para respaldo o análisis

## 📱 Responsive

La aplicación se adapta a diferentes tamaños de pantalla:
- **Desktop**: Vista completa con formulario y tabla
- **Tablet**: Formulario arriba y tabla abajo
- **Móvil**: Diseño optimizado para pantallas pequeñas

## 🔒 Privacidad

**Tus datos son 100% tuyos**. 
- Todos los datos se guardan en el LocalStorage de tu navegador
- No hay comunicación con servidores externos
- Puedes borrar tus datos en cualquier momento desde las herramientas del navegador

## 🚀 Despliegue Rápido en GitHub Pages

1. Crea un repositorio en GitHub
2. Sube los 3 archivos (index.html, style.css, script.js)
3. Ve a Settings > Pages
4. Selecciona la rama principal como source
5. ¡Tu aplicación estará disponible en minutos!

## 📝 Licencia

MIT - Libre para usar, modificar y distribuir.

---

**¿Preguntas o sugerencias?** ¡Abre un issue en el repositorio!