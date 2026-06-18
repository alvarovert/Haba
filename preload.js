const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getData: () => ipcRenderer.invoke('get-data'),
    addExpense: (expense) => ipcRenderer.invoke('add-expense', expense),
    addCategory: (category) => ipcRenderer.invoke('add-category', category),
    editExpense: (expense) => ipcRenderer.invoke('edit-expense', expense), 
    deleteExpense: (id) => ipcRenderer.invoke('delete-expense', id),   
    editCategory: (oldName, newName) => ipcRenderer.invoke('edit-category', { oldName, newName }),
    deleteCategory: (categoryName) => ipcRenderer.invoke('delete-category', categoryName),
    showConfirm: (message) => ipcRenderer.invoke('show-confirm', message),
    exportCsv: () => ipcRenderer.invoke('export-csv'),
    sendFeedback: (data) => ipcRenderer.invoke('send-feedback', data),
    addIncome: (income) => ipcRenderer.invoke('add-income', income),
    editIncome: (income) => ipcRenderer.invoke('edit-income', income),
    deleteIncome: (id) => ipcRenderer.invoke('delete-income', id),
    addIncomeSource: (source) => ipcRenderer.invoke('add-income-source', source),
    deleteIncomeSource: (sourceName) => ipcRenderer.invoke('delete-income-source', sourceName),
    
});