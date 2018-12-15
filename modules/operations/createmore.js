import { t } from '../util/locale';
import { behaviorOperation } from '../behavior/index';
import _clone from 'lodash-es/clone';

import {
    modeAddArea,
    modeAddLine,
    modeAddPoint
} from '../modes';


export function operationCreateMore(selectedIDs, context) {
    var entityId = selectedIDs[0];
    var entity = context.hasEntity(entityId);
    var cloneTags = _clone(entity.tags);
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
