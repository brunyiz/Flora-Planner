/**
 * StorageManager.js
 * Persistência + utilitários.
 * v6: marcadores com suporte a recorrência, IDs estáveis e feriados brasileiros.
 */

class StorageManager {
    static TASKS_KEY = 'flora_planner_tasks';
    static SETTINGS_KEY = 'flora_planner_settings';
    static DAY_MARKERS_KEY = 'flora_planner_day_markers';

    static DEFAULT_CATEGORIES = [
        { name: 'Geral',    color: '#D8B4FE' },
        { name: 'Trabalho', color: '#4299E1' },
        { name: 'Estudos',  color: '#48BB78' },
        { name: 'Pessoal',  color: '#ED8936' },
        { name: 'Saúde',    color: '#F56565' }
    ];
    static DEFAULT_CATEGORY_COLOR = '#9F7AEA';

    static MARKER_SUGGESTIONS = [
        { label: 'Feriado',     color: '#F56565' },
        { label: 'Prova',       color: '#ED8936' },
        { label: 'Aniversário', color: '#ED64A6' },
        { label: 'Reunião',     color: '#4299E1' },
        { label: 'Viagem',      color: '#48BB78' },
        { label: 'Férias',      color: '#38B2AC' },
        { label: 'Prazo',       color: '#E53E3E' },
        { label: 'Evento',      color: '#9F7AEA' },
        { label: 'Consulta',    color: '#3182CE' },
        { label: 'Entrega',     color: '#DD6B20' }
    ];

    /* ========================= TAREFAS ========================= */

    static getTasks() {
        try {
            const data = localStorage.getItem(this.TASKS_KEY);
            return this.normalizeTasks(data ? JSON.parse(data) : []);
        } catch (e) { console.error(e); return []; }
    }

    static saveTasks(tasks) {
        try { localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks)); }
        catch (e) { console.error(e); }
    }

    static normalizeTasks(tasks) {
        if (!Array.isArray(tasks)) return [];
        return tasks.map(task => {
            const t = { ...task };
            if (typeof t.endTime !== 'string') t.endTime = '';
            if (typeof t.notes !== 'string') t.notes = '';
            if (typeof t.time !== 'string') t.time = '';
            if (typeof t.completed !== 'boolean') t.completed = !!t.completed;
            if (!Array.isArray(t.completedDates)) t.completedDates = [];
            if (!Array.isArray(t.excludedDates)) t.excludedDates = [];

            if (t.recurrence && typeof t.recurrence === 'object') {
                const days = Array.isArray(t.recurrence.days)
                    ? t.recurrence.days.filter(d => Number.isInteger(d) && d >= 0 && d <= 6)
                    : [];
                t.recurrence = days.length > 0
                    ? { days, until: t.recurrence.until || null }
                    : null;
            } else {
                t.recurrence = null;
            }
            if (typeof t.order !== 'number') delete t.order;
            return t;
        });
    }

    static generateId() {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    /* ====================== CONFIGURAÇÕES ====================== */

    static getSettings() {
        const defaults = {
            darkMode: false,
            primaryColor: '#D8B4FE',
            titleColor: '#D46FA8',
            startOfWeek: 0,
            pdfOrientation: 'landscape',
            pdfShowNotes: true,
            pdfFontSize: 'medium',
            categories: this.DEFAULT_CATEGORIES.map(c => ({ ...c }))
        };
        try {
            const data = localStorage.getItem(this.SETTINGS_KEY);
            if (!data) return defaults;
            const parsed = JSON.parse(data);
            const merged = { ...defaults, ...parsed };
            merged.categories = this.normalizeCategories(merged.categories);
            return merged;
        } catch (e) { return defaults; }
    }

    static saveSettings(settings) {
        try { localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings)); }
        catch (e) { console.error(e); }
    }

    /* ======================= CATEGORIAS ======================= */

    static normalizeCategories(categories) {
        if (!Array.isArray(categories) || categories.length === 0) {
            return this.DEFAULT_CATEGORIES.map(c => ({ ...c }));
        }
        return categories.map((cat, i) => {
            if (typeof cat === 'string') {
                const def = this.DEFAULT_CATEGORIES.find(
                    d => d.name.toLowerCase() === cat.toLowerCase()
                );
                return { name: cat, color: def ? def.color : this.DEFAULT_CATEGORY_COLOR };
            }
            if (cat && typeof cat === 'object' && cat.name) {
                return {
                    name: String(cat.name),
                    color: cat.color || this.DEFAULT_CATEGORY_COLOR
                };
            }
            return { name: `Categoria ${i + 1}`, color: this.DEFAULT_CATEGORY_COLOR };
        });
    }

    static getCategories() { return this.getSettings().categories.map(c => ({ ...c })); }
    static getCategoryNames() { return this.getCategories().map(c => c.name); }

    static getCategoryColor(name) {
        const found = this.getCategories().find(c => c.name === name);
        return found ? found.color : this.DEFAULT_CATEGORY_COLOR;
    }

    static saveCategories(categories) {
        const settings = this.getSettings();
        settings.categories = this.normalizeCategories(categories);
        this.saveSettings(settings);
    }

    static addCategory(name, color) {
        const trimmed = String(name || '').trim();
        if (!trimmed) return false;
        const categories = this.getCategories();
        if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) return false;
        categories.push({ name: trimmed, color: color || this.DEFAULT_CATEGORY_COLOR });
        this.saveCategories(categories);
        return true;
    }

    static removeCategory(name) {
        let categories = this.getCategories().filter(c => c.name !== name);
        if (categories.length === 0) {
            categories = [{ name: 'Geral', color: this.DEFAULT_CATEGORY_COLOR }];
        }
        this.saveCategories(categories);
    }

    static updateCategoryColor(name, color) {
        const categories = this.getCategories();
        const idx = categories.findIndex(c => c.name === name);
        if (idx < 0) return false;
        categories[idx].color = color;
        this.saveCategories(categories);
        return true;
    }

    /* ==================== MARCADORES DE DIA ==================== */

    static getDayMarkers() {
        try {
            const data = localStorage.getItem(this.DAY_MARKERS_KEY);
            const parsed = data ? JSON.parse(data) : [];
            return this.normalizeMarkers(parsed);
        } catch (e) { console.error(e); return []; }
    }

    static normalizeMarkers(markers) {
        if (!Array.isArray(markers)) return [];
        return markers
            .filter(m => m && typeof m === 'object')
            .map((m, i) => {
                const out = {
                    id: m.id || `mk_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
                    label: String(m.label || '').trim(),
                    color: m.color || '#F6AD55',
                    date: m.date || null
                };
                if (m.recurrence && typeof m.recurrence === 'object'
                    && Array.isArray(m.recurrence.days) && m.recurrence.days.length > 0) {
                    out.recurrence = {
                        days: m.recurrence.days.filter(d => Number.isInteger(d) && d >= 0 && d <= 6),
                        until: m.recurrence.until || null
                    };
                } else {
                    out.recurrence = null;
                }
                return out;
            })
            .filter(m => m.label && (m.date || (m.recurrence && m.recurrence.days.length > 0)));
    }

    static saveDayMarkers(markers) {
        try { localStorage.setItem(this.DAY_MARKERS_KEY, JSON.stringify(markers)); }
        catch (e) { console.error(e); }
    }

    /** Retorna TODOS os marcadores aplicáveis a uma data (data exata + recorrentes). */
    static getDayMarkersForDate(dateStr) {
        const markers = this.getDayMarkers();
        const dateObj = new Date(dateStr + 'T00:00:00');
        const dow = dateObj.getDay();
        const result = [];

        markers.forEach(m => {
            if (m.recurrence && m.recurrence.days.length > 0) {
                if (m.recurrence.until) {
                    const until = new Date(m.recurrence.until + 'T23:59:59');
                    if (dateObj > until) return;
                }
                if (m.date) {
                    const start = new Date(m.date + 'T00:00:00');
                    if (dateObj < start) return;
                }
                if (m.recurrence.days.includes(dow)) result.push(m);
            } else if (m.date === dateStr) {
                result.push(m);
            }
        });

        return result;
    }

    /** Compat: retorna o primeiro marcador (ou null) */
    static getDayMarker(dateStr) {
        const arr = this.getDayMarkersForDate(dateStr);
        return arr.length > 0 ? arr[0] : null;
    }

    static upsertDayMarker(marker) {
        const markers = this.getDayMarkers();
        const idx = markers.findIndex(m => m.id === marker.id);
        if (idx >= 0) markers[idx] = marker;
        else markers.push(marker);
        this.saveDayMarkers(markers);
        return marker;
    }

    static updateDayMarker(id, patch) {
        const markers = this.getDayMarkers();
        const idx = markers.findIndex(m => m.id === id);
        if (idx < 0) return false;
        markers[idx] = { ...markers[idx], ...patch, id };
        this.saveDayMarkers(markers);
        return true;
    }

    static removeDayMarkerById(id) {
        this.saveDayMarkers(this.getDayMarkers().filter(m => m.id !== id));
    }

    /** Compat com código antigo */
    static setDayMarker(dateStr, label, color) {
        const markers = this.getDayMarkers();
        const idx = markers.findIndex(m => m.date === dateStr && !m.recurrence);
        if (!label || !String(label).trim()) {
            if (idx >= 0) markers.splice(idx, 1);
        } else if (idx >= 0) {
            markers[idx].label = String(label).trim();
            markers[idx].color = color || '#F6AD55';
        } else {
            markers.push({
                id: this.generateId(),
                date: dateStr,
                label: String(label).trim(),
                color: color || '#F6AD55',
                recurrence: null
            });
        }
        this.saveDayMarkers(markers);
    }

    static removeDayMarker(dateStr) {
        this.saveDayMarkers(
            this.getDayMarkers().filter(m => !(m.date === dateStr && !m.recurrence))
        );
    }

    /* ==================== SUGESTÕES / FERIADOS ==================== */

    static getMarkerSuggestions() {
        // Mescla sugestões padrão com marcadores já usados (nomes únicos)
        const used = new Map();
        this.getDayMarkers().forEach(m => {
            const key = m.label.toLowerCase();
            if (!used.has(key)) used.set(key, { label: m.label, color: m.color });
        });
        const merged = [...this.MARKER_SUGGESTIONS];
        used.forEach(s => {
            if (!merged.some(x => x.label.toLowerCase() === s.label.toLowerCase())) {
                merged.push(s);
            }
        });
        return merged;
    }

    /** Calcula a Páscoa (algoritmo de Meeus/Jones/Butcher) */
    static calculateEaster(year) {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        return new Date(year, month - 1, day);
    }

    static formatDateStr(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    static getBrazilianHolidays(year) {
        const list = [
            { date: `${year}-01-01`, label: 'Confraternização Universal', color: '#F56565' },
            { date: `${year}-04-21`, label: 'Tiradentes',                 color: '#F56565' },
            { date: `${year}-05-01`, label: 'Dia do Trabalho',            color: '#F56565' },
            { date: `${year}-09-07`, label: 'Independência do Brasil',    color: '#F56565' },
            { date: `${year}-10-12`, label: 'Nossa Senhora Aparecida',    color: '#F56565' },
            { date: `${year}-11-02`, label: 'Finados',                    color: '#F56565' },
            { date: `${year}-11-15`, label: 'Proclamação da República',   color: '#F56565' },
            { date: `${year}-11-20`, label: 'Consciência Negra',          color: '#F56565' },
            { date: `${year}-12-25`, label: 'Natal',                      color: '#F56565' }
        ];
        const easter = this.calculateEaster(year);
        const carnival = new Date(easter);   carnival.setDate(easter.getDate() - 47);
        const goodFriday = new Date(easter); goodFriday.setDate(easter.getDate() - 2);
        const corpus = new Date(easter);     corpus.setDate(easter.getDate() + 60);
        list.push({ date: this.formatDateStr(carnival),   label: 'Carnaval',          color: '#F56565' });
        list.push({ date: this.formatDateStr(goodFriday), label: 'Sexta-feira Santa', color: '#F56565' });
        list.push({ date: this.formatDateStr(corpus),     label: 'Corpus Christi',    color: '#F56565' });
        return list;
    }

    /** Importa os feriados do ano. Retorna { added, updated, total }. */
    static importBrazilianHolidays(year) {
        const holidays = this.getBrazilianHolidays(year);
        const markers = this.getDayMarkers();
        let added = 0;
        const existingDates = new Set(
            markers.filter(m => !m.recurrence && m.date).map(m => m.date)
        );

        holidays.forEach(h => {
            if (!existingDates.has(h.date)) {
                markers.push({
                    id: this.generateId(),
                    date: h.date,
                    label: h.label,
                    color: h.color,
                    recurrence: null
                });
                added++;
            }
        });

        this.saveDayMarkers(markers);
        return { added, updated: 0, total: holidays.length };
    }

    /* ========================= BACKUP ========================= */

    static buildBackupPayload() {
        return {
            app: 'flora-planner',
            version: 6,
            exportedAt: new Date().toISOString(),
            tasks: this.getTasks(),
            settings: this.getSettings(),
            dayMarkers: this.getDayMarkers()
        };
    }

    static restoreFromBackupText(jsonText) {
        let parsed;
        try { parsed = JSON.parse(jsonText); }
        catch (e) { throw new Error('Arquivo inválido: não é um JSON válido.'); }

        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.tasks)) {
            throw new Error('Arquivo inválido: formato de backup do Flora Planner não reconhecido.');
        }

        const merged = { ...this.getSettings(), ...(parsed.settings || {}) };
        merged.categories = this.normalizeCategories(merged.categories);

        const normalizedTasks = this.normalizeTasks(parsed.tasks);
        const normalizedMarkers = Array.isArray(parsed.dayMarkers)
            ? this.normalizeMarkers(parsed.dayMarkers)
            : [];

        this.saveTasks(normalizedTasks);
        this.saveSettings(merged);
        this.saveDayMarkers(normalizedMarkers);

        return { tasks: normalizedTasks, settings: merged, dayMarkers: normalizedMarkers };
    }

    /* ================ SALVAMENTO DE ARQUIVOS ================== */

    static async saveBlob(blob, filename, mimeType) {
        const ext = '.' + filename.split('.').pop();
        const supportsPicker = typeof window !== 'undefined'
            && typeof window.showSaveFilePicker === 'function';

        if (supportsPicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: `Arquivo ${ext.toUpperCase()}`,
                        accept: { [mimeType]: [ext] }
                    }]
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                return { saved: true, via: 'picker' };
            } catch (err) {
                if (err && err.name === 'AbortError') {
                    return { saved: false, via: 'picker', canceled: true };
                }
                console.warn('File System Access API indisponível, usando download padrão:', err);
            }
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        return { saved: true, via: 'download' };
    }
}
