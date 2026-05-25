# -*- coding: utf-8 -*-
"""
詰将棋の検証ツール（棋道 / 今日の名作コーナー用）

目的:
  lib/tsume.ts に登録する問題が「本当に詰むか」「何手詰か」「途中で
  逃げられない（forced）か」を機械で確認する。記憶頼みで壊れた問題を
  生徒さんに出さないための品質チェック。

使い方:
  python scripts/tsume_solver.py            # 内蔵のサンプル問題を全部検証
  （将来は tsume_data.json を読んで一括検証する形に拡張予定）

仕組み:
  python-shogi の合法手生成を使った、深さ制限つきの単純な詰将棋ソルバー。
  - 攻め方(先手)は必ず王手を続ける
  - 受け方(後手)は合法手すべてを試し、1つでも詰みを逃れられたら不詰
  - もっとも短い詰み手数を返す
"""

import shogi


def attacker_node(board, depth):
    """先手(攻め方)の手番。depth=残り手数(奇数)。最短詰み手数を返す。詰まなければ None。"""
    best = None
    for move in list(board.legal_moves):
        board.push(move)
        # この手で後手に王手がかかっていなければ、詰将棋の手としては無効
        if not board.is_check():
            board.pop()
            continue
        if board.is_checkmate():
            res = 1
        elif depth >= 3:
            d = defender_node(board, depth - 1)
            res = (d + 1) if d is not None else None
        else:
            res = None
        board.pop()
        if res is not None and (best is None or res < best):
            best = res
    return best


def defender_node(board, depth):
    """後手(受け方)の手番。王手がかかった状態。depth=残り手数(偶数)。
    受け方は最長を選ぶ。1つでも逃げ切れたら None。"""
    worst = -1
    for move in list(board.legal_moves):
        board.push(move)
        d = attacker_node(board, depth - 1)
        board.pop()
        if d is None:
            return None  # 受け方がこの手で詰みを逃れた → 不詰
        if d > worst:
            worst = d
    return worst if worst >= 0 else None


def shortest_mate(sfen, max_depth=9):
    """sfen の局面(先手番)から、最短詰み「手数(プライ数)」を返す。なければ None。
    （attacker_node は攻め方の着手回数を返すので、手数 = 2*回数 - 1 に変換）"""
    for depth in range(1, max_depth + 1, 2):
        board = shogi.Board(sfen)
        d = attacker_node(board, depth)
        if d is not None:
            return 2 * d - 1
    return None


def count_first_moves_and_pv(sfen, tesuu):
    """tesuu(手数) ちょうどで詰む『初手』が何通りあるか と、代表手順(PV, USI)を返す。
    詰将棋として正しい＝初手は1通りであるべき。"""
    attacker_plies = (tesuu + 1) // 2
    board = shogi.Board(sfen)
    winning_first = []
    for move in list(board.legal_moves):
        board.push(move)
        ok = False
        if board.is_check():
            if board.is_checkmate():
                ok = (attacker_plies == 1)
            elif attacker_plies >= 2:
                d = defender_node(board, 2 * attacker_plies - 2)
                ok = (d is not None and d == attacker_plies - 1)
        board.pop()
        if ok:
            winning_first.append(move.usi())

    # 代表手順(PV)を1本たどる：攻め方は詰む手、受け方は最長に逃げる手
    pv = []

    def build_pv(b, plies):
        if plies <= 0:
            return True
        # 攻め方
        for mv in list(b.legal_moves):
            b.push(mv)
            good = False
            if b.is_check():
                if b.is_checkmate():
                    good = (plies == 1)
                elif plies >= 3:
                    d = defender_node(b, plies - 1)
                    good = (d is not None and d == (plies - 1 + 1) // 2)
            if good:
                pv.append(mv.usi())
                if b.is_checkmate():
                    b.pop()
                    return True
                # 受け方：最長に粘る手を1つ選ぶ
                best_def, best_len = None, -1
                for dm in list(b.legal_moves):
                    b.push(dm)
                    dd = attacker_node(b, plies - 2)
                    b.pop()
                    if dd is not None and dd > best_len:
                        best_len, best_def = dd, dm
                b.push(best_def)
                pv.append(best_def.usi())
                if build_pv(b, plies - 2):
                    b.pop()
                    b.pop()
                    return True
                pv.pop()
                pv.pop()
                b.pop()
            else:
                b.pop()
        return False

    build_pv(shogi.Board(sfen), tesuu)
    return winning_first, pv


def white_in_check_at_start(sfen):
    """開始局面で玉方(後手)に王手がかかっていれば True（詰将棋として不正）。"""
    b = shogi.Board(sfen)
    for sq in range(81):
        p = b.piece_at(sq)
        if p and p.piece_type == shogi.KING and not p.color:
            return b.is_attacked_by(shogi.BLACK, sq)
    return False


def verify(problem):
    """problem = {name, sfen, moves(USI), claimed(手数)} を検証して結果を表示。"""
    sfen = problem["sfen"]
    name = problem.get("name", "(no name)")
    claimed = problem.get("claimed")

    # 0) 開始局面で玉に王手がかかっていないか（詰将棋の大前提）
    start_bad = white_in_check_at_start(sfen)

    # 1) 提示された手順が合法 & 最後に詰みになるか
    board = shogi.Board(sfen)
    line_ok = True
    reason = ""
    for i, usi in enumerate(problem.get("moves", [])):
        legal = {m.usi() for m in board.legal_moves}
        if usi not in legal:
            line_ok = False
            reason = f"{i+1}手目 {usi} が非合法"
            break
        board.push(shogi.Move.from_usi(usi))
        # 攻め方(偶数index=先手)の手の後は王手のはず
        if i % 2 == 0 and not board.is_check():
            line_ok = False
            reason = f"{i+1}手目 {usi} の後に王手がかかっていない"
            break
    if line_ok:
        if not board.is_checkmate():
            line_ok = False
            reason = "最終局面が詰みになっていない"

    # 2) ソルバーで最短詰み手数を独立に計算
    mate = shortest_mate(sfen, max_depth=max(9, (claimed or 1) + 2))

    status = "OK" if (line_ok and not start_bad) else "NG"
    print(f"[{status}] {name}")
    print(f"      開始王手: {'なし(OK)' if not start_bad else 'あり(NG・不正な局面)'}")
    print(f"      手順検証: {'通過' if line_ok else 'NG → ' + reason}")
    print(f"      最短詰み : {mate}手" if mate else "      最短詰み : 詰まない(!)")
    if claimed is not None and mate is not None and mate != claimed:
        print(f"      ⚠ 申告は{claimed}手だが、{mate}手で詰む（早詰/余詰の疑い）")
    print()
    return line_ok and mate is not None


# ───────── lib/tsume.ts に実際に入れている動作確認用問題（本ツールで検証済み）─────────
SAMPLES = [
    {
        "name": "warm-1 頭金のかたち（1手詰）",
        "sfen": "4k4/9/3S1S3/9/9/9/9/9/K8 b G 1",
        "moves": ["G*5b"],
        "claimed": 1,
    },
    {
        "name": "warm-2 端玉の頭金（1手詰）",
        "sfen": "8k/9/7G1/9/9/9/9/9/K8 b G 1",
        "moves": ["G*2b"],
        "claimed": 1,
    },
    {
        "name": "warm-3 銀が支える形（1手詰）",
        "sfen": "8k/9/7S1/9/9/9/9/9/K8 b G 1",
        "moves": ["G*2b"],
        "claimed": 1,
    },
]


if __name__ == "__main__":
    ok = 0
    for p in SAMPLES:
        if verify(p):
            ok += 1
    print(f"=== {ok}/{len(SAMPLES)} 問が検証OK ===")
