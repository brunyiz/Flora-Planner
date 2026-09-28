/**
 * PdfExporter.js
 * PDF/PNG do planejamento Mensal, Semanal, Diário e Anual.
 */

class PdfExporter {
    /* ==================== HELPERS ==================== */

    static formatDateStr(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    static getTasksForDate(tasks, dateStr) {
        const dateObj = new Date(dateStr + 'T00:00:00');
        const dow = dateObj.getDay();

        const filtered = tasks.filter(task => {
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
        });

        filtered.sort((a, b) => {
            const aHas = typeof a.order === 'number';
            const bHas = typeof b.order === 'number';
            if (aHas && bHas && a.order !== b.order) return a.order - b.order;
            if (aHas && !bHas) return -1;
            if (!aHas && bHas) return 1;
            return (a.time || '99:99').localeCompare(b.time || '99:99');
        });

        return filtered;
    }

    static escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    static openPrintWindow(html, title) {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor, permita pop-ups para gerar a impressão em PDF.');
            return;
        }
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.document.title = title;
    }

    /* ==================== PDF MENSAL ==================== */

    static exportMonthlyCalendar(currentDate, tasks) {
        const settings = StorageManager.getSettings();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        const monthName = monthNames[month];

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const fontSizes = { small: '7.5pt', medium: '8.5pt', large: '10pt' };
        const taskFontSize = fontSizes[settings.pdfFontSize] || fontSizes.medium;

        const buildTaskHtml = (task) => {
            const timeStr = task.time
                ? (task.endTime ? `${task.time}-${task.endTime}` : task.time) + ' • '
                : '';
            return `<div class="pdf-task ${task.completed ? 'completed' : ''}">&bull; ${this.escapeHtml(timeStr)}${this.escapeHtml(task.title)}</div>`;
        };

        let cells = '';
        for (let i = firstDay - 1; i >= 0; i--) {
            cells += `<div class="pdf-day other-month"><span class="pdf-day-num">${daysInPrevMonth - i}</span></div>`;
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayTasks = this.getTasksForDate(tasks, dateStr);
            cells += `<div class="pdf-day"><span class="pdf-day-num">${d}</span><div class="pdf-task-list">${dayTasks.map(buildTaskHtml).join('')}</div></div>`;
        }
        const total = firstDay + daysInMonth;
        const remaining = (7 - (total % 7)) % 7;
        for (let d = 1; d <= remaining; d++) {
            cells += `<div class="pdf-day other-month"><span class="pdf-day-num">${d}</span></div>`;
        }

        const printStyles = `
            @page { size: A4 ${settings.pdfOrientation === 'portrait' ? 'portrait' : 'landscape'}; margin: 10mm; }
            body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; color: #2D3748; }
            .pdf-header { text-align: center; margin-bottom: 15px; }
            .pdf-title { font-size: 24pt; font-weight: bold; color: ${settings.titleColor || '#D46FA8'}; text-transform: uppercase; letter-spacing: 1px; }
            .pdf-subtitle { font-size: 14pt; color: #718096; }
            .pdf-calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); border: 2px solid #CBD5E0; border-radius: 8px; overflow: hidden; }
            .pdf-weekday { background: ${settings.primaryColor || '#D8B4FE'}; color: #fff; font-weight: bold; text-align: center; padding: 8px 0; font-size: 10pt; text-transform: uppercase; }
            .pdf-day { min-height: 100px; border: 1px solid #E2E8F0; padding: 6px; box-sizing: border-box; display: flex; flex-direction: column; background: #fff; }
            .pdf-day.other-month { background: #F7FAFC; color: #A0AEC0; }
            .pdf-day-num { font-weight: bold; font-size: 11pt; align-self: flex-end; margin-bottom: 4px; }
            .pdf-task-list { display: flex; flex-direction: column; gap: 3px; font-size: ${taskFontSize}; }
            .pdf-task { background: #EDF2F7; padding: 2px 4px; border-radius: 4px; border-left: 3px solid ${settings.primaryColor || '#D8B4FE'}; overflow-wrap: break-word; }
            .pdf-task.completed { text-decoration: line-through; opacity: 0.6; }
            .pdf-footer { margin-top: 12px; text-align: center; font-size: 8pt; color: #A0AEC0; }
        `;

        const html = `
            <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Flora Planner - ${monthName} ${year}</title>
            <style>${printStyles}</style></head><body>
                <div class="pdf-header">
                    <div class="pdf-title">${monthName} ${year}</div>
                    <div class="pdf-subtitle">Planejamento Mensal Flora Planner</div>
                </div>
                <div class="pdf-calendar-grid">
                    <div class="pdf-weekday">Domingo</div><div class="pdf-weekday">Segunda</div>
                    <div class="pdf-weekday">Terça</div><div class="pdf-weekday">Quarta</div>
                    <div class="pdf-weekday">Quinta</div><div class="pdf-weekday">Sexta</div>
                    <div class="pdf-weekday">Sábado</div>
                    ${cells}
                </div>
                <div class="pdf-footer">Gerado pelo Flora Planner</div>
                <script>window.onload = function() { window.focus(); window.print(); };<\/script>
            </body></html>
        `;

        this.openPrintWindow(html, `Flora Planner - ${monthName} ${year}`);
    }

    /* ==================== PDF SEMANAL ==================== */

    static exportWeeklyCalendar(currentDate, tasks) {
        const settings = StorageManager.getSettings();
        const start = new Date(currentDate);
        start.setDate(currentDate.getDate() - currentDate.getDay());
        start.setHours(0, 0, 0, 0);

        const fontSizes = { small: '7.5pt', medium: '8.5pt', large: '10pt' };
        const taskFontSize = fontSizes[settings.pdfFontSize] || fontSizes.medium;

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }

        const dayNames = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
        const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

        const end = days[6];
        const title = `${start.getDate()} de ${months[start.getMonth()]} – ${end.getDate()} de ${months[end.getMonth()]} ${end.getFullYear()}`;

        const columnsHtml = days.map((d, i) => {
            const dateStr = this.formatDateStr(d);
            const dayTasks = this.getTasksForDate(tasks, dateStr);

            const tasksHtml = dayTasks.map(t => {
                const timeStr = t.time
                    ? (t.endTime ? `${t.time} - ${t.endTime}` : t.time)
                    : '';
                return `
                    <div class="pdf-week-task ${t.completed ? 'completed' : ''}">
                        ${timeStr ? `<div class="pdf-week-task-time">${this.escapeHtml(timeStr)}</div>` : ''}
                        <div class="pdf-week-task-title">${this.escapeHtml(t.title)}</div>
                        ${t.notes ? `<div class="pdf-week-task-notes">${this.escapeHtml(t.notes).replace(/\n/g, '<br>')}</div>` : ''}
                    </div>
                `;
            }).join('');

            return `
                <div class="pdf-week-col">
                    <div class="pdf-week-header">
                        <div class="pdf-week-day-name">${dayNames[i]}</div>
                        <div class="pdf-week-day-date">${d.getDate()}/${d.getMonth() + 1}</div>
                    </div>
                    <div class="pdf-week-body">
                        ${tasksHtml || '<div class="pdf-week-empty">—</div>'}
                    </div>
                </div>
            `;
        }).join('');

        const printStyles = `
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; color: #2D3748; }
            .pdf-header { text-align: center; margin-bottom: 15px; }
            .pdf-title { font-size: 20pt; font-weight: bold; color: ${settings.titleColor || '#D46FA8'}; }
            .pdf-subtitle { font-size: 12pt; color: #718096; }
            .pdf-week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
            .pdf-week-col { border: 1px solid #CBD5E0; border-radius: 8px; overflow: hidden; background: #fff; }
            .pdf-week-header { background: ${settings.primaryColor || '#D8B4FE'}; color: #fff; text-align: center; padding: 6px; }
            .pdf-week-day-name { font-weight: bold; text-transform: uppercase; font-size: 9pt; }
            .pdf-week-day-date { font-size: 13pt; font-weight: bold; }
            .pdf-week-body { padding: 6px; display: flex; flex-direction: column; gap: 4px; min-height: 130px; font-size: ${taskFontSize}; }
            .pdf-week-task { border-left: 3px solid ${settings.primaryColor || '#D8B4FE'}; background: #EDF2F7; padding: 4px 6px; border-radius: 4px; overflow-wrap: break-word; }
            .pdf-week-task-time { font-weight: bold; font-size: 8pt; color: #4A5568; }
            .pdf-week-task-title { margin-top: 2px; }
            .pdf-week-task-notes { margin-top: 3px; font-size: 7pt; color: #4A5568; font-style: italic; padding-top: 3px; border-top: 1px dashed #CBD5E0; }
            .pdf-week-task.completed { text-decoration: line-through; opacity: 0.6; }
            .pdf-week-empty { color: #A0AEC0; text-align: center; font-style: italic; }
            .pdf-footer { margin-top: 12px; text-align: center; font-size: 8pt; color: #A0AEC0; }
        `;

        const html = `
            <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Flora Planner - Semana</title>
            <style>${printStyles}</style></head><body>
                <div class="pdf-header">
                    <div class="pdf-title">${title}</div>
                    <div class="pdf-subtitle">Planejamento Semanal Flora Planner</div>
                </div>
                <div class="pdf-week-grid">${columnsHtml}</div>
                <div class="pdf-footer">Gerado pelo Flora Planner</div>
                <script>window.onload = function() { window.focus(); window.print(); };<\/script>
            </body></html>
        `;

        this.openPrintWindow(html, `Flora Planner - Semana`);
    }

    /* ==================== PDF DIÁRIO ==================== */

    static exportDayCalendar(currentDate, tasks) {
        const settings = StorageManager.getSettings();
        const dateStr = this.formatDateStr(currentDate);
        const dayTasks = this.getTasksForDate(tasks, dateStr);

        const weekday = currentDate.toLocaleDateString('pt-BR', { weekday: 'long' });
        const fullDate = currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
        const title = `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${fullDate}`;

        const tasksHtml = dayTasks.length === 0
            ? '<div class="pdf-day-empty">Nenhuma tarefa agendada para este dia.</div>'
            : dayTasks.map(t => {
                const timeStr = t.time
                    ? (t.endTime ? `${t.time} - ${t.endTime}` : t.time)
                    : 'Sem horário';
                const color = StorageManager.getCategoryColor(t.category || 'Geral');
                return `
                    <div class="pdf-day-task ${t.completed ? 'completed' : ''}" style="border-left-color: ${color};">
                        <div class="pdf-day-task-head">
                            <div class="pdf-day-task-time">${this.escapeHtml(timeStr)}</div>
                            <div class="pdf-day-task-cat" style="background:${color};">${this.escapeHtml(t.category || 'Geral')}</div>
                        </div>
                        <div class="pdf-day-task-title">${this.escapeHtml(t.title)}</div>
                        ${t.recurrence ? '<div class="pdf-day-task-recur">🔁 Tarefa recorrente</div>' : ''}
                        ${t.notes ? `<div class="pdf-day-task-notes"><strong>📝 Anotações:</strong><br>${this.escapeHtml(t.notes).replace(/\n/g, '<br>')}</div>` : ''}
                    </div>
                `;
            }).join('');

        const printStyles = `
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; color: #2D3748; }
            .pdf-header { text-align: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 3px solid ${settings.primaryColor || '#D8B4FE'}; }
            .pdf-title { font-size: 22pt; font-weight: bold; color: ${settings.titleColor || '#D46FA8'}; text-transform: capitalize; }
            .pdf-subtitle { font-size: 11pt; color: #718096; margin-top: 4px; }
            .pdf-day-tasks { display: flex; flex-direction: column; gap: 10px; }
            .pdf-day-task { border-left: 5px solid #CBD5E0; background: #F7FAFC; padding: 10px 14px; border-radius: 6px; page-break-inside: avoid;
