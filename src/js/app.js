lucide.createIcons();

let appData = { expenses: [], categories: [] };

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    appData = await window.api.getData();
    updateCategorySelect();
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

function applyFilter() {
    const filter = document.getElementById('time-filter').value;
    const now = new Date();
    
    let filtered = appData.expenses.filter(e => {
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

    updateDashboardStats(filtered);
    renderCharts(filtered);
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
    btn.innerText = "Guardando...";

    const newExpense = {
        amount: document.getElementById('amount').value,
        category: document.getElementById('category').value,
        source: document.getElementById('source').value,
        description: document.getElementById('description').value
    };

    const saved = await window.api.addExpense(newExpense);
    appData.expenses.push(saved);
    
    e.target.reset();
    applyFilter(); // Actualiza dashboard
    
    setTimeout(() => {
        btn.innerText = "Guardar Gasto";
        switchTab('dashboard'); // Transición suave al dashboard
    }, 400);
});

// Exportar
async function exportData() {
    const res = await window.api.exportCsv();
    if (res.success) alert('¡Datos exportados con éxito!');
    else if(res.msg) alert(res.msg);
}

// ====== HISTORIAL (TABLA) ======
function renderHistoryTable() {
    const tbody = document.getElementById('history-table-body');
    
    // Ordenar gastos del más reciente al más antiguo
    const sortedExpenses = [...appData.expenses].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (sortedExpenses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-12 text-center text-gray-400 text-sm">No hay gastos registrados aún.</td></tr>`;
        return;
    }

    tbody.innerHTML = sortedExpenses.map(e => {
        const dateObj = new Date(e.timestamp);
        const dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        return `
            <tr class="hover:bg-gray-50/80 transition-colors group">
                <td class="py-4 px-6 text-sm text-gray-500 whitespace-nowrap">${dateStr} <span class="text-gray-400 text-xs ml-1">${timeStr}</span></td>
                <td class="py-4 px-6 text-sm text-gray-900 font-medium">${e.description}</td>
                <td class="py-4 px-6 text-sm">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        ${e.category}
                    </span>
                </td>
                <td class="py-4 px-6 text-sm text-gray-500">${e.source}</td>
                <td class="py-4 px-6 text-sm text-gray-900 font-semibold text-right">S/${parseFloat(e.amount).toFixed(2)}</td>
                <td class="py-4 px-4 text-sm text-center">
                    <div class="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="openEditModal('${e.id}')" class="text-gray-400 hover:text-indigo-600 transition-colors" title="Editar">
                            <i data-lucide="pencil" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteExpense('${e.id}')" class="text-gray-400 hover:text-red-500 transition-colors" title="Eliminar">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    lucide.createIcons(); // Vuelve a cargar los iconos en la tabla
}
// ====== EDITAR Y ELIMINAR GASTOS ======

window.deleteExpense = async (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
        appData.expenses = await window.api.deleteExpense(id);
        applyFilter(); 
        renderHistoryTable(); 
    }
};

window.openEditModal = (id) => {
    const editModal = document.getElementById('edit-expense-modal');
    
    // Buscar el gasto asegurándonos de que ambos sean String
    const expense = appData.expenses.find(e => String(e.id) === String(id));
    if (!expense) return;

    // Llenar categorías en el select del modal
    const selectCat = document.getElementById('edit-category');
    selectCat.innerHTML = appData.categories.map(c => `<option value="${c}">${c}</option>`).join('');

    // Ajustar zona horaria para el input datetime-local
    const date = new Date(expense.timestamp);
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date - tzoffset).toISOString().slice(0, 16);

    // Llenar valores
    document.getElementById('edit-id').value = expense.id;
    document.getElementById('edit-amount').value = expense.amount;
    document.getElementById('edit-date').value = localISOTime;
    document.getElementById('edit-category').value = expense.category;
    document.getElementById('edit-source').value = expense.source;
    document.getElementById('edit-description').value = expense.description;

    // Mostrar modal
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
    const originalText = btn.innerText;
    btn.innerText = "Guardando...";

    const dateInputStr = document.getElementById('edit-date').value;
    const updatedTimestamp = new Date(dateInputStr).toISOString();

    const updatedExpense = {
        id: document.getElementById('edit-id').value,
        amount: document.getElementById('edit-amount').value,
        timestamp: updatedTimestamp,
        category: document.getElementById('edit-category').value,
        source: document.getElementById('edit-source').value,
        description: document.getElementById('edit-description').value
    };

    appData.expenses = await window.api.editExpense(updatedExpense);
    
    applyFilter();
    renderHistoryTable();
    
    const editModal = document.getElementById('edit-expense-modal');
    editModal.classList.add('hidden');
    editModal.classList.remove('flex');
    btn.innerText = originalText;
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