from datetime import date, timedelta
from calendar import monthrange
from sqlalchemy import func
from app.extensions import db
from app.models.lancamento import Lancamento


def resumo_periodo(usuario_id, data_inicio, data_fim):
    base = Lancamento.query.filter(
        Lancamento.usuario_id == usuario_id,
        Lancamento.data >= data_inicio,
        Lancamento.data <= data_fim,
    )

    total_entradas = base.filter(
        Lancamento.tipo == 'entrada'
    ).with_entities(func.coalesce(func.sum(Lancamento.valor), 0)).scalar()

    total_saidas = base.filter(
        Lancamento.tipo == 'saida'
    ).with_entities(func.coalesce(func.sum(Lancamento.valor), 0)).scalar()

    return {
        'total_entradas': float(total_entradas),
        'total_saidas': float(total_saidas),
        'saldo': float(total_entradas - total_saidas),
        'total_lancamentos': base.count(),
    }


def dados_por_dia(usuario_id, data_inicio, data_fim):
    resultados = db.session.query(
        Lancamento.data,
        Lancamento.tipo,
        func.sum(Lancamento.valor).label('total'),
    ).filter(
        Lancamento.usuario_id == usuario_id,
        Lancamento.data >= data_inicio,
        Lancamento.data <= data_fim,
    ).group_by(Lancamento.data, Lancamento.tipo).order_by(Lancamento.data).all()

    datas = []
    dia_atual = data_inicio
    while dia_atual <= data_fim:
        datas.append(str(dia_atual))
        dia_atual += timedelta(days=1)

    entradas_map = {str(r.data): float(r.total) for r in resultados if r.tipo == 'entrada'}
    saidas_map = {str(r.data): float(r.total) for r in resultados if r.tipo == 'saida'}

    return {
        'labels': datas,
        'entradas': [entradas_map.get(d, 0) for d in datas],
        'saidas': [saidas_map.get(d, 0) for d in datas],
    }


def dados_por_categoria(usuario_id, data_inicio, data_fim):
    from app.models.categoria import Categoria

    resultados = db.session.query(
        Categoria.nome,
        Categoria.cor,
        Lancamento.tipo,
        func.sum(Lancamento.valor).label('total'),
    ).join(Categoria).filter(
        Lancamento.usuario_id == usuario_id,
        Lancamento.data >= data_inicio,
        Lancamento.data <= data_fim,
    ).group_by(Categoria.nome, Categoria.cor, Lancamento.tipo).order_by(
        Lancamento.tipo, func.sum(Lancamento.valor).desc()
    ).all()

    entradas = [{'nome': r.nome, 'cor': r.cor, 'total': float(r.total)}
                for r in resultados if r.tipo == 'entrada']
    saidas = [{'nome': r.nome, 'cor': r.cor, 'total': float(r.total)}
              for r in resultados if r.tipo == 'saida']

    return {'entradas': entradas, 'saidas': saidas}


def dados_por_forma_pagamento(usuario_id, data_inicio, data_fim):
    from app.models.lancamento import FORMAS_PAGAMENTO

    nomes = dict(FORMAS_PAGAMENTO)

    resultados = db.session.query(
        Lancamento.forma_pagamento,
        func.sum(Lancamento.valor).label('total'),
        func.count(Lancamento.id).label('quantidade'),
    ).filter(
        Lancamento.usuario_id == usuario_id,
        Lancamento.data >= data_inicio,
        Lancamento.data <= data_fim,
    ).group_by(Lancamento.forma_pagamento).order_by(
        func.sum(Lancamento.valor).desc()
    ).all()

    return [
        {
            'forma': nomes.get(r.forma_pagamento, r.forma_pagamento),
            'total': float(r.total),
            'quantidade': r.quantidade,
        }
        for r in resultados
    ]


def get_datas_mes(ano, mes):
    ultimo_dia = monthrange(ano, mes)[1]
    return date(ano, mes, 1), date(ano, mes, ultimo_dia)


def get_datas_semana(data_referencia=None):
    if data_referencia is None:
        data_referencia = date.today()
    inicio = data_referencia - timedelta(days=data_referencia.weekday())
    fim = inicio + timedelta(days=6)
    return inicio, fim
