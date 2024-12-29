import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, publishVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";

const router = Router();

router.route("/publish-video")
        .post(verifyJWT, upload.fields([                   // middleware to upload files through multer on local server before calling a controller or method ..
            {name: "video", maxCount: 1},
            {name: "thumbnail", maxCount: 1}
            ]), 
            publishVideo)
router.route("/getAllVideos").get(getAllVideos)
router.route("/getVideo/:videoId").get(verifyJWT, getVideoById)
router.route("/updateVideoDetails/:videoId").patch(verifyJWT, upload.single("thumbnail"), updateVideo)
router.route("/togglePublish/:videoId").patch(verifyJWT, togglePublishStatus)
router.route("/deleteVideo/:videoId").delete(verifyJWT, deleteVideo)
export default router 