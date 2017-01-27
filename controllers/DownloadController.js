/*
 * *
 *  Copyright 2014 Comcast Cable Communications Management, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 * /
 */

'use strict';
//module provides download test sizes based off of probe data
var stream = require('stream');

/**
 * Class representing a DownloadController.
 */
class DownloadController {

    /**
     * Create a DownloadController.
     * @param {express.Router()} router.
     */
    constructor(router) {
        this.router = router;
        this.registerRoutes();
    }

    /**
     * Register the route for Express.
     */
    registerRoutes() {
        this.router.get('/download', this.getDownload.bind(this));
    }

    /**
     * endpoint to return response.
     * @param {request} req - http request.
     * @param {response} res - http response.
     */
    getDownload(req, res) {
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
      if(!isNaN(parseInt(req.query.bufferSize))  && (parseInt(req.query.bufferSize)<=global.maxDownloadBuffer) &&(parseInt(req.query.bufferSize)>0)){
        var bufferStream = new stream.PassThrough();
        bufferStream.pipe(res);
        var responseBuffer = new Buffer(parseInt(req.query.bufferSize));
        responseBuffer.fill(0x1020304);
        bufferStream.write(responseBuffer);
        bufferStream.end();
      }
      else{
        res.status(404).end('bufferSize failed validation.');
      }
    }
}

module.exports = DownloadController;
