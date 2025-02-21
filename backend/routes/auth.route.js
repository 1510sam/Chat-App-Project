import express from "express";
import {
  Signin,
  Signup,
  Signout,
  updateAvatar,
  checkAuth,
  updateUser,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
const router = express.Router();

router.post("/signup", Signup);
router.post("/signin", Signin);
router.post("/signout", Signout);
router.put("/update-profile", protectRoute, updateAvatar);
router.put("/update-user/:id", protectRoute, updateUser);

// Check if the user login already
router.get("/check", protectRoute, checkAuth);
export default router;
