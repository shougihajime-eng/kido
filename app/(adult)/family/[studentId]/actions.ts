// 互換シム：旧コードからの import を残しておくために再エクスポートする。
// 新規追加は app/_actions/comments.ts を直接使う。

export {
  addCommentAction,
  deleteCommentAction,
  updateCommentAction,
  toggleReactionAction
} from '@/app/_actions/comments'
