from datetime import date, datetime, timezone
from app.extensions import db

FORMAS_PAGAMENTO = [
    ('dinheiro', 'Dinheiro'),
    ('pix', 'PIX'),
    ('cartao_credito', 'Cartão de Crédito'),
    ('cartao_debito', 'Cartão de Débito'),
    ('boleto', 'Boleto'),
    ('transferencia', 'Transferência Bancária'),
]


class Lancamento(db.Model):
    __tablename__ = 'lancamento'

    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(10), nullable=False)  # 'entrada' ou 'saida'
    valor = db.Column(db.Numeric(10, 2), nullable=False)
    descricao = db.Column(db.String(255), nullable=True)
    data = db.Column(db.Date, nullable=False, default=date.today)
    forma_pagamento = db.Column(db.String(30), nullable=False)
    observacoes = db.Column(db.Text, nullable=True)
    criado_em = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    atualizado_em = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                              onupdate=lambda: datetime.now(timezone.utc))

    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    categoria_id = db.Column(db.Integer, db.ForeignKey('categoria.id'), nullable=False)
    paciente_id = db.Column(db.Integer, db.ForeignKey('paciente.id'), nullable=True)

    usuario = db.relationship('Usuario', back_populates='lancamentos')
    categoria = db.relationship('Categoria', back_populates='lancamentos')
    paciente = db.relationship('Paciente', back_populates='lancamentos')

    __table_args__ = (
        db.Index('idx_lancamento_data', 'data'),
        db.Index('idx_lancamento_tipo', 'tipo'),
        db.Index('idx_lancamento_usuario', 'usuario_id'),
    )

    def __repr__(self):
        return f'<Lancamento {self.tipo} R${self.valor} em {self.data}>'
