iD.hoot = function() {
    var hoot = {},
        availableTranslations,
        defaultTranslation = 'OSM',
        activeTranslation = defaultTranslation;

    function formatNodeJsPortOrPath(p) {
        if (isNaN(p)) {
            return '/' + p;
        } else {
            return ':' + p;
        }
    }

    d3.json(window.location.protocol + '//' + window.location.hostname +
        formatNodeJsPortOrPath(iD.data.hoot.translationServerPort) + '/capabilities')
        .get(function(error, json) {
            if (error) {
                console.error(error);
            } else {
                availableTranslations = [defaultTranslation].concat(Object.keys(json));
            }
        });

    hoot.availableTranslations = function() {
        return availableTranslations;
    };

    hoot.defaultTranslation = function() {
        return defaultTranslation;
    };

    hoot.activeTranslation = function(_) {
        if (!arguments.length) return activeTranslation;
        activeTranslation = _;
        return hoot;
    };

    hoot.searchTranslatedSchema = function(value, geometry, callback) {
        d3.json(window.location.protocol + '//' + window.location.hostname +
            formatNodeJsPortOrPath(iD.data.hoot.translationServerPort) +
            '/schema?geometry='+ geometry + '&translation=' + activeTranslation + '&searchstr=' +
            value + '&maxlevdst=' + iD.data.hoot.presetMaxLevDistance +
            '&limit=' + iD.data.hoot.presetMaxDisplayNum, function(error, data) {
                if (error) {
                    console.error(error);
                } else {
                    callback(data);
                }
            });
    };

    hoot.translateEntity = function(entity, callback) {
        var osmXml = '<osm version="0.6" upload="true" generator="hootenanny">' + JXON.stringify(entity.asJXON()) + '</osm>';
        d3.xml(window.location.protocol + '//' + window.location.hostname +
            formatNodeJsPortOrPath(iD.data.hoot.translationServerPort) +
            '/code?translation=' + activeTranslation)
        .post(osmXml, function (error, data) {
            if (error) {
                console.error(error);
            } else {
                //Turn osm xml into a preset and tags
                var tags = [].map.call(data.querySelectorAll('tag'), function(tag) {
                    return {
                        k: tag.getAttribute("k"),
                        v: tag.getAttribute("v")
                    };
                }).reduce(function(prev, curr) {
                    prev[curr.k] = curr.v;
                    return prev;
                }, {});
                console.log(tags);

                //var preset =
                //callback(preset, tags);
            }
        });
    };

    return hoot;
};