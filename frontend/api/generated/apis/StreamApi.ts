/* tslint:disable */
/* eslint-disable */
/**
 * TikTok Video Scraper API
 * API for scraping and downloading TikTok videos
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import * as runtime from '../runtime';

export interface ApiStreamFilenameGetRequest {
    filename: string;
}

/**
 * 
 */
export class StreamApi extends runtime.BaseAPI {

    /**
     * Streams a previously downloaded TikTok video
     * Streams a downloaded video
     */
    async apiStreamFilenameGetRaw(requestParameters: ApiStreamFilenameGetRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Blob>> {
        if (requestParameters['filename'] == null) {
            throw new runtime.RequiredError(
                'filename',
                'Required parameter "filename" was null or undefined when calling apiStreamFilenameGet().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/api/stream/{filename}`.replace(`{${"filename"}}`, encodeURIComponent(String(requestParameters['filename']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.BlobApiResponse(response);
    }

    /**
     * Streams a previously downloaded TikTok video
     * Streams a downloaded video
     */
    async apiStreamFilenameGet(requestParameters: ApiStreamFilenameGetRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Blob> {
        const response = await this.apiStreamFilenameGetRaw(requestParameters, initOverrides);
        return await response.value();
    }

}
