/**
 * SettingsModal.js
 * Modal de Configurações Categorizadas (Interface, Planejamento, PDF, Geral)
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
            <div class="modal-content" style="max-width: 650px;">
                <div class="modal-header">
                    <h2><i class="fas fa-sliders-h"></i> Configurações do Sistema</h2>
                    <button class="close-btn" id="close-settings-btn">&times;</button>
                </div>
                
                <!-- Abas de Categoria -->
                <div class="settings-tabs">
                    <button class="settings-tab-btn active" data-tab="tab-interface">
                        <i class="fas fa-paint-brush"></i> Interface
                    </button>
                    <button class="settings-tab-btn" data-tab="tab-planning">
                        <i class="fas fa-tasks"></i> Planejamento
                    </button>
                    <button class="settings-tab-btn" data-tab="tab-pdf">
                        <i class="fas fa-file-pdf"></i> PDF & Impressão
                    </button>
                    <button class="settings-tab-btn" data-tab="tab-general">
                        <i class="fas fa-cog"></i> Geral
                    </button>
                </div>

                <!-- Conteúdo das Abas -->
                <form id="settings-form">
                    <!-- 1. Categoria Interface -->
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

                    <!-- 2. Categoria Planejamento -->
                    <div class="settings-tab-content" id="tab-planning">
                        <div class="form-group">
                            <label>Primeiro dia da semana no calendário</label>
                            <select class="form-control" id="setting-start-week">
                                <option value="0">Domingo</option>
                                <option value="1">Segunda-feira</option>
                            </select>
                        </div>
                    </div>

                    <!-- 3. Categoria PDF & Impressão -->
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
                    </div>

                    <!-- 4. Categoria Geral -->
                    <div class="settings-tab-content" id="tab-general">
                        <p style="font-size: 0.9rem; color: var(--cor-texto-light);">
                            Configurações gerais do sistema e armazenamento local.
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
        // Alternância de Abas
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

        // Fechamento
        this.modal.querySelector('#close-settings-btn').addEventListener('click', () => this.close());
        this.modal.querySelector('#cancel-settings-btn').addEventListener('click', () => this.close());

        // Salvar
        this.modal.querySelector('#settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
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

        this.modal.style.display = 'flex';
    }

    close() {
        this.modal.style.display = 'none';
    }

    saveSettings() {
        const newSettings = {
            darkMode: document.getElementById('setting-dark-mode').checked,
            primaryColor: document.getElementById('setting-primary-color').value,
            titleColor: document.getElementById('setting-title-color').value,
            startOfWeek: parseInt(document.getElementById('setting-start-week').value),
            pdfOrientation: document.getElementById('setting-pdf-orientation').value,
            pdfFontSize: document.getElementById('setting-pdf-font-size').value
        };

        StorageManager.saveSettings(newSettings);

        // Aplica o tema imediatamente
        if (newSettings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        document.documentElement.style.setProperty('--cor-principal', newSettings.primaryColor);
        document.documentElement.style.setProperty('--cor-titulo', newSettings.titleColor);

        if (this.onSettingsChanged) this.onSettingsChanged(newSettings);

        this.close();
    }
}
