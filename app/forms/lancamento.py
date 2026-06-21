from flask_wtf import FlaskForm
from wtforms import StringField, SelectField, TextAreaField, DateField, SubmitField
from wtforms.validators import DataRequired, Length, Optional, ValidationError
from decimal import Decimal, InvalidOperation
from app.models.lancamento import FORMAS_PAGAMENTO


class LancamentoForm(FlaskForm):
    tipo = SelectField('Tipo', choices=[
        ('entrada', 'Entrada'),
        ('saida', 'Saída'),
    ], validators=[DataRequired()])
    valor = StringField('Valor (R$)', validators=[DataRequired()])
    descricao = StringField('Descrição', validators=[Optional(), Length(max=255)])
    data = DateField('Data', validators=[DataRequired()], format='%Y-%m-%d')
    forma_pagamento = SelectField('Forma de Pagamento',
                                  choices=FORMAS_PAGAMENTO,
                                  validators=[DataRequired()])
    categoria_id = SelectField('Categoria', coerce=int, validators=[DataRequired()])
    paciente_id = SelectField('Paciente', coerce=int, validators=[Optional()])
    observacoes = TextAreaField('Observações', validators=[Optional()])
    submit = SubmitField('Salvar')

    def validate_valor(self, field):
        valor_str = field.data.replace('.', '').replace(',', '.').strip()
        valor_str = valor_str.replace('R$', '').replace(' ', '')
        try:
            valor = Decimal(valor_str)
            if valor <= 0:
                raise ValidationError('O valor deve ser maior que zero.')
            field.data = str(valor)
        except InvalidOperation:
            raise ValidationError('Valor inválido. Use o formato: 1234,56')
