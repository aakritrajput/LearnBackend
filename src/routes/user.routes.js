import {Router} from "express";
import {registerUser} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.route("/register").post(
    upload.fields([                   // middleware to upload files through multer on local server before calling a controller or method ..
        {name: "avatar", maxCount: 1},
        {name: "coverImage", maxCount: 1}
    ]),
    registerUser
) //methods to be written
// hi i am very much excited for the development of the cloud engineering and i am not very much excited for the new thing that i a going to learn about
export default router 