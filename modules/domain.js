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

//TODO replace with IPV4 and IPV6 FQDN
var ipAddress = require('ip-address');
global.hasAddressIpv4=false;
global.hasAddressIpv6=false;
var os = require('os');
var ifaces = os.networkInterfaces();


  /**
   * Sets the ipv4 and ipv6 address as global variables
   *
   */
  function setIpAddresses() {
    //loop over network interfaces
    //TODO refactor into map reduce when global looping logic refactored
    Object.keys(ifaces).forEach(function (ifname) {
      var alias = 0;
      ifaces[ifname].forEach(function (iface) {
        if (iface.internal !== false) {
          // skip over internal (i.e. 127.0.0.1)
          return;
        }
        //set IPv4 address
        if ('IPv4' === iface.family) {
          var address4 = new ipAddress.Address4(iface.address);
          if (address4.isValid()) {
            global.AddressIpv4 = iface.address;
            global.hasAddressIpv4 = true;
          }
        }
        //set IPv6 address
        if (('IPv6' === iface.family)) {
          var address6 = new ipAddress.Address6(iface.address);
          //Only globally scoped IPv6 addresses can be reached externally
          if(address6.isValid() && address6.getScope() === 'Global'){
              global.AddressIpv6 = iface.address;
              global.hasAddressIpv6 = true;
          }
        }
        ++alias;
      });
    });
  }
  /**
   * Returns cpu information from node.js os object
   * {@link https://nodejs.org/api/os.html#os_os_cpus}
   * @return {os.cpus} cpu information from machine
   */
  function getCpu(){
    return os.cpus();
  }
  /**
   * Returns free memory information from node.js os object
   * {@link https://nodejs.org/api/os.html#os_os_freemem}
   * @return {os.freemem} free memory information from machine
   */
  function getFreeMemory(){
    return os.freemem();
  }
  /**
   * Returns load averages information from node.js os object
   * {@link https://nodejs.org/api/os.html#os_os_loadavg}
   * @return {os.freemem} load averages information from machine
   */
  function getLoadAverages(){
    return os.loadavg();
  }
  /**
   * Returns total memory information from node.js os object
   * {@link https://nodejs.org/api/os.html#os_os_totalmem}
   * @return {os.totalmem} total memory information from machine
   */
  function getTotalMemory(){
    return os.totalmem();
  }
  /**
   * Returns uptime information from node.js os object
   * {@link https://nodejs.org/api/os.html#os_os_uptime}
   * @return {os.uptime} uptime information from machine
   */
  function getUpTime(){
    return os.uptime();
  }

module.exports = {
  setIpAddresses: setIpAddresses,
  getCpu: getCpu,
  getFreeMemory: getFreeMemory,
  getLoadAverages: getLoadAverages,
  getTotalMemory: getTotalMemory,
  getUpTime: getUpTime
};
