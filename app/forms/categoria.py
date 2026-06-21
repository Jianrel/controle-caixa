from flask_wtf import FlaskForm
from wtforms import StringField, SelectField, SubmitField
from wtforms.validators import DataRequired, Length


class CategoriaForm(FlaskForm):
    nome = StringField('Nome', validators=[DataRequired(), Length(max=100)])
    tipo = SelectField('Tipo', choices=[
        ('entrada', 'Entrada'),
        ('saida', 'Saída'),
    ], validators=[DataRequired()])
    descricao = StringField('Descrição', validators=[Length(max=255)])
    cor = StringField('Cor', default='#6c757d')
    submit = SubmitField('Salvar')
