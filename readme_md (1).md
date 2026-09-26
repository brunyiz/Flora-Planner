# Flora Planner

Uma aplicação web desenvolvida para otimizar o planejamento pessoal e profissional. O Flora Planner integra a gestão de tarefas com uma visualização de calendário intuitiva, permitindo organizar rotinas, acompanhar compromissos e exportar os planejamentos com facilidade.

## Funcionalidades

* **Visualização de Calendário:** Interface interativa para acompanhamento de datas, compromissos e prazos de forma clara.
* **Gerenciamento de Tarefas:** Crie, edite, organize e acompanhe o status de suas atividades diárias.
* **Exportação em PDF:** Gere relatórios e exporte seu planejamento em formato PDF para impressão ou compartilhamento.
* **Armazenamento Local:** Seus dados são salvos de forma segura no próprio navegador através do Local Storage, garantindo privacidade e acesso rápido sem a necessidade de contas ou banco de dados externo.
* **Personalização e Configurações:** Ajuste as preferências da aplicação e o tema visual através do modal de configurações.
* **Tutorial Integrado:** Guia passo a passo embutido na aplicação para facilitar o primeiro uso (Onboarding).

## Tecnologias Utilizadas

O projeto foi construído utilizando tecnologias web padrão com uma arquitetura baseada em módulos do JavaScript (ES6+), mantendo a leveza e a independência de frameworks externos complexos:

* **HTML5:** Estrutura da interface.
* **CSS3:** Estilização modular e temas.
* **JavaScript (Vanilla):** Lógica de negócios baseada em módulos (`import`/`export`).

## Estrutura do Projeto

A organização dos diretórios foi pensada para manter as responsabilidades separadas de forma lógica e escalável:

```text
Flora-Planner/
├── index.html                 # Ponto de entrada e estrutura principal da aplicação
├── src/
│   ├── main.js                # Arquivo principal de inicialização do JavaScript
│   ├── calendar/
│   │   └── CalendarView.js    # Lógica de renderização e interação do calendário
│   ├── components/
│   │   ├── SettingsModal.js   # Controle da janela de configurações
│   │   ├── SidebarMenu.js     # Lógica do menu de navegação lateral
│   │   └── TutorialModal.js   # Controle do tutorial para novos usuários
│   ├── pdf/
│   │   └── PdfExporter.js     # Utilitário para geração e exportação de relatórios em PDF
│   ├── planning/
│   │   └── TaskManager.js     # Regras de negócio para o gerenciamento de tarefas
│   ├── storage/
│   │   └── StorageManager.js  # Abstração para salvar e recuperar dados no navegador
│   └── styles/
│       └── theme.css          # Variáveis e regras de estilização global
```

## Como Executar o Projeto

Como o projeto é uma aplicação web estática baseada em módulos ES6, ele precisa ser executado através de um servidor web local para que as importações dos arquivos JavaScript funcionem corretamente.

1. Faça o clone do repositório ou baixe o código-fonte.
2. Extraia os arquivos para um diretório local.
3. Utilize um servidor local para abrir o projeto. Recomendamos a extensão **Live Server** para Visual Studio Code.
   * *Nota: Abrir o arquivo `index.html` diretamente no navegador (usando o protocolo `file://`) pode causar erros de CORS devido ao uso de ES Modules.*
4. Acesse a porta fornecida pelo seu servidor local (geralmente `http://127.0.0.1:5500`) no seu navegador.

## Como Contribuir

Contribuições são bem-vindas para a correção de bugs, adição de novas funcionalidades (como novos formatos de exportação) ou melhorias na interface:

1. Faça um Fork do projeto.
2. Crie uma branch para a sua modificação (`git checkout -b feature/NomeDaFuncionalidade`).
3. Realize os commits detalhando suas alterações (`git commit -m 'Adiciona exportação para CSV'`).
4. Faça o push para a sua branch (`git push origin feature/NomeDaFuncionalidade`).
5. Abra um Pull Request para revisão.

---
Desenvolvido para simplificar e organizar sua rotina de planejamento.