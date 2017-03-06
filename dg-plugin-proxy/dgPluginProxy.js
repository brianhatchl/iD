var dgPluginProxy = function(options) {
    var express = require('express'),
    app = express(),
    url = require('url'),
    proxy = require('express-http-proxy');

    app.listen(options.port);

    app.use(express.static(options.dir));

    app.use('/gbm', proxy('https://services.digitalglobe.com', {
        forwardPath: function(req, res) {
            return url.parse(req.url).path;
        }
    }));

    app.use('/egd', proxy('https://evwhs.digitalglobe.com', {
        forwardPath: function(req, res) {
            return url.parse(req.url).path;
        }
    }));

    console.log('dg-plugin-proxy listening on port %d', options.port);
};

exports.dgPluginProxy = dgPluginProxy;
