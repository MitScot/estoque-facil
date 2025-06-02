// Este console.log é para verificar se o script está sendo carregado e executado.
console.log("Script EstoqueFácil carregado com sucesso!");

// --- Variáveis Globais (Simulação de Banco de Dados) ---
// ATENÇÃO: Estes dados são armazenados no localStorage do navegador e NÃO SÃO SEGUROS para produção.
// São usados apenas para simular um sistema de autenticação e persistência de dados.

let users = JSON.parse(localStorage.getItem("users")) || []; // Usuários registrados
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null; // Usuário logado

// Garante que o usuário admin padrão exista e que o localStorage seja redefinido se necessário
function initializeDefaultUsers() {
    const adminExists = users.some(u => u.email === "admin@estoquefacil.com" && u.role === "admin");
    if (!adminExists || users.length === 0) { // Se admin não existe ou se a lista de usuários está vazia
        users = [
            { email: "admin@estoquefacil.com", password: "admin123", role: "admin" },
            { email: "funcionario@estoquefacil.com", password: "func123", role: "employee" }
        ];
        localStorage.setItem("users", JSON.stringify(users)); // Salva os usuários padrão
        console.log("Usuários padrão reinicializados no localStorage.");
    }
}

// Chamar a função de inicialização de usuários no carregamento do script
initializeDefaultUsers();


let catalogo = JSON.parse(localStorage.getItem("catalogo")) || [
    // Itens iniciais do catálogo
    { sku: "NOTE-001", nome: "Notebook Dell Inspiron", quantidade: 15, lastUpdated: new Date().toLocaleString('pt-BR'), updatedBy: "sistema@exemplo.com" },
    { sku: "MON-002", nome: "Monitor Samsung 24'", quantidade: 20, lastUpdated: new Date().toLocaleString('pt-BR'), updatedBy: "sistema@exemplo.com" },
    { sku: "TECL-003", nome: "Teclado Mecânico HyperX", quantidade: 30, lastUpdated: new Date().toLocaleString('pt-BR'), updatedBy: "sistema@exemplo.com" },
    { sku: "MOUSE-004", nome: "Mouse Logitech G203", quantidade: 40, lastUpdated: new Date().toLocaleString('pt-BR'), updatedBy: "sistema@exemplo.com" },
    { sku: "IMP-005", nome: "Impressora HP Laser", quantidade: 5, lastUpdated: new Date().toLocaleString('pt-BR'), updatedBy: "sistema@exemplo.com" },
    { sku: "CAN-006", nome: "Caneta Esferográfica Bic", quantidade: 200, lastUpdated: new Date().toLocaleString('pt-BR'), updatedBy: "sistema@exemplo.com" },
    { sku: "PAP-007", nome: "Resma Papel A4", quantidade: 150, lastUpdated: new Date().toLocaleString('pt-BR'), updatedBy: "sistema@exemplo.com" },
    { sku: "CLI-008", nome: "Clipes de Papel Cx", quantidade: 80, lastUpdated: new Date().toLocaleString('pt-BR'), updatedBy: "sistema@exemplo.com" },
    { sku: "COL-009", nome: "Cola Bastão Pritt", quantidade: 70, lastUpdated: new Date().toLocaleString('pt-BR'), updatedBy: "sistema@exemplo.com" },
    { sku: "REG-010", nome: "Régua Acrílica 30cm", quantidade: 60, lastUpdated: new Date().toLocaleString('pt-BR'), updatedBy: "sistema@exemplo.com" }
];
let movimentos = JSON.parse(localStorage.getItem("movimentos")) || []; // Histórico de movimentações
let feedbacks = JSON.parse(localStorage.getItem("feedbacks")) || []; // Feedbacks dos usuários

let isRegisterMode = false; // Controla se a tela de auth está em modo registro
let estoqueChartInstance = null; // Referência à instância do gráfico Chart.js
const LOW_STOCK_THRESHOLD = 10; // Limite para considerar estoque baixo

// --- Funções de Persistência de Dados ---
/**
 * Salva todos os dados relevantes no localStorage.
 */
function saveData() {
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    localStorage.setItem("catalogo", JSON.stringify(catalogo));
    localStorage.setItem("movimentos", JSON.stringify(movimentos));
    localStorage.setItem("feedbacks", JSON.stringify(feedbacks)); // Salva os feedbacks
}

// --- Funções de Autenticação (Simuladas) ---

/**
 * Alterna entre o modo de Login e Registro na tela de autenticação.
 */
function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    document.getElementById("auth-title").innerText = isRegisterMode ? "Registrar" : "Login";
    document.getElementById("auth-button").innerText = isRegisterMode ? "Registrar" : "Entrar";
    document.getElementById("toggle-auth-mode").innerText = isRegisterMode ? "Já tem uma conta? Faça login" : "Não tem uma conta? Registre-se";
    document.getElementById("auth-message").innerText = ""; // Limpa mensagens
}

/**
 * Lida com o login ou registro de usuários.
 */
async function handleAuth() {
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value.trim();
    const authMessage = document.getElementById("auth-message");

    authMessage.innerText = ""; // Limpa mensagens anteriores

    if (!email || !password) {
        authMessage.innerText = "Por favor, preencha e-mail e senha.";
        return;
    }

    if (isRegisterMode) {
        // Tenta registrar
        if (users.some(u => u.email === email)) {
            authMessage.innerText = "Este e-mail já está registrado.";
            return;
        }
        // Simula registro: novo usuário é funcionário por padrão
        users.push({ email: email, password: password, role: "employee" });
        currentUser = { email: email, role: "employee" };
        saveData();
        authMessage.innerText = "Registro bem-sucedido! Você está logado.";
        await showCustomAlert("Sucesso!", "Registro bem-sucedido! Você está logado como funcionário.");
        showDashboard();
    } else {
        // Tenta fazer login
        const userFound = users.find(u => u.email === email && u.password === password);
        if (userFound) {
            currentUser = userFound;
            saveData();
            authMessage.innerText = "Login bem-sucedido!";
            await showCustomAlert("Sucesso!", `Login bem-sucedido! Bem-vindo, ${currentUser.email}.`);
            showDashboard();
        } else {
            authMessage.innerText = "E-mail ou senha incorretos.";
        }
    }
}

/**
 * Realiza o logout do usuário.
 */
async function handleLogout() {
    const confirm = await showCustomConfirm("Confirmar Saída", "Deseja realmente sair da sua conta?");
    if (confirm) {
        currentUser = null;
        saveData();
        document.getElementById("auth-screen").classList.remove("oculto");
        document.getElementById("main-dashboard").classList.add("oculto");
        document.getElementById("auth-email").value = "";
        document.getElementById("auth-password").value = "";
        document.getElementById("auth-message").innerText = "";
        isRegisterMode = false; // Volta para o modo login
        toggleAuthMode(); // Reseta o texto do botão
        await showCustomAlert("Sessão Encerrada", "Você foi desconectado com sucesso.");
    }
}

/**
 * Exibe o dashboard apropriado (Admin ou Funcionário) após o login.
 */
function showDashboard() {
    document.getElementById("auth-screen").classList.add("oculto");
    document.getElementById("main-dashboard").classList.remove("oculto");
    // Ajustado para exibir "Ajustes" para o papel de administrador
    const userRoleDisplay = currentUser.role === 'admin' ? 'Ajustes' : 'Funcionário';
    document.getElementById("user-info").innerText = `Olá, ${currentUser.email} (${userRoleDisplay})`;
    console.log(`Usuário logado: ${currentUser.email}, Papel: ${userRoleDisplay}`); // Adicionado para depuração

    hideAllContentSections(); // Oculta todas as seções de conteúdo

    // Controla a visibilidade do botão "Ajustes" no cabeçalho
    const ajustesButton = document.getElementById("ajustes-button");
    if (currentUser && currentUser.role === "admin") {
        ajustesButton.classList.remove("oculto");
    } else {
        ajustesButton.classList.add("oculto");
    }

    if (currentUser.role === "admin") {
        document.getElementById("admin-panel").classList.remove("oculto");
        document.getElementById("employee-panel").classList.add("oculto");
    } else {
        document.getElementById("admin-panel").classList.add("oculto");
        document.getElementById("employee-panel").classList.remove("oculto");
    }
}

/**
 * Esconde todas as seções de conteúdo (tabelas, gráficos, etc.).
 */
function hideAllContentSections() {
    document.getElementById("movimentacoes-section").classList.add("oculto");
    document.getElementById("catalogo-section").classList.add("oculto");
    document.getElementById("grafico-section").classList.add("oculto");
    document.getElementById("user-management-section").classList.add("oculto");
    document.getElementById("admin-reports-section").classList.add("oculto");
}

// --- Funções de Navegação do Dashboard ---

function showAdminCatalog() {
    hideAllContentSections();
    document.getElementById("catalogo-section").classList.remove("oculto");
    exibirCatalogo(); // Atualiza o catálogo com botões de admin
}

function showAdminReports() {
    hideAllContentSections();
    document.getElementById("admin-reports-section").classList.remove("oculto");
}

function showUserManagement() {
    hideAllContentSections();
    document.getElementById("user-management-section").classList.remove("oculto");
    exibirUsuarios(); // Carrega e exibe a lista de usuários
}

/**
 * Abre o formulário de movimentação (entrada ou saída).
 * Esta função é chamada tanto pelo painel de funcionário quanto diretamente.
 * @param {string} tipo - 'entrada' ou 'saida'.
 */
function abrirFormulario(tipo) {
    hideAllContentSections(); // Oculta outras seções antes de mostrar o formulário
    document.getElementById("formulario").style.display = "flex";
    document.getElementById("titulo-form").innerText = tipo === "entrada" ? "Registrar Entrada" : "Registrar Saída";
    document.getElementById("sku").value = '';
    document.getElementById("qtd").value = '';
    document.getElementById("email").value = currentUser ? currentUser.email : ''; // Preenche com o email do usuário logado
    // Guarda o tipo de movimento para uso posterior
    document.getElementById("formulario").dataset.tipoMovimento = tipo;
}

/**
 * Fecha o formulário de movimentação e retorna ao dashboard.
 */
function fecharFormulario() {
    document.getElementById("formulario").style.display = "none";
    showDashboard(); // Retorna ao dashboard
}

/**
 * Fecha o modal de adicionar item e retorna ao catálogo admin.
 */
function fecharAddItem() {
    document.getElementById("addItem").style.display = "none";
    showAdminCatalog(); // Volta para a tela de gerenciamento de catálogo
}

/**
 * Fecha o modal de detalhes do item.
 */
function fecharItemDetails() {
    document.getElementById("itemDetailsModal").style.display = "none";
}

/**
 * Abre o modal de feedback.
 */
function showFeedbackModal() {
    document.getElementById("feedbackModal").style.display = "flex";
    document.getElementById("feedbackText").value = ''; // Limpa o campo de texto
}

/**
 * Fecha o modal de feedback.
 */
function fecharFeedbackModal() {
    document.getElementById("feedbackModal").style.display = "none";
}

/**
 * Envia o feedback (apenas simulação).
 */
async function submitFeedback() {
    const feedbackText = document.getElementById("feedbackText").value.trim();
    if (!feedbackText) {
        await showCustomAlert("Erro", "Por favor, digite seu feedback ou sugestão.");
        return;
    }

    const confirm = await showCustomConfirm("Confirmar Feedback", "Deseja realmente enviar este feedback?");
    if (confirm) {
        feedbacks.push({
            text: feedbackText,
            user: currentUser ? currentUser.email : 'Anônimo',
            date: new Date().toLocaleString('pt-BR')
        });
        saveData();
        fecharFeedbackModal();
        await showCustomAlert("Sucesso!", "Seu feedback foi enviado com sucesso! Agradecemos sua contribuição.");
    }
}


// --- Funções Principais do Sistema ---

/**
 * Registra uma nova movimentação de estoque (entrada ou saída).
 */
async function registrarMovimentacao() {
    const sku = document.getElementById("sku").value.trim().toUpperCase();
    const qtd = parseInt(document.getElementById("qtd").value);
    const email = document.getElementById("email").value.trim();
    const tipoMovimento = document.getElementById("formulario").dataset.tipoMovimento; // Pega o tipo salvo

    if (!sku || isNaN(qtd) || qtd <= 0 || !email) {
        await showCustomAlert("Erro de Validação", "Por favor, preencha todos os campos corretamente (SKU, Quantidade e E-mail).");
        return;
    }

    const item = catalogo.find(i => i.sku === sku);
    if (!item) {
        await showCustomAlert("SKU Não Encontrado", `SKU "${sku}" não encontrado no catálogo.`);
        return;
    }

    if (tipoMovimento === "saida") {
        if (item.quantidade < qtd) {
            await showCustomAlert("Estoque Insuficiente", `Quantidade insuficiente em estoque para "${item.nome}". Disponível: ${item.quantidade}`);
            return;
        }
        const confirmacao = await showCustomConfirm("Confirmar Saída", `Deseja realmente registrar a saída de ${qtd} unidade(s) de "${item.nome}"?`);
        if (!confirmacao) return;
        item.quantidade -= qtd;
    } else if (tipoMovimento === "entrada") {
        const confirmacao = await showCustomConfirm("Confirmar Entrada", `Deseja realmente registrar a entrada de ${qtd} unidade(s) de "${item.nome}"?`);
        if (!confirmacao) return;
        item.quantidade += qtd;
    }

    // Atualiza a data e o responsável pela última atualização do item
    item.lastUpdated = new Date().toLocaleString('pt-BR');
    item.updatedBy = email;

    const tipo = tipoMovimento === "saida" ? "Saída" : "Entrada";
    const timestamp = new Date().getTime();
    movimentos.push({ tipo, sku, nome: item.nome, qtd, email, data: new Date().toLocaleString('pt-BR'), timestamp });

    saveData();
    exibirMovimentacoes();
    fecharFormulario();
    atualizarGraficoEstoque();
    await showCustomAlert("Sucesso!", `Movimentação de ${qtd} unidade(s) do item "${item.nome}" registrada com sucesso!`);
}

/**
 * Exibe as movimentações na tabela principal.
 */
function exibirMovimentacoes() {
    const tbody = document.getElementById("movimentos");
    tbody.innerHTML = "";

    const movimentosOrdenados = [...movimentos].sort((a, b) => b.timestamp - a.timestamp);

    movimentosOrdenados.forEach(m => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${m.tipo}</td>
            <td>${m.sku}</td>
            <td>${m.nome}</td>
            <td>${m.qtd}</td>
            <td>${m.data}</td>
            <td>${m.email}</td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Exibe a seção do catálogo de itens.
 * A visibilidade das ações (excluir) depende do papel do usuário.
 */
function exibirCatalogo() {
    const catalogoSection = document.getElementById("catalogo-section");
    const listaCatalogo = document.getElementById("listaCatalogo");
    listaCatalogo.innerHTML = "";

    hideAllContentSections();
    catalogoSection.classList.remove("oculto");

    // Mostra/oculta o cabeçalho "Ações"
    const catalogActionsHeader = document.getElementById("catalog-actions-header");
    if (currentUser && currentUser.role === "admin") {
        catalogActionsHeader.classList.remove("oculto");
    } else {
        catalogActionsHeader.classList.add("oculto");
    }

    // Filtra o catálogo com base na busca
    const termoBusca = document.getElementById("buscaCatalogo").value.toLowerCase();
    const catalogoFiltrado = catalogo.filter(item =>
        item.sku.toLowerCase().includes(termoBusca) ||
        item.nome.toLowerCase().includes(termoBusca)
    );

    catalogoFiltrado.forEach(item => {
        const tr = document.createElement("tr");
        if (item.quantidade <= LOW_STOCK_THRESHOLD) {
            tr.classList.add('low-stock-row');
        }
        tr.innerHTML = `
            <td>${item.sku}</td>
            <td><a href="#" onclick="showItemDetails('${item.sku}')">${item.nome}</a></td>
            <td>${item.quantidade}</td>
            <td>${item.quantidade <= LOW_STOCK_THRESHOLD ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><i class="fas fa-exclamation-triangle mr-1"></i> Baixo</span>' : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">OK</span>'}</td>
            <td>${item.lastUpdated || 'N/A'}</td>
            ${currentUser && currentUser.role === "admin" ? `
                <td>
                    <button class="action-button delete-button" onclick="deletarItem('${item.sku}')"><i class="fas fa-trash-alt"></i> Excluir</button>
                </td>
            ` : ''}
        `;
        listaCatalogo.appendChild(tr);
    });
}

/**
 * Filtra as movimentações na tabela com base no termo de busca.
 */
function filtrar() {
    const termo = document.getElementById("busca").value.toLowerCase();
    const linhas = document.querySelectorAll("#tabela tbody tr");

    linhas.forEach(linha => {
        const texto = linha.innerText.toLowerCase();
        linha.style.display = texto.includes(termo) ? "" : "none";
    });
}

/**
 * Filtra o catálogo na tabela com base no termo de busca.
 */
function filtrarCatalogo() {
    exibirCatalogo(); // Re-exibe o catálogo com o filtro aplicado
}


// --- Funções de Administrador (Ajustes) ---

/**
 * Exibe a lista de usuários e permite gerenciar papéis (APENAS AJUSTES).
 */
function exibirUsuarios() {
    const listaUsuariosTbody = document.getElementById("listaUsuarios");
    listaUsuariosTbody.innerHTML = "";

    if (!currentUser || currentUser.role !== "admin") {
        document.getElementById("user-management-section").classList.add("oculto");
        showCustomAlert("Acesso Negado", "Você não tem permissão para gerenciar usuários.");
        showDashboard();
        return;
    }

    users.forEach(user => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${user.email}</td>
            <td>${user.role === 'admin' ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Ajustes</span>' : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Funcionário</span>'}</td>
            <td>
                ${user.email !== currentUser.email ? `
                    <button class="action-button ${user.role === 'admin' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}" onclick="toggleUserRole('${user.email}')">
                        ${user.role === 'admin' ? 'Remover Ajustes' : 'Tornar Ajustes'}
                    </button>
                ` : '<span>(Você)</span>'}
            </td>
        `;
        listaUsuariosTbody.appendChild(tr);
    });
}

/**
 * Alterna o papel de um usuário (ajustes/funcionário).
 * @param {string} emailToToggle - O e-mail do usuário cujo papel será alterado.
 */
async function toggleUserRole(emailToToggle) {
    if (!currentUser || currentUser.role !== "admin") {
        await showCustomAlert("Acesso Negado", "Você não tem permissão para alterar papéis de usuário.");
        return;
    }

    const userIndex = users.findIndex(u => u.email === emailToToggle);
    if (userIndex === -1) {
        await showCustomAlert("Erro", "Usuário não encontrado.");
        return;
    }

    const userToToggle = users[userIndex];
    const newRole = userToToggle.role === "admin" ? "employee" : "admin";
    const confirmMessage = `Deseja realmente ${newRole === 'admin' ? 'tornar' : 'remover como'} Ajustes o(a) usuário(a) ${emailToToggle}?`;

    const confirm = await showCustomConfirm("Confirmar Alteração de Papel", confirmMessage);

    if (confirm) {
        users[userIndex].role = newRole;
        saveData();
        exibirUsuarios(); // Atualiza a lista de usuários
        await showCustomAlert("Sucesso!", `Papel de ${emailToToggle} alterado para ${newRole}.`);
    }
}

/**
 * Registra um novo usuário (APENAS AJUSTES).
 */
async function registerNewUser() {
    if (!currentUser || currentUser.role !== "admin") {
        await showCustomAlert("Acesso Negado", "Você não tem permissão para registrar novos usuários.");
        return;
    }

    const newUserEmail = document.getElementById("newUserEmail").value.trim();
    const newUserRole = document.getElementById("newUserRole").value;

    if (!newUserEmail || !newUserEmail.includes('@')) {
        await showCustomAlert("Erro de Validação", "Por favor, insira um e-mail válido para o novo usuário.");
        return;
    }

    if (users.some(u => u.email === newUserEmail)) {
        await showCustomAlert("Erro", "Já existe um usuário com este e-mail.");
        return;
    }

    // Gerar uma senha aleatória para o novo usuário (temporária)
    const newPassword = Math.random().toString(36).substring(2, 10);

    users.push({ email: newUserEmail, password: newPassword, role: newUserRole });
    saveData();
    exibirUsuarios(); // Atualiza a lista de usuários
    await showCustomAlert("Sucesso!", `Usuário "${newUserEmail}" (${newUserRole}) adicionado com senha temporária: "${newPassword}". Recomende que ele faça login e altere a senha.`);
    document.getElementById("newUserEmail").value = ""; // Limpa campo
}


// --- Funções de Gráfico ---

/**
 * Alterna a visibilidade da seção do gráfico de estoque.
 * Se o gráfico estiver oculto, ele é exibido e atualizado. Se estiver visível, é ocultado.
 */
function alternarGrafico() {
    const graficoSection = document.getElementById("grafico-section");
    hideAllContentSections(); // Oculta outras seções antes de mostrar o gráfico
    graficoSection.classList.remove("oculto");
    atualizarGraficoEstoque();
}

/**
 * Atualiza (ou cria) o gráfico de barras do estoque.
 * Esta função é chamada sempre que os dados do catálogo mudam ou o gráfico é exibido.
 */
function atualizarGraficoEstoque() {
    const ctx = document.getElementById('estoqueChart').getContext('2d');

    const labels = catalogo.map(item => item.nome);
    const quantidades = catalogo.map(item => item.quantidade);

    const backgroundColor = quantidades.map(q => q > LOW_STOCK_THRESHOLD ? 'rgba(0, 114, 206, 0.8)' : 'rgba(220, 53, 69, 0.8)');
    const borderColor = 'rgba(0, 0, 0, 0.1)';

    if (estoqueChartInstance) {
        estoqueChartInstance.data.labels = labels;
        estoqueChartInstance.data.datasets[0].data = quantidades;
        estoqueChartInstance.data.datasets[0].backgroundColor = backgroundColor;
        estoqueChartInstance.data.datasets[0].borderColor = borderColor;
        estoqueChartInstance.update();
    } else {
        estoqueChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Quantidade em Estoque',
                    data: quantidades,
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Estoque Atual por Item',
                        font: { size: 18 },
                        padding: 20
                    },
                    legend: {
                        display: false,
                        position: 'bottom',
                        align: 'center',
                        labels: { font: { size: 14 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) { label += ': '; }
                                label += context.parsed.y;
                                return label;
                            },
                            title: function(context) {
                                return `SKU: ${catalogo[context[0].index].sku}`;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#ddd',
                        borderWidth: 1,
                        cornerRadius: 4,
                        displayColors: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { font: { size: 14 } },
                        title: {
                            display: true,
                            text: 'Quantidade',
                            font: { size: 16 },
                            padding: 10
                        }
                    },
                    x: {
                        ticks: { font: { size: 14 } },
                        title: {
                            display: true,
                            text: 'Item',
                            font: { size: 16 },
                            padding: 10
                        }
                    }
                }
            }
        });
    }
}

// --- Função de Exportação CSV ---

/**
 * Exporta as movimentações dos últimos 7 dias para um arquivo CSV.
 */
async function exportarCSV() {
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    const movimentosRecentes = movimentos.filter(m => {
        const [dataPart, horaPart] = m.data.split(' ');
        const [dia, mes, ano] = dataPart.split('/');
        const dataMovimento = new Date(`${ano}-${mes}-${dia}T${horaPart}`);
        return dataMovimento >= seteDiasAtras;
    });

    if (movimentosRecentes.length === 0) {
        await showCustomAlert("Sem Dados", "Não há movimentações nos últimos 7 dias para exportar.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Tipo;SKU;Nome do Produto;Quantidade;Usuario;Data\n";

    movimentosRecentes.forEach(m => {
        const row = `${m.tipo};${m.sku};${m.nome};${m.qtd};${m.email};${m.data}`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "movimentacoes_7dias.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    await showCustomAlert("Sucesso!", "Relatório CSV dos últimos 7 dias gerado com sucesso!");
}

// --- Funções de Detalhes do Item ---

/**
 * Exibe um modal com os detalhes de um item específico.
 * @param {string} sku - O SKU do item a ser exibido.
 */
function showItemDetails(sku) {
    const item = catalogo.find(i => i.sku === sku);
    if (!item) {
        showCustomAlert("Erro", "Item não encontrado.");
        return;
    }

    document.getElementById("detailSKU").innerText = item.sku;
    document.getElementById("detailName").innerText = item.nome;
    document.getElementById("detailQuantity").innerText = item.quantidade;
    document.getElementById("detailLastUpdated").innerText = item.lastUpdated || 'N/A';
    document.getElementById("detailUpdatedBy").innerText = item.updatedBy || 'N/A';

    document.getElementById("itemDetailsModal").style.display = "flex";
}

// --- Funções de Alerta/Confirmação Personalizadas ---

/**
 * Exibe um modal de alerta personalizado.
 * @param {string} title - Título do alerta.
 * @param {string} message - Mensagem do alerta.
 * @returns {Promise<void>} - Retorna uma Promise que resolve quando o usuário clica em OK.
 */
function showCustomAlert(title, message) {
    return new Promise(resolve => {
        const modal = document.getElementById('customAlertModal');
        document.getElementById('customAlertTitle').innerText = title;
        document.getElementById('customAlertMessage').innerText = message;
        document.getElementById('customAlertCancelBtn').classList.add('oculto');
        
        const confirmBtn = document.getElementById('customAlertConfirmBtn');
        confirmBtn.innerText = 'OK';
        confirmBtn.onclick = () => {
            modal.style.display = 'none';
            resolve();
        };
        modal.style.display = 'flex';
    });
}

/**
 * Exibe um modal de confirmação personalizado.
 * @param {string} title - Título da confirmação.
 * @param {string} message - Mensagem da confirmação.
 * @returns {Promise<boolean>} - Retorna uma Promise que resolve com true para Confirmar ou false para Cancelar.
 */
function showCustomConfirm(title, message) {
    return new Promise(resolve => {
        const modal = document.getElementById('customAlertModal');
        document.getElementById('customAlertTitle').innerText = title;
        document.getElementById('customAlertMessage').innerText = message;
        document.getElementById('customAlertCancelBtn').classList.remove('oculto');

        const confirmBtn = document.getElementById('customAlertConfirmBtn');
        const cancelBtn = document.getElementById('customAlertCancelBtn');
        
        confirmBtn.innerText = 'Confirmar';
        cancelBtn.innerText = 'Cancelar';

        confirmBtn.onclick = () => {
            modal.style.display = 'none';
            resolve(true);
        };
        cancelBtn.onclick = () => {
            modal.style.display = 'none';
            resolve(false);
        };
        modal.style.display = 'flex';
    });
}

// --- Inicialização da Aplicação ---

/**
 * Função chamada ao carregar a página para inicializar o estado.
 */
function initializeApp() {
    // Garante que os usuários padrão estejam sempre presentes
    initializeDefaultUsers();

    // Tenta carregar o usuário atual novamente após garantir os usuários padrão
    currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

    // Se houver um usuário logado no localStorage, exibe o dashboard.
    // Caso contrário, exibe a tela de autenticação.
    if (currentUser) {
        showDashboard();
    } else {
        document.getElementById("auth-screen").classList.remove("oculto");
        document.getElementById("main-dashboard").classList.add("oculto");
    }
    exibirMovimentacoes(); // Sempre carrega as movimentações na inicialização
    // A exibição do catálogo e gráfico será feita quando o usuário clicar nos respectivos botões
}

// Garante que a função 'initializeApp' seja chamada quando a página estiver totalmente carregada
window.onload = initializeApp;

