lucide.createIcons();

// 1. CORRECCIÓN: Una sola declaración
let appData = { expenses: [], categories: [], incomes: [], incomeSources: [] };

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    appData = await window.api.getData();
    updateCategorySelect();
    updateSourceSelect(); 
    applyFilter();
    renderHistoryTable(); 
});

// Navegación
function switchTab(tabId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active', 'fade-in'));
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active', 'bg-indigo-50', 'text-indigo-600');
        b.classList.add('text-gray-500');
    });

    const targetView = document.getElementById(`view-${tabId}`);
    targetView.classList.add('active', 'fade-in');
    
    const targetBtn = document.getElementById(`tab-${tabId}`);
    targetBtn.classList.add('active');
    targetBtn.classList.remove('text-gray-500');
}

// Filtros y Renderizado
document.getElementById('time-filter').addEventListener('change', applyFilter);

// 2. CORRECCIÓN: applyFilter debe pasar los gastos filtrados a renderCharts
function applyFilter() {
    const filter = document.getElementById('time-filter').value;
    const now = new Date();
    
    let filteredExpenses = appData.expenses.filter(e => {
        const date = new Date(e.timestamp);
        if (filter === 'today') return date.toDateString() === now.toDateString();
        if (filter === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        if (filter === 'quarter') {
            const quarterObj = Math.floor(now.getMonth() / 3);
            const expenseQuarter = Math.floor(date.getMonth() / 3);
            return quarterObj === expenseQuarter && date.getFullYear() === now.getFullYear();
        }
        return true;
    });

    updateDashboardStats(filteredExpenses);
    // renderCharts ahora recibe los gastos filtrados y usará appData.incomes internamente
    renderCharts(filteredExpenses); 
}

function updateDashboardStats(expenses) {
    if (expenses.length === 0) {
        document.getElementById('stat-total').innerText = 'S/0.00';
        document.getElementById('stat-top-cat').innerText = '-';
        document.getElementById('stat-top-day').innerText = '-';
        return;
    }

    // Total
    const total = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    document.getElementById('stat-total').innerText = `S/${total.toFixed(2)}`;

    // Top Categoria
    const catCounts = {};
    const dayCounts = {};
    expenses.forEach(e => {
        catCounts[e.category] = (catCounts[e.category] || 0) + parseFloat(e.amount);
        const day = new Date(e.timestamp).toLocaleDateString();
        dayCounts[day] = (dayCounts[day] || 0) + parseFloat(e.amount);
    });

    const topCat = Object.keys(catCounts).reduce((a, b) => catCounts[a] > catCounts[b] ? a : b);
    const topDay = Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b);

    document.getElementById('stat-top-cat').innerText = topCat;
    document.getElementById('stat-top-day').innerText = topDay;
}

// Formulario
function updateCategorySelect() {
    const select = document.getElementById('category');
    select.innerHTML = appData.categories.map(c => `<option value="${c}">${c}</option>`).join('');
}


// 4. ACTUALIZACIÓN: Formulario de Ingresos (Mejorado)
document.getElementById('income-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = "Guardar Ingreso";
    
    btn.innerText = "Guardando...";
    btn.disabled = true;

    const newIncome = {
        amount: document.getElementById('income-amount').value,
        source: document.getElementById('income-source').value,
        description: document.getElementById('income-description').value
    };

    try {
        const saved = await window.api.addIncome(newIncome);
        appData.incomes.push(saved);
        
        applyFilter(); 
        renderHistoryTable(); 
        e.target.reset();
        
        btn.innerText = "Ingreso Guardado";
        btn.classList.replace('bg-green-600', 'bg-emerald-600');

        setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.replace('bg-emerald-600', 'bg-green-600');
            btn.disabled = false;
        }, 1000);
    } catch (error) {
        console.error(error);
        alert("Error al guardar ingreso");
        btn.innerText = originalText;
        btn.disabled = false;
    }
});

// ====== GESTIÓN DE CATEGORÍAS (MODAL) ======

const modal = document.getElementById('category-modal');
const btnManage = document.getElementById('btn-manage-categories');
const btnCloseModal = document.getElementById('close-modal');
const btnAddCategory = document.getElementById('btn-add-category');
const inputNewCategory = document.getElementById('new-category-input');

btnManage.addEventListener('click', () => {
    renderCategoryList();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
});

btnCloseModal.addEventListener('click', () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    updateCategorySelect();
});

function renderCategoryList() {
    const list = document.getElementById('category-list');
    list.innerHTML = appData.categories.map(c => `
        <div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg group">
            <span class="text-sm font-medium text-gray-700">${c}</span>
            <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button onclick="editCategory('${c}')" class="text-indigo-500 hover:text-indigo-700"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                <button onclick="deleteCategory('${c}')" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
        </div>
    `).join('');
    lucide.createIcons(); // Recargar iconos
}

btnAddCategory.addEventListener('click', async () => {
    const newCat = inputNewCategory.value.trim();
    if (newCat) {
        appData.categories = await window.api.addCategory(newCat);
        inputNewCategory.value = '';
        renderCategoryList();
    }
});

window.editCategory = async (oldName) => {
    const newName = prompt('Nuevo nombre para la categoría:', oldName);
    if (newName && newName.trim() !== '' && newName !== oldName) {
        const result = await window.api.editCategory(oldName, newName.trim());
        appData.categories = result.categories;
        appData.expenses = result.expenses; // Actualiza gastos por si cambiaron
        renderCategoryList();
        applyFilter(); // Actualiza gráficas
        renderHistoryTable();
    }
};

window.deleteCategory = async (categoryName) => {
    if (confirm(`¿Seguro que deseas eliminar "${categoryName}"? Los gastos con esta categoría no se borrarán.`)) {
        appData.categories = await window.api.deleteCategory(categoryName);
        renderCategoryList();
    }
};


document.getElementById('expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = "Guardar Gasto";
    
    btn.innerText = "Guardando...";
    btn.disabled = true;

    const newExpense = {
        amount: document.getElementById('amount').value,
        category: document.getElementById('category').value,
        source: document.getElementById('source').value,
        description: document.getElementById('description').value
    };

    try {
        const saved = await window.api.addExpense(newExpense);
        appData.expenses.push(saved);
        
        // --- ACTUALIZACIÓN EN SEGUNDO PLANO ---
        // Esto actualiza las gráficas y estadísticas del Dashboard
        applyFilter(); 
        // Esto actualiza la lista de la pestaña Historial
        renderHistoryTable(); 

        // --- PREPARAR PARA EL SIGUIENTE REGISTRO ---
        e.target.reset(); // Limpia los campos
        document.getElementById('amount').focus(); // Pone el cursor en el monto automáticamente

        // --- FEEDBACK VISUAL DEL BOTON---
        btn.innerText = "Gasto Guardado";
        btn.classList.replace('bg-indigo-600', 'bg-green-600');
        btn.classList.replace('hover:bg-indigo-700', 'hover:bg-green-700');

        setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.replace('bg-green-600', 'bg-indigo-600');
            btn.classList.replace('hover:bg-green-700', 'hover:bg-indigo-700');
            btn.disabled = false;
        }, 700);

    } catch (error) {
        console.error(error);
        alert("Hubo un error al guardar.");
        btn.innerText = originalText;
        btn.disabled = false;
    }
});

// Exportar
async function exportData() {
    const res = await window.api.exportCsv();
    if (res.success) alert('¡Datos exportados con éxito!');
    else if(res.msg) alert(res.msg);
}

// ====== GESTIÓN DE ORÍGENES (MODAL) ======
const sourceModal = document.getElementById('source-modal');
const btnManageSources = document.getElementById('btn-manage-sources');
const btnCloseSourceModal = document.getElementById('close-source-modal');
const btnAddSource = document.getElementById('btn-add-source');
const inputNewSource = document.getElementById('new-source-input');

// Abrir modal de orígenes
btnManageSources.addEventListener('click', () => {
    renderSourceList();
    sourceModal.classList.remove('hidden');
    sourceModal.classList.add('flex');
});

// Cerrar modal de orígenes
btnCloseSourceModal.addEventListener('click', () => {
    sourceModal.classList.add('hidden');
    sourceModal.classList.remove('flex');
    updateSourceSelect();
});

// Renderizar la lista dentro del modal
function renderSourceList() {
    const list = document.getElementById('source-list');
    list.innerHTML = appData.incomeSources.map(s => `
        <div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg group">
            <span class="text-sm font-medium text-gray-700">${s}</span>
            <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button onclick="deleteSource('${s}')" class="text-red-500 hover:text-red-700">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

// Agregar nuevo origen
btnAddSource.addEventListener('click', async () => {
    const newSource = inputNewSource.value.trim();
    if (newSource) {
        appData.incomeSources = await window.api.addIncomeSource(newSource);
        inputNewSource.value = '';
        renderSourceList();
        updateSourceSelect();
    }
});

// Eliminar origen
window.deleteSource = async (sourceName) => {
    if (confirm(`¿Eliminar el origen "${sourceName}"?`)) {
        appData.incomeSources = await window.api.deleteIncomeSource(sourceName);
        renderSourceList();
        updateSourceSelect();
    }
};

function updateSourceSelect() {
    const select = document.getElementById('income-source');
    if(select) {
        select.innerHTML = appData.incomeSources.map(s => `<option value="${s}">${s}</option>`).join('');
    }
}

// ====== HISTORIAL (TABLA) ======
// Modificar renderHistoryTable para mezclar gastos e ingresos
function renderHistoryTable() {
    const tbody = document.getElementById('history-table-body');
    
    // Combinar ambos arrays etiquetándolos
    const combined = [
        ...appData.expenses.map(e => ({...e, type: 'expense'})),
        ...appData.incomes.map(i => ({...i, type: 'income'}))
    ];

    const sorted = combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-12 text-center text-gray-400 text-sm">No hay registros aún.</td></tr>`;
        return;
    }

    tbody.innerHTML = sorted.map(item => {
        const dateObj = new Date(item.timestamp);
        const dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const isIncome = item.type === 'income';

        return `
            <tr class="hover:bg-gray-50/80 transition-colors group">
                <td class="py-4 px-6 text-sm text-gray-500 whitespace-nowrap flex items-center gap-2">
                    ${isIncome ? '<span class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>' : ''}
                    ${dateStr} <span class="text-gray-400 text-xs ml-1">${timeStr}</span>
                </td>
                <td class="py-4 px-6 text-sm text-gray-900 font-medium">${item.description}</td>
                <td class="py-4 px-6 text-sm">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${isIncome ? 'bg-green-50 text-green-700 border-green-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'} border">
                        ${isIncome ? item.source : item.category}
                    </span>
                </td>
                <td class="py-4 px-6 text-sm text-gray-500">${isIncome ? 'Ingreso Directo' : item.source}</td>
                <td class="py-4 px-6 text-sm font-semibold text-right ${isIncome ? 'text-green-600' : 'text-gray-900'}">
                    ${isIncome ? '+' : ''}S/${parseFloat(item.amount).toFixed(2)}
                </td>
                <td class="py-4 px-4 text-sm text-center">
                    <div class="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">

                        <button onclick="openEditModal('${item.id}', '${item.type}')" class="text-gray-400 hover:text-indigo-600 transition-colors" title="Editar">
                            <i data-lucide="pencil" class="w-4 h-4"></i>
                        </button>
                    
                        <button onclick="${isIncome ? `deleteIncome('${item.id}')` : `deleteExpense('${item.id}')`}" class="text-gray-400 hover:text-red-500 transition-colors">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    lucide.createIcons();
}
// ====== EDITAR Y ELIMINAR GASTOS ======

window.deleteExpense = async (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
        appData.expenses = await window.api.deleteExpense(id);
        applyFilter(); 
        renderHistoryTable(); 
        updateCategorySelect(); 
    }
};
// Función para borrar ingresos
window.deleteIncome = async (id) => {
    if (confirm('¿Eliminar este ingreso?')) {
        appData.incomes = await window.api.deleteIncome(id);
        applyFilter();
        renderHistoryTable();
    }
}

window.openEditModal = (id, type) => {
    const editModal = document.getElementById('edit-expense-modal');
    const title = editModal.querySelector('h3');
    const categoryLabel = editModal.querySelector('label[for="edit-category"]');
    
    // Buscar el objeto en el array correcto
    const item = type === 'income' 
        ? appData.incomes.find(i => String(i.id) === String(id))
        : appData.expenses.find(e => String(e.id) === String(id));

    if (!item) return;

    // Configurar el modal según el tipo
    title.innerText = type === 'income' ? 'Editar Ingreso' : 'Editar Gasto';
    document.getElementById('edit-id').dataset.type = type; // Guardamos el tipo en un atributo data

    const selectCat = document.getElementById('edit-category');
    if (type === 'income') {
        // Si es ingreso, mostramos orígenes en lugar de categorías
        categoryLabel.innerText = "Origen";
        selectCat.innerHTML = appData.incomeSources.map(s => `<option value="${s}">${s}</option>`).join('');
        document.getElementById('edit-category').value = item.source;
        // Ocultar fuente de pago ya que ingresos no suelen tenerla en tu esquema
        document.getElementById('edit-source').parentElement.style.display = 'none';
    } else {
        // Si es gasto, comportamiento normal
        categoryLabel.innerText = "Categoría";
        selectCat.innerHTML = appData.categories.map(c => `<option value="${c}">${c}</option>`).join('');
        document.getElementById('edit-category').value = item.category;
        document.getElementById('edit-source').parentElement.style.display = 'block';
        document.getElementById('edit-source').value = item.source;
    }

    // Ajustar fecha
    const date = new Date(item.timestamp);
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date - tzoffset).toISOString().slice(0, 16);

    // Llenar valores comunes
    document.getElementById('edit-id').value = item.id;
    document.getElementById('edit-amount').value = item.amount;
    document.getElementById('edit-date').value = localISOTime;
    document.getElementById('edit-description').value = item.description;

    editModal.classList.remove('hidden');
    editModal.classList.add('flex');
};

document.getElementById('close-edit-modal').addEventListener('click', () => {
    const editModal = document.getElementById('edit-expense-modal');
    editModal.classList.add('hidden');
    editModal.classList.remove('flex');
});


document.getElementById('edit-expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const type = document.getElementById('edit-id').dataset.type;
    const id = document.getElementById('edit-id').value;
    
    btn.innerText = "Guardando...";

    const dateInputStr = document.getElementById('edit-date').value;
    const updatedTimestamp = new Date(dateInputStr).toISOString();

    if (type === 'income') {
        const updatedIncome = {
            id: id,
            amount: document.getElementById('edit-amount').value,
            timestamp: updatedTimestamp,
            source: document.getElementById('edit-category').value, // En ingresos usamos el select de categoría para el source
            description: document.getElementById('edit-description').value
        };
        appData.incomes = await window.api.editIncome(updatedIncome);
    } else {
        const updatedExpense = {
            id: id,
            amount: document.getElementById('edit-amount').value,
            timestamp: updatedTimestamp,
            category: document.getElementById('edit-category').value,
            source: document.getElementById('edit-source').value,
            description: document.getElementById('edit-description').value
        };
        appData.expenses = await window.api.editExpense(updatedExpense);
    }
    
    applyFilter();
    renderHistoryTable();
    
    document.getElementById('edit-expense-modal').classList.add('hidden');
    document.getElementById('edit-expense-modal').classList.remove('flex');
    btn.innerText = "Guardar Cambios";
});
// ====== SECCIÓN: TU OPINIÓN (FEEDBACK) ======

window.openFeedbackModal = () => {
    const modal = document.getElementById('feedback-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Limpiar campos al abrir
    document.getElementById('feedback-name').value = '';
    document.getElementById('feedback-message').value = '';
    document.getElementById('char-count').innerText = '0';
};

const closeFeedbackModal = () => {
    const modal = document.getElementById('feedback-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

document.getElementById('close-feedback-modal').addEventListener('click', closeFeedbackModal);
document.getElementById('cancel-feedback').addEventListener('click', closeFeedbackModal);

// Contador de caracteres dinámico
document.getElementById('feedback-message').addEventListener('input', function() {
    document.getElementById('char-count').innerText = this.value.length;
});

// Enviar formulario
document.getElementById('feedback-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalContent = btn.innerHTML;
    
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Enviando...`;
    btn.disabled = true;
    lucide.createIcons();

    const nameInput = document.getElementById('feedback-name').value.trim();
    const name = nameInput !== '' ? nameInput : 'Anónimo';
    const message = document.getElementById('feedback-message').value.trim();

    try {
        // Llama a la API de Electron (La configuraremos en el siguiente paso)
        await window.api.sendFeedback({ name, message });
        
        closeFeedbackModal();
        showToast();
    } catch (error) {
        alert("Hubo un error al enviar tu mensaje. Intenta de nuevo.");
    } finally {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        lucide.createIcons();
    }
});

// Mostrar tarjeta flotante (Toast)
function showToast() {
    const toast = document.getElementById('toast-notification');
    
    // Mostrar
    toast.classList.remove('opacity-0', 'translate-y-10');
    toast.classList.add('opacity-100', 'translate-y-0');

    // Ocultar después de 5 segundos
    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-10');
    }, 5000);
}