/**
 * main.js
 * Ponto de entrada principal do Flora Planner
 * Inicializa os modulos e conecta o fluxo de controle da aplicacao.
 *
 * OBS: este arquivo (e os demais em /src) NAO usa import/export ES6.
 * Todas as classes sao carregadas como scripts globais comuns, na
 * ordem correta, diretamente pelo index.html. Isso evita o bloqueio
 * de "type=module" quando o arquivo e aberto direto no navegador
 * (file://) em vez de por um servidor local.
 */

// SOM DE CLIQUE (estilo 8-bit/"blocky")
class ClickSound {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    ensureContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return null;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    play() {
        if (!this.enabled) return;
        const ctx = this.ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // 1. TEXTURA (Ruído curto que simula o estalo de plástico/madeira)
        const bufferSize = ctx.sampleRate * 0.02; // 20 milissegundos
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Filtro Bandpass elimina as frequências estridentes e deixa só o estalo orgânico
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, now);
        filter.Q.setValueAtTime(1.2, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.18, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

        // 2. CORPO TÁTIL (Um leve "thud" grave que imita a pressão do botão)
        const body = ctx.createOscillator();
        const bodyGain = ctx.createGain();
        body.type = 'sine';
        body.frequency.setValueAtTime(180, now);
        body.frequency.exponentialRampToValueAtTime(40, now + 0.015);

        bodyGain.gain.setValueAtTime(0.08, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

        // Conexões
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        body.connect(bodyGain);
        bodyGain.connect(ctx.destination);

        noise.start(now);
        body.start(now);
        body.stop(now + 0.025);
    }

    bindGlobalClicks() {
        // Delega o clique de qualquer elemento "clicável" da interface
        const selector = '.btn, .toggle-btn, .sidebar-item, .notes-tool-btn, .mini-month, .task-item-badge, .time-block, .settings-tab-btn';
        document.addEventListener('click', (e) => {
            const target = e.target.closest(selector);
            if (target) this.play();
        }, true);

        // Primeiro clique/tecla "destrava" o áudio em navegadores que exigem interação do usuário
        const unlock = () => {
            this.ensureContext();
            document.removeEventListener('click', unlock);
            document.removeEventListener('keydown', unlock);
        };
        document.addEventListener('click', unlock, { once: true });
        document.addEventListener('keydown', unlock, { once: true });
    }
}

class FloraPlannerApp {
    constructor() {
        this.clickSound = new ClickSound();
        this.init();
    }

    init() {
        // 1. Carrega configuracoes e aplica tema
        const settings = StorageManager.getSettings();
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
        }
        document.documentElement.style.setProperty('--cor-principal', settings.primaryColor);
        document.documentElement.style.setProperty('--cor-titulo', settings.titleColor);

        // 2. Inicializa o gerenciador de tarefas (usa o modal ja existente no index.html)
        this.taskManager = new TaskManager({
            onTasksUpdated: (tasks) => this.calendarView.setTasks(tasks)
        });

        // 3. Inicializa a visualizacao do calendario
        this.calendarView = new CalendarView({
            containerId: 'month-grid',
            onDayClick: (dateStr) => this.taskManager.openForNew(dateStr),
            onTaskClick: (task) => this.taskManager.openForEdit(task)
        });
        this.calendarView.setTasks(this.taskManager.getTasks());

        // 4. Inicializa modal de configuracoes
        this.settingsModal = new SettingsModal({
            onSettingsChanged: () => {
                this.calendarView.render();
            }
        });

        // 5. Inicializa o modal de tutorial (Modo de Uso)
        this.tutorialModal = new TutorialModal();

        // 6. Inicializa o menu hamburguer
        this.sidebarMenu = new SidebarMenu({
            onNavigate: (view) => this.switchView(view),
            onOpenSettings: () => this.settingsModal.open(),
            onExportPdf: () => this.exportPdf(),
            onBackup: () => this.doBackup(),
            onRestore: (file) => this.doRestore(file),
            onOpenTutorial: () => this.tutorialModal.open()
        });

        // 7. Conecta todos os controles do cabecalho e da barra de navegacao
        this.bindHeaderControls();
        this.bindViewToggles();
        this.bindDateNavigation();

        // 8. Som de clique nos botões
        this.clickSound.bindGlobalClicks();

        // Estado inicial
        this.calendarView.setView('month');
    }

    bindHeaderControls() {
        const addTaskBtn = document.getElementById('btn-add-task');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                const dateStr = new Date().toISOString().split('T')[0];
                this.taskManager.openForNew(dateStr);
            });
        }
    }

    bindViewToggles() {
        const toggles = [
            { id: 'btn-year-view', view: 'year' },
            { id: 'btn-month-view', view: 'month' },
            { id: 'btn-week-view', view: 'week' }
        ];

        toggles.forEach(({ id, view }) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => this.switchView(view));
            }
        });
    }

    bindDateNavigation() {
        const prevBtn = document.getElementById('btn-prev-date');
        const nextBtn = document.getElementById('btn-next-date');
        const todayBtn = document.getElementById('btn-today');

        if (prevBtn) prevBtn.addEventListener('click', () => this.calendarView.navigate(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.calendarView.navigate(1));
        if (todayBtn) todayBtn.addEventListener('click', () => this.calendarView.goToToday());
    }

    switchView(view) {
        this.calendarView.setView(view);
        if (this.sidebarMenu) this.sidebarMenu.setActiveView(view);
    }

    exportPdf() {
        const currentDate = this.calendarView.currentDate;
        const tasks = this.taskManager.getTasks();

        if (tasks.length === 0) {
            const proceed = confirm('Nao ha tarefas cadastradas para este periodo. Deseja exportar mesmo assim?');
            if (!proceed) return;
        }

        PdfExporter.exportMonthlyCalendar(currentDate, tasks);
    }

    /** Gera um arquivo .json com todas as tarefas e configurações e dispara o download */
    doBackup() {
        const payload = StorageManager.buildBackupPayload();
        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const dateStamp = new Date().toISOString().split('T')[0];
        const a = document.createElement('a');
        a.href = url;
        a.download = `flora-planner-backup-${dateStamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Libera a URL temporária depois de um instante
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    /** Lê o arquivo .json escolhido pelo usuário e restaura tarefas + configurações */
    doRestore(file) {
        const proceed = confirm(
            'Restaurar este backup vai SUBSTITUIR todas as tarefas e configurações atuais. Deseja continuar?'
        );
        if (!proceed) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const { tasks, settings } = StorageManager.restoreFromBackupText(reader.result);

                // Aplica tema restaurado
                document.body.classList.toggle('dark-mode', !!settings.darkMode);
                document.documentElement.style.setProperty('--cor-principal', settings.primaryColor);
                document.documentElement.style.setProperty('--cor-titulo', settings.titleColor);

                // Atualiza tarefas em memória e a tela
                this.taskManager.setTasksExternally(tasks);
                this.calendarView.render();

                alert(`Backup restaurado com sucesso! ${tasks.length} tarefa(s) carregada(s).`);
            } catch (err) {
                alert(`Não foi possível restaurar o backup: ${err.message}`);
            }
        };
        reader.onerror = () => {
            alert('Não foi possível ler o arquivo selecionado.');
        };
        reader.readAsText(file);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new FloraPlannerApp();
});
