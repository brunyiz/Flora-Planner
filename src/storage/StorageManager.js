/**
 * StorageManager.js
 * Gerenciamento centralizado de persistência de dados no LocalStorage
 */

class StorageManager {
    static TASKS_KEY = 'flora_planner_tasks';
    static SETTINGS_KEY = 'flora_planner_settings';

    /**
     * Carrega as tarefas salvas
     * @returns {Array} Lista de tarefas
     */
    static getTasks() {
        try {
            const data = localStorage.getItem(this.TASKS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Erro ao carregar tarefas:', e);
            return [];
        }
    }

    /**
     * Salva a lista completa de tarefas
     * @param {Array} tasks
     */
    static saveTasks(tasks) {
        try {
            localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
        } catch (e) {
            console.error('Erro ao salvar tarefas:', e);
        }
    }

    /**
     * Gera um identificador único e estável para uma nova tarefa
     * @returns {string}
     */
    static generateId() {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    /**
     * Carrega as configurações do usuário
     * @returns {Object} Configurações
     */
    static getSettings() {
        const defaults = {
            darkMode: false,
            primaryColor: '#D8B4FE',
            titleColor: '#D46FA8',
            startOfWeek: 0, // 0 = Domingo, 1 = Segunda
            pdfOrientation: 'landscape',
            pdfShowNotes: true,
            pdfFontSize: 'medium'
        };
        try {
            const data = localStorage.getItem(this.SETTINGS_KEY);
            return data ? { ...defaults, ...JSON.parse(data) } : defaults;
        } catch (e) {
            return defaults;
        }
    }

    /**
     * Salva as configurações do usuário
     * @param {Object} settings
     */
    static saveSettings(settings) {
        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Erro ao salvar configurações:', e);
        }
    }

    /**
     * Monta o objeto completo de backup (tarefas + configurações) pronto para exportação em .json
     * @returns {Object}
     */
    static buildBackupPayload() {
        return {
            app: 'flora-planner',
            version: 1,
            exportedAt: new Date().toISOString(),
            tasks: this.getTasks(),
            settings: this.getSettings()
        };
    }

    /**
     * Valida e restaura um backup a partir do conteúdo textual de um arquivo .json
     * @param {string} jsonText
     * @returns {{tasks: Array, settings: Object}}
     * @throws {Error} se o arquivo não tiver o formato esperado
     */
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

        this.saveTasks(parsed.tasks);
        this.saveSettings(settings);

        return { tasks: parsed.tasks, settings };
    }
}
