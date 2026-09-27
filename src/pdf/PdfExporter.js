/**
 * PdfExporter.js
 * Geração de PDF/impressão E exportação em PNG do planejamento mensal.
 */

class PdfExporter {
    /* ------------------------------ PDF ------------------------------ */

    static exportMonthlyCalendar(currentDate, tasks) {
        const settings = StorageManager.getSettings();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const monthName = monthNames[month];

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor, permita pop-ups para gerar a impressão em PDF.');
            return;
        }

        const fontSizes = { small: '7.5pt', medium: '8.5pt', large: '10pt' };
        const taskFontSize = fontSizes[settings.pdfFontSize] || fontSizes.medium;

        const escapeHtml = (str) => String(str || '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));

        const buildTaskHtml = (task) => {
            const timePrefix = task.time ? `${escapeHtml(task.time)} &bull; ` : '';
            return `
                <div class="pdf-task ${task.completed ? 'completed' : ''}">
                    &bull; ${timePrefix}${escapeHtml(task.title)}
                </div>
            `;
        };

        let calendarCellsHtml = '';

        for (let i = firstDay - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            calendarCellsHtml += `<div class="pdf-day other-month"><span class="pdf-day-num">${dayNum}</span></div>`;
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayTasks = tasks
                .filter(t => t.date === dateStr)
                .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

            const tasksHtml = dayTasks.map(buildTaskHtml).join('');

            calendarCellsHtml += `
                <div class="pdf-day">
                    <span class="pdf-day-num">${d}</span>
                    <div class="pdf-task-list">${tasksHtml}</div>
                </div>
            `;
        }

        const totalCells = firstDay + daysInMonth;
        const remaining = (7 - (totalCells % 7)) % 7;
        for (let d = 1; d <= remaining; d++) {
            calendarCellsHtml += `<div class="pdf-day other-month"><span class="pdf-day-num">${d}</span></div>`;
        }

        const printStyles = `
            @page {
                size: A4 ${settings.pdfOrientation === 'portrait' ? 'portrait' : 'landscape'};
                margin: 10mm;
            }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; color: #2D3748; }
            .pdf-header { text-align: center; margin-bottom: 15px; }
            .pdf-title { font-size: 24pt; font-weight: bold; color: ${settings.titleColor || '#D46FA8'}; text-transform: uppercase; letter-spacing: 1px; }
            .pdf-subtitle { font-size: 14pt; color: #718096; }
            .pdf-calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); border: 2px solid #CBD5E0; border-radius: 8px; overflow: hidden; }
            .pdf-weekday { background: ${settings.primaryColor || '#D8B4FE'}; color: #fff; font-weight: bold; text-align: center; padding: 8px 0; font-size: 10pt; text-transform: uppercase; }
            .pdf-day { min-height: 100px; border: 1px solid #E2E8F0; padding: 6px; box-sizing: border-box; display: flex; flex-direction: column; background: #fff; break-inside: avoid; }
            .pdf-day.other-month { background: #F7FAFC; color: #A0AEC0; }
            .pdf-day-num { font-weight: bold; font-size: 11pt; align-self: flex-end; margin-bottom: 4px; }
            .pdf-task-list { display: flex; flex-direction: column; gap: 3px; font-size: ${taskFontSize}; }
            .pdf-task { background: #EDF2F7; padding: 2px 4px; border-radius: 4px; border-left: 3px solid ${settings.primaryColor || '#D8B4FE'}; white-space: normal; overflow-wrap: break-word; }
            .pdf-task.completed { text-decoration: line-through; opacity: 0.6; }
            .pdf-footer { margin-top: 12px; text-align: center; font-size: 8pt; color: #A0AEC0; }
        `;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Flora Planner - ${monthName} ${year}</title>
                <style>${printStyles}</style>
            </head>
            <body>
                <div class="pdf-header">
                    <div class="pdf-title">${monthName} ${year}</div>
                    <div class="pdf-subtitle">Planejamento Mensal Flora Planner</div>
                </div>
                <div class="pdf-calendar-grid">
                    <div class="pdf-weekday">Domingo</div>
                    <div class="pdf-weekday">Segunda</div>
                    <div class="pdf-weekday">Terça</div>
                    <div class="pdf-weekday">Quarta</div>
                    <div class="pdf-weekday">Quinta</div>
                    <div class="pdf-weekday">Sexta</div>
                    <div class="pdf-weekday">Sábado</div>
                    ${calendarCellsHtml}
                </div>
                <div class="pdf-footer">Gerado pelo Flora Planner</div>
                <script>
                    window.onload = function() { window.focus(); window.print(); };
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    /* ------------------------------ PNG ------------------------------ */

    /**
     * Exporta o mês atual como imagem PNG (canvas em alta resolução).
     * O navegador abre o diálogo "Salvar como" quando suportado
     * (File System Access API), permitindo escolher a pasta.
     */
    static async exportMonthlyCalendarAsPng(currentDate, tasks) {
        const settings = StorageManager.getSettings();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const monthName = monthNames[month];

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Layout
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

        // Exporta em ~2x de escala para nitidez
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = baseW * scale;
        canvas.height = baseH * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);

        // Fundo
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, baseW, baseH);

        // Cabeçalho
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

        // Faixa dos dias da semana
        const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        ctx.fillStyle = settings.primaryColor || '#D8B4FE';
        ctx.fillRect(gridX, gridY, cols * cellW, weekdayH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Segoe UI", Tahoma, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        weekdays.forEach((w, i) => {
            ctx.fillText(w, gridX + i * cellW + cellW / 2, gridY + weekdayH / 2);
        });

        // Monta lista de células (inclui dias do mês anterior/próximo)
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

        const prioColors = {
            baixa: '#48BB78',
            media: '#ED8936',
            alta: '#E53E3E',
            urgente: '#9F7AEA'
        };

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

            // Número do dia
            ctx.fillStyle = cell.other ? '#A0AEC0' : '#2D3748';
            ctx.font = 'bold 20px "Segoe UI", Tahoma, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillText(String(cell.num), x + cellW - 12, y + 10);

            if (!cell.dateStr) return;

            const dayTasks = tasks
                .filter(t => t.date === cell.dateStr)
                .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

            let ty = y + 40;
            const maxTextW = cellW - 32;
            const maxLines = Math.floor((cellH - 52) / lineHeight);

            ctx.textAlign = 'left';
            ctx.font = `${taskFontSize}px "Segoe UI", Tahoma, sans-serif`;

            dayTasks.slice(0, maxLines).forEach(task => {
                const raw = `• ${task.time ? task.time + ' ' : ''}${task.title}`;
                let display = raw;
                while (ctx.measureText(display).width > maxTextW && display.length > 4) {
                    display = display.slice(0, -2);
                }
                if (display !== raw) display = display.slice(0, -1) + '…';

                // Barra de prioridade
                ctx.fillStyle = task.completed ? '#A0AEC0' : (prioColors[task.priority] || '#ED8936');
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

        // Rodapé
        ctx.fillStyle = '#A0AEC0';
        ctx.font = '12px "Segoe UI", Tahoma, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Gerado pelo Flora Planner', baseW / 2, baseH - padding / 2);

        // Exporta
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) {
            alert('Não foi possível gerar a imagem PNG.');
            return;
        }

        const filename = `flora-planner-${year}-${String(month + 1).padStart(2, '0')}-${monthName.toLowerCase()}.png`;

        try {
            const result = await StorageManager.saveBlob(blob, filename, 'image/png');
            if (!result.saved && result.canceled) return; // usuário cancelou
        } catch (err) {
            console.error('Erro ao salvar PNG:', err);
            alert('Não foi possível salvar a imagem PNG.');
        }
    }
}
