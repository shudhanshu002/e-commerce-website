import { Router } from 'express';
import {
  addAddress,
  getAddresses,
  updateAddresses,
  deleteAddress,
  getCurrentUser,
} from '../controllers/user.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// All routes here require a logged-in user
router.use(verifyJWT);

router.route('/me').get(getCurrentUser);
router.route('/addresses').post(addAddress).get(getAddresses);
router
  .route('/addresses/:addressId')
  .put(updateAddresses)
  .delete(deleteAddress);

export default router;
