from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required
from app.extensions import db
from app.models.categoria import Categoria
from app.forms.categoria import CategoriaForm

categorias_bp = Blueprint('categorias', __name__, url_prefix='/categorias')


@categorias_bp.route('/')
@login_required
def index():
    categorias = Categoria.query.order_by(Categoria.tipo, Categoria.nome).all()
    return render_template('categorias/index.html', categorias=categorias)


@categorias_bp.route('/nova', methods=['GET', 'POST'])
@login_required
def criar():
    form = CategoriaForm()
    if form.validate_on_submit():
        categoria = Categoria(
            nome=form.nome.data,
            tipo=form.tipo.data,
            descricao=form.descricao.data,
            cor=form.cor.data,
        )
        db.session.add(categoria)
        db.session.commit()
        flash('Categoria criada com sucesso!', 'success')
        return redirect(url_for('categorias.index'))
    return render_template('categorias/form.html', form=form, titulo='Nova Categoria')


@categorias_bp.route('/<int:id>/editar', methods=['GET', 'POST'])
@login_required
def editar(id):
    categoria = Categoria.query.get_or_404(id)
    form = CategoriaForm(obj=categoria)
    if form.validate_on_submit():
        categoria.nome = form.nome.data
        categoria.tipo = form.tipo.data
        categoria.descricao = form.descricao.data
        categoria.cor = form.cor.data
        db.session.commit()
        flash('Categoria atualizada com sucesso!', 'success')
        return redirect(url_for('categorias.index'))
    return render_template('categorias/form.html', form=form, titulo='Editar Categoria')


@categorias_bp.route('/<int:id>/excluir', methods=['POST'])
@login_required
def excluir(id):
    categoria = Categoria.query.get_or_404(id)
    if categoria.lancamentos.count() > 0:
        categoria.ativa = False
        db.session.commit()
        flash('Categoria desativada (possui lançamentos vinculados).', 'warning')
    else:
        db.session.delete(categoria)
        db.session.commit()
        flash('Categoria excluída com sucesso!', 'success')
    return redirect(url_for('categorias.index'))
