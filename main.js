 // Añade 'Menu' a la importación
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const ObjectsToCsv = require('objects-to-csv');
const fs = require('fs');
const nodemailer = require('nodemailer'); 
const store = new Store();

// Inicializar datos si no existen
if (!store.has('expenses')) store.set('expenses', []);
if (!store.has('categories')) {
    store.set('categories', ['Comida', 'Movilidad', 'Entretenimiento', 'Servicios', 'Otros']);
}
if (!store.has('incomes')) store.set('incomes', []);
if (!store.has('incomeSources')) store.set('incomeSources', ['Trabajo']);

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 750,
        minWidth: 900,
        minHeight: 600,
        titleBarStyle: 'hiddenInset', // Estilo macOS premium
        backgroundColor: '#fbfbfe',
        icon: path.join(__dirname, 'build/icon.png'), 
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile('src/index.html');
}

function createCustomMenu() {
    const isMac = process.platform === 'darwin';

    const template = [
        // Menú de la Aplicación (obligatorio en macOS)
        ...(isMac ? [{
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }] : []),
        // Menú Archivo
        {
            label: 'Archivo',
            submenu: [
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },
        // Menú Edición (Necesario para que funcionen atajos como Cmd+C, Cmd+V en inputs)
        {
            label: 'Edición',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        // EL MENÚ VENTANA: LA SOLUCIÓN AL RECHAZO DE APPLE
        {
            label: 'Window', // Lo dejamos en inglés porque Apple revisa en ese idioma
            submenu: [
                {
                    label: 'Open Main Window', // El botón mágico que pide Apple
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        // Si la ventana está cerrada, la crea. Si está abierta, la enfoca.
                        if (BrowserWindow.getAllWindows().length === 0) {
                            createWindow();
                        } else if (mainWindow) {
                            mainWindow.focus();
                        }
                    }
                },
                { type: 'separator' },
                { role: 'minimize' },
                { role: 'zoom' },
                ...(isMac ? [
                    { type: 'separator' },
                    { role: 'front' },
                ] : [])
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
    createCustomMenu(); // Configura el menú personalizado
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// --- IPC HANDLERS (COMUNICACIÓN CON UI) ---

ipcMain.handle('get-data', () => {
    return {
        expenses: store.get('expenses'),
        categories: store.get('categories'),
        incomes: store.get('incomes'),
        incomeSources: store.get('incomeSources')
    };
});

ipcMain.handle('add-expense', (event, expense) => {
    const expenses = store.get('expenses');
    const newExpense = {
        ...expense,
        id: Date.now().toString(),
        timestamp: new Date().toISOString() // Fecha automática
    };
    expenses.push(newExpense);
    store.set('expenses', expenses);
    return newExpense;
});

// Manejo de Ingresos
ipcMain.handle('add-income', (event, income) => {
    const incomes = store.get('incomes');
    const newIncome = {
        ...income,
        id: 'inc_' + Date.now().toString(),
        timestamp: new Date().toISOString()
    };
    incomes.push(newIncome);
    store.set('incomes', incomes);
    return newIncome;
});

ipcMain.handle('delete-income', (event, id) => {
    let incomes = store.get('incomes');
    incomes = incomes.filter(i => i.id !== id);
    store.set('incomes', incomes);
    return incomes;
});

// Manejo de Orígenes de Ingreso
ipcMain.handle('add-income-source', (event, source) => {
    const sources = store.get('incomeSources');
    if (!sources.includes(source)) {
        sources.push(source);
        store.set('incomeSources', sources);
    }
    return sources;
});

ipcMain.handle('delete-income-source', (event, sourceName) => {
    let sources = store.get('incomeSources');
    sources = sources.filter(s => s !== sourceName);
    store.set('incomeSources', sources);
    return sources;
});

ipcMain.handle('add-category', (event, category) => {
    const categories = store.get('categories');
    if (!categories.includes(category)) {
        categories.push(category);
        store.set('categories', categories);
    }
    return categories;
});

ipcMain.handle('edit-category', (event, { oldName, newName }) => {
    let categories = store.get('categories');
    const index = categories.indexOf(oldName);
    
    if (index !== -1 && !categories.includes(newName)) {
        categories[index] = newName;
        store.set('categories', categories);

        // Actualizar todos los gastos que tenían la categoría anterior
        let expenses = store.get('expenses');
        expenses = expenses.map(e => {
            if (e.category === oldName) return { ...e, category: newName };
            return e;
        });
        store.set('expenses', expenses);
    }
    return { categories: store.get('categories'), expenses: store.get('expenses') };
});

ipcMain.handle('delete-category', (event, categoryName) => {
    let categories = store.get('categories');
    categories = categories.filter(c => c !== categoryName);
    store.set('categories', categories);
    return categories;
});
ipcMain.handle('delete-expense', (event, id) => {
    let expenses = store.get('expenses');
    expenses = expenses.filter(e => e.id !== id);
    store.set('expenses', expenses);
    return expenses;
});

ipcMain.handle('edit-expense', (event, updatedExpense) => {
    let expenses = store.get('expenses');
    const index = expenses.findIndex(e => e.id === updatedExpense.id);
    if (index !== -1) {
        // Mantenemos el ID original, pero actualizamos lo demás (incluida la fecha/timestamp)
        expenses[index] = { ...expenses[index], ...updatedExpense };
        store.set('expenses', expenses);
    }
    return expenses;
});

ipcMain.handle('edit-income', (event, updatedIncome) => {
    let incomes = store.get('incomes');
    const index = incomes.findIndex(i => i.id === updatedIncome.id);
    if (index !== -1) {
        incomes[index] = { ...incomes[index], ...updatedIncome };
        store.set('incomes', incomes);
    }
    return incomes;
});

ipcMain.handle('export-csv', async () => {
    const expenses = store.get('expenses');
    if (expenses.length === 0) return { success: false, msg: 'No hay datos' };

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Exportar Gastos',
        defaultPath: `spendy_export_${new Date().toISOString().split('T')[0]}.csv`,
        filters: [{ name: 'CSV', extensions: ['csv'] }]
    });

    if (filePath) {
        const csv = new ObjectsToCsv(expenses);
        await csv.toDisk(filePath);
        return { success: true };
    }
    return { success: false };
});

// ====== SECCIÓN DE ENVÍO DE CORREO (TU OPINIÓN) ======

ipcMain.handle('send-feedback', async (event, data) => {
    try {
        // Configuración de la cuenta que ENVÍA el correo (Invisible para el usuario)
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'usuariohaba@gmail.com',
                pass: 'enlxugxjhqpqkznw'
            }
        });

        // Configuración del correo a enviar
        let mailOptions = {
            from: '"Haba App" <usuariohaba@gmail.com>',
            to: 'alvaromenachomd@gmail.com', // El correo que RECIBE (tu correo personal)
            subject: `Nueva opinión en Haba de: ${data.name}`,
            text: `Usuario: ${data.name}\n\nMensaje:\n${data.message}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #fbfbfe; border-radius: 12px; border: 1px solid #eee;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #4F46E5; margin: 0;">Haba 🍃</h2>
                        <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Nueva opinión recibida</p>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        <p style="margin-top: 0; color: #374151;"><strong>Remitente:</strong> <span style="color: #111827;">${data.name}</span></p>
                        <p style="color: #374151; margin-bottom: 5px;"><strong>Mensaje:</strong></p>
                        <div style="background: #f9fafb; padding: 15px; border-radius: 6px; color: #1f2937; line-height: 1.5; white-space: pre-wrap;">${data.message}</div>
                    </div>
                </div>
            `
        };

        // Enviar el correo
        await transporter.sendMail(mailOptions);
        return { success: true };

    } catch (error) {
        console.error("Error enviando correo:", error);
        throw error; // Lanza el error para que el frontend lo sepa
    }
});