iD.Background = function(context) {
    var dispatch = d3.dispatch('change'),
        baseLayer = iD.TileLayer(context).projection(context.projection),
        //Added for DG-plugin
        footprintLayer = iD.FootprintLayer(context, dispatch).projection(context.projection),
        overlayLayers = [],
        backgroundSources;


    function findSource(id) {
        return _.find(backgroundSources, function(d) {
            return d.id && d.id === id;
        });
    }


    function background(selection) {
        var base = selection.selectAll('.layer-background')
            .data([0]);

        base.enter()
            .insert('div', '.layer-data')
            .attr('class', 'layer layer-background');

        base.call(baseLayer);

        var overlays = selection.selectAll('.layer-overlay')
            .data(overlayLayers, function(d) { return d.source().name(); });

        overlays.enter()
            .insert('div', '.layer-data')
            .attr('class', 'layer layer-overlay');

        overlays.each(function(layer) {
            d3.select(this).call(layer);
        });

        overlays.exit()
            .remove();

        //Added for DG-plugin
        var footprint = selection.selectAll('.footprint-layer')
        .data([0]);

        footprint.enter().insert('div', '.layer-data')
            .attr('class', 'layer-layer footprint-layer');

        footprint.call(footprintLayer);
    }


    background.updateImagery = function() {
        var b = background.baseLayerSource(),
            o = overlayLayers.map(function (d) { return d.source().id; }).join(','),
            meters = iD.geo.offsetToMeters(b.offset()),
            epsilon = 0.01,
            x = +meters[0].toFixed(2),
            y = +meters[1].toFixed(2),
            q = iD.util.stringQs(location.hash.substring(1));

        var id = b.id;
        if (id === 'custom') {
            id = 'custom:' + b.template;
        }

        if (id) {
            q.background = id;
        } else {
            delete q.background;
        }

        if (o) {
            q.overlays = o;
        } else {
            delete q.overlays;
        }

        if (Math.abs(x) > epsilon || Math.abs(y) > epsilon) {
            q.offset = x + ',' + y;
        } else {
            delete q.offset;
        }

        location.replace('#' + iD.util.qsString(q, true));

        var imageryUsed = [b.imageryUsed()];

        overlayLayers.forEach(function (d) {
            var source = d.source();
            if (!source.isLocatorOverlay()) {
                imageryUsed.push(source.imageryUsed());
            }
        });

        var gpx = context.layers().layer('gpx');
        if (gpx && gpx.enabled() && gpx.hasGpx()) {
            imageryUsed.push('Local GPX');
        }

        var mapillary_images = context.layers().layer('mapillary-images');
        if (mapillary_images && mapillary_images.enabled()) {
            imageryUsed.push('Mapillary Images');
        }

        var mapillary_signs = context.layers().layer('mapillary-signs');
        if (mapillary_signs && mapillary_signs.enabled()) {
            imageryUsed.push('Mapillary Signs');
        }

        context.history().imageryUsed(imageryUsed);
    };

    background.sources = function(extent) {
        return backgroundSources.filter(function(source) {
            return source.intersects(extent);
        });
    };

    background.addSource = function(d) {
        var source = iD.BackgroundSource(d);
        backgroundSources.push(source);
        background.toggleOverlayLayer(source);
    };

    background.updateSource = function(d) {
        var source = findSource(d.id);
        for (var i = backgroundSources.length-1; i >= 0; i--) {
            var layer = backgroundSources[i];
            if (layer === source) {
                backgroundSources[i] = iD.BackgroundSource(d);
                background.addOrUpdateOverlayLayer(backgroundSources[i]);
                break;
            }
        }
    };

    background.removeSource = function(d) {
        var source = findSource(d.id);
        for (var i = backgroundSources.length-1; i >= 0; i--) {
            var layer = backgroundSources[i];
            if (layer === source) {
                backgroundSources.splice(i, 1);
                background.toggleOverlayLayer(source);
                break;
            }
        }
    };

    background.dimensions = function(_) {
        baseLayer.dimensions(_);
        footprintLayer.dimensions(_);

        overlayLayers.forEach(function(layer) {
            layer.dimensions(_);
        });
    };

    background.baseLayerSource = function(d) {
        if (!arguments.length) return baseLayer.source();
        baseLayer.source(d);
        dispatch.change();
        background.updateImagery();
        return background;
    };

    background.bing = function() {
        background.baseLayerSource(findSource('Bing'));
    };

    background.showsLayer = function(d) {
        return d === baseLayer.source() ||
            (d.id === 'custom' && baseLayer.source().id === 'custom') ||
            //Added for DG-plugin
            (d.name() === 'DigitalGlobe Imagery' && (baseLayer.source().id && baseLayer.source().id.indexOf('DigitalGlobe') === 0)) ||
            (d.name() === 'DigitalGlobe Imagery Collection' && overlayLayers.some(function(l) {
                return l.source().id  === 'dgCollection';
            })) ||
            overlayLayers.some(function(l) { return l.source() === d; });
    };

    background.overlayLayerSources = function() {
        return overlayLayers.map(function (l) { return l.source(); });
    };

    background.toggleOverlayLayer = function(d) {
        var layer;

        for (var i = 0; i < overlayLayers.length; i++) {
            layer = overlayLayers[i];
            if (layer.source() === d || (d.id === 'dgCollection' && d.id === layer.source().id)) {
                overlayLayers.splice(i, 1);
                dispatch.change();
                background.updateImagery();
                return;
            }
        }

        layer = iD.TileLayer(context)
            .source(d)
            .projection(context.projection)
            .dimensions(baseLayer.dimensions());

        overlayLayers.push(layer);
        dispatch.change();
        background.updateImagery();
    };

    background.addOrUpdateOverlayLayer = function(d) {
        var layer;

        for (var i = 0; i < overlayLayers.length; i++) {
            layer = overlayLayers[i];
            if (d.id === layer.source().id) {
                overlayLayers.splice(i, 1);
            }
        }

        layer = iD.TileLayer()
            .source(d)
            .projection(context.projection)
            .dimensions(baseLayer.dimensions());

        overlayLayers.push(layer);
        dispatch.change();
        background.updateImagery();
    };

    background.updateFootprintLayer = function(d) {
        footprintLayer.geojson(d);
        dispatch.change();
    };

    background.nudge = function(d, zoom) {
        baseLayer.source().nudge(d, zoom);
        dispatch.change();
        background.updateImagery();
        return background;
    };

    background.offset = function(d) {
        if (!arguments.length) return baseLayer.source().offset();
        baseLayer.source().offset(d);
        dispatch.change();
        background.updateImagery();
        return background;
    };

    background.load = function(imagery) {
        function parseMap(qmap) {
            if (!qmap) return false;
            var args = qmap.split('/').map(Number);
            if (args.length < 3 || args.some(isNaN)) return false;
            return iD.geo.Extent([args[1], args[2]]);
        }

        var q = iD.util.stringQs(location.hash.substring(1)),
            chosen = q.background || q.layer,
            extent = parseMap(q.map),
            best;

        backgroundSources = imagery.map(function(source) {
            if (source.type === 'bing') {
                return iD.BackgroundSource.Bing(source, dispatch);
            } else {
                return iD.BackgroundSource(source);
            }
        });

        backgroundSources.unshift(iD.BackgroundSource.None());

        if (!chosen && extent) {
            best = _.find(this.sources(extent), function(s) { return s.best(); });
        }

        if (chosen && chosen.indexOf('custom:') === 0) {
            background.baseLayerSource(iD.BackgroundSource.Custom(chosen.replace(/^custom:/, '')));
        } else {
            background.baseLayerSource(findSource(chosen) || best || findSource('Bing') || backgroundSources[1] || backgroundSources[0]);
        }

        var locator = _.find(backgroundSources, function(d) {
            return d.overlay && d.default;
        });

        if (locator) {
            background.toggleOverlayLayer(locator);
        }

        var overlays = (q.overlays || '').split(',');
        overlays.forEach(function(overlay) {
            overlay = findSource(overlay);
            if (overlay) {
                background.toggleOverlayLayer(overlay);
            }
        });

        if (q.gpx) {
            var gpx = context.layers().layer('gpx');
            if (gpx) {
                gpx.url(q.gpx);
            }
        }

        if (q.offset) {
            var offset = q.offset.replace(/;/g, ',').split(',').map(function(n) {
                return !isNaN(n) && n;
            });

            if (offset.length === 2) {
                background.offset(iD.geo.metersToOffset(offset));
            }
        }
    };

    return d3.rebind(background, dispatch, 'on');
};
