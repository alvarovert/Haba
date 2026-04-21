const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const ObjectsToCsv = require('objects-to-csv');
const fs = require('fs');

const store = new Store();

// Inicializar datos si no existen
if (!store.has('expenses')) store.set('expenses', []);
if (!store.has('categories')) {
    store.set('categories', ['Comida', 'Movilidad', 'Entretenimiento', 'Servicios', 'Otros']);
}

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

app.whenReady().then(() => {
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
        categories: store.get('categories')
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
