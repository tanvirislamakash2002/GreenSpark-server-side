// Re-export all controllers from their respective files
export { getCommentsController as getComments } from "./controllers/public-comment.controller";
export {
    createCommentController as createComment,
    updateCommentController as updateComment,
    deleteCommentController as deleteComment,
    reportCommentController as reportComment,
} from "./controllers/member-comment.controller";
export { getUserCommentsController as getUserComments } from "./controllers/user-comment.controller";
export {
    getAdminCommentsController as getAdminComments,
    getCommentReportsController as getCommentReports,
    adminDeleteCommentController as adminDeleteComment,
    adminRestoreCommentController as adminRestoreComment,
    adminResolveReportsController as adminResolveReports,
    adminBulkActionController as adminBulkAction,
} from "./controllers/admin-comment.controller";