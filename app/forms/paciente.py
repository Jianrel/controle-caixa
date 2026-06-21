from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SubmitField
from wtforms.validators import DataRequired, Length, Email, Optional, ValidationError
from app.models.paciente import Paciente


class PacienteForm(FlaskForm):
    nome = StringField('Nome', validators=[DataRequired(), Length(max=150)])
    cpf = StringField('CPF', validators=[DataRequired(), Length(max=14)])
    telefone = StringField('Telefone', validators=[Optional(), Length(max=20)])
    email = StringField('Email', validators=[Optional(), Email(), Length(max=150)])
    observacoes = TextAreaField('Observações', validators=[Optional()])
    submit = SubmitField('Salvar')

    def validate_cpf(self, field):
        cpf = ''.join(c for c in field.data if c.isdigit())
        if not Paciente.validar_cpf(cpf):
            raise ValidationError('CPF inválido.')
