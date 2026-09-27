/**
 * SidebarMenu.js
 * Menu Hamburguer (☰) + Gaveta lateral de navegação
 */

class SidebarMenu {
    constructor({ onNavigate, onOpenSettings, onExportPdf, onExportPng, onBackup, onRestore, onOpenTutorial }) {
        this.onNavigate = onNavigate;
        this.onOpenSettings = onOpenSettings;
        this.onExportPdf = onExportPdf;
        this.onExportPng = onExportPng;
        this.onBackup = onBackup;
        this.onRestore = onRestore;
        this.onOpenTutorial = onOpenTutorial;
        this.isOpen = false;

        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'sidebar-overlay';
        document.body.appendChild(this.overlay);

        this.restoreInput = document.createElement('input');
        this.restoreInput.type = 'file';
        this.restoreInput.accept = '.json,application/json';
        this.restoreInput.style.display = 'none';
        document.body.appendChild(this.restoreInput);

        this.sidebar = document.createElement('aside');
        this.sidebar.className = 'sidebar-menu';
        this.sidebar.innerHTML = `
            <div class="sidebar-header">
                <h2><i class="fas fa-leaf"></i> Flora Planner</h2>
                <button class="close-btn" id="close-sidebar-btn" title="Fechar Menu">&times;</button>
            </div>
            <nav class="sidebar-nav">
                <a class="sidebar-item" data-action="reports">
                    <i class="fas fa-chart-pie"></i> Relatórios & Métricas
                </a>
                <a class="sidebar-item" data-action="settings">
                    <i class="fas fa-cog"></i> Configurações
                </a>
                <hr style="border: 0; border-top: 1px solid var(--cinza); margin: 10px 0;">
                <a class="sidebar-item" data-action="pdf">
                    <i class="fas fa-file-pdf"></i> Exportar / Imprimir PDF
                </a>
                <a class="sidebar-item" data-action="png">
                    <i class="fas fa-file-image"></i> Exportar Imagem (PNG)
                </a>
                <hr style="border: 0; border-top: 1px solid var(--cinza); margin: 10px 0;">
                <a class="sidebar-item" data-action="backup">
                    <i class="fas fa-download"></i> Fazer Backup (.json)
                </a>
                <a class="sidebar-item" data-action="restore">
                    <i class="fas fa-upload"></i> Restaurar Backup
                </a>
                <hr style="border: 0; border-top: 1px solid var(--cinza); margin: 10px 0;">
                <a class="sidebar-item" data-action="tutorial">
                    <i class="fas fa-graduation-cap"></i> Modo de Uso
                </a>
            </nav>
            <div class="sidebar-footer">
                <span>Flora Planner v2.3 &bull; Organização Intuitiva</span>
                <span class="footer-signature"><i class="fas fa-robot"></i>Criado por Brunyiz com Inteligência Artificial</span>
            </div>
        `;
        document.body.appendChild(this.sidebar);
    }

    bindEvents() {
        const hamburgerBtn = document.getElementById('hamburger-toggle-btn');
        if (hamburgerBtn) hamburgerBtn.addEventListener('click', () => this.toggle());

        this.sidebar.querySelector('#close-sidebar-btn').addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', () => this.close());

        this.sidebar.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const action = item.getAttribute('data-action');

                if (action === 'reports') {
                    this.sidebar.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                }

                this.handleAction(action);
                if (action !== 'restore') this.close();
            });
        });

        this.restoreInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            this.close();
            if (file && this.onRestore) this.onRestore(file);
            this.restoreInput.value = '';
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });
    }

    setActiveView(view) {
        const items = this.sidebar.querySelectorAll('.sidebar-item[data-action]');
        items.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-action') === view);
        });
    }

    handleAction(action) {
        switch (action) {
            case 'reports':
                if (this.onNavigate) this.onNavigate('reports');
                break;
            case 'settings':
                if (this.onOpenSettings) this.onOpenSettings();
                break;
            case 'pdf':
                if (this.onExportPdf) this.onExportPdf();
                break;
            case 'png':
                if (this.onExportPng) this.onExportPng();
                break;
            case 'backup':
                if (this.onBackup) this.onBackup();
                break;
            case 'restore':
                this.restoreInput.click();
                break;
            case 'tutorial':
                if (this.onOpenTutorial) this.onOpenTutorial();
                break;
        }
    }

    toggle() { this.isOpen ? this.close() : this.open(); }

    open() {
        this.isOpen = true;
        this.sidebar.classList.add('active');
        this.overlay.classList.add('active');
    }

    close() {
        this.isOpen = false;
        this.sidebar.classList.remove('active');
        this.overlay.classList.remove('active');
    }
}
