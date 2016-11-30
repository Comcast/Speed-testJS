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
var uploadData = require('../modules/uploadData');

/**
 * Class representing a DownloadProbeController.
 */
class UploadProbeController {

    /**
     * Create a UploadProbeController.
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
        this.router.get('/uploadProbe', this.getUPloadProbe.bind(this));
    }

    /**
     * endpoint to return response.
     * @param {request} req - http request.
     * @param {response} res - http response.
     */
    getUPloadProbe(req, res) {
        var uploadTestSizes = uploadData.GetUploadSize(req.query.bufferSize, req.query.time, req.query.lowLatency);
        res.json(uploadTestSizes);
    }
}

module.exports = UploadProbeController;

