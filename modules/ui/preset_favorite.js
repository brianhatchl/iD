import _find from 'lodash-es/find';
import _omit from 'lodash-es/omit';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';
import { svgIcon } from '../svg';


export function uiPresetFavorite() {
    var presetFavorite = {};

    var _button = d3_select(null);



    presetFavorite.button = function(selection) {
        _button = selection.selectAll('.preset-favorite-button')
            .data([0]);

        _button = _button.enter()
            .append('button')
            .attr('class', 'preset-favorite-button')
            .attr('title', t('icons.favorite'))
            .attr('tabindex', -1)
            .call(svgIcon('#iD-icon-favorite'))
            .merge(_button);

        _button
            .on('click', function () {
                d3_event.stopPropagation();
                d3_event.preventDefault();

                d3_select(this)
                    .classed('active', function() {
                        return !d3_select(this).classed('active');
                    });

            });
    };

    return presetFavorite;
}
