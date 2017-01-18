import * as d3 from 'd3';
import _ from 'lodash';
import { geoExtent, geoPolygonIntersectsPolygon } from '../geo/index';
import toGeoJSON from 'togeojson';


export function svgDgFootprint(projection, context, dispatch) {
    var showLabels = true,
        layer;


    function init() {
        if (svgDgFootprint.initialized) return;  // run once

        svgDgFootprint.geojson = {};
        svgDgFootprint.enabled = true;

        svgDgFootprint.initialized = true;
    }


    function drawDgFootprint(selection) {
        var geojson = svgDgFootprint.geojson,
            enabled = svgDgFootprint.enabled;

        layer = selection.selectAll('.layer-footprint')
            .data(enabled ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-footprint')
            .merge(layer);


        var paths = layer
            .selectAll('path')
            .data([geojson]);

        paths.exit()
            .remove();

        paths = paths.enter()
            .append('path')
            .attr('class', 'carousel-footprint')
            .merge(paths);


        var path = d3.geoPath(projection);

        paths
            .attr('d', path);


        var labels = layer.selectAll('text')
            .data(showLabels && geojson.features ? geojson.features : []);

        labels.exit()
            .remove();

        labels = labels.enter()
            .append('text')
            .attr('class', 'carousel-footprint')
            .merge(labels);

        labels
            .text(function(d) {
                return d.properties.desc || d.properties.name;
            })
            .attr('x', function(d) {
                var centroid = path.centroid(d);
                return centroid[0] + 7;
            })
            .attr('y', function(d) {
                var centroid = path.centroid(d);
                return centroid[1];
            });

    }


    function toDom(x) {
        return (new DOMParser()).parseFromString(x, 'text/xml');
    }


    drawDgFootprint.showLabels = function(_) {
        if (!arguments.length) return showLabels;
        showLabels = _;
        return this;
    };


    drawDgFootprint.enabled = function(_) {
        if (!arguments.length) return svgDgFootprint.enabled;
        svgDgFootprint.enabled = _;
        dispatch.call('change');
        return this;
    };


    drawDgFootprint.geojson = function(gj) {
        if (!arguments.length) return svgDgFootprint.geojson;
        svgDgFootprint.geojson = gj;
        dispatch.call('change');
        return this;
    };


    init();
    return drawDgFootprint;
}
