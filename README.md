Flora Planner

Uma aplicação web desenvolvida para otimizar o planejamento pessoal e profissional. O Flora Planner integra a gestão de tarefas com uma visualização de calendário intuitiva, permitindo organizar rotinas diárias, semanais, mensais e anuais, acompanhar compromissos recorrentes e exportar os planejamentos com facilidade.

---

Funcionalidades

Visualização e Organização

· Quatro visualizações de calendário: Mensal, Semanal, Diário e Anual, com navegação intuitiva entre períodos.
· Destaque do dia atual: O dia de hoje é realçado em rosa, tanto na visão mensal quanto na semanal.
· Visão Diária com anotações: Detalhamento completo das tarefas do dia com destaque especial para o bloco de anotações de cada tarefa.
· Reordenação por arrastar e soltar: Na visão semanal, arraste tarefas para reorganizar a ordem dentro do dia ou movê-las para outro dia. A ordem é salva automaticamente.
· Marcadores de dia: Marque datas especiais (feriados, provas, aniversários, períodos de matrícula) com nome e cor personalizados. Aparecem como faixas coloridas no mensal, no semanal e no diário. > ⚠️ Atualmente a criação/edição de marcadores só é possível na visão Diária. Melhorias planejadas — veja a seção Roadmap.
· Gerenciamento completo de tarefas: Crie, edite, duplique e exclua tarefas com título, data, horário de início e fim, prioridade, categoria, recorrência e status de conclusão.
· Painel de anotações (Post-it): Bloco de notas amarelo ao lado do formulário, com ferramentas de checklist e formatação.
· Prioridades: Baixa, Média, Alta e Urgente para classificar suas tarefas.

Tarefas Recorrentes (Rotina)

· Repetição por dias da semana: Defina tarefas fixas que se repetem em dias específicos (ex: aulas de segunda e quarta).
· Data limite de repetição: Combine os dias da semana com uma data final — ideal para semestres letivos, cursos e compromissos temporários.
· Conclusão por ocorrência: Marcar uma aula como concluída num dia específico não afeta as outras ocorrências da mesma tarefa.
· Exclusão individual ou em série: Ao excluir uma tarefa recorrente, escolha entre remover apenas aquela ocorrência ou toda a série.

Categorias Personalizadas

· Categorias com cores próprias: Cada categoria tem uma cor editável que é aplicada automaticamente nos badges do calendário, blocos da visão semanal, cartões da visão diária e gráficos de relatório.
· Criação rápida: Adicione novas categorias diretamente pelo formulário de tarefa (opção "+ Nova categoria...") ou pelo painel de configurações.
· Gerenciamento completo: Adicione, remova e recolora categorias em Configurações → Categorias, com contagem de tarefas por categoria.

Relatórios e Métricas

· Painel de produtividade: Total de tarefas cadastradas e taxa de conclusão.
· Gráfico por categoria: Gráfico de rosca (Chart.js) que usa as cores configuradas para cada categoria.

Exportação e Impressão

· Exportação para PDF por visualização:
  · Mensal: Grade de calendário A4 (retrato ou paisagem).
  · Semanal: Layout horizontal com as 7 colunas de dias e tarefas detalhadas.
  · Diário: Ficha do dia com tarefas, categorias e anotações completas — ideal para imprimir e levar.
  · Anual: 12 mini-calendários numa única página A4.
· Exportação para PNG: Todas as visualizações podem ser exportadas como imagem de alta resolução (2×).
· Escolha da pasta de destino: Em navegadores compatíveis (Chrome/Edge), o diálogo "Salvar como" permite escolher a pasta; caso contrário, o download segue para a pasta padrão.

Armazenamento e Backup

· Armazenamento local: Seus dados ficam salvos no próprio navegador (Local Storage), sem necessidade de contas ou servidores externos.
· Backup em JSON (versão 5): Exporta tarefas, configurações e marcadores de dia em um arquivo .json — com escolha da pasta de destino.
· Restauração de backup: Carregue um arquivo .json para restaurar todo o planejamento em outro computador ou após limpar o navegador.
· Migração automática: Backups das versões 3 e 4 são convertidos automaticamente para o formato atual (v5), sem perda de informações.

Personalização

· Tema claro e escuro: Alterne entre os temas com um clique.
· Cores personalizáveis: Defina a cor principal de destaque e a cor dos títulos.
· Preferências de PDF: Orientação da página e tamanho da fonte.
· Som de clique: Feedback sonoro sutil (estilo 8-bit) ao interagir com botões.

Onboarding

· Tutorial integrado: Guia passo a passo acessível pelo menu lateral, ideal para o primeiro uso.

---

🚧 Roadmap — Próximas melhorias

Esta seção lista melhorias planejadas (ainda não implementadas). Serve como guia para o desenvolvimento e como transparência sobre limitações atuais.

Marcadores de dia — tornar mais dinâmico

Hoje o sistema de marcadores é funcional mas limitado à visão Diária: só é possível criar, editar ou remover um marcador abrindo o dia específico. O plano é tornar isso muito mais ágil:

☐ Botão "Marcar dia" direto em cada célula do calendário Mensal, Semanal e Anual (provavelmente via clique com o botão direito ou um ícone no hover, para não conflitar com o clique que cria tarefa).
☐ Navegação para o Diário a partir de qualquer visualização: clicar na data do Anual (mini-calendário), no cabeçalho do dia na Semanal, ou no número do dia no Mensal leva direto para a visão Diária daquela data — com um botão explícito (ex: ícone 👁️ / "Ver dia") ao lado do número.
☐ Painel dedicado de marcadores em Configurações, permitindo ver/editar/remover todos os marcadores em uma lista (sem precisar navegar até a data).
☐ Marcadores recorrentes (ex: "todas as sextas-feiras são dia de entrega de PBL") seguindo o mesmo modelo das tarefas.
☐ Marcadores pré-definidos por país/região (feriados nacionais brasileiros) com opção de importar em lote.
☐ Sugestões automáticas ao digitar o nome do marcador (ex: "Feriado", "Prova", "Aniversário") com cores sugeridas.

Outras ideias para futuras contribuições

· Exportação para CSV / iCal (.ics)
· Lembretes e notificações do navegador
· Filtros por categoria/prioridade no calendário
· Sincronização opcional em nuvem
· Múltiplos calendários (ex: pessoal + trabalho)
· Subtarefas dentro de uma tarefa
· Estatísticas de tempo por categoria
· Atalhos de teclado (navegação entre views, criar tarefa com N, etc.)

---

Tecnologias Utilizadas

O projeto foi construído utilizando tecnologias web padrão, mantendo a leveza e a independência de frameworks complexos:

· HTML5: Estrutura da interface.
· CSS3: Estilização modular com variáveis CSS e suporte a temas (claro/escuro).
· JavaScript (Vanilla): Lógica de negócios organizada em classes globais carregadas na ordem correta pelo index.html.
· Chart.js: Gráfico de rosca na tela de Relatórios.
· SortableJS: Arrastar e soltar (drag and drop) na visão semanal.
· html2canvas: Captura das visualizações Semanal, Diário e Anual para exportação em PNG.
· Font Awesome: Ícones da interface.
· Canvas API: Geração das imagens PNG mensais (com layout dedicado).
· File System Access API: Escolha da pasta de destino ao salvar arquivos (com fallback automático).

Nota sobre arquitetura: Os arquivos em /src não usam import/export ES6 de propósito. Todas as classes são carregadas como scripts globais comuns na ordem correta. Isso permite abrir o index.html diretamente no navegador (file://) sem erros de CORS, sem depender de um servidor local.

---

Estrutura do Projeto

```text
Flora-Planner/
├── index.html                 # Ponto de entrada e estrutura principal
├── README.md
└── src/
    ├── main.js                # Inicialização, som de clique e orquestração
    ├── calendar/
    │   └── CalendarView.js    # Renderização das 4 visualizações e relatórios
    ├── components/
    │   ├── SettingsModal.js   # Modal de configurações (com gestão de categorias)
    │   ├── SidebarMenu.js     # Menu lateral (hamburguer)
    │   └── TutorialModal.js   # Tutorial "Modo de Uso"
    ├── pdf/
    │   └── PdfExporter.js     # Exportação em PDF (mensal/semanal/diário/anual) e PNG
    ├── planning/
    │   └── TaskManager.js     # CRUD de tarefas, recorrência e painel Post-it
    ├── storage/
    │   └── StorageManager.js  # Persistência, categorias, marcadores de dia e salvamento
    └── styles/
        └── theme.css          # Variáveis, temas e estilos globais
```

---

Como Executar o Projeto

Opção 1 — Servidor local (recomendado)

1. Faça o clone do repositório ou baixe o código-fonte.
2. Extraia os arquivos para um diretório local.
3. Abra a pasta no Visual Studio Code e instale a extensão Live Server.
4. Clique com o botão direito no index.html → Open with Live Server.
5. Acesse http://127.0.0.1:5500 no navegador.

Opção 2 — Abrir direto no navegador

Como os scripts não usam ES Modules, você pode simplesmente dar duplo clique no index.html. A aplicação funciona 100% via file://.

Para a melhor experiência (escolha de pasta ao salvar arquivos), recomendamos Chrome, Edge ou Opera atualizados.

---

Atalhos e Fluxos Rápidos

Ação Como fazer
Criar tarefa Clique em qualquer dia do calendário ou em + Nova Tarefa
Criar tarefa recorrente No formulário, marque os dias em Repetição e (opcionalmente) defina a data limite
Marcar uma ocorrência como concluída Abra a tarefa na visão diária e marque Concluída — só afeta aquele dia
Excluir apenas uma ocorrência Abra a tarefa, clique em Excluir e confirme com OK (só este dia)
Excluir a série inteira Abra a tarefa, clique em Excluir e cancele o primeiro aviso, confirmando o segundo
Reordenar tarefas na semana Arraste as tarefas na visão semanal para reordenar ou mover entre dias
Marcar um dia (feriado, prova) Na visão Diário, clique em 🏷️ Marcar este dia e informe nome + cor
Criar nova categoria No formulário, escolha + Nova categoria... no seletor
Recolorir categoria ☰ → Configurações → Categorias → clique no quadradinho colorido
Exportar PDF ☰ → Exportar / Imprimir PDF (respeita a visualização atual)
Exportar PNG ☰ → Exportar Imagem (PNG) (respeita a visualização atual)
Fazer backup ☰ → Fazer Backup (.json)
Restaurar backup ☰ → Restaurar Backup
Alternar tema ☰ → Configurações → Interface
Ver tutorial ☰ → Modo de Uso

---

Compatibilidade

Recurso Chrome/Edge Firefox Safari
Aplicação completa ✅ ✅ ✅
Escolha de pasta ao salvar (File System Access API) ✅ ⚠️ download padrão ⚠️ download padrão
Exportação PNG (mensal via Canvas) ✅ ✅ ✅
Exportação PNG (semanal/diário/anual via html2canvas) ✅ ✅ ✅
Drag and drop (SortableJS) ✅ ✅ ✅
Chart.js ✅ ✅ ✅

---

Como Contribuir

Contribuições são bem-vindas para correção de bugs, adição de novas funcionalidades ou melhorias na interface:

1. Faça um Fork do projeto.
2. Crie uma branch para a sua modificação:
   ```bash
   git checkout -b feature/NomeDaFuncionalidade
   ```
3. Realize os commits detalhando suas alterações:
   ```bash
   git commit -m 'Adiciona exportação para CSV'
   ```
4. Faça o push para a sua branch:
   ```bash
   git push origin feature/NomeDaFuncionalidade
   ```
5. Abra um Pull Request para revisão.

Ao propor melhorias para marcadores de dia, considere os itens da seção Roadmap — eles são as prioridades atuais do projeto.

---

Histórico de Versões

v3.0 — Organizador de Rotina Completo

· ✨ Nova visualização Diária com destaque para anotações e marcadores.
· ✨ Horário de fim nas tarefas — agora cada tarefa pode ter início e fim.
· ✨ Tarefas recorrentes com dias da semana + data limite (ideal para aulas e monitorias).
· ✨ Conclusão e exclusão por ocorrência — marcar uma aula como concluída em um dia não afeta as outras.
· ✨ Marcadores de dia (feriados, provas, períodos de matrícula) com nome e cor personalizados — por enquanto editáveis apenas na visão Diária.
· ✨ Reordenação drag and drop na visão semanal (SortableJS), persistida automaticamente.
· ✨ Exportação PDF para Semanal, Diário e Anual (antes só o Mensal).
· ✨ Exportação PNG para todas as visualizações (html2canvas para semana/dia/ano).
· ✨ Backup v5 incluindo marcadores de dia.
· 🎨 Correção de overflow no calendário mensal — agora com limite de 3 tarefas visíveis + botão "+N mais" que abre a visão diária.
· 🔄 Migração automática de backups v3 e v4 para o formato v5.

v2.4

· ✨ Categorias com cores personalizáveis — cada categoria tem cor própria, editável em Configurações.
· ✨ Dia atual destacado em rosa nas visões mensal e semanal.
· ✨ Badges coloridos por categoria (substituindo a coloração por prioridade).
· ✨ Migração automática de categorias antigas (lista de strings → objetos { name, color }).
· 🎨 Gráfico de relatórios agora usa as cores configuradas das categorias.

v2.3

· ✨ Exportação em PNG de alta resolução.
· ✨ Escolha da pasta de destino ao salvar backup/PNG (File System Access API).
· ✨ Categorias personalizadas com criação direta no formulário.
· ✨ Botão Duplicar tarefa.
· ✨ Nova aba Categorias no modal de configurações.

v2.2

· Refatoração modular dos scripts (sem ES Modules, compatível com file://).
· Painel Post-it de anotações.
· Backend de backup/restauração em JSON.
· Som de clique 8-bit.

---

Licença

Este projeto é de uso livre para fins pessoais e educacionais.

---

Desenvolvido para simplificar e organizar sua rotina de planejamento. 🌿

Criado por Brunyiz com Inteligência Artificial.
