function renderizarLayout(paginaAtiva) {
    const navbar = document.getElementById('navbar');
    const sidebar = document.getElementById('sidebar');

    if (navbar) {
        navbar.innerHTML = `
        <nav class="navbar navbar-dark bg-primary fixed-top">
            <div class="container-fluid">
                <button class="btn btn-primary me-2 d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu">
                    <i class="bi bi-list"></i>
                </button>
                <a class="navbar-brand" href="dashboard.html">
                    <i class="bi bi-cash-stack me-2"></i>Controle de Caixa
                </a>
                <div class="d-flex align-items-center">
                    <span class="text-white me-3 d-none d-sm-inline" id="user-name">
                        <i class="bi bi-person-circle me-1"></i>
                    </span>
                    <button onclick="fazerLogout()" class="btn btn-outline-light btn-sm">
                        <i class="bi bi-box-arrow-right"></i> Sair
                    </button>
                </div>
            </div>
        </nav>`;
    }

    if (sidebar) {
        const links = [
            { href: 'dashboard.html', icon: 'bi-speedometer2', texto: 'Dashboard', id: 'dashboard' },
            { href: 'lancamentos.html', icon: 'bi-currency-dollar', texto: 'Lançamentos', id: 'lancamentos' },
            { href: 'pacientes.html', icon: 'bi-people', texto: 'Pacientes', id: 'pacientes' },
            { href: 'categorias.html', icon: 'bi-tags', texto: 'Categorias', id: 'categorias' },
            { tipo: 'separator' },
            { href: 'relatorios.html', icon: 'bi-bar-chart', texto: 'Relatórios', id: 'relatorios' },
        ];

        let html = `
        <div class="offcanvas-md offcanvas-start sidebar" tabindex="-1" id="sidebarMenu">
            <div class="offcanvas-header">
                <h5 class="offcanvas-title">Menu</h5>
                <button type="button" class="btn-close" data-bs-dismiss="offcanvas" data-bs-target="#sidebarMenu"></button>
            </div>
            <div class="offcanvas-body p-0">
                <nav class="nav flex-column sidebar-nav">`;

        links.forEach(link => {
            if (link.tipo === 'separator') {
                html += '<hr class="mx-3">';
            } else {
                const active = paginaAtiva === link.id ? 'active' : '';
                html += `<a class="nav-link ${active}" href="${link.href}">
                    <i class="bi ${link.icon} me-2"></i>${link.texto}
                </a>`;
            }
        });

        html += '</nav></div></div>';
        sidebar.innerHTML = html;
    }

    getUsuario().then(user => {
        const el = document.getElementById('user-name');
        if (el && user) {
            el.innerHTML = `<i class="bi bi-person-circle me-1"></i>${user.email}`;
        }
    });
}
