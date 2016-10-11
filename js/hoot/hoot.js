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
            '&limit=' + iD.data.hoot.presetMaxDisplayNum, function(error, resp) {
                callback(error, resp);
            });
    }
    return hoot;
};