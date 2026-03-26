import express from 'express';
import {
  addProducts,
  updateProduct,
  removeProducts,
  listProducts,
  singleProduct,
  toggleFlag,
  getDashboardStats,
} from '../controllers/productController.js';
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';

const productRouter = express.Router();

const imageUpload = upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 },
]);

// ───── Public routes (customer side) ─────
productRouter.get('/list', listProducts);
productRouter.get('/:id', singleProduct);

// ───── Admin routes (protected) ─────
productRouter.post('/add', adminAuth, imageUpload, addProducts);
productRouter.put('/update/:id', adminAuth, imageUpload, updateProduct);
productRouter.delete('/remove/:id', adminAuth, removeProducts);
productRouter.patch('/toggle', adminAuth, toggleFlag);
productRouter.get('/stats', adminAuth, getDashboardStats);

export default productRouter;
