# Flora Planner

Uma aplicação web desenvolvida para otimizar o planejamento pessoal e profissional. O Flora Planner integra a gestão de tarefas com uma visualização de calendário intuitiva, permitindo organizar rotinas, acompanhar compromissos e exportar os planejamentos com facilidade.

## Funcionalidades

### Visualização e Organização
* **Múltiplas visualizações de calendário:** Mensal, Semanal e Anual, com navegação intuitiva entre períodos.
* **Destaque do dia atual:** O dia de hoje é realçado em rosa, tanto na visão mensal quanto na semanal.
* **Gerenciamento completo de tarefas:** Crie, edite, duplique e exclua tarefas com título, data, horário, prioridade, categoria e status de conclusão.
* **Painel de anotações (Post-it):** Bloco de notas amarelo ao lado do formulário, com ferramentas de checklist e formatação.
* **Prioridades:** Baixa, Média, Alta e Urgente para classificar suas tarefas.

### Categorias Personalizadas
* **Categorias com cores próprias:** Cada categoria tem uma cor editável que é aplicada automaticamente nos badges do calendário, blocos da visão semanal e gráficos de relatório.
* **Criação rápida:** Adicione novas categorias diretamente pelo formulário de tarefa (opção "+ Nova categoria...") ou pelo painel de configurações.
* **Gerenciamento completo:** Adicione, remova e recolora categorias em **Configurações → Categorias**, com contagem de tarefas por categoria.

### Relatórios e Métricas
* **Painel de produtividade:** Total de tarefas cadastradas e taxa de conclusão.
* **Gráfico por categoria:** Gráfico de rosca (Chart.js) que usa as cores configuradas para cada categoria.

### Exportação e Impressão
* **Exportação para PDF:** Gera o planejamento mensal em formato de grade de calendário pronta para impressão (A4, retrato ou paisagem).
* **Exportação para PNG:** Exporta o mês como imagem de alta resolução (2×) usando Canvas — ideal para compartilhar em redes sociais ou mensageiros.
* **Escolha da pasta de destino:** Em navegadores compatíveis (Chrome/Edge recentes), o diálogo "Salvar como" permite escolher a pasta; caso contrário, o download segue para a pasta padrão.

### Armazenamento e Backup
* **Armazenamento local:** Seus dados ficam salvos no próprio navegador (Local Storage), sem necessidade de contas ou servidores externos.
* **Backup em JSON:** Exporta todas as tarefas e configurações em um arquivo `.json` — com escolha da pasta de destino.
* **Restauração de backup:** Carregue um arquivo `.json` para restaurar todo o planejamento em outro computador ou após limpar o navegador.
* **Migração automática:** Backups e dados antigos são convertidos automaticamente para o formato atual sem perda de informações.

### Personalização
* **Tema claro e escuro:** Alterne entre os temas com um clique.
* **Cores personalizáveis:** Defina a cor principal de destaque e a cor dos títulos.
* **Preferências de PDF:** Orientação da página e tamanho da fonte.
* **Som de clique:** Feedback sonoro sutil (estilo 8-bit) ao interagir com botões.

### Onboarding
* **Tutorial integrado:** Guia passo a passo acessível pelo menu lateral, ideal para o primeiro uso.

---

## Tecnologias Utilizadas

O projeto foi construído utilizando tecnologias web padrão, mantendo a leveza e a independência de frameworks complexos:

* **HTML5:** Estrutura da interface.
* **CSS3:** Estilização modular com variáveis CSS e suporte a temas (claro/escuro).
* **JavaScript (Vanilla):** Lógica de negócios organizada em classes globais carregadas na ordem correta pelo `index.html`.
* **Chart.js:** Gráfico de rosca na tela de Relatórios.
* **Font Awesome:** Ícones da interface.
* **Canvas API:** Geração das imagens PNG exportadas.
* **File System Access API:** Escolha da pasta de destino ao salvar arquivos (com fallback automático).

> **Nota sobre arquitetura:** Os arquivos em `/src` **não usam** `import`/`export` ES6 de propósito. Todas as classes são carregadas como scripts globais comuns na ordem correta. Isso permite abrir o `index.html` diretamente no navegador (`file://`) sem erros de CORS, sem depender de um servidor local.

---

## Estrutura do Projeto

```text
Flora-Planner/
├── index.html                 # Ponto de entrada e estrutura principal
├── README.md
└── src/
    ├── main.js                # Inicialização, som de clique e orquestração
    ├── calendar/
    │   └── CalendarView.js    # Renderização do calendário e relatórios
    ├── components/
    │   ├── SettingsModal.js   # Modal de configurações (com gestão de categorias)
    │   ├── SidebarMenu.js     # Menu lateral (hamburguer)
    │   └── TutorialModal.js   # Tutorial "Modo de Uso"
    ├── pdf/
    │   └── PdfExporter.js     # Exportação em PDF (impressão) e PNG (canvas)
    ├── planning/
    │   └── TaskManager.js     # CRUD de tarefas e painel Post-it
    ├── storage/
    │   └── StorageManager.js  # Persistência, categorias e salvamento de arquivos
    └── styles/
        └── theme.css          # Variáveis, temas e estilos globais
```

---

## Como Executar o Projeto

### Opção 1 — Servidor local (recomendado)

1. Faça o clone do repositório ou baixe o código-fonte.
2. Extraia os arquivos para um diretório local.
3. Abra a pasta no **Visual Studio Code** e instale a extensão **Live Server**.
4. Clique com o botão direito no `index.html` → **Open with Live Server**.
5. Acesse `http://127.0.0.1:5500` no navegador.

### Opção 2 — Abrir direto no navegador

Como os scripts **não usam ES Modules**, você pode simplesmente dar **duplo clique no `index.html`**. A aplicação funciona 100% via `file://`.

Para a melhor experiência (escolha de pasta ao salvar arquivos), recomendamos **Chrome**, **Edge** ou **Opera** atualizados.

---

## Atalhos e Fluxos Rápidos

| Ação | Como fazer |
|---|---|
| Criar tarefa | Clique em qualquer dia do calendário ou em **+ Nova Tarefa** |
| Criar nova categoria | No formulário, escolha **+ Nova categoria...** no seletor |
| Recolorir categoria | **☰ → Configurações → Categorias** → clique no quadradinho colorido |
| Exportar PDF | **☰ → Exportar / Imprimir PDF** |
| Exportar PNG | **☰ → Exportar Imagem (PNG)** |
| Fazer backup | **☰ → Fazer Backup (.json)** |
| Restaurar backup | **☰ → Restaurar Backup** |
| Alternar tema | **☰ → Configurações → Interface** |
| Ver tutorial | **☰ → Modo de Uso** |

---

## Compatibilidade

| Recurso | Chrome/Edge | Firefox | Safari |
|---|:---:|:---:|:---:|
| Aplicação completa | ✅ | ✅ | ✅ |
| Escolha de pasta ao salvar (File System Access API) | ✅ | ⚠️ download padrão | ⚠️ download padrão |
| Exportação PNG | ✅ | ✅ | ✅ |
| Chart.js | ✅ | ✅ | ✅ |

---

## Como Contribuir

Contribuições são bem-vindas para correção de bugs, adição de novas funcionalidades ou melhorias na interface:

1. Faça um **Fork** do projeto.
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
5. Abra um **Pull Request** para revisão.

### Ideias para futuras contribuições
- Exportação para CSV / iCal (.ics)
- Lembretes e notificações do navegador
- Tarefas recorrentes
- Filtros por categoria/prioridade no calendário
- Sincronização opcional em nuvem

---

## Histórico de Versões

### v2.4
- ✨ **Categorias com cores personalizáveis** — cada categoria tem cor própria, editável em Configurações.
- ✨ **Dia atual destacado em rosa** nas visões mensal e semanal.
- ✨ **Badges coloridos por categoria** (substituindo a coloração por prioridade).
- ✨ **Migração automática** de categorias antigas (lista de strings → objetos `{ name, color }`).
- 🎨 Gráfico de relatórios agora usa as cores configuradas das categorias.

### v2.3
- ✨ Exportação em **PNG** de alta resolução.
- ✨ **Escolha da pasta de destino** ao salvar backup/PNG (File System Access API).
- ✨ **Categorias personalizadas** com criação direta no formulário.
- ✨ Botão **Duplicar** tarefa.
- ✨ Nova aba **Categorias** no modal de configurações.

### v2.2
- Refatoração modular dos scripts (sem ES Modules, compatível com `file://`).
- Painel Post-it de anotações.
- Backend de backup/restauração em JSON.
- Som de clique 8-bit.

---

## Licença

Este projeto é de uso livre para fins pessoais e educacionais.

---

Desenvolvido para simplificar e organizar sua rotina de planejamento. 🌿

*Criado por **Brunyiz** com Inteligência Artificial.*
