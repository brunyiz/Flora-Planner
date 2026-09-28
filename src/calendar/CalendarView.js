/**
 * CalendarView.js
 * Renderização do calendário (Mensal/Semanal/Anual) e relatórios.
 * Badges usam a COR DA CATEGORIA (não mais a prioridade).
 */

class CalendarView {
    constructor(_ignored, { onTaskClick, onTasksUpdated, onNewTask }) {
        this.onTaskClick = onTaskClick;
        this.onTasksUpdated = onTasksUpdated;
        this.onNewTask = onNewTask;
        this.tasks = [];
        this.currentDate = new Date();
        this.currentView = 'month';
    }

    setTasks(tasks) {
        this.tasks = tasks;
        this.render();
    }

    setView(view) {
        this.currentView = view;
        this.render();
    }

    setDate(date) {
        this.currentDate = date;
        this.render();
    }

    render() {
        document.querySelectorAll('.view').forEach(el => el.style.display = 'none');
        const container = document.getElementById(`view-${this.currentView}`);
        if (container) container.style.display = 'block';

        switch (this.currentView) {
            case 'month': this.renderMonth(); break;
            case 'week': this.renderWeek(); break;
            case 'day': this.renderDay(); break;
            case 'year': this.renderYear(); break;
        }

        const label = document.getElementById('period-label');
        if (label) label.textContent = this.getPeriodLabel();
    }

    getPeriodLabel() {
        const d = this.currentDate;
        const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                        'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        if (this.currentView === 'month') return `${months[d.getMonth()]} ${d.getFullYear()}`;
        if (this.currentView === 'year') return `${d.getFullYear()}`;
        if (this.currentView === 'week') {
            const { start, end } = this.getWeekRange(d);
            return `${start.getDate()}/${start.getMonth()+1} – ${end.getDate()}/${end.getMonth()+1} ${end.getFullYear()}`;
        }
        if (this.currentView === 'day') {
            return d.toLocaleDateString('pt-BR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            });
        }
        return '';
    }

    toDateString(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    getWeekRange(date) {
        const d = new Date(date);
        const day = d.getDay();
        const start = new Date(d);
        start.setDate(d.getDate() - day);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    /**
     * Retorna todas as tarefas aplicáveis a uma data específica,
     * considerando recorrência e ordenando por order.
     */
    getTasksForDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const dow = date.getDay();
        return this.tasks
            .filter(task => {
                // tarefa simples naquele dia
                if (task.date === dateStr) return true;

                // tarefa recorrente
                if (task.recurrence && task.recurrence.days) {
                    if (task.recurrence.until) {
                        const until = new Date(task.recurrence.until + 'T23:59:59');
                        if (date > until) return false;
                    }
                    if (task.date) {
                        const start = new Date(task.date + 'T00:00:00');
                        if (date < start) return false;
                    }
                    return task.recurrence.days.includes(dow);
                }
                return false;
            })
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    /* ============ MONTH ============ */
    renderMonth() {
        const container = document.getElementById('view-month');
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDow = firstDay.getDay();
        const totalDays = lastDay.getDate();
        const today = this.toDateString(new Date());

        let html = '<div class="month-grid">';
        ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].forEach(d => {
            html += `<div class="month-header">${d}</div>`;
        });

        for (let i = 0; i < startDow; i++) html += '<div class="month-cell empty"></div>';

        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const dayTasks = this.getTasksForDate(dateStr);
            const isToday = dateStr === today;

            html += `<div class="month-cell ${isToday ? 'today' : ''}" data-date="${dateStr}">
                <div class="month-day-num">${day}</div>
                <div class="month-tasks">
                    ${dayTasks.slice(0, 3).map(t => `
                        <div class="month-task cat-${t.category}" data-task-id="${t.id}">
                            ${t.time ? t.time + ' ' : ''}${this.escape(t.title)}
                        </div>
                    `).join('')}
                    ${dayTasks.length > 3 ? `<div class="more">+${dayTasks.length - 3}</div>` : ''}
                </div>
            </div>`;
        }
        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.month-task').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const task = this.tasks.find(t => t.id === el.dataset.taskId);
                if (task && this.onTaskClick) this.onTaskClick(task);
            });
        });
        container.querySelectorAll('.month-cell[data-date]').forEach(el => {
            el.addEventListener('click', () => {
                if (this.onNewTask) this.onNewTask(el.dataset.date);
            });
        });
    }

    /* ============ WEEK ============ */
    renderWeek() {
        const container = document.getElementById('view-week');
        const { start } = this.getWeekRange(this.currentDate);
        const today = this.toDateString(new Date());
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }

        let html = '<div class="week-grid">';
        days.forEach(d => {
            const dateStr = this.toDateString(d);
            const isToday = dateStr === today;
            html += `<div class="week-col ${isToday ? 'today' : ''}" data-date="${dateStr}">
                <div class="week-col-header">
                    <div class="week-day-name">${d.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
                    <div class="week-day-num">${d.getDate()}</div>
                </div>
                <div class="week-day-tasks" data-date="${dateStr}"></div>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;

        days.forEach(d => {
            const dateStr = this.toDateString(d);
            const tasksEl = container.querySelector(`.week-day-tasks[data-date="${dateStr}"]`);
            const dayTasks = this.getTasksForDate(dateStr);
            tasksEl.innerHTML = dayTasks.map(t => `
                <div class="week-task cat-${t.category} prio-${t.priority} ${t.completed ? 'done' : ''}"
                     data-task-id="${t.id}">
                    <div class="week-task-time">${t.time || '--:--'}${t.endTime ? ' - ' + t.endTime : ''}</div>
                    <div class="week-task-title">${this.escape(t.title)}</div>
                    ${t.recurrence ? '<div class="week-task-recur">🔁</div>' : ''}
                </div>
            `).join('');
        });

        container.querySelectorAll('.week-task').forEach(el => {
            el.addEventListener('click', () => {
                const task = this.tasks.find(t => t.id === el.dataset.taskId);
                if (task && this.onTaskClick) this.onTaskClick(task);
            });
        });

        if (window.Sortable) {
            container.querySelectorAll('.week-day-tasks').forEach(el => {
                new Sortable(el, {
                    group: 'week-tasks',
                    animation: 150,
                    ghostClass: 'sortable-ghost',
                    onEnd: (evt) => this.handleReorder(evt)
                });
            });
        }
    }

    handleReorder(evt) {
        const targetDate = evt.to.dataset.date;
        const orderedIds = Array.from(evt.to.children).map(el => el.dataset.taskId);

        orderedIds.forEach((id, idx) => {
            const task = this.tasks.find(t => t.id === id);
            if (!task) return;
            task.order = idx;
            // Se moveu para outro dia e não é recorrente, atualiza a data
            if (task.date !== targetDate && !task.recurrence) {
                task.date = targetDate;
            }
        });

        if (this.onTasksUpdated) this.onTasksUpdated(this.tasks);
    }

    /* ============ DAY ============ */
    renderDay() {
        const container = document.getElementById('view-day');
        const dateStr = this.toDateString(this.currentDate);
        const dayTasks = this.getTasksForDate(dateStr);

        const header = `
            <div class="day-header">
                <h2>${this.currentDate.toLocaleDateString('pt-BR', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}</h2>
                <button class="btn-add-day" data-date="${dateStr}">+ Nova Tarefa</button>
            </div>
        `;

        const tasksHtml = dayTasks.length === 0
            ? '<p class="empty-msg">Nenhuma tarefa para este dia.</p>'
            : dayTasks.map(t => `
                <div class="day-task cat-${t.category} prio-${t.priority} ${t.completed ? 'done' : ''}"
                     data-task-id="${t.id}">
                    <div class="day-task-time">
                        <span class="time">${t.time || '--:--'}</span>
                        ${t.endTime ? `<span class="time-end">→ ${t.endTime}</span>` : ''}
                    </div>
                    <div class="day-task-body">
                        <div class="day-task-title">${this.escape(t.title)}</div>
                        ${t.description ? `<div class="day-task-desc">${this.escape(t.description)}</div>` : ''}
                        ${t.notes ? `<div class="day-task-notes"><strong>📝 Anotações:</strong> ${this.escape(t.notes).replace(/\n/g, '<br>')}</div>` : ''}
                        ${t.recurrence ? `<div class="day-task-recur">🔁 ${this.describeRecurrence(t.recurrence)}</div>` : ''}
                    </div>
                </div>
            `).join('');

        container.innerHTML = header + `<div class="day-tasks-list">${tasksHtml}</div>`;

        container.querySelectorAll('.day-task').forEach(el => {
            el.addEventListener('click', () => {
                const task = this.tasks.find(t => t.id === el.dataset.taskId);
                if (task && this.onTaskClick) this.onTaskClick(task);
            });
        });
        const addBtn = container.querySelector('.btn-add-day');
        if (addBtn && this.onNewTask) {
            addBtn.addEventListener('click', () => this.onNewTask(dateStr));
        }
    }

    describeRecurrence(rec) {
        const names = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
        const days = rec.days.map(d => names[d]).join(', ');
        return rec.until ? `${days} até ${rec.until}` : days;
    }

    /* ============ YEAR ============ */
    renderYear() {
        const container = document.getElementById('view-year');
        const year = this.currentDate.getFullYear();
        const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        const today = new Date();

        let html = '<div class="year-grid">';
        for (let m = 0; m < 12; m++) {
            const firstDay = new Date(year, m, 1);
            const lastDay = new Date(year, m + 1, 0);
            const startDow = firstDay.getDay();
            const totalDays = lastDay.getDate();

            html += `<div class="year-month"><div class="year-month-title">${months[m]}</div><div class="mini-grid">`;
            ['D','S','T','Q','Q','S','S'].forEach(d => html += `<div class="mini-header">${d}</div>`);
            for (let i = 0; i < startDow; i++) html += '<div class="mini-day empty"></div>';

            for (let day = 1; day <= totalDays; day++) {
                const isToday = today.getFullYear() === year
                    && today.getMonth() === m
                    && today.getDate() === day;
                const dateStr = `${year}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const hasTasks = this.getTasksForDate(dateStr).length > 0;
                html += `<div class="mini-day ${isToday ? 'today' : ''} ${hasTasks ? 'has-tasks' : ''}"
                              data-date="${dateStr}">${day}</div>`;
            }
            html += '</div></div>';
        }
        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.mini-day[data-date]').forEach(el => {
            el.addEventListener('click', () => {
                const [y, m, d] = el.dataset.date.split('-').map(Number);
                this.currentDate = new Date(y, m - 1, d);
                this.setView('day');
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                document.querySelector('.view-btn[data-view="day"]')?.classList.add('active');
            });
        });
    }

    escape(str) {
        const div = document.createElement('div');
        div.textContent = str ?? '';
        return div.innerHTML;
    }
}
