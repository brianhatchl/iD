import _find from 'lodash-es/find';
import _omit from 'lodash-es/omit';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';
import { svgIcon } from '../svg';
import { uiFavoriteButton } from 'favorite_button';

export function uiPresetFavorite(preset, geom) {
    var presetFavorite = {};

    var _button = d3_select(null);
    var _favoriteButton = uiFavoriteButton(preset, geom);

    var modesContainer = d3_select('div.modes');
    var markerClass = preset.name()
        .replace(/\s+/g, '_')
        + '-' + geom; //replace spaces with underscores to avoid css interpretation
    var favorite = modesContainer.selectAll('button.favorite.' + markerClass);


    presetFavorite.button = function(selection) {
        var data = (preset.icon) ? [0] : [];

        _button = selection.selectAll('.preset-favorite-button')
            .data(data);

        _button.exit().remove();

        _button = _button.enter()
            .insert('button', '.tag-reference-button')
            .attr('class', 'preset-favorite-button')
            .attr('title', t('icons.favorite'))
            .attr('tabindex', -1)
            .call(svgIcon('#iD-icon-favorite'))
            .merge(_button);

        _button
            .classed('active', function(d) {
                return favorite.size() == 1;
            })
            .on('click', function () {
                d3_event.stopPropagation();
                d3_event.preventDefault();

                //update state of favorite icon
                d3_select(this)
                    .classed('active', function() {
                        return !d3_select(this).classed('active');
                    });

                _favoriteButton.update(modesContainer, markerClass);

            });

    };

    return presetFavorite;
}
