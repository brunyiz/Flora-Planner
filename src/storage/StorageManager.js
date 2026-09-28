/**
 * StorageManager.js
 * Persistência + utilitários de salvamento em arquivo.
 * Categorias agora são objetos { name, color }.
 * NOVO: normalização de tarefas (endTime, recurrence, order).
 */

class StorageManager {
    static TASKS_KEY = 'flora_planner_tasks';
    static SETTINGS_KEY = 'flora_planner_settings';

    static DEFAULT_CATEGORIES = [
        { name: 'Geral',    color: '#D8B4FE' },
        { name: 'Trabalho', color: '#4299E1' },
        { name: 'Estudos',  color: '#48BB78' },
        { name: 'Pessoal',  color: '#ED8936' },
        { name: 'Saúde',    color: '#F56565' }
    ];

    static DEFAULT_CATEGORY_COLOR = '#9F7AEA';

    /* ------------------------- TAREFAS ------------------------- */

    static getTasks() {
        try {
            const data = localStorage.getItem(this.TASKS_KEY);
            const parsed = data ? JSON.parse(data) : [];
            return this.normalizeTasks(parsed);
        } catch (e) {
            console.error('Erro ao carregar tarefas:', e);
            return [];
        }
    }

    static saveTasks(tasks) {
        try {
            localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
        } catch (e) {
            console.error('Erro ao salvar tarefas:', e);
        }
    }

    /**
     * Garante que tarefas antigas tenham os novos campos.
     * order fica undefined por padrão (ordenação automática por horário).
     */
    static normalizeTasks(tasks) {
        if (!Array.isArray(tasks)) return [];
        return tasks.map(task => {
            const t = { ...task };
            if (typeof t.endTime !== 'string') t.endTime = '';
            if (typeof t.notes !== 'string') t.notes = '';
            if (typeof t.time !== 'string') t.time = '';

            // Recurrence: { days: [0..6], until: 'YYYY-MM-DD'|null }
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

            // order: null/undefined por padrão → sort por hora
            if (typeof t.order !== 'number') delete t.order;

            return t;
        });
    }

    static generateId() {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    /* ----------------------- CONFIGURAÇÕES ---------------------- */

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
        } catch (e) {
            return defaults;
        }
    }

    static saveSettings(settings) {
        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Erro ao salvar configurações:', e);
        }
    }

    /* ----------------------- CATEGORIAS ------------------------- */

    static normalizeCategories(categories) {
        if (!Array.isArray(categories) || categories.length === 0) {
            return this.DEFAULT_CATEGORIES.map(c => ({ ...c }));
        }
        return categories.map((cat, i) => {
            if (typeof cat === 'string') {
                const def = this.DEFAULT_CATEGORIES.find(
                    d => d.name.toLowerCase() === cat.toLowerCase()
                );
                return {
                    name: cat,
                    color: def ? def.color : this.DEFAULT_CATEGORY_COLOR
                };
            }
            if (cat && typeof cat === 'object' && cat.name) {
                return {
                    name: String(cat.name),
                    color: cat.color || this.DEFAULT_CATEGORY_COLOR
                };
            }
            return {
                name: `Categoria ${i + 1}`,
                color: this.DEFAULT_CATEGORY_COLOR
            };
        });
    }

    static getCategories() {
        const settings = this.getSettings();
        return settings.categories.map(c => ({ ...c }));
    }

    static getCategoryNames() {
        return this.getCategories().map(c => c.name);
    }

    static getCategoryColor(name) {
        const cats = this.getCategories();
        const found = cats.find(c => c.name === name);
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
        const exists = categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
        if (exists) return false;
        categories.push({
            name: trimmed,
            color: color || this.DEFAULT_CATEGORY_COLOR
        });
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

    /* ------------------------- BACKUP --------------------------- */

    static buildBackupPayload() {
        return {
            app: 'flora-planner',
            version: 4,
            exportedAt: new Date().toISOString(),
            tasks: this.getTasks(),
            settings: this.getSettings()
        };
    }

    static restoreFromBackupText(jsonText) {
        let parsed;
        try {
            parsed = JSON.parse(jsonText);
        } catch (e) {
            throw new Error('Arquivo inválido: não é um JSON válido.');
        }

        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.tasks)) {
            throw new Error('Arquivo inválido: formato de backup do Flora Planner não reconhecido.');
        }

        const merged = { ...this.getSettings(), ...(parsed.settings || {}) };
        merged.categories = this.normalizeCategories(merged.categories);

        const normalizedTasks = this.normalizeTasks(parsed.tasks);

        this.saveTasks(normalizedTasks);
        this.saveSettings(merged);

        return { tasks: normalizedTasks, settings: merged };
    }

    /* ---------------- SALVAMENTO DE ARQUIVOS -------------------- */

    static async saveBlob(blob, filename, mimeType) {
        const ext = '.' + filename.split('.').pop();
        const supportsPicker = typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function';

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
