from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required
from app.extensions import db
from app.models.paciente import Paciente
from app.forms.paciente import PacienteForm

pacientes_bp = Blueprint('pacientes', __name__, url_prefix='/pacientes')


@pacientes_bp.route('/')
@login_required
def index():
    busca = request.args.get('busca', '').strip()
    page = request.args.get('page', 1, type=int)

    query = Paciente.query
    if busca:
        filtro = f'%{busca}%'
        query = query.filter(
            db.or_(
                Paciente.nome.ilike(filtro),
                Paciente.cpf.ilike(filtro),
            )
        )

    pacientes = query.order_by(Paciente.nome).paginate(page=page, per_page=20, error_out=False)
    return render_template('pacientes/index.html', pacientes=pacientes, busca=busca)


@pacientes_bp.route('/novo', methods=['GET', 'POST'])
@login_required
def criar():
    form = PacienteForm()
    if form.validate_on_submit():
        cpf_limpo = ''.join(c for c in form.cpf.data if c.isdigit())
        cpf_formatado = Paciente.formatar_cpf(cpf_limpo)

        existente = Paciente.query.filter_by(cpf=cpf_formatado).first()
        if existente:
            flash('Já existe um paciente com este CPF.', 'danger')
            return render_template('pacientes/form.html', form=form, titulo='Novo Paciente')

        paciente = Paciente(
            nome=form.nome.data,
            cpf=cpf_formatado,
            telefone=form.telefone.data,
            email=form.email.data,
            observacoes=form.observacoes.data,
        )
        db.session.add(paciente)
        db.session.commit()
        flash('Paciente cadastrado com sucesso!', 'success')
        return redirect(url_for('pacientes.index'))
    return render_template('pacientes/form.html', form=form, titulo='Novo Paciente')


@pacientes_bp.route('/<int:id>/editar', methods=['GET', 'POST'])
@login_required
def editar(id):
    paciente = Paciente.query.get_or_404(id)
    form = PacienteForm(obj=paciente)
    if form.validate_on_submit():
        cpf_limpo = ''.join(c for c in form.cpf.data if c.isdigit())
        cpf_formatado = Paciente.formatar_cpf(cpf_limpo)

        existente = Paciente.query.filter(
            Paciente.cpf == cpf_formatado,
            Paciente.id != paciente.id,
        ).first()
        if existente:
            flash('Já existe outro paciente com este CPF.', 'danger')
            return render_template('pacientes/form.html', form=form, titulo='Editar Paciente')

        paciente.nome = form.nome.data
        paciente.cpf = cpf_formatado
        paciente.telefone = form.telefone.data
        paciente.email = form.email.data
        paciente.observacoes = form.observacoes.data
        db.session.commit()
        flash('Paciente atualizado com sucesso!', 'success')
        return redirect(url_for('pacientes.index'))
    return render_template('pacientes/form.html', form=form, titulo='Editar Paciente')


@pacientes_bp.route('/<int:id>')
@login_required
def detalhe(id):
    paciente = Paciente.query.get_or_404(id)
    page = request.args.get('page', 1, type=int)
    lancamentos = paciente.lancamentos.order_by(
        db.text('data DESC')
    ).paginate(page=page, per_page=20, error_out=False)
    return render_template('pacientes/detalhe.html', paciente=paciente, lancamentos=lancamentos)


@pacientes_bp.route('/<int:id>/excluir', methods=['POST'])
@login_required
def excluir(id):
    paciente = Paciente.query.get_or_404(id)
    if paciente.lancamentos.count() > 0:
        flash('Não é possível excluir paciente com lançamentos vinculados.', 'danger')
    else:
        db.session.delete(paciente)
        db.session.commit()
        flash('Paciente excluído com sucesso!', 'success')
    return redirect(url_for('pacientes.index'))
