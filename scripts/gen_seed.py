# -*- coding: utf-8 -*-
"""動作確認用『おためし問題』の正確なデータを TS 用に出力。
表示する答えの手を指定し、開始局面で王手なし＋その手で詰む ことを確認して
start/final の SFEN と日本語表記を出す。"""
import shogi

ZEN={1:"１",2:"２",3:"３",4:"４",5:"５",6:"６",7:"７",8:"８",9:"９"}
KAN={0:"一",1:"二",2:"三",3:"四",4:"五",5:"六",6:"七",7:"八",8:"九"}
PJ={shogi.PAWN:"歩",shogi.LANCE:"香",shogi.KNIGHT:"桂",shogi.SILVER:"銀",shogi.GOLD:"金",
    shogi.BISHOP:"角",shogi.ROOK:"飛",shogi.KING:"玉",shogi.PROM_SILVER:"成銀",shogi.PROM_ROOK:"龍"}

def fr(sq): return 9-(sq%9), sq//9
def ja(board,usi):
    mv=shogi.Move.from_usi(usi); f,r=fr(mv.to_square)
    if mv.drop_piece_type: return f"▲{ZEN[f]}{KAN[r]}{PJ[mv.drop_piece_type]}打"
    return f"▲{ZEN[f]}{KAN[r]}{PJ[board.piece_type_at(mv.from_square)]}{'成' if mv.promotion else ''}"
def wcheck(b):
    for sq in range(81):
        p=b.piece_at(sq)
        if p and p.piece_type==shogi.KING and not p.color: return b.is_attacked_by(shogi.BLACK,sq)
    return False

# (id, sfen, 表示する答え(USI))
PROBS=[
 ("warm-5二金","4k4/9/3S1S3/9/9/9/9/9/K8 b G 1","G*5b"),
 ("warm-2二金","8k/9/7G1/9/9/9/9/9/K8 b G 1","G*2b"),
 ("warm-2二銀","8k/9/7S1/9/9/9/9/9/K8 b G 1","G*2b"),
]
for pid,sfen,ans in PROBS:
    b=shogi.Board(sfen)
    bad=wcheck(b)
    label=ja(b,ans)
    b.push(shogi.Move.from_usi(ans))
    print(f'{{ id:"{pid}", tesuu:1, startSfen:"{sfen}", finalSfen:"{b.sfen()}", '
          f'movesJa:["{label}"] }}  // start_check={bad} mate={b.is_checkmate()}')
