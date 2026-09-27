/**
 * TaskManager.js
 * Gerenciamento das operações CRUD de tarefas e da janela de edição com Post-it.
 * Categorias são carregadas dinamicamente do StorageManager e podem ser
 * criadas na hora pelo próprio formulário.
 */

class TaskManager {
    constructor({ onTasksUpdated }) {
        this.onTasksUpdated = onTasksUpdated;
        this.tasks = StorageManager.getTasks();
        this.activeTask = null;

        this.cacheDOM();
        this.bindEvents();
    }

    cacheDOM() {
        this.modal = document.getElementById('task-modal');
        this.form = document.getElementById('task-form');
        this.titleEl = document.getElementById('modal-task-title');
        this.closeBtn = document.getElementById('close-task-modal');
        this.cancelBtn = document.getElementById('btn-cancel-task');
        this.deleteBtn = document.getElementById('btn-delete-task');
        this.duplicateBtn = document.getElementById('btn-duplicate-task');

        this.idInput = document.getElementById('task-id');
        this.titleInput = document.getElementById('task-title');
        this.dateInput = document.getElementById('task-date');
        this.timeInput = document.getElementById('task-time');
        this.priorityInput = document.getElementById('task-priority');
        this.categoryInput = document.getElementById('task-category');
        this.completedInput = document.getElementById('task-completed');

        this.notesTextarea = document.getElementById('notes-textarea');
        this.notesTaskLabel = document.getElementById('notes-task-label');
        this.notesCharCount = document.getElementById('notes-char-count');
        this.btnNoteCheck = document.getElementById('btn-note-check');
        this.btnNoteBold = document.getElementById('btn-note-bold');
        this.btnNoteClear = document.getElementById('btn-note-clear');
    }

    bindEvents() {
        if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());
        if (this.cancelBtn) this.cancelBtn.addEventListener('click', () => this.close());

        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.close();
            });
        }

        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTask();
            });
        }

        if (this.deleteBtn) {
            this.deleteBtn.addEventListener('click', () => {
                if (this.activeTask && confirm('Tem certeza que deseja excluir esta tarefa?')) {
                    this.deleteTask(this.activeTask.id);
                }
            });
        }

        if (this.duplicateBtn) {
            this.duplicateBtn.addEventListener('click', () => this.duplicateActiveTask());
        }

        // Categoria dinâmica: opção "+ Nova categoria" no select
        if (this.categoryInput) {
            this.categoryInput.addEventListener('change', () => {
                if (this.categoryInput.value === '__new__') {
                    const name = prompt('Nome da nova categoria:');
                    if (name && name.trim()) {
                        const created = StorageManager.addCategory(name.trim());
                        const value = name.trim();
                        this.populateCategorySelect(created ? value : this.getFallbackCategory(value));
                        if (!created) {
                            // categoria já existia — só seleciona
                            this.populateCategorySelect(value);
                        }
                    } else {
                        this.populateCategorySelect();
                    }
                }
            });
        }

        // Ferramentas do Post-it
        if (this.notesTextarea) {
            this.notesTextarea.addEventListener('input', () => this.updateCharCount());
        }
        if (this.btnNoteCheck) {
            this.btnNoteCheck.addEventListener('click', () => this.insertAtCursor('[ ] '));
        }
        if (this.btnNoteBold) {
            this.btnNoteBold.addEventListener('click', () => this.wrapSelection('**'));
        }
        if (this.btnNoteClear) {
            this.btnNoteClear.addEventListener('click', () => {
                if (confirm('Limpar todas as anotações desta tarefa?')) {
                    this.notesTextarea.value = '';
                    this.updateCharCount();
                    this.notesTextarea.focus();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && this.modal.style.display === 'flex') {
                this.close();
            }
        });
    }

        /** Nome da categoria que existe (case-insensitive) — usada após tentar adicionar */
    getFallbackCategory(name) {
        const cats = StorageManager.getCategories();
        const found = cats.find(c => c.name.toLowerCase() === String(name).toLowerCase());
        return found ? found.name : (cats[0] && cats[0].name) || 'Geral';
    }

    /**
     * Preenche o <select> de categorias com as categorias do StorageManager.
     * Categorias agora são objetos { name, color }.
     */
    populateCategorySelect(selected) {
        const select = this.categoryInput;
        if (!select) return;

        const categories = StorageManager.getCategories();
        select.innerHTML = '';

        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.name;
            opt.textContent = cat.name;
            select.appendChild(opt);
        });

        // Categoria da tarefa que não está mais na lista → adiciona temporariamente
        if (selected && !categories.some(c => c.name === selected)) {
            const opt = document.createElement('option');
            opt.value = selected;
            opt.textContent = `${selected} (não listada)`;
            select.insertBefore(opt, select.firstChild);
        }

        const addOpt = document.createElement('option');
        addOpt.value = '__new__';
        addOpt.textContent = '+ Nova categoria...';
        select.appendChild(addOpt);

        if (selected) {
            select.value = selected;
        } else {
            select.value = (categories[0] && categories[0].name) || 'Geral';
        }
    }

    insertAtCursor(text) {
        if (!this.notesTextarea) return;
        const start = this.notesTextarea.selectionStart;
        const end = this.notesTextarea.selectionEnd;
        const value = this.notesTextarea.value;
        this.notesTextarea.value = value.slice(0, start) + text + value.slice(end);
        const cursor = start + text.length;
        this.notesTextarea.setSelectionRange(cursor, cursor);
        this.notesTextarea.focus();
        this.updateCharCount();
    }

    wrapSelection(wrapper) {
        if (!this.notesTextarea) return;
        const start = this.notesTextarea.selectionStart;
        const end = this.notesTextarea.selectionEnd;
        const value = this.notesTextarea.value;
        const selected = value.slice(start, end) || 'texto';
        this.notesTextarea.value = value.slice(0, start) + wrapper + selected + wrapper + value.slice(end);
        this.notesTextarea.focus();
        this.updateCharCount();
    }

    updateCharCount() {
        if (!this.notesCharCount || !this.notesTextarea) return;
        const count = this.notesTextarea.value.length;
        this.notesCharCount.textContent = `${count} caractere${count === 1 ? '' : 's'}`;
    }

    openForNew(dateStr) {
        this.activeTask = null;
        if (this.titleEl) this.titleEl.innerHTML = '<i class="fas fa-calendar-plus"></i> Nova Tarefa';
        if (this.notesTaskLabel) this.notesTaskLabel.textContent = 'Nova Tarefa';

        this.idInput.value = '';
        this.titleInput.value = '';
        this.dateInput.value = dateStr || new Date().toISOString().split('T')[0];
        if (this.timeInput) this.timeInput.value = '';
        this.priorityInput.value = 'media';
        this.populateCategorySelect();
        this.completedInput.checked = false;
        if (this.notesTextarea) this.notesTextarea.value = '';
        this.updateCharCount();

        if (this.deleteBtn) this.deleteBtn.style.display = 'none';
        if (this.duplicateBtn) this.duplicateBtn.style.display = 'none';
        this.open();
    }

    openForEdit(task) {
        this.activeTask = task;
        if (this.titleEl) this.titleEl.innerHTML = '<i class="fas fa-edit"></i> Editar Tarefa';
        if (this.notesTaskLabel) this.notesTaskLabel.textContent = task.title || 'Tarefa';

        this.idInput.value = task.id;
        this.titleInput.value = task.title;
        this.dateInput.value = task.date;
        if (this.timeInput) this.timeInput.value = task.time || '';
        this.priorityInput.value = task.priority || 'media';
        this.populateCategorySelect(task.category || 'Geral');
        this.completedInput.checked = !!task.completed;
        if (this.notesTextarea) this.notesTextarea.value = task.notes || '';
        this.updateCharCount();

        if (this.deleteBtn) this.deleteBtn.style.display = 'inline-flex';
        if (this.duplicateBtn) this.duplicateBtn.style.display = 'inline-flex';
        this.open();
    }

    open() {
        if (this.modal) this.modal.style.display = 'flex';
        setTimeout(() => this.titleInput && this.titleInput.focus(), 50);
    }

    close() {
        if (this.modal) this.modal.style.display = 'none';
        this.activeTask = null;
    }

    saveTask() {
        const title = this.titleInput.value.trim();
        const date = this.dateInput.value;

        if (!title || !date) {
            alert('Por favor, preencha o título e a data da tarefa.');
            return;
        }

        const id = this.idInput.value || StorageManager.generateId();
        let category = this.categoryInput ? this.categoryInput.value : 'Geral';
        if (category === '__new__') category = 'Geral';

        const taskData = {
            id,
            title,
            date,
            time: this.timeInput ? this.timeInput.value : '',
            priority: this.priorityInput.value,
            category,
            completed: this.completedInput.checked,
            notes: this.notesTextarea ? this.notesTextarea.value : ''
        };

        const existingIndex = this.tasks.findIndex(t => t.id === id);
        if (existingIndex >= 0) {
            this.tasks[existingIndex] = taskData;
        } else {
            this.tasks.push(taskData);
        }

        StorageManager.saveTasks(this.tasks);
        this.notify();
        this.close();
    }

    /** Duplica a tarefa aberta atualmente como uma nova tarefa */
    duplicateActiveTask() {
        if (!this.activeTask) return;
        const base = this.activeTask;
        const newTask = {
            ...base,
            id: StorageManager.generateId(),
            title: `${base.title} (cópia)`,
            completed: false
        };
        this.tasks.push(newTask);
        StorageManager.saveTasks(this.tasks);
        this.notify();
        // Reabre o modal já na nova tarefa
        this.openForEdit(newTask);
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        StorageManager.saveTasks(this.tasks);
        this.notify();
        this.close();
    }

    getTasks() {
        return this.tasks;
    }

    setTasksExternally(tasks) {
        this.tasks = Array.isArray(tasks) ? tasks : [];
        this.notify();
    }

    notify() {
        if (this.onTasksUpdated) this.onTasksUpdated(this.tasks);
    }
}
