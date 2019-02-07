import _find from 'lodash-es/find';
import _omit from 'lodash-es/omit';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';
import { svgIcon } from '../svg';
import { uiFavoriteIcon } from './favorite_icon';
import { uiPresetIcon } from './preset_icon';
import { tooltip } from '../util/tooltip';
import { uiTooltipHtml } from './tooltipHtml';


export function uiFavoriteButton(preset, geom) {
    var favoriteButton = {};

    favoriteButton.update = function(selection, markerClass) {


        //update selection on click
        var favorite = selection.selectAll('button.favorite.' + markerClass);
        var isMaki = /^maki-/.test(preset.icon);
        var icon = '#' + preset.icon + (isMaki ? '-11' : '');

        //add or remove preset button from bar
        if (favorite.size() == 1) {
            favorite.remove();
        } else {
            var buttonsEnter = selection.append('button')
                .attr('class', 'favorite ' + markerClass)
                .attr('tabindex', -1)
                .on('click.mode-buttons', function(mode) {
                    // // When drawing, ignore accidental clicks on mode buttons - #4042
                    // var currMode = context.mode().id;
                    // if (currMode.match(/^draw/) !== null) return;

                    // if (mode.id === currMode) {
                    //     context.enter(modeBrowse(context));
                    // } else {
                    //     context.enter(mode);
                    // }
                })
                .call(tooltip()
                    .placement('bottom')
                    .html(true)
                    .title(function(mode) {
                        return uiTooltipHtml("foo", "bar");
                    })
                )
                .call(svgIcon(icon))
                // .call(uiFavoriteIcon()
                //     .geometry(geom)
                //     .favorite(preset)
                // )
                // .call(uiPresetIcon()
                //     .geometry(geom)
                //     .preset(preset)
                // )
                .append('span')
                .attr('class', 'label')
                .text(preset.name());
        }

    }

    return favoriteButton;

}
