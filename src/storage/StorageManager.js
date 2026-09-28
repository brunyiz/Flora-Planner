/**
 * StorageManager.js
 * Persistência + utilitários de salvamento em arquivo.
 * Categorias agora são objetos { name, color } (com migração automática
 * do formato antigo — lista de strings — para o novo).
 */

class StorageManager {
    static TASKS_KEY = 'flora_planner_tasks';
    static SETTINGS_KEY = 'flora_planner_settings';

    static loadTasks() {
        try {
            const raw = localStorage.getItem(StorageManager.TASKS_KEY);
            const tasks = raw ? JSON.parse(raw) : [];
            return StorageManager.normalizeTasks(tasks);
        } catch (e) {
            console.error('Erro ao carregar tarefas:', e);
            return [];
        }
    }

    static saveTasks(tasks) {
        try {
            localStorage.setItem(StorageManager.TASKS_KEY, JSON.stringify(tasks));
        } catch (e) {
            console.error('Erro ao salvar tarefas:', e);
        }
    }

    /**
     * Garante que tarefas antigas tenham todos os campos novos.
     */
    static normalizeTasks(tasks) {
        return tasks.map((task, index) => ({
            id: task.id || StorageManager.generateId(),
            title: task.title || '',
            description: task.description || '',
            date: task.date || '',
            time: task.time || '',
            endTime: task.endTime || '',
            category: task.category || 'outro',
            priority: task.priority || 'media',
            completed: !!task.completed,
            notes: task.notes || '',
            order: typeof task.order === 'number' ? task.order : index,
            recurrence: task.recurrence || null
        }));
    }

    static generateId() {
        return 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    }

    static loadSettings() {
        try {
            const raw = localStorage.getItem(StorageManager.SETTINGS_KEY);
            return raw ? JSON.parse(raw) : { view: 'month' };
        } catch (e) {
            return { view: 'month' };
        }
    }

    static saveSettings(settings) {
        try {
            localStorage.setItem(StorageManager.SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Erro ao salvar settings:', e);
        }
    }
}
