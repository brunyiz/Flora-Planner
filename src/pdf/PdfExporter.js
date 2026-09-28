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
            .pdf-day-task { border-left: 5px solid #CBD5E0; background: #F7FAFC; padding: 10px 14px; border-radius: 6px; page-break-inside: avoid; }
            .pdf-day-task-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
            .pdf-day-task-time { font-weight: bold; font-size: 11pt; color: #2D3748; }
            .pdf-day-task-cat { color: #fff; padding: 2px 10px; border-radius: 20px; font-size: 9pt; font-weight: 600; }
            .pdf-day-task-title { font-size: 14pt; font-weight: 600; }
            .pdf-day-task-recur { font-size: 9pt; color: #718096; margin-top: 3px; }
            .pdf-day-task-notes { margin-top: 8px; padding: 8px 10px; background: #FFFBE6; border-left: 3px solid #F5C542; border-radius: 4px; font-size: 10pt; }
            .pdf-day-task.completed .pdf-day-task-title { text-decoration: line-through; opacity: 0.6; }
            .pdf-day-empty { text-align: center; color: #A0AEC0; font-style: italic; padding: 40px; }
            .pdf-footer { margin-top: 25px; text-align: center; font-size: 8pt; color: #A0AEC0; }
        `;

        const html = `
            <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Flora Planner - Dia</title>
            <style>${printStyles}</style></head><body>
                <div class="pdf-header">
                    <div class="pdf-title">${title}</div>
                    <div class="pdf-subtitle">Planejamento Diário Flora Planner &bull; ${dayTasks.length} tarefa${dayTasks.length === 1 ? '' : 's'}</div>
                </div>
                <div class="pdf-day-tasks">${tasksHtml}</div>
                <div class="pdf-footer">Gerado pelo Flora Planner</div>
                <script>window.onload = function() { window.focus(); window.print(); };<\/script>
            </body></html>
        `;

        this.openPrintWindow(html, `Flora Planner - Dia`);
    }

    /* ==================== PDF ANUAL ==================== */

    static exportYearlyCalendar(currentDate, tasks) {
        const settings = StorageManager.getSettings();
        const year = currentDate.getFullYear();
        const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        const weekLetters = ['D','S','T','Q','Q','S','S'];

        let monthsHtml = '';
        for (let m = 0; m < 12; m++) {
            const firstDay = new Date(year, m, 1).getDay();
            const daysInMonth = new Date(year, m + 1, 0).getDate();

            let cellsHtml = '';
            weekLetters.forEach(l => {
                cellsHtml += `<div class="pdf-mini-header">${l}</div>`;
            });
            for (let i = 0; i < firstDay; i++) {
                cellsHtml += `<div class="pdf-mini-day empty"></div>`;
            }
            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const dayTasks = this.getTasksForDate(tasks, dateStr);
                const hasTask = dayTasks.length > 0;
                const color = hasTask ? StorageManager.getCategoryColor(dayTasks[0].category || 'Geral') : '';
                cellsHtml += `<div class="pdf-mini-day ${hasTask ? 'has-task' : ''}" ${hasTask ? `style="background:${color};color:#fff;"` : ''}>${d}</div>`;
            }

            monthsHtml += `
                <div class="pdf-mini-month">
                    <div class="pdf-mini-month-title">${monthNames[m]}</div>
                    <div class="pdf-mini-grid">${cellsHtml}</div>
                </div>
            `;
        }

        const printStyles = `
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; color: #2D3748; }
            .pdf-header { text-align: center; margin-bottom: 15px; }
            .pdf-title { font-size: 26pt; font-weight: bold; color: ${settings.titleColor || '#D46FA8'}; }
            .pdf-subtitle { font-size: 12pt; color: #718096; }
            .pdf-year-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
            .pdf-mini-month { border: 1px solid #CBD5E0; border-radius: 8px; padding: 8px; background: #fff; page-break-inside: avoid; }
            .pdf-mini-month-title { font-weight: bold; color: ${settings.titleColor || '#D46FA8'}; text-align: center; margin-bottom: 6px; font-size: 11pt; }
            .pdf-mini-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
            .pdf-mini-header { font-size: 6pt; text-align: center; color: #718096; font-weight: bold; }
            .pdf-mini-day { font-size: 7pt; text-align: center; padding: 3px 0; border-radius: 3px; color: #4A5568; }
            .pdf-mini-day.empty { visibility: hidden; }
            .pdf-mini-day.has-task { font-weight: bold; }
            .pdf-footer { margin-top: 15px; text-align: center; font-size: 8pt; color: #A0AEC0; }
        `;

        const html = `
            <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Flora Planner - ${year}</title>
            <style>${printStyles}</style></head><body>
                <div class="pdf-header">
                    <div class="pdf-title">${year}</div>
                    <div class="pdf-subtitle">Planejamento Anual Flora Planner</div>
                </div>
                <div class="pdf-year-grid">${monthsHtml}</div>
                <div class="pdf-footer">Gerado pelo Flora Planner</div>
                <script>window.onload = function() { window.focus(); window.print(); };<\/script>
            </body></html>
        `;

        this.openPrintWindow(html, `Flora Planner - ${year}`);
    }

    /* ==================== PNG (via html2canvas) ==================== */

    /**
     * Exporta qualquer elemento do DOM como PNG de alta resolução.
     * Ideal para as visões Semanal / Diário / Anual (captura com notas).
     */
    static async exportElementAsPng(elementId, filename) {
        const el = document.getElementById(elementId);
        if (!el) {
            alert('Elemento não encontrado para exportação.');
            return;
        }
        if (typeof html2canvas === 'undefined') {
            alert('Biblioteca html2canvas não carregada. Verifique a conexão com a internet.');
            return;
        }

        // Garante que o elemento está visível
        const previousDisplay = el.style.display;
        if (previousDisplay === 'none') el.style.display = 'block';

        try {
            // Fundo branco sólido — evita transparência
            const canvas = await html2canvas(el, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                windowWidth: el.scrollWidth,
                windowHeight: el.scrollHeight
            });
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error('Falha ao gerar blob PNG.');

            await StorageManager.saveBlob(blob, filename, 'image/png');
        } catch (err) {
            console.error('Erro ao gerar PNG:', err);
            alert('Não foi possível gerar a imagem PNG.');
        } finally {
            el.style.display = previousDisplay;
        }
    }

    /* ==================== PNG MENSAL (manual canvas) ==================== */

    static async exportMonthlyCalendarAsPng(currentDate, tasks) {
        const settings = StorageManager.getSettings();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        const monthName = monthNames[month];

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const padding = 40;
        const headerH = 120;
        const weekdayH = 46;
        const cellW = 210;
        const cellH = 180;
        const cols = 7;

        const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
        const rows = totalCells / 7;

        const baseW = cols * cellW + padding * 2;
        const baseH = padding + headerH + weekdayH + rows * cellH + padding;

        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = baseW * scale;
        canvas.height = baseH * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, baseW, baseH);

        ctx.fillStyle = settings.titleColor || '#D46FA8';
        ctx.font = 'bold 46px "Segoe UI", Tahoma, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${monthName} ${year}`, baseW / 2, padding + 30);

        ctx.fillStyle = '#718096';
        ctx.font = '18px "Segoe UI", Tahoma, sans-serif';
        ctx.fillText('Planejamento Mensal Flora Planner', baseW / 2, padding + 75);

        const gridX = padding;
        const gridY = padding + headerH;

        const weekdays = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
        ctx.fillStyle = settings.primaryColor || '#D8B4FE';
        ctx.fillRect(gridX, gridY, cols * cellW, weekdayH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Segoe UI", Tahoma, sans-serif';
        weekdays.forEach((w, i) => {
            ctx.fillText(w, gridX + i * cellW + cellW / 2, gridY + weekdayH / 2);
        });

        const cells = [];
        for (let i = firstDay - 1; i >= 0; i--) {
            cells.push({ num: daysInPrevMonth - i, other: true });
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            cells.push({ num: d, other: false, dateStr });
        }
        while (cells.length < totalCells) {
            cells.push({ num: cells.length - (firstDay + daysInMonth) + 1, other: true });
        }

        const fontSizeMap = { small: 11, medium: 13, large: 15 };
        const taskFontSize = fontSizeMap[settings.pdfFontSize] || 13;
        const lineHeight = taskFontSize + 7;

        cells.forEach((cell, idx) => {
            const row = Math.floor(idx / 7);
            const col = idx % 7;
            const x = gridX + col * cellW;
            const y = gridY + weekdayH + row * cellH;

            ctx.fillStyle = cell.other ? '#F7FAFC' : '#ffffff';
            ctx.fillRect(x, y, cellW, cellH);

            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);

            ctx.fillStyle = cell.other ? '#A0AEC0' : '#2D3748';
            ctx.font = 'bold 20px "Segoe UI", Tahoma, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillText(String(cell.num), x + cellW - 12, y + 10);

            if (!cell.dateStr) return;

            const dayTasks = this.getTasksForDate(tasks, cell.dateStr);

            let ty = y + 40;
            const maxTextW = cellW - 32;
            const maxLines = Math.floor((cellH - 52) / lineHeight);

            ctx.textAlign = 'left';
            ctx.font = `${taskFontSize}px "Segoe UI", Tahoma, sans-serif`;

            dayTasks.slice(0, maxLines).forEach(task => {
                const timeStr = task.time
                    ? (task.endTime ? `${task.time}-${task.endTime} ` : `${task.time} `)
                    : '';
                const raw = `• ${timeStr}${task.title}`;
                let display = raw;
                while (ctx.measureText(display).width > maxTextW && display.length > 4) {
                    display = display.slice(0, -2);
                }
                if (display !== raw) display = display.slice(0, -1) + '…';

                const catColor = StorageManager.getCategoryColor(task.category || 'Geral');
                ctx.fillStyle = task.completed ? '#A0AEC0' : catColor;
                ctx.fillRect(x + 8, ty, 3, taskFontSize + 2);

                ctx.fillStyle = task.completed ? '#A0AEC0' : '#2D3748';
                ctx.fillText(display, x + 16, ty);

                if (task.completed) {
                    const w = ctx.measureText(display).width;
                    ctx.strokeStyle = '#A0AEC0';
                    ctx.beginPath();
                    ctx.moveTo(x + 16, ty + taskFontSize / 2);
                    ctx.lineTo(x + 16 + w, ty + taskFontSize / 2);
                    ctx.stroke();
                }

                ty += lineHeight;
            });

            if (dayTasks.length > maxLines) {
                ctx.fillStyle = '#718096';
                ctx.font = `italic ${taskFontSize - 1}px "Segoe UI", Tahoma, sans-serif`;
                ctx.fillText(`+ ${dayTasks.length - maxLines} mais`, x + 16, ty);
            }
        });

        ctx.fillStyle = '#A0AEC0';
        ctx.font = '12px "Segoe UI", Tahoma, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Gerado pelo Flora Planner', baseW / 2, baseH - padding / 2);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) {
            alert('Não foi possível gerar a imagem PNG.');
            return;
        }

        const filename = `flora-planner-${year}-${String(month + 1).padStart(2, '0')}-${monthName.toLowerCase()}.png`;
        try {
            await StorageManager.saveBlob(blob, filename, 'image/png');
        } catch (err) {
            console.error('Erro ao salvar PNG:', err);
            alert('Não foi possível salvar a imagem PNG.');
        }
    }
}
