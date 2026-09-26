/**
 * PdfExporter.js
 * Módulo de Geração de PDF e Visualização de Impressão
 * Formata o planejamento mensal em uma GRADE DE CALENDÁRIO REAL
 */


class PdfExporter {
    /**
     * Exporta o planejamento mensal em formato de grade de calendário real
     * @param {Date} currentDate
     * @param {Array} tasks
     */
    static exportMonthlyCalendar(currentDate, tasks) {
        const settings = StorageManager.getSettings();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const monthName = monthNames[month];

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Monta o documento em uma janela dedicada de impressão
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

        // Dias do mês anterior
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            calendarCellsHtml += `<div class="pdf-day other-month"><span class="pdf-day-num">${dayNum}</span></div>`;
        }

        // Dias do mês atual
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayTasks = tasks
                .filter(t => t.date === dateStr)
                .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

            const tasksHtml = dayTasks.map(buildTaskHtml).join('');

            calendarCellsHtml += `
                <div class="pdf-day">
                    <span class="pdf-day-num">${d}</span>
                    <div class="pdf-task-list">
                        ${tasksHtml}
                    </div>
                </div>
            `;
        }

        // Dias do próximo mês para fechar a última semana
        const totalCells = firstDay + daysInMonth;
        const remaining = (7 - (totalCells % 7)) % 7;
        for (let d = 1; d <= remaining; d++) {
            calendarCellsHtml += `<div class="pdf-day other-month"><span class="pdf-day-num">${d}</span></div>`;
        }

        // Estilos CSS otimizados para impressão em folha A4
        const printStyles = `
            @page {
                size: A4 ${settings.pdfOrientation === 'portrait' ? 'portrait' : 'landscape'};
                margin: 10mm;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 0;
                color: #2D3748;
            }
            .pdf-header {
                text-align: center;
                margin-bottom: 15px;
            }
            .pdf-title {
                font-size: 24pt;
                font-weight: bold;
                color: ${settings.titleColor || '#D46FA8'};
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .pdf-subtitle {
                font-size: 14pt;
                color: #718096;
            }
            .pdf-calendar-grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                border: 2px solid #CBD5E0;
                border-radius: 8px;
                overflow: hidden;
            }
            .pdf-weekday {
                background: ${settings.primaryColor || '#D8B4FE'};
                color: #fff;
                font-weight: bold;
                text-align: center;
                padding: 8px 0;
                font-size: 10pt;
                text-transform: uppercase;
            }
            .pdf-day {
                min-height: 100px;
                border: 1px solid #E2E8F0;
                padding: 6px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                background: #fff;
                break-inside: avoid;
            }
            .pdf-day.other-month {
                background: #F7FAFC;
                color: #A0AEC0;
            }
            .pdf-day-num {
                font-weight: bold;
                font-size: 11pt;
                align-self: flex-end;
                margin-bottom: 4px;
            }
            .pdf-task-list {
                display: flex;
                flex-direction: column;
                gap: 3px;
                font-size: ${taskFontSize};
            }
            .pdf-task {
                background: #EDF2F7;
                padding: 2px 4px;
                border-radius: 4px;
                border-left: 3px solid ${settings.primaryColor || '#D8B4FE'};
                white-space: normal;
                overflow-wrap: break-word;
            }
            .pdf-task.completed {
                text-decoration: line-through;
                opacity: 0.6;
            }
            .pdf-footer {
                margin-top: 12px;
                text-align: center;
                font-size: 8pt;
                color: #A0AEC0;
            }
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
                    window.onload = function() {
                        window.focus();
                        window.print();
                    };
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
}
