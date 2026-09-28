/**
 * TaskManager.js
 * Gerenciamento das operações CRUD de tarefas e da janela de edição com Post-it.
 * Categorias são carregadas dinamicamente do StorageManager e podem ser
 * criadas na hora pelo próprio formulário.
 */

class TaskManager {
    constructor({ onSave, onDelete }) {
        this.onSave = onSave;
        this.onDelete = onDelete;
        this.tasks = [];
        this.editingId = null;
        this.cacheDOM();
        this.bindEvents();
    }

    cacheDOM() {
        this.modal = document.getElementById('task-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.form = document.getElementById('task-form');
        this.idInput = document.getElementById('task-id');
        this.titleInput = document.getElementById('task-title');
        this.descriptionInput = document.getElementById('task-description');
        this.dateInput = document.getElementById('task-date');
        this.timeInput = document.getElementById('task-time');
        this.endTimeInput = document.getElementById('task-end-time');
        this.categorySelect = document.getElementById('task-category');
        this.prioritySelect = document.getElementById('task-priority');
        this.notesInput = document.getElementById('task-notes');
        this.recurrenceDayCheckboxes = document.querySelectorAll('.recurrence-day');
        this.recurrenceUntilInput = document.getElementById('task-recurrence-until');
        this.cancelBtn = document.getElementById('btn-cancel-task');
        this.deleteBtn = document.getElementById('btn-delete-task');
        this.newTaskBtn = document.getElementById('btn-new-task');
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });
        this.cancelBtn.addEventListener('click', () => this.close());
        this.deleteBtn.addEventListener('click', () => this.deleteTask());
        this.newTaskBtn.addEventListener('click', () => this.openNew());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
    }

    setTasks(tasks) {
        this.tasks = tasks;
    }

    openNew(defaultDate) {
        this.editingId = null;
        this.modalTitle.textContent = 'Nova Tarefa';
        this.form.reset();
        this.idInput.value = '';
        this.dateInput.value = defaultDate || this.toDateString(new Date());
        this.deleteBtn.style.display = 'none';
        this.modal.style.display = 'flex';
        setTimeout(() => this.titleInput.focus(), 0);
    }

    openForEdit(task) {
        this.editingId = task.id;
        this.modalTitle.textContent = 'Editar Tarefa';
        this.idInput.value = task.id;
        this.titleInput.value = task.title || '';
        this.descriptionInput.value = task.description || '';
        this.dateInput.value = task.date || '';
        this.timeInput.value = task.time || '';
        this.endTimeInput.value = task.endTime || '';
        this.categorySelect.value = task.category || 'outro';
        this.prioritySelect.value = task.priority || 'media';
        this.notesInput.value = task.notes || '';

        this.recurrenceDayCheckboxes.forEach(cb => {
            cb.checked = !!(task.recurrence && task.recurrence.days.includes(parseInt(cb.value)));
        });
        this.recurrenceUntilInput.value = task.recurrence?.until || '';

        this.deleteBtn.style.display = 'inline-block';
        this.modal.style.display = 'flex';
        setTimeout(() => this.titleInput.focus(), 0);
    }

    close() {
        this.modal.style.display = 'none';
        this.editingId = null;
    }

    saveTask() {
        const recurrenceDays = Array.from(this.recurrenceDayCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => parseInt(cb.value));

        const recurrence = recurrenceDays.length > 0 ? {
            days: recurrenceDays,
            until: this.recurrenceUntilInput.value || null
        } : null;

        const data = {
            title: this.titleInput.value.trim(),
            description: this.descriptionInput.value.trim(),
            date: this.dateInput.value,
            time: this.timeInput.value,
            endTime: this.endTimeInput.value,
            category: this.categorySelect.value,
            priority: this.prioritySelect.value,
            notes: this.notesInput.value.trim(),
            recurrence
        };

        if (!data.title) return;

        if (this.editingId) {
            const idx = this.tasks.findIndex(t => t.id === this.editingId);
            if (idx >= 0) {
                this.tasks[idx] = { ...this.tasks[idx], ...data };
            }
        } else {
            const newTask = {
                id: StorageManager.generateId(),
                completed: false,
                order: this.tasks.length,
                ...data
            };
            this.tasks.push(newTask);
        }

        if (this.onSave) this.onSave(this.tasks);
        this.close();
    }

    deleteTask() {
        if (!this.editingId) return;
        if (!confirm('Excluir esta tarefa?')) return;
        this.tasks = this.tasks.filter(t => t.id !== this.editingId);
        if (this.onDelete) this.onDelete(this.tasks);
        this.close();
    }

    toDateString(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
}
