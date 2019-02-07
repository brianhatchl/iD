import { select as d3_select } from 'd3-selection';

import { svgIcon } from '../svg';
import { utilFunctor } from '../util';


export function uiFavoriteIcon() {
    var favorite, geometry;


    function favoriteIcon(selection) {
        selection.each(render);
    }


    function getIcon(p, geom) {
        if (p.icon)
            return p.icon;
        else if (geom === 'line')
            return 'iD-other-line';
        else if (geom === 'vertex')
            return p.isFallback() ? '' : 'temaki-vertex';
        else
            return 'maki-marker-stroked';
    }


    function render() {
        var selection = d3_select(this);
        var p = favorite.apply(this, arguments);
        var geom = geometry.apply(this, arguments);
        var picon = getIcon(p, geom);
        var isMaki = /^maki-/.test(picon);
        var isTemaki = /^temaki-/.test(picon);
        var isFa = /^fa[srb]-/.test(picon);
        var isPOI = isMaki || isTemaki || isFa;
        var isFramed = (geom === 'area' || geom === 'vertex');


        function tag_classes(p) {
            var s = '';
            for (var i in p.tags) {
                s += ' tag-' + i;
                if (p.tags[i] !== '*') {
                    s += ' tag-' + i + '-' + p.tags[i];
                }
            }
            return s;
        }


        var fill = selection.selectAll('.favorite-icon-fill')
            .data([0]);

        fill = fill.enter()
            .append('div')
            .merge(fill);

        fill
            .attr('class', function() {
                return 'favorite-icon-fill favorite-icon-fill-' + geom + tag_classes(p);
            });


        var areaFrame = selection.selectAll('.favorite-icon-frame')
            .data((geom === 'area') ? [0] : []);

        areaFrame.exit()
            .remove();

        areaFrame = areaFrame.enter()
            .append('div')
            .attr('class', 'favorite-icon-frame')
            .call(svgIcon('#iD-favorite-icon-frame'));


        var icon = selection.selectAll('.favorite-icon')
            .data([0]);

        icon = icon.enter()
            .append('div')
            .attr('class', 'favorite-icon')
            .call(svgIcon(''))
            .merge(icon);

        icon
            .attr('class', 'favorite-icon favorite-icon-' +
                (isPOI ? (isFramed ? '24' : '28') : (isFramed ? '44' : '60'))
            );

        icon.selectAll('svg')
            .attr('class', function() {
                return 'icon ' + picon + (isPOI ? '' : tag_classes(p));
            });

        icon.selectAll('use')
            .attr('href', '#' + picon + (isMaki ? '-15' : ''));
    }


    favoriteIcon.favorite = function(_) {
        if (!arguments.length) return favorite;
        favorite = utilFunctor(_);
        return favoriteIcon;
    };


    favoriteIcon.geometry = function(_) {
        if (!arguments.length) return geometry;
        geometry = utilFunctor(_);
        return favoriteIcon;
    };

    return favoriteIcon;
}
