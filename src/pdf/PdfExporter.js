/**
 * PdfExporter.js
 * Geração de PDF/impressão E exportação em PNG do planejamento mensal.
 */

class PdfExporter {
    /* ========== MONTHLY ========== */
    static async exportMonthly(currentDate, tasks) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                        'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

        pdf.setFontSize(18);
        pdf.text(`${months[month]} ${year}`, 105, 15, { align: 'center' });

        const startX = 10, startY = 25, cellW = 27, cellH = 40;
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDow = firstDay.getDay();
        const totalDays = lastDay.getDate();

        pdf.setFontSize(10);
        ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].forEach((h, i) => {
            pdf.setFillColor(220, 235, 255);
            pdf.rect(startX + i * cellW, startY, cellW, 8, 'F');
            pdf.text(h, startX + i * cellW + cellW / 2, startY + 5.5, { align: 'center' });
        });

        let day = 1;
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const cellIndex = row * 7 + col;
                if (cellIndex < startDow || day > totalDays) continue;
                const x = startX + col * cellW;
                const y = startY + 8 + row * cellH;
                pdf.setDrawColor(200);
                pdf.rect(x, y, cellW, cellH);

                pdf.setFontSize(11);
                pdf.text(String(day), x + 2, y + 5);

                const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const dayTasks = PdfExporter.getTasksForDate(tasks, dateStr);
                pdf.setFontSize(7);
                let ty = y + 9;
                dayTasks.slice(0, 5).forEach(t => {
                    if (ty > y + cellH - 2) return;
                    const line = `${t.time ? t.time + ' ' : ''}${t.title}`;
                    pdf.text(line.substring(0, 22), x + 1.5, ty);
                    ty += 3.5;
                });
                day++;
            }
        }

        pdf.save(`flora-planner-mensal-${year}-${month+1}.pdf`);
    }

    /* ========== WEEKLY ========== */
    static async exportWeekly(currentDate, tasks) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('l', 'mm', 'a4');
        const { start, end } = PdfExporter.getWeekRange(currentDate);
        const year = start.getFullYear();

        pdf.setFontSize(16);
        pdf.text(
            `Semana: ${start.getDate()}/${start.getMonth()+1} – ${end.getDate()}/${end.getMonth()+1} de ${year}`,
            148, 15, { align: 'center' }
        );

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }

        const startX = 10, startY = 25, totalW = 277;
        const colW = totalW / 7, colH = 170;
        const dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

        days.forEach((d, i) => {
            const x = startX + i * colW;
            pdf.setFillColor(230, 240, 255);
            pdf.rect(x, startY, colW, 10, 'F');
            pdf.setFontSize(11);
            pdf.text(
                `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`,
                x + colW / 2, startY + 6.5, { align: 'center' }
            );

            pdf.setDrawColor(200);
            pdf.rect(x, startY + 10, colW, colH - 10);

            const dateStr = PdfExporter.toDateString(d);
            const dayTasks = PdfExporter.getTasksForDate(tasks, dateStr);

            pdf.setFontSize(8);
            let ty = startY + 16;
            dayTasks.forEach(t => {
                if (ty > startY + colH - 4) return;
                pdf.setTextColor(100);
                pdf.text(
                    `${t.time || '--:--'}${t.endTime ? ' - ' + t.endTime : ''}`,
                    x + 2, ty
                );
                ty += 3.5;
                pdf.setTextColor(0);
                const lines = pdf.splitTextToSize(t.title, colW - 4);
                lines.forEach(l => {
                    if (ty > startY + colH - 4) return;
                    pdf.text(l, x + 2, ty);
                    ty += 3.5;
                });
                ty += 1.5;
            });
        });

        pdf.save(`flora-planner-semanal-${PdfExporter.toDateString(start)}.pdf`);
    }

    /* ========== YEARLY ========== */
    static async exportYearly(currentDate, tasks) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const year = currentDate.getFullYear();
        const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                        'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

        pdf.setFontSize(20);
        pdf.text(`Ano ${year}`, 105, 15, { align: 'center' });

        const cols = 3;
        const cellW = 63, cellH = 65;
        const startX = 6, startY = 22;

        for (let m = 0; m < 12; m++) {
            const row = Math.floor(m / cols);
            const col = m % cols;
            const x = startX + col * cellW;
            const y = startY + row * cellH;

            pdf.setFontSize(11);
            pdf.setFillColor(230, 240, 255);
            pdf.rect(x, y, cellW - 3, 7, 'F');
            pdf.text(months[m], x + (cellW - 3) / 2, y + 5, { align: 'center' });

            const firstDay = new Date(year, m, 1);
            const lastDay = new Date(year, m + 1, 0);
            const startDow = firstDay.getDay();
            const totalDays = lastDay.getDate();
            const dayW = (cellW - 3) / 7;
            const dayH = 8;

            pdf.setFontSize(6);
            ['D','S','T','Q','Q','S','S'].forEach((h, i) => {
                pdf.setTextColor(120);
                pdf.text(h, x + i * dayW + dayW / 2, y + 12, { align: 'center' });
            });
            pdf.setTextColor(0);

            let day = 1;
            for (let r = 0; r < 6; r++) {
                for (let c = 0; c < 7; c++) {
                    const idx = r * 7 + c;
                    if (idx < startDow || day > totalDays) continue;
                    const dx = x + c * dayW;
                    const dy = y + 13 + r * dayH;
                    pdf.setFontSize(7);
                    pdf.text(String(day), dx + dayW / 2, dy + 4, { align: 'center' });
                    day++;
                }
            }
        }

        pdf.save(`flora-planner-anual-${year}.pdf`);
    }

    /* ========== PNG ========== */
    static async exportElementAsPng(elementId, filename) {
        const el = document.getElementById(elementId);
        if (!el || !window.html2canvas) {
            alert('Elemento não encontrado ou html2canvas não carregado.');
            return;
        }
        const prev = el.style.display;
        el.style.display = 'block';
        try {
            const canvas = await window.html2canvas(el, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true
            });
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } finally {
            el.style.display = prev;
        }
    }

    /* ========== HELPERS ========== */
    static toDateString(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    static getWeekRange(date) {
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

    static getTasksForDate(tasks, dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const dow = date.getDay();
        return tasks
            .filter(task => {
                if (task.date === dateStr) return true;
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
}
