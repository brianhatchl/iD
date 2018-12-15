import _isEmpty from 'lodash-es/isEmpty';
import { t } from '../util/locale';
import { actionAddEntity } from '../actions';
import { actionChangeTags } from '../actions';
import { behaviorDraw } from '../behavior';
import { modeBrowse, modeSelect } from './index';
import { osmNode } from '../osm';
import { actionAddMidpoint } from '../actions';


export function modeAddPoint(context) {
    var mode = {
        id: 'add-point',
        button: 'point',
        title: t('modes.add_point.title'),
        description: t('modes.add_point.description'),
        key: '1'
    };

    var behavior = behaviorDraw(context)
        .tail(t('modes.add_point.tail'))
        .on('click', add)
        .on('clickWay', addWay)
        .on('clickNode', addNode)
        .on('cancel', cancel)
        .on('finish', cancel);


    function add(loc) {
        var node = osmNode({ loc: loc });

        context.perform(
            actionAddEntity(node),
            t('operations.add.annotation.point')
        );

        //Apply cloned tags to new feature [part of tool/preset lock]
        if (!_isEmpty(context.cloneTags())) {
            context.perform(
                actionChangeTags(node.id, context.cloneTags()),
                t('operations.change_tags.annotation')
            );
        }

        context.enter(
            modeSelect(context, [node.id]).newFeature(true)
        );

        //Re-activate locked tool [part of tool/preset lock]
        if (context.lock()) {
            context.enter(context.lockMode());
        }
    }


    function addWay(loc, edge) {
        var node =  osmNode();

        context.perform(
            actionAddMidpoint({loc: loc, edge: edge}, node),
            t('operations.add.annotation.vertex')
        );

        context.enter(
            modeSelect(context, [node.id]).newFeature(true)
        );
    }


    function addNode(node) {
        add(node.loc);
    }


    function cancel() {
        context.enter(modeBrowse(context));
    }


    mode.enter = function() {
        context.install(behavior);
    };


    mode.exit = function() {
        context.uninstall(behavior);
    };


    return mode;
}
