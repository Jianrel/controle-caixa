from app.extensions import db


class Categoria(db.Model):
    __tablename__ = 'categoria'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), unique=True, nullable=False)
    tipo = db.Column(db.String(10), nullable=False)  # 'entrada' ou 'saida'
    descricao = db.Column(db.String(255), nullable=True)
    ativa = db.Column(db.Boolean, default=True)
    cor = db.Column(db.String(7), default='#6c757d')

    lancamentos = db.relationship('Lancamento', back_populates='categoria', lazy='dynamic')

    def __repr__(self):
        return f'<Categoria {self.nome} ({self.tipo})>'
