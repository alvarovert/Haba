# Haba — Gestor de Finanzas Personales

> Aplicación diseñada para promover y accesibilizar las finanzas personales proporcionándole a los usuarios una herramienta con la cual se sientan cómodos y a gusto conociendo su salud financiera

---

## El Proposito de Haba 

Comunmente se tiene la idea de que las finanzas personales son tediosas, complejas o que requieren de mucha preparación. En gran parte es porque las herramientas que se tienen para esto son innecesariamente intrincadas.

**Haba** esta enfocada en ser intuitiva y brillante para el usuario, permitiendole llevar sus finanzas de forma muy cómoda y agradable.
* **Uso rápido e intuitivo:**  En cuanto ingresas a Haba sabes como registrar tus gastos e ingresos, en ese instante ya puedes entender tus propias finanzas.
* **Dashboard Estetico y Comprensible:** El Dashboard de Haba no solo es sencillo de entender, es muy estético. En todo sentido es agradable de ver los gráficos y como van cambiando de acuerdo a tus registros.
* **Comunicación con el Usuario:**  Haba tiene un apartado donde los usuarios pueden mandar sus propias recomendaciones, problemas u opiniones. Esto me nos constante feedback y nos permite seguir mejorando haba escuchando activamente a los usuarios.

---

## Stack de desarrollo

* **Frontend & UI:** HTML5, CSS3, JavaScript.
* **Desktop Engine:** Electron.js (gestión de ventana principal e integración de sistema operativo mediante IPC con `preload.js` y `main.js`).
* **Telemetría & Métricas:** PostHog SDK (para análisis del uso de Haba y filtrar funciones y estrategia).
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
