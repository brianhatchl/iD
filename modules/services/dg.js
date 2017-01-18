import * as d3 from 'd3';
import { t } from '../util/locale';

    var dg = {},
        gbm_proxy = '/gbm',
        egd_proxy = '/egd',
        gbm_host = 'https://{switch:a,b,c,d,e}-services.digitalglobe.com',
        egd_host = 'https://evwhs.digitalglobe.com',
        gbm_connectId = '',
        egd_connectId = '',
        wmts_template = '/earthservice/wmtsaccess?CONNECTID={connectId}&request=GetTile&version=1.0.0'
            + '&layer=DigitalGlobe:ImageryTileService&featureProfile={profile}&style=default&format=image/png'
            + '&TileMatrixSet=EPSG:3857&TileMatrix=EPSG:3857:{zoom}&TileRow={y}&TileCol={x}',
        wms_template = '/mapservice/wmsaccess?connectId={connectId}&SERVICE=WMS&REQUEST=GetMap&SERVICE=WMS&VERSION=1.1.1'
            + '&LAYERS=DigitalGlobe:Imagery&STYLES=&FORMAT=image/png&BGCOLOR=0xFFFFFF&TRANSPARENT=TRUE'
            + '&featureProfile={profile}&SRS=EPSG:3857&FEATURECOLLECTION={featureId}&BBOX={bbox}&WIDTH=256&HEIGHT=256',
        wfs_template = '/catalogservice/wfsaccess?connectid={connectId}&SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature'
            + '&typeName=FinishedFeature&featureProfile={profile}&outputFormat=json'
            + '&BBOX={bbox}&HEIGHT={height}&WIDTH={width}',
        collection_template = '/mapservice/wmsaccess?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap'
            + '&STYLES=imagery_footprint&env=color:ff6600&FORMAT=image/png8&LAYERS=DigitalGlobe:ImageryFootprint'
            + '&featureProfile={profile}&TRANSPARENT=true&SRS=EPSG:3857&SUPEROVERLAY=true'
            + '&FORMAT_OPTIONS=OPACITY:0.6;GENERALIZE:true&connectId={connectId}&FRESHNESS={freshness}'
            + '&BBOX={bbox}&WIDTH=256&HEIGHT=256',
        //service = 'EGD',
        defaultProfile = 'Global_Currency_Profile',
        defaultCollection = '24h';

    function isUUID(str) {
        if (str === null){
            return false;
        } else{
            var match = str.search(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
            return match !== -1;
        }
    }

    dg.enabled = isUUID(gbm_connectId) || isUUID(egd_connectId) || egd_connectId === 'prompt';

    dg.egd = {};
    dg.egd.connectId = function(_) {
        if (!arguments.length) return egd_connectId;
        egd_connectId = _;
        return dg;
    };

    dg.profiles = [
        'Global_Currency_Profile',
        'MyDG_Color_Consumer_Profile',
        'MyDG_Consumer_Profile',
        'Cloud_Cover_Profile',
        'Color_Infrared_Profile',
    ];

    dg.defaultProfile = defaultProfile;

    dg.getProfile = function(value) {
        var p = dg.profiles.filter(function(d) {
            return d === (value);
        });
        return (p.length > 0) ? p[0].text : null;
    };

    dg.collections = [
        '24h',
        '1w',
        '1m',
        '6m',
        '1y',
        'all',
    ];

    dg.defaultCollection = defaultCollection;

    function getUrl(service, connectId, profile, template, proxy) {
        var host,
            connectid;
        if (!service || service === 'GBM') {
            host = (proxy) ? gbm_proxy : gbm_host;
            connectid = connectId || gbm_connectId;
        } else if (service === 'EGD') {
            host = (proxy) ? egd_proxy : egd_proxy;
            connectid = connectId || egd_connectId;
        }
        return (host + template)
            .replace('{connectId}', connectid)
            .replace('{profile}', profile || defaultProfile);
    }

    dg.wmts = {};
    dg.wmts.getTile = function(service, connectId, profile) {
        return getUrl(service, connectId, profile, wmts_template);
    };

    dg.wms = {};
    dg.wms.getMap = function(service, connectId, profile, featureId) {
        return getUrl(service, connectId, profile, wms_template)
            .replace('{featureId}', featureId);
    };

    dg.wfs = {};
    // Returns a random integer between min (included) and max (excluded)
    // Using Math.round() will give you a non-uniform distribution!
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }
    function getWfsFeature(service, connectId, profile, extent, size, callback, addlParam) {
        var url = getUrl(service, connectId, profile, wfs_template, true/*proxy*/);
        if (addlParam) {
            url += '&' + d3.entries(addlParam).map(function(d) {
                return d.key + '=' + d.value;
            }).join('&');
        }
        url = url.replace(/\{switch:([^}]+)\}/, function(s, r) {
                var subdomains = r.split(',');
                return subdomains[getRandomInt(0, subdomains.length)];
            })
            .replace('{width}', size[0])
            .replace('{height}', size[1])
            .replace('{bbox}', extent.toParam());

        d3.json(url, callback);
    }
    dg.wfs.getFeature = function(service, connectId, profile, extent, size, callback) {
        getWfsFeature(service, connectId, profile, extent, size, callback);
    };
    dg.wfs.getFeatureInRaster = function(service, connectId, profile, extent, size, callback) {
        getWfsFeature(service, connectId, profile, extent, size, callback, {
            showTheRasterReturned: 'TRUE'
        });
    };

    dg.collection = {};
    dg.collection.getMap = function(service, connectId, profile, freshness) {
        return getUrl(service, connectId, profile, collection_template)
            .replace('{freshness}', freshness || defaultCollection);

    };

    dg.imagemeta = {};
    dg.imagemeta.sources = {};
    dg.imagemeta.add = function(source, features) {
        /*
        ${BASEMAP_IMAGE_SOURCE} - Source of imagery. E.g. 'digitalglobe', 'bing'
        ${BASEMAP_IMAGE_SENSOR} - Name of the source sensor. E.g. 'WV02'
        ${BASEMAP_IMAGE_DATETIME} - Date time the source was acquired. E.g. '2012-03-28 11:22:29'
        ${BASEMAP_IMAGE_ID} - Unique identifier for the image. E.g. 32905903099a73faec6d7de72b9a2bdb
        */
        dg.imagemeta.sources[source] = {
            '${BASEMAP_IMAGE_SOURCE}': source,
            '${BASEMAP_IMAGE_SENSOR}': features.map(function(d) { return d.properties.source; }).join(';'),
            '${BASEMAP_IMAGE_DATETIME}': features.map(function(d) { return d.properties.acquisitionDate; }).join(';'),
            '${BASEMAP_IMAGE_ID}': features.map(function(d) { return d.properties.featureId; }).join(';')
        };
    };
    dg.imagemeta.remove = function(source) {
        delete dg.imagemeta.sources[source];
    };

    dg.terms = function(service) {
        if (!service || service === 'GBM') {
            return 'https://origin-services.digitalglobe.com/myDigitalGlobe';
        } else if (service === 'EGD') {
            return 'https://evwhs.digitalglobe.com/myDigitalGlobe';
        }
    };

    dg.backgroundSource = function(service, connectId, profile) {
        var template = dg.wmts.getTile(service, connectId, profile);
        var terms = dg.terms(service);
        var source = {
                'name': function() { return 'DigitalGlobe Imagery'; },
                'type': 'wmts',
                'description': 'Satellite imagery from ' + (service || 'GBM'),
                'template': template,
                'scaleExtent': [
                    0,
                    20
                ],
                'polygon': [
                    [
                        [
                            -180,
                            -90
                        ],
                        [
                            -180,
                            90
                        ],
                        [
                            180,
                            90
                        ],
                        [
                            180,
                            -90
                        ],
                        [
                            -180,
                            -90
                        ]
                    ]
                ],
                'terms_url': terms,
                'terms_text': '© DigitalGlobe',
                'id': 'DigitalGlobe ' + (service || 'GBM') + ' - ' + (dg.getProfile(profile) || dg.getProfile(defaultProfile)),
                'overlay': false
            };
        return source;
    };

    dg.collectionSource = function(service, connectId, profile, freshness) {
        var template = dg.collection.getMap(service, connectId, profile, freshness);
        var terms = dg.terms(service);
        var source = {
                'name': function() { return 'DigitalGlobe Imagery Collection'; },
                'type': 'wms',
                'description': 'Satellite imagery collection from ' + service || 'GBM',
                'template': template,
                'scaleExtent': [
                    0,
                    20
                ],
                'polygon': [
                    [
                        [
                            -180,
                            -90
                        ],
                        [
                            -180,
                            90
                        ],
                        [
                            180,
                            90
                        ],
                        [
                            180,
                            -90
                        ],
                        [
                            -180,
                            -90
                        ]
                    ]
                ],
                'terms_url': terms,
                'terms_text': '© DigitalGlobe',
                // 'id': 'DigitalGlobe Collection Footprint - ' + dg.collections.filter(function(d) {
                //     return d === profile || defaultCollection;
                // })[0].text,
                'id': 'dgCollection',
                'overlay': true
            };
        return source;
    };

export default {

    collections: function() {
        return dg.collections;
    },

    enabled: function() {
        return dg.enabled;
    },

    backgroundSource: dg.backgroundSource,
    getFeature: dg.wfs.getFeature,
    getFeatureInRaster: dg.wfs.getFeatureInRaster,
    collectionSource: dg.collectionSource,
    addImageMetadata: dg.imagemeta.add,
    removeImageMetadata: dg.imagemeta.remove,
    getProfile: dg.getProfile,
    terms: dg.terms,
    egdConnectId: dg.egd.connectId,
    getMap: dg.wms.getMap,

    defaultCollection: function() {
        return dg.defaultCollection;
    },

    defaultProfile: function() {
        return dg.defaultProfile;
    },

    profiles: function() {
        return dg.profiles;
    }




};
