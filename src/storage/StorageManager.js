/**
 * StorageManager.js
 * Gerenciamento centralizado de persistência de dados no LocalStorage
 * + utilitários de salvamento em arquivo (com escolha de pasta).
 */

class StorageManager {
    static TASKS_KEY = 'flora_planner_tasks';
    static SETTINGS_KEY = 'flora_planner_settings';

    static DEFAULT_CATEGORIES = ['Geral', 'Trabalho', 'Estudos', 'Pessoal', 'Saúde'];

    /* ------------------------- TAREFAS ------------------------- */

    static getTasks() {
        try {
            const data = localStorage.getItem(this.TASKS_KEY);
            return data ? JSON.parse(data) : [];
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
            categories: [...this.DEFAULT_CATEGORIES]
        };
        try {
            const data = localStorage.getItem(this.SETTINGS_KEY);
            return data ? { ...defaults, ...JSON.parse(data) } : defaults;
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

    static getCategories() {
        const settings = this.getSettings();
        if (Array.isArray(settings.categories) && settings.categories.length > 0) {
            return [...settings.categories];
        }
        return [...this.DEFAULT_CATEGORIES];
    }

    static saveCategories(categories) {
        const settings = this.getSettings();
        settings.categories = Array.isArray(categories) ? categories : this.getCategories();
        this.saveSettings(settings);
    }

    /** Adiciona uma categoria. Retorna true se foi adicionada, false se já existia/vazia. */
    static addCategory(name) {
        const trimmed = String(name || '').trim();
        if (!trimmed) return false;
        const categories = this.getCategories();
        const exists = categories.some(c => c.toLowerCase() === trimmed.toLowerCase());
        if (exists) return false;
        categories.push(trimmed);
        this.saveCategories(categories);
        return true;
    }

    /** Remove uma categoria (mantém pelo menos 'Geral'). */
    static removeCategory(name) {
        let categories = this.getCategories().filter(c => c !== name);
        if (categories.length === 0) categories = ['Geral'];
        this.saveCategories(categories);
    }

    /* ------------------------- BACKUP --------------------------- */

    static buildBackupPayload() {
        return {
            app: 'flora-planner',
            version: 2,
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

        const settings = { ...this.getSettings(), ...(parsed.settings || {}) };
        // Garante que categorias personalizadas continuem existindo
        if (!Array.isArray(settings.categories) || settings.categories.length === 0) {
            settings.categories = [...this.DEFAULT_CATEGORIES];
        }

        this.saveTasks(parsed.tasks);
        this.saveSettings(settings);

        return { tasks: parsed.tasks, settings };
    }

    /* ---------------- SALVAMENTO DE ARQUIVOS -------------------- */

    /**
     * Salva um Blob em disco.
     * Se o navegador suportar File System Access API (Chrome/Edge recentes),
     * abre o diálogo "Salvar como" permitindo escolher a pasta.
     * Caso contrário, faz download tradicional para a pasta padrão.
     *
     * @param {Blob} blob
     * @param {string} filename
     * @param {string} mimeType
     * @returns {Promise<{saved:boolean, via:string, canceled?:boolean}>}
     */
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
                // cai no fallback abaixo
            }
        }

        // Fallback universal
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
