import os
from flask import Flask
from config import config
from app.extensions import db, migrate, login_manager, csrf


def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    csrf.init_app(app)

    from app.views.auth import auth_bp
    from app.views.dashboard import dashboard_bp
    from app.views.lancamentos import lancamentos_bp
    from app.views.pacientes import pacientes_bp
    from app.views.categorias import categorias_bp
    from app.views.relatorios import relatorios_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(lancamentos_bp)
    app.register_blueprint(pacientes_bp)
    app.register_blueprint(categorias_bp)
    app.register_blueprint(relatorios_bp)

    @app.template_filter('moeda')
    def formato_moeda(valor):
        if valor is None:
            return 'R$ 0,00'
        return f'R$ {valor:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')

    with app.app_context():
        from app import models  # noqa: F401

    return app
