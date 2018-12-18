import { t } from '../util/locale';
import { behaviorOperation } from '../behavior/index';
import _clone from 'lodash-es/clone';
import { select as d3_select } from 'd3-selection';
import { svgIcon } from '../svg';
import { tooltip } from '../util/tooltip';
import { uiTooltipHtml } from '../ui/tooltipHtml';

import {
    modeAddArea,
    modeAddLine,
    modeAddPoint
} from '../modes';


export function operationCreateMore(selectedIDs, context) {
    var entityId = selectedIDs[0];
    var entity = context.hasEntity(entityId);
    var cloneTags = _clone(entity.tags);
    var preset, isMaki, icon;
    preset = context.presets().match(entity, context.graph());
    if (preset) {
        isMaki = /^maki-/.test(preset.icon);
        icon = '#' + preset.icon + (isMaki ? '-11' : '');
    }

    var mode;
    switch (entity.type) {
        case 'node':
            mode = modeAddPoint(context);
            break;
        case 'way':
            mode = (entity.isArea()) ? modeAddArea(context) : modeAddLine(context);
            break;
    }

    var operation = function() {
        context.enter(mode, true/*lock*/, cloneTags);
        //Move this to modes.js
        if (preset) {
            var button = d3_select('button.add-button.active');
            button.call(svgIcon(icon));
            button.selectAll('span')
                .text(preset.name());
            button.select('.tooltip').remove();
            button.call(tooltip()
                .placement('bottom')
                .html(true)
                .title(function(mode) {
                    return uiTooltipHtml(t('operations.create_more.tooltip'), mode.key);
                })
            );
        }
    };


    operation.available = function() {
        return selectedIDs.length === 1
            && entity.hasInterestingTags();
    };


    operation.disabled = function() {
        return false;
    };


    operation.tooltip = function() {
        return t('operations.create_more.description');
    };

    operation.annotation = function() {
        return t('operations.create_more.annotation');
    };


    operation.id = 'createmore';
    operation.keys = [t('operations.create_more.key')];
    operation.title = t('operations.create_more.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
