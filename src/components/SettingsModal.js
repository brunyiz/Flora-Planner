/**
 * SettingsModal.js
 * Modal de Configurações Categorizadas (Interface, Planejamento, PDF, Geral e Categorias)
 */

class SettingsModal {
    constructor({ onSettingsChanged }) {
        this.onSettingsChanged = onSettingsChanged;
        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.modal = document.createElement('div');
        this.modal.className = 'modal';
        this.modal.id = 'settings-modal';
        this.modal.innerHTML = `
            <div class="modal-content" style="max-width: 680px;">
                <div class="modal-header">
                    <h2><i class="fas fa-sliders-h"></i> Configurações do Sistema</h2>
                    <button class="close-btn" id="close-settings-btn">&times;</button>
                </div>

                <div class="settings-tabs">
                    <button class="settings-tab-btn active" data-tab="tab-interface">
                        <i class="fas fa-paint-brush"></i> Interface
                    </button>
                    <button class="settings-tab-btn" data-tab="tab-planning">
                        <i class="fas fa-tasks"></i> Planejamento
                    </button>
                    <button class="settings-tab-btn" data-tab="tab-categories">
                        <i class="fas fa-tags"></i> Categorias
                    </button>
                    <button class="settings-tab-btn" data-tab="tab-pdf">
                        <i class="fas fa-file-pdf"></i> PDF & Impressão
                    </button>
                    <button class="settings-tab-btn" data-tab="tab-general">
                        <i class="fas fa-cog"></i> Geral
                    </button>
                </div>

                <form id="settings-form">
                    <div class="settings-tab-content active" id="tab-interface">
                        <div class="form-group">
                            <label><i class="fas fa-moon"></i> Modo Escuro (Dark Mode)</label>
                            <label class="checkbox-group" style="margin-top: 5px;">
                                <input type="checkbox" id="setting-dark-mode"> Ativar tema escuro de alto contraste
                            </label>
                        </div>
                        <div class="form-row" style="margin-top: 15px;">
                            <div class="form-group">
                                <label>Cor Principal de Destaque</label>
                                <input type="color" id="setting-primary-color" value="#D8B4FE">
                            </div>
                            <div class="form-group">
                                <label>Cor dos Títulos</label>
                                <input type="color" id="setting-title-color" value="#D46FA8">
                            </div>
                        </div>
                    </div>

                    <div class="settings-tab-content" id="tab-planning">
                        <div class="form-group">
                            <label>Primeiro dia da semana no calendário</label>
                            <select class="form-control" id="setting-start-week">
                                <option value="0">Domingo</option>
                                <option value="1">Segunda-feira</option>
                            </select>
                        </div>
                    </div>

                    <div class="settings-tab-content" id="tab-categories">
                        <p style="font-size: 0.9rem; color: var(--cor-texto-light); margin-bottom: 14px;">
                            Gerencie as categorias disponíveis ao criar ou editar tarefas.
                            Elas também alimentam o gráfico da tela de Relatórios.
                        </p>
                        <div class="category-list" id="category-list"></div>
                        <div class="category-add-row">
                            <input type="text" class="form-control" id="new-category-input"
                                   placeholder="Nome da nova categoria..." maxlength="40">
                            <button type="button" class="btn btn-primary" id="btn-add-category">
                                <i class="fas fa-plus"></i> Adicionar
                            </button>
                        </div>
                        <small style="display:block; margin-top:10px; color: var(--cor-texto-light);">
                            Dica: você também pode criar uma categoria direto no formulário de tarefa,
                            escolhendo a opção “+ Nova categoria...”.
                        </small>
                    </div>

                    <div class="settings-tab-content" id="tab-pdf">
                        <div class="form-group">
                            <label>Orientação Padrão de Impressão</label>
                            <select class="form-control" id="setting-pdf-orientation">
                                <option value="landscape">Paisagem (Horizontal - Ideal para Calendário)</option>
                                <option value="portrait">Retrato (Vertical)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Tamanho da Fonte no PDF</label>
                            <select class="form-control" id="setting-pdf-font-size">
                                <option value="small">Pequeno (cabe mais conteúdo)</option>
                                <option value="medium" selected>Médio (equilibrado)</option>
                                <option value="large">Grande (alta legibilidade)</option>
                            </select>
                        </div>
                        <small style="display:block; color: var(--cor-texto-light);">
                            Essas opções também afetam a exportação em PNG.
                        </small>
                    </div>

                    <div class="settings-tab-content" id="tab-general">
                        <p style="font-size: 0.9rem; color: var(--cor-texto-light);">
                            Preferências gerais e informações sobre o armazenamento local.
                            Os dados ficam salvos no seu próprio navegador e podem ser
                            exportados via “Fazer Backup (.json)” no menu lateral.
                        </p>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px;">
                        <button type="button" class="btn btn-secondary" id="cancel-settings-btn">Cancelar</button>
                        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Salvar Alterações</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(this.modal);
    }

    bindEvents() {
        const tabBtns = this.modal.querySelectorAll('.settings-tab-btn');
        const tabContents = this.modal.querySelectorAll('.settings-tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                this.modal.querySelector(`#${targetTab}`).classList.add('active');
            });
        });

        this.modal.querySelector('#close-settings-btn').addEventListener('click', () => this.close());
        this.modal.querySelector('#cancel-settings-btn').addEventListener('click', () => this.close());

        this.modal.querySelector('#settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // Adicionar categoria
        this.modal.querySelector('#btn-add-category').addEventListener('click', () => this.handleAddCategory());
        this.modal.querySelector('#new-category-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleAddCategory();
            }
        });
    }

    handleAddCategory() {
        const input = this.modal.querySelector('#new-category-input');
        const value = (input.value || '').trim();
        if (!value) {
            alert('Digite um nome para a categoria.');
            return;
        }
        const created = StorageManager.addCategory(value);
        if (!created) {
            alert('Essa categoria já existe.');
            return;
        }
        input.value = '';
        this.renderCategoryList();
    }

        renderCategoryList() {
        const list = this.modal.querySelector('#category-list');
        if (!list) return;

        const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));

        const categories = StorageManager.getCategories();
        const tasks = StorageManager.getTasks();

        list.innerHTML = categories.map(cat => {
            const count = tasks.filter(t => (t.category || 'Geral') === cat.name).length;
            return `
                <div class="category-item">
                    <div class="category-item-left">
                        <input type="color"
                               class="category-color-input"
                               data-category="${escapeHtml(cat.name)}"
                               value="${escapeHtml(cat.color)}"
                               title="Cor da categoria">
                        <span class="category-name">${escapeHtml(cat.name)}</span>
                        <small class="category-count">
                            (${count} tarefa${count === 1 ? '' : 's'})
                        </small>
                    </div>
                    <button type="button" class="category-remove"
                            data-category="${escapeHtml(cat.name)}"
                            title="Remover categoria">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');

        // Remover categoria
        list.querySelectorAll('.category-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.getAttribute('data-category');
                if (confirm(`Remover a categoria "${cat}"?\n\nTarefas que já usam essa categoria continuarão existindo; apenas a opção some da lista.`)) {
                    StorageManager.removeCategory(cat);
                    this.renderCategoryList();
                    if (this.onSettingsChanged) this.onSettingsChanged(StorageManager.getSettings());
                }
            });
        });

        // Alterar cor — salva na hora e atualiza o calendário atrás do modal
        list.querySelectorAll('.category-color-input').forEach(input => {
            input.addEventListener('input', () => {
                const cat = input.getAttribute('data-category');
                StorageManager.updateCategoryColor(cat, input.value);
                if (this.onSettingsChanged) this.onSettingsChanged(StorageManager.getSettings());
            });
        });
    }

    open() {
        const settings = StorageManager.getSettings();

        document.getElementById('setting-dark-mode').checked = settings.darkMode;
        document.getElementById('setting-primary-color').value = settings.primaryColor;
        document.getElementById('setting-title-color').value = settings.titleColor;
        document.getElementById('setting-start-week').value = settings.startOfWeek;
        document.getElementById('setting-pdf-orientation').value = settings.pdfOrientation;
        document.getElementById('setting-pdf-font-size').value = settings.pdfFontSize;

        this.renderCategoryList();

        this.modal.style.display = 'flex';
    }

    close() {
        this.modal.style.display = 'none';
    }

    saveSettings() {
        // Preserva campos que não são formulário (ex.: categorias)
        const current = StorageManager.getSettings();

        const newSettings = {
            ...current,
            darkMode: document.getElementById('setting-dark-mode').checked,
            primaryColor: document.getElementById('setting-primary-color').value,
            titleColor: document.getElementById('setting-title-color').value,
            startOfWeek: parseInt(document.getElementById('setting-start-week').value, 10),
            pdfOrientation: document.getElementById('setting-pdf-orientation').value,
            pdfFontSize: document.getElementById('setting-pdf-font-size').value
        };

        StorageManager.saveSettings(newSettings);

        document.body.classList.toggle('dark-mode', !!newSettings.darkMode);
        document.documentElement.style.setProperty('--cor-principal', newSettings.primaryColor);
        document.documentElement.style.setProperty('--cor-titulo', newSettings.titleColor);

        if (this.onSettingsChanged) this.onSettingsChanged(newSettings);

        this.close();
    }
}
