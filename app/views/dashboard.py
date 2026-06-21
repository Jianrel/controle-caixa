from flask import Blueprint, render_template
from flask_login import login_required, current_user
from datetime import date
from sqlalchemy import func
from app.extensions import db
from app.models.lancamento import Lancamento

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/')
@login_required
def index():
    hoje = date.today()
    primeiro_dia_mes = hoje.replace(day=1)

    base_query = Lancamento.query.filter(
        Lancamento.usuario_id == current_user.id,
        Lancamento.data >= primeiro_dia_mes,
        Lancamento.data <= hoje,
    )

    total_entradas = base_query.filter(
        Lancamento.tipo == 'entrada'
    ).with_entities(func.coalesce(func.sum(Lancamento.valor), 0)).scalar()

    total_saidas = base_query.filter(
        Lancamento.tipo == 'saida'
    ).with_entities(func.coalesce(func.sum(Lancamento.valor), 0)).scalar()

    saldo = total_entradas - total_saidas

    total_lancamentos = base_query.count()

    ultimos_lancamentos = Lancamento.query.filter(
        Lancamento.usuario_id == current_user.id
    ).order_by(Lancamento.data.desc(), Lancamento.criado_em.desc()).limit(10).all()

    dados_grafico = db.session.query(
        Lancamento.data,
        Lancamento.tipo,
        func.sum(Lancamento.valor).label('total')
    ).filter(
        Lancamento.usuario_id == current_user.id,
        Lancamento.data >= primeiro_dia_mes,
        Lancamento.data <= hoje,
    ).group_by(Lancamento.data, Lancamento.tipo).order_by(Lancamento.data).all()

    datas = sorted(set(str(d.data) for d in dados_grafico))
    entradas_por_dia = {str(d.data): float(d.total) for d in dados_grafico if d.tipo == 'entrada'}
    saidas_por_dia = {str(d.data): float(d.total) for d in dados_grafico if d.tipo == 'saida'}

    grafico = {
        'labels': datas,
        'entradas': [entradas_por_dia.get(d, 0) for d in datas],
        'saidas': [saidas_por_dia.get(d, 0) for d in datas],
    }

    return render_template('dashboard/index.html',
                           total_entradas=total_entradas,
                           total_saidas=total_saidas,
                           saldo=saldo,
                           total_lancamentos=total_lancamentos,
                           ultimos_lancamentos=ultimos_lancamentos,
                           grafico=grafico,
                           mes_atual=hoje.strftime('%B/%Y'))
