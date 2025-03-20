const express = require('express');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const cors = require('cors');
const logger = require('./utils/logger');
const apiRoutes = require('./routes/apiRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
const { StatusCodes } = require('http-status-codes');
const ApiResponse = require('./utils/apiResponse');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const downloadsDir = path.join(__dirname, '../downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

app.use(morgan('combined', { stream: accessLogStream }));

app.use((req, res, next) => {
  logger.request(req);
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpecs);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TikTok Scraper API',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
    displayRequestDuration: true,
    syntaxHighlight: {
      activate: true,
      theme: 'agate'
    },
    persistAuthorization: true,
    downloadUrl: '/api-docs.json',
  }
}));

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  return ApiResponse.success(res, {
    name: 'TikTok Scraper API',
    version: '1.0.0',
    documentation: '/api-docs'
  }, 'TikTok Scraper API çalışıyor');
});

app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  return ApiResponse.serverError(res, err);
});

app.use((req, res) => {
  logger.warn(`Not found: ${req.originalUrl}`);
  return ApiResponse.notFound(res, `The requested resource '${req.originalUrl}' was not found`);
});

app.listen(PORT, () => {
  logger.success(`Server running on port ${PORT}`);
  console.log(`Server started: http://localhost:${PORT}`);
  console.log(`Swagger documentation: http://localhost:${PORT}/api-docs`);
});

module.exports = app;