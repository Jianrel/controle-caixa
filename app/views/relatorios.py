import csv
import io
from flask import Blueprint, render_template, request, Response
from flask_login import login_required, current_user
from datetime import date
from app.models.lancamento import Lancamento
from app.services.relatorio_service import (
    resumo_periodo, dados_por_dia, dados_por_categoria,
    dados_por_forma_pagamento, get_datas_mes, get_datas_semana,
)

relatorios_bp = Blueprint('relatorios', __name__, url_prefix='/relatorios')


@relatorios_bp.route('/mensal')
@login_required
def mensal():
    hoje = date.today()
    ano = request.args.get('ano', hoje.year, type=int)
    mes = request.args.get('mes', hoje.month, type=int)

    data_inicio, data_fim = get_datas_mes(ano, mes)
    resumo = resumo_periodo(current_user.id, data_inicio, data_fim)
    grafico = dados_por_dia(current_user.id, data_inicio, data_fim)
    categorias = dados_por_categoria(current_user.id, data_inicio, data_fim)
    pagamentos = dados_por_forma_pagamento(current_user.id, data_inicio, data_fim)

    meses = [
        (1, 'Janeiro'), (2, 'Fevereiro'), (3, 'Março'), (4, 'Abril'),
        (5, 'Maio'), (6, 'Junho'), (7, 'Julho'), (8, 'Agosto'),
        (9, 'Setembro'), (10, 'Outubro'), (11, 'Novembro'), (12, 'Dezembro'),
    ]

    return render_template('relatorios/mensal.html',
                           resumo=resumo, grafico=grafico, categorias=categorias,
                           pagamentos=pagamentos, ano=ano, mes=mes, meses=meses)


@relatorios_bp.route('/semanal')
@login_required
def semanal():
    data_ref = request.args.get('data', '')
    if data_ref:
        data_referencia = date.fromisoformat(data_ref)
    else:
        data_referencia = date.today()

    data_inicio, data_fim = get_datas_semana(data_referencia)
    resumo = resumo_periodo(current_user.id, data_inicio, data_fim)
    grafico = dados_por_dia(current_user.id, data_inicio, data_fim)

    return render_template('relatorios/semanal.html',
                           resumo=resumo, grafico=grafico,
                           data_inicio=data_inicio, data_fim=data_fim)


@relatorios_bp.route('/por-categoria')
@login_required
def por_categoria():
    hoje = date.today()
    ano = request.args.get('ano', hoje.year, type=int)
    mes = request.args.get('mes', hoje.month, type=int)

    data_inicio, data_fim = get_datas_mes(ano, mes)
    categorias = dados_por_categoria(current_user.id, data_inicio, data_fim)

    meses = [
        (1, 'Janeiro'), (2, 'Fevereiro'), (3, 'Março'), (4, 'Abril'),
        (5, 'Maio'), (6, 'Junho'), (7, 'Julho'), (8, 'Agosto'),
        (9, 'Setembro'), (10, 'Outubro'), (11, 'Novembro'), (12, 'Dezembro'),
    ]

    return render_template('relatorios/por_categoria.html',
                           categorias=categorias, ano=ano, mes=mes, meses=meses)


@relatorios_bp.route('/exportar')
@login_required
def exportar():
    data_inicio = request.args.get('data_inicio', '')
    data_fim = request.args.get('data_fim', '')

    query = Lancamento.query.filter(Lancamento.usuario_id == current_user.id)
    if data_inicio:
        query = query.filter(Lancamento.data >= data_inicio)
    if data_fim:
        query = query.filter(Lancamento.data <= data_fim)

    lancamentos = query.order_by(Lancamento.data.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Forma Pagamento', 'Paciente'])

    for l in lancamentos:
        writer.writerow([
            l.data.strftime('%d/%m/%Y'),
            'Entrada' if l.tipo == 'entrada' else 'Saída',
            l.categoria.nome if l.categoria else '',
            l.descricao or '',
            f'{l.valor:.2f}'.replace('.', ','),
            l.forma_pagamento,
            l.paciente.nome if l.paciente else '',
        ])

    output.seek(0)
    return Response(
        '﻿' + output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment;filename=lancamentos.csv'},
    )
