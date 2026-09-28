/**
 * SettingsModal.js
 * Configurações em abas (Interface, Planejamento, Categorias, Marcadores, PDF, Geral).
 */

class SettingsModal {
    constructor({ onSettingsChanged, onOpenMarker } = {}) {
        this.onSettingsChanged = onSettingsChanged;
        this.onOpenMarker = onOpenMarker;
        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.modal = document.createElement('div');
        this.modal.className = 'modal';
        this.modal.id = 'settings-modal';
        this.modal.innerHTML = `
            <div class="modal-content" style="max-width: 720px;">
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
                    <button class="settings-tab-btn" data-tab="tab-markers">
                        <i class="fas fa-bookmark"></i> Marcadores
                    </button>
                    <button class="settings-tab-btn" data-tab="tab-pdf">
                        <i class="fas fa-file-pdf"></i> PDF
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
                                <input type="checkbox" id="setting-dark-mode"> Ativar tema escuro
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
                        </p>
                        <div class="category-list" id="category-list"></div>
                        <div class="category-add-row">
                            <input type="text" class="form-control" id="new-category-input"
                                   placeholder="Nome da nova categoria..." maxlength="40">
                            <button type="button" class="btn btn-primary" id="btn-add-category">
                                <i class="fas fa-plus"></i> Adicionar
                            </button>
                        </div>
                    </div>

                    <div class="settings-tab-content" id="tab-markers">
                        <p style="font-size: 0.9rem; color: var(--cor-texto-light); margin-bottom: 14px;">
                            Marcadores destacam datas especiais (feriados, provas, aniversários).
                            Podem ser únicos ou recorrentes (ex: toda sexta-feira).
                        </p>
                        <div class="markers-actions">
                            <button type="button" class="btn btn-primary" id="btn-add-marker-settings">
                                <i class="fas fa-plus"></i> Novo marcador
                            </button>
                            <button type="button" class="btn btn-secondary" id="btn-import-holidays">
                                <i class="fas fa-calendar-check"></i> Importar feriados brasileiros
                            </button>
                        </div>
                        <div class="marker-year-row">
                            <label>Ano para importar:</label>
                            <select class="form-control" id="holiday-year" style="max-width: 120px;">
                            </select>
                        </div>
                        <div class="markers-list" id="markers-list"></div>
                    </div>

                    <div class="settings-tab-content" id="tab-pdf">
                        <div class="form-group">
                            <label>Orientação Padrão de Impressão</label>
                            <select class="form-control" id="setting-pdf-orientation">
                                <option value="landscape">Paisagem (Horizontal)</option>
                                <option value="portrait">Retrato (Vertical)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Tamanho da Fonte no PDF</label>
                            <select class="form-control" id="setting-pdf-font-size">
                                <option value="small">Pequeno</option>
                                <option value="medium" selected>Médio</option>
                                <option value="large">Grande</option>
                            </select>
                        </div>
                    </div>

                    <div class="settings-tab-content" id="tab-general">
                        <p style="font-size: 0.9rem; color: var(--cor-texto-light);">
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

        // Ano para importação
        const yearSelect = this.modal.querySelector('#holiday-year');
        const currentYear = new Date().getFullYear();
        for (let y = currentYear; y <= currentYear + 3; y++) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            yearSelect.appendChild(opt);
        }
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

        this.modal.querySelector('#btn-add-category').addEventListener('click', () => this.handleAddCategory());
        this.modal.querySelector('#new-category-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); this.handleAddCategory(); }
        });

        this.modal.querySelector('#btn-add-marker-settings').addEventListener('click', () => {
            if (this.onOpenMarker) this.onOpenMarker(null, null);
        });

        this.modal.querySelector('#btn-import-holidays').addEventListener('click', () => {
            const year = parseInt(this.modal.querySelector('#holiday-year').value, 10);
            const result = StorageManager.importBrazilianHolidays(year);
            this.renderMarkersList();
            alert(`Feriados de ${year} importados!\n\n${result.added} adicionado(s) de ${result.total} disponíveis.`);
            if (this.onSettingsChanged) this.onSettingsChanged(StorageManager.getSettings());
        });
    }

    handleAddCategory() {
        const input = this.modal.querySelector('#new-category-input');
        const value = (input.value || '').trim();
        if (!value) { alert('Digite um nome para a categoria.'); return; }
        if (!StorageManager.addCategory(value)) { alert('Essa categoria já existe.'); return; }
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
                        <input type="color" class="category-color-input"
                               data-category="${escapeHtml(cat.name)}"
                               value="${escapeHtml(cat.color)}" title="Cor da categoria">
                        <span class="category-name">${escapeHtml(cat.name)}</span>
                        <small class="category-count">(${count} tarefa${count === 1 ? '' : 's'})</small>
                    </div>
                    <button type="button" class="category-remove"
                            data-category="${escapeHtml(cat.name)}" title="Remover categoria">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');

        list.querySelectorAll('.category-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.getAttribute('data-category');
                if (confirm(`Remover a categoria "${cat}"?`)) {
                    StorageManager.removeCategory(cat);
                    this.renderCategoryList();
                    if (this.onSettingsChanged) this.onSettingsChanged(StorageManager.getSettings());
                }
            });
        });

        list.querySelectorAll('.category-color-input').forEach(input => {
            input.addEventListener('input', () => {
                StorageManager.updateCategoryColor(input.getAttribute('data-category'), input.value);
                if (this.onSettingsChanged) this.onSettingsChanged(StorageManager.getSettings());
            });
        });
    }

    renderMarkersList() {
        const list = this.modal.querySelector('#markers-list');
        if (!list) return;
        const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));

        const markers = StorageManager.getDayMarkers();

        if (markers.length === 0) {
            list.innerHTML = `
                <div class="markers-empty">
                    Nenhum marcador cadastrado ainda. Use o botão acima ou clique no ícone 🏷️ em qualquer dia do calendário.
                </div>
            `;
            return;
        }

        const dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
        const sorted = [...markers].sort((a, b) => {
            const aKey = a.date || '9999-99-99';
            const bKey = b.date || '9999-99-99';
            return aKey.localeCompare(bKey);
        });

        list.innerHTML = sorted.map(mk => {
            let when;
            if (mk.recurrence && mk.recurrence.days.length > 0) {
                const daysLabel = mk.recurrence.days.map(d => dayNames[d]).join(', ');
                const until = mk.recurrence.until ? ` até ${mk.recurrence.until}` : '';
                when = `🔁 ${daysLabel}${until}`;
                if (mk.date) when = `${mk.date} • ${when}`;
            } else {
                when = mk.date || '—';
            }
            const textColor = StorageManager.DEFAULT_CATEGORY_COLOR; // não usado
            return `
                <div class="marker-item">
                    <div class="marker-item-left">
                        <span class="marker-swatch" style="background:${escapeHtml(mk.color)};"></span>
                        <div class="marker-item-info">
                            <div class="marker-item-label">${escapeHtml(mk.label)}</div>
                            <div class="marker-item-when">${escapeHtml(when)}</div>
                        </div>
                    </div>
                    <div class="marker-item-actions">
                        <button type="button" class="marker-item-btn edit"
                                data-marker-id="${escapeHtml(mk.id)}" title="Editar">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button type="button" class="marker-item-btn delete"
                                data-marker-id="${escapeHtml(mk.id)}" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        list.querySelectorAll('.marker-item-btn.edit').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.onOpenMarker) this.onOpenMarker(null, btn.dataset.markerId);
            });
        });
        list.querySelectorAll('.marker-item-btn.delete').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!confirm('Excluir este marcador?')) return;
                StorageManager.removeDayMarkerById(btn.dataset.markerId);
                this.renderMarkersList();
                if (this.onSettingsChanged) this.onSettingsChanged(StorageManager.getSettings());
            });
        });
    }

    open() {
        const settings = StorageManager.getSettings();
        this.modal.querySelector('#setting-dark-mode').checked = settings.darkMode;
        this.modal.querySelector('#setting-primary-color').value = settings.primaryColor;
        this.modal.querySelector('#setting-title-color').value = settings.titleColor;
        this.modal.querySelector('#setting-start-week').value = settings.startOfWeek;
        this.modal.querySelector('#setting-pdf-orientation').value = settings.pdfOrientation;
        this.modal.querySelector('#setting-pdf-font-size').value = settings.pdfFontSize;
        this.renderCategoryList();
        this.renderMarkersList();
        this.modal.style.display = 'flex';
    }

    close() { this.modal.style.display = 'none'; }

    saveSettings() {
        const current = StorageManager.getSettings();
        const newSettings = {
            ...current,
            darkMode: this.modal.querySelector('#setting-dark-mode').checked,
            primaryColor: this.modal.querySelector('#setting-primary-color').value,
            titleColor: this.modal.querySelector('#setting-title-color').value,
            startOfWeek: parseInt(this.modal.querySelector('#setting-start-week').value, 10),
            pdfOrientation: this.modal.querySelector('#setting-pdf-orientation').value,
            pdfFontSize: this.modal.querySelector('#setting-pdf-font-size').value
        };
        StorageManager.saveSettings(newSettings);

        document.body.classList.toggle('dark-mode', !!newSettings.darkMode);
        document.documentElement.style.setProperty('--cor-principal', newSettings.primaryColor);
        document.documentElement.style.setProperty('--cor-titulo', newSettings.titleColor);

        if (this.onSettingsChanged) this.onSettingsChanged(newSettings);
        this.close();
    }
}
