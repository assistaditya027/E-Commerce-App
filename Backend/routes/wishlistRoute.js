import express from 'express';
import {
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  getUserWishlist,
} from '../controllers/wishlistController.js';
import authUser from '../middleware/auth.js';

const wishlistRouter = express.Router();

wishlistRouter.post('/get', authUser, getUserWishlist);
wishlistRouter.post('/add', authUser, addToWishlist);
wishlistRouter.post('/remove', authUser, removeFromWishlist);
wishlistRouter.post('/toggle', authUser, toggleWishlist);

export default wishlistRouter;
