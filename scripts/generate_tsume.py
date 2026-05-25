# -*- coding: utf-8 -*-
"""詰将棋の自動生成＋検証。
ランダムに局面を作り、tsume_solver で
  ・開始局面で玉に王手がかかっていない
  ・ちょうど目標手数で詰む
  ・初手が1通り（余詰なし）
を満たすものだけを採用し、TS(lib/tsume.ts)に貼れる形で出力する。

使い方:
  python scripts/generate_tsume.py            # 既定の本数を生成
  python scripts/generate_tsume.py 3:3 5:4 7:2  # 手数:本数 を指定
"""
import sys
import random
import shogi
from tsume_solver import (
    shortest_mate,
    count_first_moves_and_pv,
    white_in_check_at_start,
)

ZEN = {1:"１",2:"２",3:"３",4:"４",5:"５",6:"６",7:"７",8:"８",9:"９"}
KAN = {0:"一",1:"二",2:"三",3:"四",4:"五",5:"六",6:"七",7:"八",8:"九"}
PJ = {
    shogi.PAWN:"歩", shogi.LANCE:"香", shogi.KNIGHT:"桂", shogi.SILVER:"銀",
    shogi.GOLD:"金", shogi.BISHOP:"角", shogi.ROOK:"飛", shogi.KING:"玉",
    shogi.PROM_PAWN:"と", shogi.PROM_LANCE:"成香", shogi.PROM_KNIGHT:"成桂",
    shogi.PROM_SILVER:"成銀", shogi.PROM_BISHOP:"馬", shogi.PROM_ROOK:"龍",
}


def sq(file, rank):
    """筋(1-9)・段(0-8, 0=一) からマス番号へ。"""
    return rank * 9 + (9 - file)


def sq_fr(s):
    return 9 - (s % 9), s // 9


def line_to_ja(start_sfen, usi_moves):
    """正解手順(USI)を ▲△ つきの日本語＋詰み上がりSFENに変換。"""
    b = shogi.Board(start_sfen)
    out = []
    prev_to = None
    for i, usi in enumerate(usi_moves):
        mv = shogi.Move.from_usi(usi)
        f, r = sq_fr(mv.to_square)
        side = "▲" if i % 2 == 0 else "△"
        loc = "同" if (prev_to is not None and mv.to_square == prev_to) else f"{ZEN[f]}{KAN[r]}"
        if mv.drop_piece_type:
            out.append(f"{side}{loc}{PJ[mv.drop_piece_type]}打")
        else:
            pt = b.piece_type_at(mv.from_square)
            out.append(f"{side}{loc}{PJ[pt]}{'成' if mv.promotion else ''}")
        b.push(mv)
        prev_to = mv.to_square
    return out, b.sfen()


# 攻め方として盤上に置く駒・持ち駒の候補
ON_BOARD = [shogi.GOLD, shogi.SILVER, shogi.KNIGHT, shogi.LANCE, shogi.BISHOP, shogi.ROOK]
IN_HAND = [shogi.GOLD, shogi.SILVER, shogi.KNIGHT, shogi.LANCE]
SYM = {shogi.GOLD:"G", shogi.SILVER:"S", shogi.KNIGHT:"N", shogi.LANCE:"L",
       shogi.BISHOP:"B", shogi.ROOK:"R", shogi.PAWN:"P"}


def random_position():
    """詰みになりやすい『端・隅に追い込まれた玉』の局面をランダム生成して SFEN を返す。"""
    # 玉方(後手)の玉：上段(一〜三)＋端寄りに置く
    wf = random.choice([1, 1, 2, 2, 3, 5, 7, 8, 9, 9])
    wr = random.choice([0, 0, 0, 1, 1, 2])
    wk = sq(wf, wr)

    board = shogi.Board()
    board.clear()
    board.set_piece_at(wk, shogi.Piece(shogi.KING, shogi.WHITE))

    # 攻め方(先手)の玉：遠くの隅に
    bk_candidates = [sq(9, 8), sq(1, 8), sq(9, 7), sq(8, 8)]
    random.shuffle(bk_candidates)
    for c in bk_candidates:
        if shogi.SQUARES and c != wk and not _adjacent(c, wk):
            board.set_piece_at(c, shogi.Piece(shogi.KING, shogi.BLACK))
            break

    # 攻め方の盤上駒 1〜3枚を玉の近く(距離1〜3)に
    n_on = random.randint(1, 3)
    used = {wk}
    used.update(s for s in range(81) if board.piece_at(s))
    placed = 0
    tries = 0
    while placed < n_on and tries < 30:
        tries += 1
        df = random.randint(-2, 2)
        dr = random.randint(0, 3)
        f = wf + df
        r = wr + dr
        if not (1 <= f <= 9 and 0 <= r <= 8):
            continue
        s = sq(f, r)
        if s in used:
            continue
        pt = random.choice(ON_BOARD)
        # 動けない＝死に駒になる位置を避ける（香は一段目、桂は一〜二段目）
        if pt == shogi.LANCE and r == 0:
            continue
        if pt == shogi.KNIGHT and r <= 1:
            continue
        promoted = False
        board.set_piece_at(s, shogi.Piece(pt, shogi.BLACK), promoted)
        used.add(s)
        placed += 1

    # 持ち駒 0〜2枚
    n_hand = random.randint(0, 2)
    hand_syms = [SYM[random.choice(IN_HAND)] for _ in range(n_hand)]

    # SFEN 組み立て
    base = board.sfen().split(" ")[0]
    hand = "".join(sorted(hand_syms)) if hand_syms else "-"
    return f"{base} b {hand} 1"


def _adjacent(a, b):
    af, ar = a % 9, a // 9
    bf, br = b % 9, b // 9
    return abs(af - bf) <= 1 and abs(ar - br) <= 1


OUT_PATH = "scripts/generated_out.txt"


def emit(idx, t, p, fh):
    ja = "', '".join(p["movesJa"])
    level = 'easy' if t <= 3 else 'normal' if t <= 5 else 'hard'
    block = (
        f"  {{\n"
        f"    id: 'gen-{idx}',\n"
        f"    tesuu: {p['tesuu']},\n"
        f"    level: '{level}',\n"
        f"    startSfen: '{p['startSfen']}',\n"
        f"    finalSfen: '{p['finalSfen']}',\n"
        f"    movesJa: ['{ja}']\n"
        f"  }},  // USI: {' '.join(p['movesUsi'])}\n"
    )
    print(block, flush=True)
    fh.write(block)
    fh.flush()


def generate(targets, max_attempts=12000):
    found = {t: 0 for t in targets}
    seen = set()
    attempts = 0
    need = sum(targets.values())
    got = 0
    idx = 1
    maxt = max(targets.keys())
    fh = open(OUT_PATH, "w", encoding="utf-8")
    while attempts < max_attempts and got < need:
        attempts += 1
        try:
            sfen = random_position()
        except Exception:
            continue
        if sfen in seen:
            continue
        seen.add(sfen)
        if white_in_check_at_start(sfen):
            continue
        try:
            b = shogi.Board(sfen)
        except Exception:
            continue
        # まず王手できる手があるか（無ければ早々に捨てる＝高速化）
        has_check = False
        for mv in b.legal_moves:
            b.push(mv)
            if b.is_check():
                has_check = True
            b.pop()
            if has_check:
                break
        if not has_check:
            continue

        m = shortest_mate(sfen, max_depth=maxt)
        if m is None or m not in targets or found[m] >= targets[m]:
            continue
        firsts, pv = count_first_moves_and_pv(sfen, m)
        if len(firsts) != 1:
            continue  # 余詰（初手が複数）は不採用
        moves_ja, final_sfen = line_to_ja(sfen, pv)
        emit(idx, m, {
            "tesuu": m, "startSfen": sfen, "finalSfen": final_sfen,
            "movesJa": moves_ja, "movesUsi": pv,
        }, fh)
        found[m] += 1
        got += 1
        idx += 1
    fh.close()
    return found, attempts, got


if __name__ == "__main__":
    random.seed(20260525)
    targets = {3: 4, 5: 5}
    if len(sys.argv) > 1:
        targets = {}
        for a in sys.argv[1:]:
            k, v = a.split(":")
            targets[int(k)] = int(v)

    found, attempts, got = generate(targets)
    print(f"# done attempts={attempts} found={got} detail={found}", flush=True)
