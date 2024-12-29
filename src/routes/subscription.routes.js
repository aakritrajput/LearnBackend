import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router()

router.route("/toggleSubscription/:channelId").patch(verifyJWT, toggleSubscription);
router.route("/channelSubscribers/:channelId").get(getUserChannelSubscribers);
router.route("/channelsSubscribed/:subscriberId").get(verifyJWT, getSubscribedChannels)

//676ce3fa44dd711ee96fbd78

export default router