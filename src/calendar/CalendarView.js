/**
 * CalendarView.js
 * Renderização (Mensal/Semanal/Diário/Anual) e relatórios.
 * v6: múltiplos marcadores por dia, hover tools, atalhos para o Diário.
 */

class CalendarView {
    constructor({ containerId, onDayClick, onTaskClick, onTasksUpdated, onGoToDay, onEditMarker }) {
        this.containerId = containerId;
        this.onDayClick = onDayClick;
        this.onTaskClick = onTaskClick;
        this.onTasksUpdated = onTasksUpdated;
        this.onGoToDay = onGoToDay;
        this.onEditMarker = onEditMarker;
        this.currentDate = new Date();
        this.currentView = 'month';
        this.tasks = [];
        this.chartInstance = null;
        this.initDOM();
    }

    initDOM() { this.container = document.getElementById(this.containerId); }

    setTasks(tasks) { this.tasks = tasks; this.render(); }
    setView(view) { this.currentView = view; this.syncToggleButtons(); this.render(); }

    syncToggleButtons() {
        const map = {
            year: 'btn-year-view', month: 'btn-month-view',
            week: 'btn-week-view', day: 'btn-day-view', reports: 'btn-reports-view'
        };
        Object.entries(map).forEach(([view, id]) => {
            const btn = document.getElementById(id);
            if (btn) btn.classList.toggle('active', view === this.currentView);
        });
        const navControls = document.getElementById('nav-controls');
        if (navControls) navControls.style.visibility = this.currentView === 'reports' ? 'hidden' : 'visible';
    }

    navigate(direction) {
        if (this.currentView === 'month') this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        else if (this.currentView === 'week') this.currentDate.setDate(this.currentDate.getDate() + direction * 7);
        else if (this.currentView === 'year') this.currentDate.setFullYear(this.currentDate.getFullYear() + direction);
        else if (this.currentView === 'day') this.currentDate.setDate(this.currentDate.getDate() + direction);
        this.render();
    }

    goToToday() { this.currentDate = new Date(); this.render(); }

    /** Navega para uma data específica e muda para view Diário. */
    goToDay(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        this.currentDate = new Date(y, m - 1, d);
        this.setView('day');
    }

    render() {
        const displayElem = document.getElementById('current-date-display');
        if (displayElem) displayElem.textContent = this.getFormattedDateHeader();

        ['view-month','view-week','view-day','view-year','view-reports'].forEach(v => {
            const el = document.getElementById(v);
            if (el) el.style.display = 'none';
        });

        const activeViewEl = document.getElementById(`view-${this.currentView}`);
        if (activeViewEl) activeViewEl.style.display = 'block';

        this.syncToggleButtons();

        if (this.currentView === 'month') this.renderMonthGrid();
        else if (this.currentView === 'week') this.renderWeekGrid();
        else if (this.currentView === 'day') this.renderDayView();
        else if (this.currentView === 'year') this.renderYearGrid();
        else if (this.currentView === 'reports') this.renderReports();
    }

    getFormattedDateHeader() {
        const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        if (this.currentView === 'year') return `${this.currentDate.getFullYear()}`;
        if (this.currentView === 'reports') return 'Relatórios';
        if (this.currentView === 'day') {
            const wd = this.currentDate.toLocaleDateString('pt-BR', { weekday: 'long' });
            return `${wd.charAt(0).toUpperCase() + wd.slice(1)}, ${this.currentDate.getDate()} de ${months[this.currentDate.getMonth()]}`;
        }
        return `${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    }

    applyCategoryColor(el, categoryName) {
        const color = StorageManager.getCategoryColor(categoryName || 'Geral');
        el.style.backgroundColor = color;
        el.style.color = this.isLightColor(color) ? '#1a202c' : '#ffffff';
    }

    isLightColor(hex) {
        const h = String(hex).replace('#', '');
        if (h.length !== 6) return false;
        const r = parseInt(h.substr(0, 2), 16);
        const g = parseInt(h.substr(2, 2), 16);
        const b = parseInt(h.substr(4, 2), 16);
        return (0.299 * r + 0.587 * g + 0.114 * b) > 170;
    }

    formatDateStr(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    escapeHtml(str) {
        return String(str ?? '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    taskMatchesDate(task, dateStr, dateObj, dow) {
        if (task.date === dateStr && !task.recurrence) return true;
        if (task.recurrence && Array.isArray(task.recurrence.days) && task.recurrence.days.length > 0) {
            if (task.recurrence.until) {
                const until = new Date(task.recurrence.until + 'T23:59:59');
                if (dateObj > until) return false;
            }
            if (task.date) {
                const start = new Date(task.date + 'T00:00:00');
                if (dateObj < start) return false;
            }
            return task.recurrence.days.includes(dow);
        }
        return false;
    }

    isTaskRecurring(task) {
        return !!(task && task.recurrence && Array.isArray(task.recurrence.days) && task.recurrence.days.length > 0);
    }

    isTaskCompletedOn(task, dateStr) {
        if (this.isTaskRecurring(task)) {
            const dates = Array.isArray(task.completedDates) ? task.completedDates : [];
            return dates.includes(dateStr);
        }
        return !!task.completed;
    }

    getTasksForDate(dateStr) {
        const dateObj = new Date(dateStr + 'T00:00:00');
        const dow = dateObj.getDay();
        const matches = this.tasks.filter(t => this.taskMatchesDate(t, dateStr, dateObj, dow));
        const visible = matches.filter(t => {
            if (this.isTaskRecurring(t) && Array.isArray(t.excludedDates)) {
                return !t.excludedDates.includes(dateStr);
            }
            return true;
        });
        const enriched = visible.map(task => ({
            ...task,
            _instanceDate: dateStr,
            _instanceCompleted: this.isTaskCompletedOn(task, dateStr)
        }));
        enriched.sort((a, b) => {
            const aHas = typeof a.order === 'number';
            const bHas = typeof b.order === 'number';
            if (aHas && bHas && a.order !== b.order) return a.order - b.order;
            if (aHas && !bHas) return -1;
            if (!aHas && bHas) return 1;
            return (a.time || '99:99').localeCompare(b.time || '99:99');
        });
        return enriched;
    }

    /* ---------- Reutilizável: cria a barra de hover tools ---------- */
    createHoverTools(dateStr, { compact = false } = {}) {
        const tools = document.createElement('div');
        tools.className = `day-hover-tools${compact ? ' compact' : ''}`;
        tools.innerHTML = `
            <button type="button" class="day-tool" data-action="marker" title="Marcar este dia">
                <i class="fas fa-tag"></i>
            </button>
            <button type="button" class="day-tool" data-action="view" title="Ver dia">
                <i class="fas fa-eye"></i>
            </button>
        `;
        tools.querySelectorAll('.day-tool').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                if (action === 'marker') {
                    if (this.onEditMarker) this.onEditMarker(dateStr, null);
                } else if (action === 'view') {
                    if (this.onGoToDay) this.onGoToDay(dateStr);
                }
            });
        });
        return tools;
    }

    /* ---------------------- MONTH ---------------------- */

    renderMonthGrid() {
        const monthGrid = document.getElementById('month-grid');
        if (!monthGrid) return;
        const MAX_MONTH_TASKS = 3;
        const MAX_MONTH_MARKERS = 2;

        monthGrid.innerHTML = `
            <div class="weekday-header">Dom</div><div class="weekday-header">Seg</div>
            <div class="weekday-header">Ter</div><div class="weekday-header">Qua</div>
            <div class="weekday-header">Qui</div><div class="weekday-header">Sex</div>
            <div class="weekday-header">Sáb</div>
        `;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        for (let i = firstDay - 1; i >= 0; i--) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day other-month';
            dayEl.innerHTML = `<span class="day-number">${daysInPrevMonth - i}</span>`;
            monthGrid.appendChild(dayEl);
        }

        const today = new Date();
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

            const dayEl = document.createElement('div');
            dayEl.className = `calendar-day ${isToday ? 'today' : ''}`;

            // Barra superior
            const topBar = document.createElement('div');
            topBar.className = 'calendar-day-top';

            topBar.appendChild(this.createHoverTools(dateStr));

            const numEl = document.createElement('span');
            numEl.className = 'day-number day-number-link';
            numEl.textContent = d;
            numEl.title = 'Clique para ver o dia';
            numEl.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.onGoToDay) this.onGoToDay(dateStr);
            });
            topBar.appendChild(numEl);
            dayEl.appendChild(topBar);

            // Marcadores
            const markers = StorageManager.getDayMarkersForDate(dateStr);
            const markersRow = document.createElement('div');
            markersRow.className = 'calendar-day-markers';
            markers.slice(0, MAX_MONTH_MARKERS).forEach(mk => {
                const m = document.createElement('div');
                m.className = 'day-marker';
                m.style.backgroundColor = mk.color;
                m.style.color = this.isLightColor(mk.color) ? '#1a202c' : '#ffffff';
                m.textContent = mk.label;
                m.title = mk.label + (mk.recurrence ? ' (recorrente)' : '');
                m.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.onEditMarker) this.onEditMarker(mk.date || dateStr, mk.id);
                });
                markersRow.appendChild(m);
            });
            if (markers.length > MAX_MONTH_MARKERS) {
                const more = document.createElement('div');
                more.className = 'day-marker day-marker-more';
                more.textContent = `+${markers.length - MAX_MONTH_MARKERS}`;
                more.title = `${markers.length} marcadores — clique para ver todos`;
                more.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.onGoToDay) this.onGoToDay(dateStr);
                });
                markersRow.appendChild(more);
            }
            dayEl.appendChild(markersRow);

            // Tarefas
            const dayTasks = this.getTasksForDate(dateStr);
            dayTasks.slice(0, MAX_MONTH_TASKS).forEach(task => {
                const badge = document.createElement('div');
                badge.className = `task-item-badge ${task._instanceCompleted ? 'done' : ''}`;
                const timePrefix = task.time
                    ? (task.endTime ? `${task.time}-${task.endTime} ` : `${task.time} `)
                    : '';
                badge.textContent = `${timePrefix}${task.title}`;
                badge.title = `${task.category || 'Geral'} — ${task.title}`;
                this.applyCategoryColor(badge, task.category);
                badge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.onTaskClick) this.onTaskClick(task, task._instanceDate);
                });
                dayEl.appendChild(badge);
            });

            const remaining = dayTasks.length - MAX_MONTH_TASKS;
            if (remaining > 0) {
                const more = document.createElement('div');
                more.className = 'task-more';
                more.textContent = `+${remaining} mais`;
                more.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.onGoToDay) this.onGoToDay(dateStr);
                });
                dayEl.appendChild(more);
            }

            // Cliques
            dayEl.addEventListener('click', () => {
                if (this.onDayClick) this.onDayClick(dateStr);
            });
            dayEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (this.onEditMarker) this.onEditMarker(dateStr, null);
            });

            monthGrid.appendChild(dayEl);
        }

        const totalCells = firstDay + daysInMonth;
        const remainingCells = (7 - (totalCells % 7)) % 7;
        for (let d = 1; d <= remainingCells; d++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day other-month';
            dayEl.innerHTML = `<span class="day-number">${d}</span>`;
            monthGrid.appendChild(dayEl);
        }
    }

    /* ---------------------- WEEK ---------------------- */

    renderWeekGrid() {
        const weeklyGrid = document.getElementById('weekly-grid');
        if (!weeklyGrid) return;
        weeklyGrid.innerHTML = '';

        const startOfWeek = new Date(this.currentDate);
        startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());

        const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
        const today = new Date();

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            const dateStr = this.formatDateStr(day);
            const isToday = today.toDateString() === day.toDateString();

            const col = document.createElement('div');
            col.className = `week-day-column ${isToday ? 'today' : ''}`;

            // Cabeçalho clicável → view Diário
            const header = document.createElement('div');
            header.className = 'week-day-header';
            header.title = 'Clique para ver o dia';
            header.innerHTML = `
                <div class="week-day-name">${days[i]}</div>
                <div class="week-day-date">${day.getDate()}</div>
                <div class="week-day-tools">
                    <button type="button" class="day-tool" data-action="marker" title="Marcar este dia">
                        <i class="fas fa-tag"></i>
                    </button>
                    <button type="button" class="day-tool" data-action="view" title="Ver dia">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            `;
            header.addEventListener('click', (e) => {
                const tool = e.target.closest('.day-tool');
                if (tool) {
                    e.stopPropagation();
                    if (tool.dataset.action === 'marker' && this.onEditMarker) {
                        this.onEditMarker(dateStr, null);
                    } else if (tool.dataset.action === 'view' && this.onGoToDay) {
                        this.onGoToDay(dateStr);
                    }
                    return;
                }
                if (this.onGoToDay) this.onGoToDay(dateStr);
            });
            header.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (this.onEditMarker) this.onEditMarker(dateStr, null);
            });
            col.appendChild(header);

            // Marcadores
            const markers = StorageManager.getDayMarkersForDate(dateStr);
            markers.forEach(mk => {
                const m = document.createElement('div');
                m.className = 'day-marker';
                m.style.backgroundColor = mk.color;
                m.style.color = this.isLightColor(mk.color) ? '#1a202c' : '#ffffff';
                m.textContent = mk.label;
                m.title = mk.label + (mk.recurrence ? ' (recorrente)' : '');
                m.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.onEditMarker) this.onEditMarker(mk.date || dateStr, mk.id);
                });
                col.appendChild(m);
            });

            const tasksContainer = document.createElement('div');
            tasksContainer.className = 'week-day-tasks';
            tasksContainer.dataset.date = dateStr;

            const dayTasks = this.getTasksForDate(dateStr);
            dayTasks.forEach(task => {
                const tBlock = document.createElement('div');
                tBlock.className = `week-task ${task._instanceCompleted ? 'done' : ''}`;
                tBlock.dataset.taskId = task.id;
                tBlock.dataset.recurring = this.isTaskRecurring(task) ? 'true' : 'false';

                const timeStr = task.time
                    ? (task.endTime ? `${task.time} - ${task.endTime}` : task.time)
                    : 'Sem horário';

                tBlock.innerHTML = `
                    <div class="week-task-time">
                        <i class="fas fa-clock"></i> ${timeStr}
                        ${this.isTaskRecurring(task) ? '<i class="fas fa-redo week-task-recur-icon" title="Tarefa recorrente"></i>' : ''}
                    </div>
                    <div class="week-task-title">${this.escapeHtml(task.title)}</div>
                `;
                this.applyCategoryColor(tBlock, task.category);

                tBlock.addEventListener('click', (e) => {
                    if (tBlock.classList.contains('sortable-chosen') || tBlock.classList.contains('sortable-ghost')) return;
                    e.stopPropagation();
                    if (this.onTaskClick) this.onTaskClick(task, task._instanceDate);
                });

                tasksContainer.appendChild(tBlock);
            });

            // Clique na área vazia → criar nova tarefa naquele dia
            tasksContainer.addEventListener('click', (e) => {
                if (e.target !== tasksContainer) return;
                if (this.onDayClick) this.onDayClick(dateStr);
            });

            col.appendChild(tasksContainer);

            weeklyGrid.appendChild(col);
        }

        if (window.Sortable) {
            weeklyGrid.querySelectorAll('.week-day-tasks').forEach(el => {
                new Sortable(el, {
                    group: 'week-tasks',
                    animation: 150,
                    ghostClass: 'sortable-ghost',
                    chosenClass: 'sortable-chosen',
                    dragClass: 'sortable-drag',
                    onEnd: (evt) => this.handleWeekReorder(evt)
                });
            });
        }
    }

    handleWeekReorder(evt) {
        const targetDate = evt.to.dataset.date;
        const orderedIds = Array.from(evt.to.children)
            .map(el => el.dataset.taskId)
            .filter(Boolean);

        orderedIds.forEach((id, idx) => {
            const task = this.tasks.find(t => t.id === id);
            if (!task) return;
            task.order = idx;
            if (!this.isTaskRecurring(task) && task.date !== targetDate) task.date = targetDate;
        });

        if (this.onTasksUpdated) this.onTasksUpdated(this.tasks);
    }

    /* ---------------------- DAY ---------------------- */

    renderDayView() {
        const container = document.getElementById('day-view-content');
        if (!container) return;

        const d = this.currentDate;
        const dateStr = this.formatDateStr(d);
        const dayTasks = this.getTasksForDate(dateStr);

        const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
        const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
        const fullDate = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

        // Marcadores múltiplos
        const markers = StorageManager.getDayMarkersForDate(dateStr);
        let markersHtml = '<div class="day-marker-section">';
        if (markers.length === 0) {
            markersHtml += `
                <button class="btn btn-secondary btn-add-marker" data-date="${dateStr}">
                    <i class="fas fa-tag"></i> Marcar este dia (feriado, prova…)
                </button>
            `;
        } else {
            markersHtml += markers.map(mk => {
                const textColor = this.isLightColor(mk.color) ? '#1a202c' : '#ffffff';
                const recBadge = mk.recurrence
                    ? `<span class="marker-recur-badge" title="Recorrente">🔁</span>`
                    : '';
                return `
                    <div class="day-marker-badge" style="background:${mk.color}; color:${textColor};">
                        <i class="fas fa-tag"></i>
                        ${this.escapeHtml(mk.label)}
                        ${recBadge}
                        <button class="marker-action edit-marker"
                                data-date="${mk.date || dateStr}"
                                data-marker-id="${mk.id}"
                                title="Editar marcador">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="marker-action remove-marker"
                                data-marker-id="${mk.id}"
                                title="Remover marcador">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            }).join('');
            markersHtml += `
                <button class="btn btn-secondary btn-add-marker btn-add-marker-compact"
                        data-date="${dateStr}" title="Adicionar outro marcador">
                    <i class="fas fa-plus"></i>
                </button>
            `;
        }
        markersHtml += '</div>';

        let html = `
            <div class="day-view-header">
                <h2><i class="fas fa-calendar-day"></i> ${weekdayCap}, ${fullDate}</h2>
                <div class="day-view-stats">
                    ${dayTasks.length} tarefa${dayTasks.length === 1 ? '' : 's'} programada${dayTasks.length === 1 ? '' : 's'}
                </div>
            </div>
            ${markersHtml}
        `;

        if (dayTasks.length === 0) {
            html += `
                <div class="day-view-empty">
                    <i class="fas fa-mug-hot"></i>
                    <p>Nenhuma tarefa para este dia.</p>
                    <small>Clique em "Nova Tarefa" ou em um dia na visão mensal para adicionar.</small>
                </div>
            `;
        } else {
            html += '<div class="day-tasks-list">';
            dayTasks.forEach(task => {
                const color = StorageManager.getCategoryColor(task.category || 'Geral');
                const textColor = this.isLightColor(color) ? '#1a202c' : '#ffffff';
                const timeRange = task.time
                    ? `${task.time}${task.endTime ? ' – ' + task.endTime : ''}`
                    : 'Sem horário';
                const isRecurring = this.isTaskRecurring(task);

                const notesHtml = task.notes
                    ? `<div class="day-task-notes-block">
                            <div class="notes-label"><i class="fas fa-sticky-note"></i> Anotações</div>
                            <div class="notes-content">${this.escapeHtml(task.notes).replace(/\n/g, '<br>')}</div>
                       </div>`
                    : '';

                html += `
                    <div class="day-task-item ${task._instanceCompleted ? 'done' : ''}"
                         data-task-id="${task.id}"
                         style="border-left-color: ${color};">
                        <div class="day-task-time-col">
                            <div class="day-task-time">${timeRange}</div>
                            <div class="day-task-category-badge"
                                 style="background:${color}; color:${textColor};">
                                ${this.escapeHtml(task.category || 'Geral')}
                            </div>
                        </div>
                        <div class="day-task-content-col">
                            <div class="day-task-title-row">
                                <span class="day-task-title">${this.escapeHtml(task.title)}</span>
                                ${isRecurring ? '<span class="recurrence-badge" title="Tarefa recorrente"><i class="fas fa-redo"></i> Recorrente</span>' : ''}
                                ${task._instanceCompleted ? '<span class="completed-badge"><i class="fas fa-check"></i> Concluída</span>' : ''}
                            </div>
                            ${notesHtml}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        container.innerHTML = html;

        // Cliques em tarefas
        container.querySelectorAll('.day-task-item').forEach(el => {
            el.addEventListener('click', () => {
                const task = this.tasks.find(t => t.id === el.dataset.taskId);
                if (task && this.onTaskClick) this.onTaskClick(task, dateStr);
            });
        });

        // Botões de marcador
        container.querySelectorAll('.btn-add-marker').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.onEditMarker) this.onEditMarker(btn.dataset.date, null);
            });
        });
        container.querySelectorAll('.edit-marker').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.onEditMarker) this.onEditMarker(btn.dataset.date, btn.dataset.markerId);
            });
        });
        container.querySelectorAll('.remove-marker').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!confirm('Remover este marcador?')) return;
                StorageManager.removeDayMarkerById(btn.dataset.markerId);
                this.render();
            });
        });
    }

    /* ---------------------- YEAR ---------------------- */

    renderYearGrid() {
        const yearGrid = document.getElementById('year-grid');
        if (!yearGrid) return;
        yearGrid.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        const weekLetters = ['D','S','T','Q','Q','S','S'];

        monthNames.forEach((mName, monthIdx) => {
            const mDiv = document.createElement('div');
            mDiv.className = 'mini-month';

            const title = document.createElement('div');
            title.className = 'mini-month-title mini-month-title-link';
            title.textContent = mName;
            title.title = `Ver ${mName} no modo Mensal`;
            title.addEventListener('click', (e) => {
                e.stopPropagation();
                this.currentDate = new Date(year, monthIdx, 1);
                const monthBtn = document.getElementById('btn-month-view');
                if (monthBtn) monthBtn.click();
                else this.setView('month');
            });
            mDiv.appendChild(title);

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
                const dayTasks = this.getTasksForDate(dateStr);
                const hasTask = dayTasks.length > 0;
                const markers = StorageManager.getDayMarkersForDate(dateStr);

                const cell = document.createElement('div');
                cell.className = `mini-month-day ${hasTask ? 'has-task' : ''} ${markers.length ? 'has-marker' : ''}`;
                cell.textContent = d;

                // ---------- Tooltip inteligente ----------
                // Prioridade: marcador > contagem de tarefas > nada
                if (markers.length > 0) {
                    const markerLabels = markers.map(m => m.label).join(' • ');
                    const taskInfo = hasTask
                        ? ` — ${dayTasks.length} tarefa${dayTasks.length === 1 ? '' : 's'}`
                        : '';
                    cell.title = `${markerLabels}${taskInfo}`;
                    // Borda colorida do primeiro marcador
                    cell.style.border = `2px solid ${markers[0].color}`;
                } else if (hasTask) {
                    cell.title = `${dayTasks.length} tarefa${dayTasks.length === 1 ? '' : 's'}`;
                } else {
                    // Sem nada — não polui com tooltip
                    cell.title = '';
                }

                // Cor de fundo = cor da categoria da 1ª tarefa
                if (hasTask) {
                    const firstColor = StorageManager.getCategoryColor(dayTasks[0].category || 'Geral');
                    cell.style.backgroundColor = firstColor;
                    cell.style.color = this.isLightColor(firstColor) ? '#1a202c' : '#ffffff';
                }

                cell.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.onGoToDay) this.onGoToDay(dateStr);
                });
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.onEditMarker) this.onEditMarker(dateStr, null);
                });

                grid.appendChild(cell);
            }

            mDiv.appendChild(grid);
            yearGrid.appendChild(mDiv);
        });
    }

    /* ---------------------- REPORTS ---------------------- */

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
            if (this.chartInstance) { this.chartInstance.destroy(); this.chartInstance = null; }
            wrapper.innerHTML = '<div class="chart-empty">Nenhuma tarefa cadastrada ainda.<br>Adicione tarefas para ver o relatório por categoria.</div>';
            return;
        }
        if (!wrapper.querySelector('#categoryChart')) {
            wrapper.innerHTML = '<canvas id="categoryChart"></canvas>';
        }
        const ctx = document.getElementById('categoryChart').getContext('2d');

        const counts = {};
        this.tasks.forEach(t => {
            const cat = t.category || 'Geral';
            counts[cat] = (counts[cat] || 0) + 1;
        });

        const labels = Object.keys(counts);
        const data = Object.values(counts);
        const colors = labels.map(name => StorageManager.getCategoryColor(name));

        if (this.chartInstance) this.chartInstance.destroy();

        if (typeof Chart === 'undefined') {
            wrapper.innerHTML = '<div class="chart-empty">Não foi possível carregar o gráfico (Chart.js).</div>';
            return;
        }

        this.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    title: { display: true, text: 'Tarefas por Categoria' }
                }
            }
        });
    }
}
