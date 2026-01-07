import { Router } from 'express';

const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  res.status(200).send({ status: 'ok' });
});

export default healthRouter;
