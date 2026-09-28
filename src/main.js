/**
 * main.js
 * Ponto de entrada principal do Flora Planner.
 * v6: view Diário acessível de qualquer view, modal de marcador centralizado.
 */

class ClickSound {
    constructor() { this.ctx = null; this.enabled = true; }

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
        noise.connect(filter); filter.connect(noiseGain); noiseGain.connect(ctx.destination);
        body.connect(bodyGain); bodyGain.connect(ctx.destination);
        noise.start(now); body.start(now); body.stop(now + 0.025);
    }

    bindGlobalClicks() {
        const selector = '.btn, .toggle-btn, .sidebar-item, .notes-tool-btn, .mini-month-title-link, .task-item-badge, .week-task, .day-task-item, .settings-tab-btn, .category-remove, .day-tool, .day-number-link, .mini-month-day, .marker-item-btn, .suggestion-chip, .color-preset';
        document.addEventListener('click', (e) => {
            if (e.target.closest(selector)) this.play();
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
    constructor() { this.clickSound = new ClickSound(); this.init(); }

    init() {
        const settings = StorageManager.getSettings();
        if (settings.darkMode) document.body.classList.add('dark-mode');
        document.documentElement.style.setProperty('--cor-principal', settings.primaryColor);
        document.documentElement.style.setProperty('--cor-titulo', settings.titleColor);

        // Modal de marcador (central)
        this.markerModal = new DayMarkerModal({
            onChange: () => this.calendarView.render()
        });

        this.taskManager = new TaskManager({
            onTasksUpdated: (tasks) => this.calendarView.setTasks(tasks)
        });

        this.calendarView = new CalendarView({
            containerId: 'month-grid',
            onDayClick: (dateStr) => this.taskManager.openForNew(dateStr),
            onTaskClick: (task, instanceDate) => this.taskManager.openForEdit(task, instanceDate),
            onTasksUpdated: (tasks) => this.taskManager.saveExternal(tasks),
            onGoToDay: (dateStr) => this.calendarView.goToDay(dateStr),
            onEditMarker: (dateStr, markerId) => this.markerModal.open({ date: dateStr, id: markerId })
        });
        this.calendarView.setTasks(this.taskManager.getTasks());

        this.settingsModal = new SettingsModal({
            onSettingsChanged: () => this.calendarView.render(),
            onOpenMarker: (dateStr, markerId) => {
                // Fecha o settings, abre o modal de marcador
                this.settingsModal.close();
                setTimeout(() => this.markerModal.open({ date: dateStr, id: markerId }), 200);
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
                let dateStr;
                if (this.calendarView.currentView === 'day') {
                    dateStr = this.calendarView.formatDateStr(this.calendarView.currentDate);
                } else {
                    dateStr = new Date().toISOString().split('T')[0];
                }
                this.taskManager.openForNew(dateStr);
            });
        }
    }

    bindViewToggles() {
        [
            { id: 'btn-year-view', view: 'year' },
            { id: 'btn-month-view', view: 'month' },
            { id: 'btn-week-view', view: 'week' },
            { id: 'btn-day-view', view: 'day' }
        ].forEach(({ id, view }) => {
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
        const view = this.calendarView.currentView;
        const currentDate = this.calendarView.currentDate;
        const tasks = this.taskManager.getTasks();
        if (tasks.length === 0) {
            if (!confirm('Não há tarefas cadastradas. Deseja exportar mesmo assim?')) return;
        }
        if (view === 'week') PdfExporter.exportWeeklyCalendar(currentDate, tasks);
        else if (view === 'day') PdfExporter.exportDayCalendar(currentDate, tasks);
        else if (view === 'year') PdfExporter.exportYearlyCalendar(currentDate, tasks);
        else PdfExporter.exportMonthlyCalendar(currentDate, tasks);
    }

    async exportPng() {
        const view = this.calendarView.currentView;
        const currentDate = this.calendarView.currentDate;
        const tasks = this.taskManager.getTasks();
        if (tasks.length === 0) {
            if (!confirm('Não há tarefas cadastradas. Deseja exportar mesmo assim?')) return;
        }
        const dateStamp = this.calendarView.formatDateStr(currentDate);
        if (view === 'month') {
            await PdfExporter.exportMonthlyCalendarAsPng(currentDate, tasks);
        } else {
            const elementId = `view-${view}`;
            const filename = `flora-planner-${view}-${dateStamp}.png`;
            await PdfExporter.exportElementAsPng(elementId, filename);
        }
    }

    async doBackup() {
        const payload = StorageManager.buildBackupPayload();
        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const dateStamp = new Date().toISOString().split('T')[0];
        const filename = `flora-planner-backup-${dateStamp}.json`;
        try {
            await StorageManager.saveBlob(blob, filename, 'application/json');
        } catch (err) {
            console.error(err);
            alert('Não foi possível salvar o backup.');
        }
    }

    doRestore(file) {
        if (!confirm('Restaurar este backup vai SUBSTITUIR tudo. Continuar?')) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const { tasks, settings } = StorageManager.restoreFromBackupText(reader.result);
                document.body.classList.toggle('dark-mode', !!settings.darkMode);
                document.documentElement.style.setProperty('--cor-principal', settings.primaryColor);
                document.documentElement.style.setProperty('--cor-titulo', settings.titleColor);
                this.taskManager.setTasksExternally(tasks);
                this.calendarView.render();
                alert(`Backup restaurado! ${tasks.length} tarefa(s) carregada(s).`);
            } catch (err) {
                alert(`Erro ao restaurar: ${err.message}`);
            }
        };
        reader.onerror = () => alert('Não foi possível ler o arquivo.');
        reader.readAsText(file);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new FloraPlannerApp();
});
