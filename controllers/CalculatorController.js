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

var statisticalCalculator = require('../modules/statisticalCalculator');

/**
 * Class representing a CalculatorController.
 */
class CalculatorController {

    /**
     * Create a CalculatorController.
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
        this.router.post('/calculator', this.performCalculations.bind(this));
    }

    /**
     * Send the results to a module to perform calculations.
     * @param req - contains array of results.
     * @param res - sends the results back to the client.
     */
    performCalculations(req, res) {
        try {
            if (typeof req.body === 'undefined' && (!(req.body).length > 0) ) {
                throw('cannot perform calculations');
            }
            //call getResults function to perform calculations
            //configurable flag to either do slicing or IQR filtering on the data
            //flag is now turned off to perform slicing
            var results = new statisticalCalculator.getResults(req.body, false);
            res.send(results);
        }
        catch (error) {
            res.status(400).json({'errorMessage': error});
        }
    }
}

module.exports = CalculatorController;
