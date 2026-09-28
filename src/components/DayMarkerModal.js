/**
 * DayMarkerModal.js
 * Modal para criar/editar/excluir marcadores de dia.
 * Suporta marcadores recorrentes (dias da semana + data limite).
 */

class DayMarkerModal {
    constructor({ onChange } = {}) {
        this.onChange = onChange;
        this.editingId = null;
        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.modal = document.createElement('div');
        this.modal.className = 'modal';
        this.modal.id = 'marker-modal';
        this.modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2><i class="fas fa-tag"></i> Marcador de Dia</h2>
                    <button type="button" class="close-btn" id="close-marker-modal">&times;</button>
                </div>
                <form id="marker-form">
                    <input type="hidden" id="marker-id">

                    <div class="form-group">
                        <label>Data (opcional se usar recorrência)</label>
                        <input type="date" class="form-control" id="marker-date">
                    </div>

                    <div class="form-group">
                        <label>Nome do marcador *</label>
                        <input type="text" class="form-control" id="marker-label" required
                               placeholder="Ex: Feriado, Prova, Aniversário"
                               list="marker-suggestions-list" autocomplete="off">
                        <datalist id="marker-suggestions-list"></datalist>
                        <div class="marker-suggestions-row" id="marker-suggestion-chips"></div>
                    </div>

                    <div class="form-group">
                        <label>Cor</label>
                        <div class="marker-color-row">
                            <input type="color" id="marker-color" value="#F6AD55">
                            <div class="marker-color-presets" id="marker-color-presets"></div>
                        </div>
                    </div>

                    <div class="recurrence-block">
                        <label class="checkbox-group" style="font-weight:600;">
                            <input type="checkbox" id="marker-recurring"> Repetir semanalmente
                        </label>
                        <div id="marker-recurrence-fields" style="display:none; margin-top:10px;">
                            <div class="recurrence-days">
                                <label><input type="checkbox" class="marker-rec-day" value="0"> Dom</label>
                                <label><input type="checkbox" class="marker-rec-day" value="1"> Seg</label>
                                <label><input type="checkbox" class="marker-rec-day" value="2"> Ter</label>
                                <label><input type="checkbox" class="marker-rec-day" value="3"> Qua</label>
                                <label><input type="checkbox" class="marker-rec-day" value="4"> Qui</label>
                                <label><input type="checkbox" class="marker-rec-day" value="5"> Sex</label>
                                <label><input type="checkbox" class="marker-rec-day" value="6"> Sáb</label>
                            </div>
                            <div class="form-group" style="margin-top:8px;">
                                <label style="font-size: 0.8rem;">Repetir até (opcional)</label>
                                <input type="date" class="form-control" id="marker-recurrence-until">
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; gap: 10px;">
                        <button type="button" class="btn btn-danger" id="btn-delete-marker" style="display:none;">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                        <div style="margin-left:auto; display:flex; gap:10px;">
                            <button type="button" class="btn btn-secondary" id="btn-cancel-marker">Cancelar</button>
                            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Salvar</button>
                        </div>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(this.modal);

        // Cache
        this.form = this.modal.querySelector('#marker-form');
        this.idInput = this.modal.querySelector('#marker-id');
        this.dateInput = this.modal.querySelector('#marker-date');
        this.labelInput = this.modal.querySelector('#marker-label');
        this.colorInput = this.modal.querySelector('#marker-color');
        this.recurringInput = this.modal.querySelector('#marker-recurring');
        this.recFields = this.modal.querySelector('#marker-recurrence-fields');
        this.recDays = this.modal.querySelectorAll('.marker-rec-day');
        this.recUntil = this.modal.querySelector('#marker-recurrence-until');
        this.deleteBtn = this.modal.querySelector('#btn-delete-marker');
        this.suggestionsList = this.modal.querySelector('#marker-suggestions-list');
        this.suggestionChips = this.modal.querySelector('#marker-suggestion-chips');
        this.colorPresets = this.modal.querySelector('#marker-color-presets');

        this.renderSuggestions();
        this.renderColorPresets();
    }

    renderSuggestions() {
        const suggestions = StorageManager.getMarkerSuggestions();
        this.suggestionsList.innerHTML = suggestions
            .map(s => `<option value="${this.escape(s.label)}"></option>`)
            .join('');

        this.suggestionChips.innerHTML = suggestions
            .slice(0, 8)
            .map(s => `
                <button type="button" class="suggestion-chip"
                        data-label="${this.escape(s.label)}"
                        data-color="${this.escape(s.color)}"
                        style="border-color:${s.color};">
                    <span class="chip-dot" style="background:${s.color};"></span>
                    ${this.escape(s.label)}
                </button>
            `).join('');
    }

    renderColorPresets() {
        const presets = ['#F56565','#ED8936','#F6AD55','#ED64A6','#9F7AEA',
                         '#4299E1','#38B2AC','#48BB78','#68D391','#A0AEC0'];
        this.colorPresets.innerHTML = presets.map(c => `
            <button type="button" class="color-preset" data-color="${c}"
                    style="background:${c};" title="${c}"></button>
        `).join('');
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.save();
        });

        this.modal.querySelector('#close-marker-modal').addEventListener('click', () => this.close());
        this.modal.querySelector('#btn-cancel-marker').addEventListener('click', () => this.close());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        this.recurringInput.addEventListener('change', () => {
            this.recFields.style.display = this.recurringInput.checked ? 'block' : 'none';
        });

        this.suggestionChips.addEventListener('click', (e) => {
            const chip = e.target.closest('.suggestion-chip');
            if (!chip) return;
            this.labelInput.value = chip.dataset.label;
            this.colorInput.value = chip.dataset.color;
        });

        this.colorPresets.addEventListener('click', (e) => {
            const btn = e.target.closest('.color-preset');
            if (!btn) return;
            this.colorInput.value = btn.dataset.color;
        });

        this.deleteBtn.addEventListener('click', () => {
            if (!this.editingId) return;
            if (!confirm('Excluir este marcador?')) return;
            StorageManager.removeDayMarkerById(this.editingId);
            if (this.onChange) this.onChange();
            this.close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') this.close();
        });
    }

    /** @param {{date?: string, id?: string|null}} opts */
    open({ date = null, id = null } = {}) {
        // Se recebeu só uma data e existem marcadores nela, edita o primeiro
        if (!id && date) {
            const existing = StorageManager.getDayMarkersForDate(date);
            if (existing.length > 0) id = existing[0].id;
        }

        if (id) {
            const m = StorageManager.getDayMarkers().find(x => x.id === id);
            if (m) {
                this.editingId = m.id;
                this.idInput.value = m.id;
                this.dateInput.value = m.date || '';
                this.labelInput.value = m.label;
                this.colorInput.value = m.color;

                const isRec = !!(m.recurrence && Array.isArray(m.recurrence.days) && m.recurrence.days.length > 0);
                this.recurringInput.checked = isRec;
                this.recFields.style.display = isRec ? 'block' : 'none';
                this.recDays.forEach(cb => {
                    cb.checked = isRec && m.recurrence.days.includes(parseInt(cb.value, 10));
                });
                this.recUntil.value = (isRec && m.recurrence.until) || '';

                this.deleteBtn.style.display = 'inline-flex';
            }
        } else {
            this.editingId = null;
            this.idInput.value = '';
            this.dateInput.value = date || new Date().toISOString().split('T')[0];
            this.labelInput.value = '';
            this.colorInput.value = '#F6AD55';
            this.recurringInput.checked = false;
            this.recFields.style.display = 'none';
            this.recDays.forEach(cb => { cb.checked = false; });
            this.recUntil.value = '';
            this.deleteBtn.style.display = 'none';
        }

        this.modal.style.display = 'flex';
        setTimeout(() => this.labelInput.focus(), 50);
    }

    close() {
        this.modal.style.display = 'none';
        this.editingId = null;
    }

    save() {
        const id = this.idInput.value || null;
        const date = this.dateInput.value || null;
        const label = this.labelInput.value.trim();
        const color = this.colorInput.value || '#F6AD55';
        const isRecurring = this.recurringInput.checked;
        const recDays = isRecurring
            ? Array.from(this.recDays).filter(cb => cb.checked).map(cb => parseInt(cb.value, 10))
            : [];
        const recUntil = isRecurring ? (this.recUntil.value || null) : null;

        if (!label) {
            alert('Digite um nome para o marcador.');
            return;
        }
        if (!date && recDays.length === 0) {
            alert('Escolha uma data ou marque dias da semana para a recorrência.');
            return;
        }
        if (isRecurring && recDays.length === 0) {
            alert('Marque pelo menos um dia da semana para a recorrência.');
            return;
        }

        const marker = {
            id: id || StorageManager.generateId(),
            label,
            color,
            date: date || null,
            recurrence: recDays.length > 0 ? { days: recDays, until: recUntil } : null
        };

        StorageManager.upsertDayMarker(marker);
        if (this.onChange) this.onChange();
        this.close();
    }

    escape(s) {
        return String(s ?? '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }
}
