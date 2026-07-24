import { Router } from 'express';
import { registerUser, loginUser, verifyEmailToken, updateUserProfile, updateUserPassword } from '../controllers/authController.js';
import {loginSchema, registerSchema} from "../schemas/authSchema.js";
import {validateRequest} from "../middleware/validateRequest.js";
import {requireAuth} from "../middleware/authMiddleware.js";
const router = Router();

router.post('/signup', validateRequest(registerSchema), registerUser);
router.post('/login', validateRequest(loginSchema),loginUser);
router.get('/verify', verifyEmailToken); // Process incoming browser link clicks
router.patch('/profile', requireAuth, updateUserProfile);
router.patch('/password', requireAuth, updateUserPassword);

export default router;