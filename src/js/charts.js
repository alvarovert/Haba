let barChartInstance = null;
let doughnutChartInstance = null;

Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#9CA3AF';

function renderCharts(expenses) {
    const dates = {};
    const categories = {};

    expenses.forEach(e => {
        const dateStr = new Date(e.timestamp).toLocaleDateString();
        dates[dateStr] = (dates[dateStr] || 0) + parseFloat(e.amount);
        categories[e.category] = (categories[e.category] || 0) + parseFloat(e.amount);
    });

    // Bar Chart
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

    // Doughnut Chart
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
}