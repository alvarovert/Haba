let barChartInstance = null;
let doughnutChartInstance = null;
let progressChartInstance = null;

Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#9CA3AF';

function renderCharts(expenses) {
    // 1. OBTENER FILTRO ACTUAL PARA EL GRÁFICO DE PROGRESO
    const filterValue = document.getElementById('time-filter').value;
    const incomes = appData.incomes || [];
    
    // 2. PROCESAR DATOS PARA BAR Y DOUGHNUT (Gastos)
    const dates = {};
    const categories = {};

    expenses.forEach(e => {
        const dateStr = new Date(e.timestamp).toLocaleDateString();
        dates[dateStr] = (dates[dateStr] || 0) + parseFloat(e.amount);
        categories[e.category] = (categories[e.category] || 0) + parseFloat(e.amount);
    });

    // 3. FILTRAR INGRESOS PARA EL PROGRESS CHART (Balance)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let filteredIncomes = incomes.filter(i => {
        const d = new Date(i.timestamp);
        // Si el filtro es Hoy, Mes o Trimestre, el progreso siempre muestra el MES actual
        if (filterValue === 'month' || filterValue === 'today' || filterValue === 'quarter') {
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }
        return true; // Para "Todo el tiempo" muestra total acumulado
    });

    const totalIncomes = filteredIncomes.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

    // --- RENDER: BAR CHART (Gasto Diario) ---
    const barCtx = document.getElementById('barChart').getContext('2d');
    if (barChartInstance) barChartInstance.destroy();
    
    barChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(dates),
            datasets: [{
                label: 'Gasto Diario',
                data: Object.values(dates),
                backgroundColor: '#818CF8',
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { display: false, drawBorder: false } },
                x: { grid: { display: false, drawBorder: false } }
            }
        }
    });

    // --- RENDER: DOUGHNUT CHART (Categorías) ---
    const doughnutCtx = document.getElementById('doughnutChart').getContext('2d');
    if (doughnutChartInstance) doughnutChartInstance.destroy();

    const colors = ['#818CF8', '#A78BFA', '#F472B6', '#60A5FA', '#34D399', '#FBBF24'];
    
    doughnutChartInstance = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: colors.slice(0, Object.keys(categories).length),
                borderWidth: 0,
                cutout: '75%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8 } }
            }
        }
    });

    // --- RENDER: PROGRESS CHART (Balance Ingresos vs Gastos) ---
    const progCtx = document.getElementById('progressChart').getContext('2d');
    if (progressChartInstance) progressChartInstance.destroy();

    progressChartInstance = new Chart(progCtx, {
        type: 'bar',
        data: {
            labels: ['Balance'],
            datasets: [
                {
                    label: 'Gastos',
                    data: [totalExpenses],
                    backgroundColor: '#818CF8', // Morado
                    borderRadius: 8,
                    barThickness: 25,
                    order: 1 // Capa superior
                },
                {
                    label: 'Ingresos',
                    data: [totalIncomes],
                    backgroundColor: '#10B981', // Verde
                    borderRadius: 8,
                    barThickness: 25,
                    order: 2 // Capa inferior
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: S/${context.raw.toFixed(2)}`
                    }
                }
            },
            scales: {
                x: { 
                    display: false,
                    // El máximo de la escala es el valor más alto entre ingresos o gastos
                    max: Math.max(totalIncomes, totalExpenses, 1) * 1.05 
                },
                y: { 
                    stacked: true, // Esto permite que se dibujen en la misma línea
                    display: false 
                }
            }
        }
    });
}

// --- TRACKING DE POSTHOG: USO DE FILTROS EN DASHBOARD ---
document.getElementById('time-filter').addEventListener('change', (event) => {
    const filterUsed = event.target.value;

    if (window.api && window.api.trackCustomEvent) {
        window.api.trackCustomEvent('dashboard_filter_used', {
            filter_value: filterUsed, 
            location: 'dashboard_main'
        });
    }
});