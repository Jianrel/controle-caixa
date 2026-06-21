from app import create_app
from app.extensions import db
from app.models.usuario import Usuario
from app.models.categoria import Categoria

app = create_app()

CATEGORIAS = [
    # Entradas
    ('Exame Oftalmológico', 'entrada', 'Exame de visão para CNH', '#28a745'),
    ('Exame Psicológico', 'entrada', 'Avaliação psicológica para CNH', '#17a2b8'),
    ('Exame Clínico Geral', 'entrada', 'Exame clínico para aptidão física', '#007bff'),
    ('Outros Recebimentos', 'entrada', 'Receitas diversas', '#6f42c1'),
    # Saídas
    ('Aluguel', 'saida', 'Aluguel do espaço da clínica', '#dc3545'),
    ('Salários', 'saida', 'Pagamento de funcionários', '#fd7e14'),
    ('Material de Escritório', 'saida', 'Papéis, canetas, etc', '#ffc107'),
    ('Equipamentos', 'saida', 'Equipamentos médicos e de escritório', '#e83e8c'),
    ('Impostos', 'saida', 'Tributos e taxas', '#6c757d'),
    ('Serviços (Contador, TI)', 'saida', 'Serviços terceirizados', '#20c997'),
    ('Outros Gastos', 'saida', 'Despesas diversas', '#795548'),
]

with app.app_context():
    admin = Usuario.query.filter_by(email='admin@clinica.com').first()
    if not admin:
        admin = Usuario(nome='Administrador', email='admin@clinica.com')
        admin.set_senha('admin123')
        db.session.add(admin)
        print('Usuário admin criado: admin@clinica.com / admin123')
    else:
        print('Usuário admin já existe.')

    for nome, tipo, descricao, cor in CATEGORIAS:
        existente = Categoria.query.filter_by(nome=nome).first()
        if not existente:
            cat = Categoria(nome=nome, tipo=tipo, descricao=descricao, cor=cor)
            db.session.add(cat)
            print(f'Categoria criada: {nome}')

    db.session.commit()
    print('\nSeed concluído!')
