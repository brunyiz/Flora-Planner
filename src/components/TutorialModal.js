/**
 * TutorialModal.js
 * Modal simples de "Modo de Uso" com um tutorial rápido do Flora Planner.
 */

class TutorialModal {
    constructor() {
        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.modal = document.createElement('div');
        this.modal.className = 'modal';
        this.modal.id = 'tutorial-modal';
        this.modal.innerHTML = `
            <div class="modal-content" style="max-width: 620px;">
                <div class="modal-header">
                    <h2><i class="fas fa-graduation-cap"></i> Modo de Uso</h2>
                    <button class="close-btn" id="close-tutorial-btn">&times;</button>
                </div>

                <div class="tutorial-step">
                    <div class="tutorial-step-icon"><i class="fas fa-mouse-pointer"></i></div>
                    <div class="tutorial-step-text">
                        <h4>1. Criando uma tarefa</h4>
                        <p>Clique em qualquer dia do calendário ou no botão "Nova Tarefa" no topo para abrir o formulário de cadastro.</p>
                    </div>
                </div>

                <div class="tutorial-step">
                    <div class="tutorial-step-icon"><i class="fas fa-sticky-note"></i></div>
                    <div class="tutorial-step-text">
                        <h4>2. Anotações (Post-it)</h4>
                        <p>Ao lado do formulário, use o bloco amarelo de anotações para checklists e detalhes. Use os botões "Check" e "B" para formatar.</p>
                    </div>
                </div>

                <div class="tutorial-step">
                    <div class="tutorial-step-icon"><i class="fas fa-calendar-week"></i></div>
                    <div class="tutorial-step-text">
                        <h4>3. Trocando de visualização</h4>
                        <p>Use os botões Mensal/Semanal/Anual no topo para navegar entre as visões do calendário, e as setas para mudar o período.</p>
                    </div>
                </div>

                <div class="tutorial-step">
                    <div class="tutorial-step-icon"><i class="fas fa-chart-pie"></i></div>
                    <div class="tutorial-step-text">
                        <h4>4. Relatórios</h4>
                        <p>No menu (☰), acesse "Relatórios & Métricas" para ver estatísticas e o gráfico de tarefas por categoria.</p>
                    </div>
                </div>

                <div class="tutorial-step">
                    <div class="tutorial-step-icon"><i class="fas fa-file-pdf"></i></div>
                    <div class="tutorial-step-text">
                        <h4>5. Exportar / Imprimir PDF</h4>
                        <p>No menu, escolha "Exportar / Imprimir PDF" para gerar o planejamento mensal em formato de calendário, pronto para imprimir.</p>
                    </div>
                </div>

                <div class="tutorial-step">
                    <div class="tutorial-step-icon"><i class="fas fa-shield-alt"></i></div>
                    <div class="tutorial-step-text">
                        <h4>6. Backup e Restauração</h4>
                        <p>Use "Fazer Backup" para salvar um arquivo .json com todas as suas tarefas em qualquer pasta do seu computador. Use "Restaurar Backup" para carregar esse arquivo de volta quando precisar (em outro computador ou após limpar o navegador).</p>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
                    <button type="button" class="btn btn-primary" id="close-tutorial-btn-2">Entendi!</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);
    }

    bindEvents() {
        this.modal.querySelector('#close-tutorial-btn').addEventListener('click', () => this.close());
        this.modal.querySelector('#close-tutorial-btn-2').addEventListener('click', () => this.close());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
    }

    open() {
        this.modal.style.display = 'flex';
    }

    close() {
        this.modal.style.display = 'none';
    }
}
