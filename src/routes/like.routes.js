import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js";

const router = Router()

router.route("/toggleVideoLike/:videoId").patch(verifyJWT, toggleVideoLike)
router.route("/toggleCommentLike/:commentId").patch(verifyJWT, toggleCommentLike)
router.route("/toggleTweetLike/:tweetId").patch(verifyJWT, toggleTweetLike)
router.route("/likedVideos").get(verifyJWT, getLikedVideos)

export default router;