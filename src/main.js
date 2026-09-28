/**
 * main.js
 * Ponto de entrada principal do Flora Planner
 */

document.addEventListener('DOMContentLoaded', () => {
    let tasks = StorageManager.loadTasks();
    let settings = StorageManager.loadSettings();

    // Instancia views
    const calendarView = new CalendarView(null, {
        onTaskClick: (task) => taskManager.openForEdit(task),
        onTasksUpdated: (updated) => {
            tasks = updated;
            StorageManager.saveTasks(tasks);
            calendarView.setTasks(tasks);
        },
        onNewTask: (date) => taskManager.openNew(date)
    });

    const taskManager = new TaskManager({
        onSave: (updated) => {
            tasks = updated;
            StorageManager.saveTasks(tasks);
            calendarView.setTasks(tasks);
        },
        onDelete: (updated) => {
            tasks = updated;
            StorageManager.saveTasks(tasks);
            calendarView.setTasks(tasks);
        }
    });

    // Estado inicial
    taskManager.setTasks(tasks);
    calendarView.setTasks(tasks);
    calendarView.setView(settings.view || 'month');

    // Aplica botão de view ativo
    const activateBtn = (view) => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.view-btn[data-view="${view}"]`)?.classList.add('active');
    };
    activateBtn(settings.view || 'month');

    // Trocas de view
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            activateBtn(view);
            calendarView.setView(view);
            settings.view = view;
            StorageManager.saveSettings(settings);
        });
    });

    // Navegação
    document.getElementById('btn-prev').addEventListener('click', () => navigate(-1));
    document.getElementById('btn-next').addEventListener('click', () => navigate(1));
    document.getElementById('btn-today').addEventListener('click', () => {
        calendarView.setDate(new Date());
    });

    function navigate(dir) {
        const d = new Date(calendarView.currentDate);
        switch (calendarView.currentView) {
            case 'month': d.setMonth(d.getMonth() + dir); break;
            case 'week':  d.setDate(d.getDate() + 7 * dir); break;
            case 'day':   d.setDate(d.getDate() + dir); break;
            case 'year':  d.setFullYear(d.getFullYear() + dir); break;
        }
        calendarView.setDate(d);
    }

    // Exportar PDF
    document.getElementById('btn-export-pdf').addEventListener('click', () => {
        const view = calendarView.currentView;
        const date = calendarView.currentDate;
        if (view === 'week')      PdfExporter.exportWeekly(date, tasks);
        else if (view === 'year') PdfExporter.exportYearly(date, tasks);
        else if (view === 'day')  PdfExporter.exportWeekly(date, tasks); // fallback: semana
        else                      PdfExporter.exportMonthly(date, tasks);
    });

    // Exportar PNG
    document.getElementById('btn-export-png').addEventListener('click', async () => {
        const view = calendarView.currentView;
        const map = {
            month: 'view-month',
            week:  'view-week',
            day:   'view-day',
            year:  'view-year'
        };
        const elId = map[view] || 'view-month';
        await PdfExporter.exportElementAsPng(elId, `flora-planner-${view}.png`);
    });
});

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
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
    }

    play() {
        if (!this.enabled) return;
        const ctx = this.ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        const bufferSize = ctx.sampleRate * 0.02;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, now);
        filter.Q.setValueAtTime(1.2, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.18, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

        const body = ctx.createOscillator();
        const bodyGain = ctx.createGain();
        body.type = 'sine';
        body.frequency.setValueAtTime(180, now);
        body.frequency.exponentialRampToValueAtTime(40, now + 0.015);

        bodyGain.gain.setValueAtTime(0.08, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

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
        const selector = '.btn, .toggle-btn, .sidebar-item, .notes-tool-btn, .mini-month, .task-item-badge, .time-block, .settings-tab-btn, .category-remove';
        document.addEventListener('click', (e) => {
            const target = e.target.closest(selector);
            if (target) this.play();
        }, true);

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
        const settings = StorageManager.getSettings();
        if (settings.darkMode) document.body.classList.add('dark-mode');
        document.documentElement.style.setProperty('--cor-principal', settings.primaryColor);
        document.documentElement.style.setProperty('--cor-titulo', settings.titleColor);

        this.taskManager = new TaskManager({
            onTasksUpdated: (tasks) => this.calendarView.setTasks(tasks)
        });

        this.calendarView = new CalendarView({
            containerId: 'month-grid',
            onDayClick: (dateStr) => this.taskManager.openForNew(dateStr),
            onTaskClick: (task) => this.taskManager.openForEdit(task)
        });
        this.calendarView.setTasks(this.taskManager.getTasks());

        this.settingsModal = new SettingsModal({
            onSettingsChanged: () => {
                this.calendarView.render();
            }
        });

        this.tutorialModal = new TutorialModal();

        this.sidebarMenu = new SidebarMenu({
            onNavigate: (view) => this.switchView(view),
            onOpenSettings: () => this.settingsModal.open(),
            onExportPdf: () => this.exportPdf(),
            onExportPng: () => this.exportPng(),
            onBackup: () => this.doBackup(),
            onRestore: (file) => this.doRestore(file),
            onOpenTutorial: () => this.tutorialModal.open()
        });

        this.bindHeaderControls();
        this.bindViewToggles();
        this.bindDateNavigation();

        this.clickSound.bindGlobalClicks();

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
            if (btn) btn.addEventListener('click', () => this.switchView(view));
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
            const proceed = confirm('Não há tarefas cadastradas. Deseja exportar mesmo assim?');
            if (!proceed) return;
        }
        PdfExporter.exportMonthlyCalendar(currentDate, tasks);
    }

    async exportPng() {
        const currentDate = this.calendarView.currentDate;
        const tasks = this.taskManager.getTasks();

        if (tasks.length === 0) {
            const proceed = confirm('Não há tarefas cadastradas. Deseja exportar mesmo assim?');
            if (!proceed) return;
        }
        await PdfExporter.exportMonthlyCalendarAsPng(currentDate, tasks);
    }

    /** Gera um arquivo .json com tarefas + configurações, permitindo escolher a pasta */
    async doBackup() {
        const payload = StorageManager.buildBackupPayload();
        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const dateStamp = new Date().toISOString().split('T')[0];
        const filename = `flora-planner-backup-${dateStamp}.json`;

        try {
            const result = await StorageManager.saveBlob(blob, filename, 'application/json');
            if (result.via === 'download') {
                // Feedback amigável para o fallback
                console.info('Backup enviado para a pasta de downloads padrão.');
            }
        } catch (err) {
            console.error('Erro ao salvar backup:', err);
            alert('Não foi possível salvar o backup.');
        }
    }

    doRestore(file) {
        const proceed = confirm(
            'Restaurar este backup vai SUBSTITUIR todas as tarefas e configurações atuais. Deseja continuar?'
        );
        if (!proceed) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const { tasks, settings } = StorageManager.restoreFromBackupText(reader.result);

                document.body.classList.toggle('dark-mode', !!settings.darkMode);
                document.documentElement.style.setProperty('--cor-principal', settings.primaryColor);
                document.documentElement.style.setProperty('--cor-titulo', settings.titleColor);

                this.taskManager.setTasksExternally(tasks);
                this.calendarView.render();

                alert(`Backup restaurado com sucesso! ${tasks.length} tarefa(s) carregada(s).`);
            } catch (err) {
                alert(`Não foi possível restaurar o backup: ${err.message}`);
            }
        };
        reader.onerror = () => alert('Não foi possível ler o arquivo selecionado.');
        reader.readAsText(file);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new FloraPlannerApp();
});
