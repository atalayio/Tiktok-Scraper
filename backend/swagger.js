const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TikTok Video Scraper API',
      version: '1.0.0',
      description: 'API for scraping and downloading TikTok videos',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            status: {
              type: 'string',
              example: 'error'
            },
            code: {
              type: 'integer',
              example: 400
            },
            message: {
              type: 'string',
              example: 'Invalid request'
            }
          }
        },
        VideoUrl: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            status: {
              type: 'string',
              example: 'success'
            },
            data: {
              type: 'object',
              properties: {
                video_url: {
                  type: 'string',
                  example: 'https://v16-webapp.tiktok.com/...'
                },
                video_id: {
                  type: 'string',
                  example: '7153458473287564554'
                },
                metadata: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      example: '7153458473287564554'
                    },
                    username: {
                      type: 'string',
                      example: 'username'
                    },
                    description: {
                      type: 'string',
                      example: 'Video description'
                    }
                  }
                }
              }
            }
          }
        },
        VideoDownload: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            status: {
              type: 'string',
              example: 'success'
            },
            data: {
              type: 'object',
              properties: {
                video_url: {
                  type: 'string',
                  example: 'https://v16-webapp.tiktok.com/...'
                },
                file_name: {
                  type: 'string',
                  example: 'tiktok_7153458473287564554.mp4'
                },
                download_path: {
                  type: 'string',
                  example: '/downloads/tiktok_7153458473287564554.mp4'
                },
                metadata: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      example: '7153458473287564554'
                    },
                    username: {
                      type: 'string',
                      example: 'username'
                    },
                    description: {
                      type: 'string',
                      example: 'Video description'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs; 