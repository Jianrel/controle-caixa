from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user
from datetime import date
from decimal import Decimal
from app.extensions import db
from app.models.lancamento import Lancamento
from app.models.categoria import Categoria
from app.models.paciente import Paciente
from app.forms.lancamento import LancamentoForm

lancamentos_bp = Blueprint('lancamentos', __name__, url_prefix='/lancamentos')


def _populate_form_choices(form):
    form.categoria_id.choices = [
        (c.id, c.nome) for c in Categoria.query.filter_by(ativa=True).order_by(Categoria.nome).all()
    ]
    form.paciente_id.choices = [(0, '— Nenhum —')] + [
        (p.id, f'{p.nome} ({p.cpf})') for p in Paciente.query.order_by(Paciente.nome).all()
    ]


@lancamentos_bp.route('/')
@login_required
def index():
    page = request.args.get('page', 1, type=int)
    tipo = request.args.get('tipo', '')
    categoria_id = request.args.get('categoria_id', 0, type=int)
    forma_pagamento = request.args.get('forma_pagamento', '')
    data_inicio = request.args.get('data_inicio', '')
    data_fim = request.args.get('data_fim', '')

    query = Lancamento.query.filter(Lancamento.usuario_id == current_user.id)

    if tipo:
        query = query.filter(Lancamento.tipo == tipo)
    if categoria_id:
        query = query.filter(Lancamento.categoria_id == categoria_id)
    if forma_pagamento:
        query = query.filter(Lancamento.forma_pagamento == forma_pagamento)
    if data_inicio:
        query = query.filter(Lancamento.data >= data_inicio)
    if data_fim:
        query = query.filter(Lancamento.data <= data_fim)

    lancamentos = query.order_by(
        Lancamento.data.desc(), Lancamento.criado_em.desc()
    ).paginate(page=page, per_page=20, error_out=False)

    categorias = Categoria.query.filter_by(ativa=True).order_by(Categoria.nome).all()

    from app.models.lancamento import FORMAS_PAGAMENTO

    return render_template('lancamentos/index.html',
                           lancamentos=lancamentos,
                           categorias=categorias,
                           formas_pagamento=FORMAS_PAGAMENTO,
                           filtros={
                               'tipo': tipo,
                               'categoria_id': categoria_id,
                               'forma_pagamento': forma_pagamento,
                               'data_inicio': data_inicio,
                               'data_fim': data_fim,
                           })


@lancamentos_bp.route('/novo', methods=['GET', 'POST'])
@login_required
def criar():
    form = LancamentoForm()
    _populate_form_choices(form)

    if form.validate_on_submit():
        paciente_id = form.paciente_id.data if form.paciente_id.data != 0 else None

        lancamento = Lancamento(
            tipo=form.tipo.data,
            valor=Decimal(form.valor.data),
            descricao=form.descricao.data,
            data=form.data.data,
            forma_pagamento=form.forma_pagamento.data,
            observacoes=form.observacoes.data,
            usuario_id=current_user.id,
            categoria_id=form.categoria_id.data,
            paciente_id=paciente_id,
        )
        db.session.add(lancamento)
        db.session.commit()
        flash('Lançamento criado com sucesso!', 'success')
        return redirect(url_for('lancamentos.index'))

    if request.method == 'GET':
        form.data.data = date.today()

    return render_template('lancamentos/form.html', form=form, titulo='Novo Lançamento')


@lancamentos_bp.route('/<int:id>/editar', methods=['GET', 'POST'])
@login_required
def editar(id):
    lancamento = Lancamento.query.filter_by(id=id, usuario_id=current_user.id).first_or_404()
    form = LancamentoForm(obj=lancamento)
    _populate_form_choices(form)

    if form.validate_on_submit():
        paciente_id = form.paciente_id.data if form.paciente_id.data != 0 else None

        lancamento.tipo = form.tipo.data
        lancamento.valor = Decimal(form.valor.data)
        lancamento.descricao = form.descricao.data
        lancamento.data = form.data.data
        lancamento.forma_pagamento = form.forma_pagamento.data
        lancamento.observacoes = form.observacoes.data
        lancamento.categoria_id = form.categoria_id.data
        lancamento.paciente_id = paciente_id
        db.session.commit()
        flash('Lançamento atualizado com sucesso!', 'success')
        return redirect(url_for('lancamentos.index'))

    if request.method == 'GET':
        form.valor.data = str(lancamento.valor)

    return render_template('lancamentos/form.html', form=form, titulo='Editar Lançamento')


@lancamentos_bp.route('/<int:id>/excluir', methods=['POST'])
@login_required
def excluir(id):
    lancamento = Lancamento.query.filter_by(id=id, usuario_id=current_user.id).first_or_404()
    db.session.delete(lancamento)
    db.session.commit()
    flash('Lançamento excluído com sucesso!', 'success')
    return redirect(url_for('lancamentos.index'))


@lancamentos_bp.route('/api/categorias/<tipo>')
@login_required
def categorias_por_tipo(tipo):
    categorias = Categoria.query.filter_by(tipo=tipo, ativa=True).order_by(Categoria.nome).all()
    return jsonify([{'id': c.id, 'nome': c.nome} for c in categorias])
