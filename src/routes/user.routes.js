import {Router} from "express";
import {registerUser} from "../controllers/user.controller.js"
const router = Router();
router.route("/register").post(registerUser) //methods to be written
// hi i am very much excited for the development of the cloud engineering and i am not very much excited for the new thing that i a going to learn about
export default router 