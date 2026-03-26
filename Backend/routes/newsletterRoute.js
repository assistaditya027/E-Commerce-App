import express from 'express';
import { subscribe, unsubscribe } from '../controllers/newsletterController.js';

const newsletterRouter = express.Router();

newsletterRouter.post('/subscribe', subscribe);
newsletterRouter.post('/unsubscribe', unsubscribe);

export default newsletterRouter;
