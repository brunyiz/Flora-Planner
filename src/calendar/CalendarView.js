/**
 * CalendarView.js
 * Módulo responsável por renderizar a grade do calendário (Mensal, Semanal, Anual)
 * e o painel de Relatórios.
 */

class CalendarView {
    constructor({ containerId, onDayClick, onTaskClick }) {
        this.containerId = containerId;
        this.onDayClick = onDayClick;
        this.onTaskClick = onTaskClick;
        this.currentDate = new Date();
        this.currentView = 'month'; // 'month' | 'week' | 'year' | 'reports'
        this.tasks = [];
        this.chartInstance = null;

        this.initDOM();
    }

    initDOM() {
        this.container = document.getElementById(this.containerId);
    }

    setTasks(tasks) {
        this.tasks = tasks;
        this.render();
    }

    setView(view) {
        this.currentView = view;
        this.syncToggleButtons();
        this.render();
    }

    /** Mantém os botões Anual/Mensal/Semanal/Relatórios do date-nav sincronizados com a view atual */
    syncToggleButtons() {
        const map = {
            year: 'btn-year-view',
            month: 'btn-month-view',
            week: 'btn-week-view',
            reports: 'btn-reports-view'
        };
        Object.entries(map).forEach(([view, id]) => {
            const btn = document.getElementById(id);
            if (btn) btn.classList.toggle('active', view === this.currentView);
        });

        // Esconde a navegação de datas (prev/next/hoje) na tela de relatórios
        const navControls = document.getElementById('nav-controls');
        if (navControls) navControls.style.visibility = this.currentView === 'reports' ? 'hidden' : 'visible';
    }

    navigate(direction) {
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        } else if (this.currentView === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
        } else if (this.currentView === 'year') {
            this.currentDate.setFullYear(this.currentDate.getFullYear() + direction);
        }
        this.render();
    }

    goToToday() {
        this.currentDate = new Date();
        this.render();
    }

    render() {
        const displayElem = document.getElementById('current-date-display');
        if (displayElem) {
            displayElem.textContent = this.getFormattedDateHeader();
        }

        const views = ['view-month', 'view-week', 'view-year', 'view-reports'];
        views.forEach(v => {
            const el = document.getElementById(v);
            if (el) el.style.display = 'none';
        });

        const activeViewEl = document.getElementById(`view-${this.currentView}`);
        if (activeViewEl) activeViewEl.style.display = 'block';

        this.syncToggleButtons();

        if (this.currentView === 'month') {
            this.renderMonthGrid();
        } else if (this.currentView === 'week') {
            this.renderWeekGrid();
        } else if (this.currentView === 'year') {
            this.renderYearGrid();
        } else if (this.currentView === 'reports') {
            this.renderReports();
        }
    }

    getFormattedDateHeader() {
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        if (this.currentView === 'year') {
            return `${this.currentDate.getFullYear()}`;
        }
        if (this.currentView === 'reports') {
            return 'Relatórios';
        }
        return `${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    }

    renderMonthGrid() {
        const monthGrid = document.getElementById('month-grid');
        if (!monthGrid) return;

        // Mantém apenas os cabeçalhos de dia da semana
        monthGrid.innerHTML = `
            <div class="weekday-header">Dom</div>
            <div class="weekday-header">Seg</div>
            <div class="weekday-header">Ter</div>
            <div class="weekday-header">Qua</div>
            <div class="weekday-header">Qui</div>
            <div class="weekday-header">Sex</div>
            <div class="weekday-header">Sáb</div>
        `;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Dias do mês anterior
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day other-month';
            dayEl.innerHTML = `<span class="day-number">${dayNum}</span>`;
            monthGrid.appendChild(dayEl);
        }

        // Dias do mês atual
        const today = new Date();
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

            const dayEl = document.createElement('div');
            dayEl.className = `calendar-day ${isToday ? 'today' : ''}`;
            dayEl.innerHTML = `<span class="day-number">${d}</span>`;

            // Tarefas do dia
            const dayTasks = this.tasks
                .filter(t => t.date === dateStr)
                .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

            dayTasks.forEach(task => {
                const badge = document.createElement('div');
                badge.className = `task-item-badge prio-${task.priority || 'media'} ${task.completed ? 'done' : ''}`;
                badge.textContent = task.time ? `${task.time} ${task.title}` : task.title;
                badge.title = task.title;
                badge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.onTaskClick) this.onTaskClick(task);
                });
                dayEl.appendChild(badge);
            });

            dayEl.addEventListener('click', () => {
                if (this.onDayClick) this.onDayClick(dateStr);
            });

            monthGrid.appendChild(dayEl);
        }

        // Dias do próximo mês para completar a última semana
        const totalCells = firstDay + daysInMonth;
        const remaining = (7 - (totalCells % 7)) % 7;
        for (let d = 1; d <= remaining; d++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day other-month';
            dayEl.innerHTML = `<span class="day-number">${d}</span>`;
            monthGrid.appendChild(dayEl);
        }
    }

    renderWeekGrid() {
        const weeklyGrid = document.getElementById('weekly-grid');
        if (!weeklyGrid) return;
        weeklyGrid.innerHTML = '';

        const startOfWeek = new Date(this.currentDate);
        startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());

        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const today = new Date();

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);

            const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
            const dayTasks = this.tasks
                .filter(t => t.date === dateStr)
                .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

            const isToday = today.toDateString() === day.toDateString();

            const col = document.createElement('div');
            col.className = `week-day-column ${isToday ? 'today' : ''}`;
            col.innerHTML = `
                <div class="week-day-header">
                    <div class="week-day-name">${days[i]}</div>
                    <div class="week-day-date">${day.getDate()}</div>
                </div>
            `;

            dayTasks.forEach(task => {
                const tBlock = document.createElement('div');
                tBlock.className = `time-block task prio-${task.priority || 'media'} ${task.completed ? 'done' : ''}`;
                tBlock.textContent = task.time ? `${task.time} ${task.title}` : task.title;
                tBlock.title = task.title;
                tBlock.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.onTaskClick) this.onTaskClick(task);
                });
                col.appendChild(tBlock);
            });

            col.addEventListener('click', () => {
                if (this.onDayClick) this.onDayClick(dateStr);
            });

            weeklyGrid.appendChild(col);
        }
    }

    renderYearGrid() {
        const yearGrid = document.getElementById('year-grid');
        if (!yearGrid) return;
        yearGrid.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const weekLetters = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

        monthNames.forEach((mName, monthIdx) => {
            const mDiv = document.createElement('div');
            mDiv.className = 'mini-month';
            mDiv.innerHTML = `<div class="mini-month-title">${mName}</div>`;

            const grid = document.createElement('div');
            grid.className = 'mini-month-grid';

            weekLetters.forEach(l => {
                const lbl = document.createElement('div');
                lbl.className = 'mini-month-day other-month';
                lbl.textContent = l;
                grid.appendChild(lbl);
            });

            const firstDay = new Date(year, monthIdx, 1).getDay();
            const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

            for (let i = 0; i < firstDay; i++) {
                const empty = document.createElement('div');
                empty.className = 'mini-month-day other-month';
                grid.appendChild(empty);
            }

            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const hasTask = this.tasks.some(t => t.date === dateStr);
                const cell = document.createElement('div');
                cell.className = `mini-month-day ${hasTask ? 'has-task' : ''}`;
                cell.textContent = d;
                if (hasTask) cell.title = `${this.tasks.filter(t => t.date === dateStr).length} tarefa(s)`;
                grid.appendChild(cell);
            }

            mDiv.appendChild(grid);

            mDiv.addEventListener('click', () => {
                this.currentDate = new Date(year, monthIdx, 1);
                this.currentView = 'month';
                const monthBtn = document.getElementById('btn-month-view');
                if (monthBtn) monthBtn.click();
                else this.render();
            });

            yearGrid.appendChild(mDiv);
        });
    }

    renderReports() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const totalEl = document.getElementById('stat-total-tasks');
        const rateEl = document.getElementById('stat-completed-rate');
        if (totalEl) totalEl.textContent = totalTasks;
        if (rateEl) rateEl.textContent = `${completionRate}%`;

        this.renderCategoryChart();
    }

    renderCategoryChart() {
        const canvas = document.getElementById('categoryChart');
        const wrapper = document.getElementById('chart-wrapper');
        if (!canvas || !wrapper) return;

        if (this.tasks.length === 0) {
            if (this.chartInstance) {
                this.chartInstance.destroy();
                this.chartInstance = null;
            }
            wrapper.innerHTML = '<div class="chart-empty">Nenhuma tarefa cadastrada ainda.<br>Adicione tarefas para ver o relatório por categoria.</div>';
            return;
        }

        // Garante que o canvas exista (caso tenha sido substituído pela mensagem vazia)
        if (!wrapper.querySelector('#categoryChart')) {
            wrapper.innerHTML = '<canvas id="categoryChart"></canvas>';
        }
        const ctx = document.getElementById('categoryChart').getContext('2d');

        const counts = {};
        this.tasks.forEach(t => {
            const cat = t.category || 'Geral';
            counts[cat] = (counts[cat] || 0) + 1;
        });

        const palette = ['#D8B4FE', '#D46FA8', '#48BB78', '#ED8936', '#4299E1', '#9F7AEA', '#F56565'];
        const labels = Object.keys(counts);
        const data = Object.values(counts);
        const colors = labels.map((_, i) => palette[i % palette.length]);

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        if (typeof Chart === 'undefined') {
            wrapper.innerHTML = '<div class="chart-empty">Não foi possível carregar o gráfico (Chart.js).</div>';
            return;
        }

        this.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    title: { display: true, text: 'Tarefas por Categoria' }
                }
            }
        });
    }
}
