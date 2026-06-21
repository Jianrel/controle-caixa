from datetime import datetime, timezone
from app.extensions import db


class Paciente(db.Model):
    __tablename__ = 'paciente'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=False)
    telefone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(150), nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    criado_em = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    atualizado_em = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                              onupdate=lambda: datetime.now(timezone.utc))

    lancamentos = db.relationship('Lancamento', back_populates='paciente', lazy='dynamic')

    def __repr__(self):
        return f'<Paciente {self.nome}>'

    @staticmethod
    def validar_cpf(cpf):
        cpf = ''.join(c for c in cpf if c.isdigit())
        if len(cpf) != 11 or cpf == cpf[0] * 11:
            return False

        for i in range(9, 11):
            soma = sum(int(cpf[j]) * ((i + 1) - j) for j in range(i))
            digito = (soma * 10 % 11) % 10
            if int(cpf[i]) != digito:
                return False
        return True

    @staticmethod
    def formatar_cpf(cpf):
        cpf = ''.join(c for c in cpf if c.isdigit())
        return f'{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:]}'
