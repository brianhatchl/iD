iD.ui.SchemaSwitcher = function(context) {
    var event = d3.dispatch('change'),
        foo;

    function schemaSwitcher(div) {
        // div.classed('preset-form', true);

        var switcher = div
            .classed('tag-schema', true);
        switcher.append('label')
            .html('Tag Schema:');
        switcher.append('input')
            // .attr('id', 'presettranstype')
            .attr('type', 'text')
            .attr('value', context.hoot().activeTranslation())
            .call(d3.combobox()
                .data(_.map(context.hoot().availableTranslations(), function (n) {
                    return {
                        value: n,
                        title: n
                    };
                }))
            )
            .on('change', function(){
                context.hoot().activeTranslation(switcher.value());
        //     var container = d3.select('#preset-list-container');
        //     container.selectAll('.preset-list-item').remove();
        //     presets = context.presets().defaults(geometry, 72);
        //     // Get the current translation filter type
        //     var filterType = d3.select('#presettranstype').value();
        //     var filteredCollection = getFilteredPresets(filterType, presets.collection);
        //     iD.util.setCurrentTranslation(filterType);
        //     // Replace with filtered
        //     presets.collection = filteredCollection;

        //     container.call(drawList, presets);
        //     if(!d3.select('#entity_editor_presettranstype').empty()){
        //         if(d3.select('#entity_editor_presettranstype').value() !== filterType){
        //             iD.util.changeComboValue('#entity_editor_presettranstype',filterType);
        //         }
        //     }

        //     // Trigger search on input value
        //     search.trigger('input');
            })
            ;
    }

    return d3.rebind(schemaSwitcher, event, 'on');
};
