const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const tiktokService = require('../services/tiktok');
const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');
const { StatusCodes } = require('http-status-codes');
const Joi = require('joi');

/**
 * URL validation
 */
const validateUrl = (req, res, next) => {
  const schema = Joi.object({
    url: Joi.string().uri().required().messages({
      'any.required': 'URL parameter is required',
      'string.uri': 'A valid URL must be provided',
      'string.empty': 'URL cannot be empty'
    })
  });

  const { error } = schema.validate(req.query);
  if (error) {
    return ApiResponse.badRequest(res, error.details[0].message);
  }

  next();
};

/**
 * @swagger
 * /api/tiktok-video:
 *   get:
 *     summary: Returns the direct URL of a TikTok video
 *     description: Extracts video information and direct URL from a given TikTok video URL
 *     tags: [Video]
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *         description: TikTok video URL
 *     responses:
 *       200:
 *         description: TikTok video URL successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VideoUrl'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/tiktok-video', validateUrl, async (req, res) => {
  try {
    const { url } = req.query;
    logger.info(`TikTok video URL request: ${url}`);
    
    const result = await tiktokService.getVideoUrl(url);
    
    if (!result.success) {
      return ApiResponse.error(
        res, 
        result.error || 'Failed to get TikTok video URL', 
        StatusCodes.BAD_REQUEST
      );
    }
    
    return ApiResponse.success(res, {
      video_url: result.video_url,
      video_id: result.video_id,
      metadata: result.metadata
    }, 'TikTok video URL successfully retrieved');
  } catch (error) {
    logger.error(`Error processing TikTok URL: ${error.message}`);
    return ApiResponse.serverError(res, error);
  }
});

/**
 * @swagger
 * /api/tiktok-download:
 *   get:
 *     summary: Downloads a TikTok video
 *     description: Downloads a video from the given TikTok video URL and returns its information
 *     tags: [Video]
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *         description: TikTok video URL
 *     responses:
 *       200:
 *         description: TikTok video successfully downloaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VideoDownload'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/tiktok-download', validateUrl, async (req, res) => {
  try {
    const { url } = req.query;
    logger.info(`TikTok video download request: ${url}`);
    
    const result = await tiktokService.downloadTikTokVideo(url);
    
    if (!result.success) {
      return ApiResponse.error(
        res, 
        result.error || 'Failed to download TikTok video', 
        StatusCodes.BAD_REQUEST
      );
    }
    
    // Convert server file path to client-friendly URL
    const downloadUrl = `/api/stream/${result.file_name}`;
    
    return ApiResponse.success(res, {
      video_url: result.video_url,
      file_name: result.file_name,
      download_url: downloadUrl,
      metadata: result.metadata
    }, 'TikTok video successfully downloaded');
  } catch (error) {
    logger.error(`Error downloading TikTok video: ${error.message}`);
    return ApiResponse.serverError(res, error);
  }
});

/**
 * @swagger
 * /api/stream/{filename}:
 *   get:
 *     summary: Streams a downloaded video
 *     description: Streams a previously downloaded TikTok video
 *     tags: [Stream]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the downloaded video file
 *     responses:
 *       200:
 *         description: Video stream
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stream/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return ApiResponse.badRequest(res, 'Filename parameter is required');
    }
    
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(__dirname, '../../downloads', sanitizedFilename);
    
    if (!fs.existsSync(filePath)) {
      logger.error(`File not found: ${filePath}`);
      return ApiResponse.notFound(res, 'File not found');
    }
    
    logger.info(`Streaming video file: ${filePath}`);
    
    // Set headers for video
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      logger.error(`Error streaming file: ${error.message}`);
      if (!res.headersSent) {
        return ApiResponse.serverError(res, error, 'Error streaming video');
      }
    });
  } catch (error) {
    logger.error(`Error streaming video file: ${error.message}`);
    return ApiResponse.serverError(res, error);
  }
});

module.exports = router; 