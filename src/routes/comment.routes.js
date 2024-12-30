import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";

const router = Router()

router.route("/videoComments/:videoId").get(verifyJWT, getVideoComments)
router.route("/addComent/:videoId").post(verifyJWT, addComment)
router.route("/updateComment/:commentId").patch(verifyJWT, updateComment)
router.route("/deleteComment/:commentId").delete(verifyJWT, deleteComment)

export default router