# Haba — Gestor de Finanzas Personales

> Aplicación de finanzas personales diseñada para facilitar al usuario el registro de gastos, ingresos y la visualización de su salud financiera.

---

## Problema que Resuelve

Comunmente se tiene la idea de que las finanzas personales son tediosas, complejas o que requieren de mucha preparación. En gran parte es porque las herramientas que se tienen para esto son innecesariamente intrincadas.

**Haba** esta enfocada en ser intuitiva y brillante para el usuario permitiendole llevar sus finanzas de forma muy cómoda y agradable.
* **Registro rápido:** Permite ingresar y categorizar ingresos y gastos diarios en pocos clics.
* **Filtros dinámicos:** Facilita la visualización de hábitos de consumo por categorías y períodos.
* **Privacidad local:** Control total de los datos financieros en el dispositivo del usuario sin exponer información sensible a servicios externos.

---

## Stack Tecnológico

* **Frontend & UI:** HTML5, CSS3, JavaScript (ES6+).
* **Desktop Engine:** Electron.js (gestión de ventana principal e integración de sistema operativo mediante IPC con `preload.js` y `main.js`).
* **Telemetría & Métricas:** PostHog SDK (para análisis del uso de producto y rendimiento).
* **Empaquetado:** Electron Builder con soporte para distribuciones de Windows y macOS.

---

## Instalación y Compilación

### Requisitos Previos

* **Node.js** (v16.x o superior recomendada)
* **npm** (incluido con Node.js)

### Pasos de Ejecución

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/alvarovert/Haba.git](https://github.com/alvarovert/Haba.git)
   cd Haba

2. **Instalar dependencias:**
   ```bash
   
   npm install

3. **Iniciar en Modo Desarrollo:**
   ```bash
   
   npm start


4. **Compilar y Generar Ejecutable para Windows:**
   ```bash
   
   npm run build:win

   
4. **Compilar y Generar Ejecutable para MacOS:**
   ```bash
   
   npm run build:mac


## 🐻 Autor
Alvaro Menacho
