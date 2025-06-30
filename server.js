require('dotenv').config();
const express = require('express');
const trapRoutes = require('./routes/trapRoutes');
const startCronJobs = require('./cron/scheduleBots');
const logger = require('./utils/logger');

const app = express();
app.use(express.json());

app.use('/api/v1/trap', trapRoutes);

app.listen(process.env.PORT || 3000, () => {
  logger.info(`Server started on port ${process.env.PORT || 3000}`);
});

startCronJobs();
