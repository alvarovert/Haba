const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getData: () => ipcRenderer.invoke('get-data'),
    addExpense: (expense) => ipcRenderer.invoke('add-expense', expense),
    addCategory: (category) => ipcRenderer.invoke('add-category', category),
    editExpense: (expense) => ipcRenderer.invoke('edit-expense', expense), // NUEVO
    deleteExpense: (id) => ipcRenderer.invoke('delete-expense', id),       // NUEVO
    editCategory: (oldName, newName) => ipcRenderer.invoke('edit-category', { oldName, newName }),
    deleteCategory: (categoryName) => ipcRenderer.invoke('delete-category', categoryName),
    exportCsv: () => ipcRenderer.invoke('export-csv'),
    sendFeedback: (data) => ipcRenderer.invoke('send-feedback', data)
});