import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";

const router = Router()

router.route("/createPlaylist").post(verifyJWT, createPlaylist)
router.route("/userPlaylists/:userId").get(verifyJWT, getUserPlaylists)
router.route("/playlist/:playlistId").get(verifyJWT, getPlaylistById)
router.route("/addVideoToPlaylist/:playlistId/:videoId").patch(verifyJWT, addVideoToPlaylist)
router.route("/removeVideoFromPlaylist/:playlistId/:videoId").patch(verifyJWT, removeVideoFromPlaylist)
router.route("/deletePlaylist/:playlistId").delete(verifyJWT, deletePlaylist)
router.route("/updatePlaylist/:playlistId").patch(verifyJWT, updatePlaylist)

export default router