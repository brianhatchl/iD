iD.ui.SchemaSwitcher = function(context) {
    var event = d3.dispatch('change');

    function schemaSwitcher(div, callback) {

        var switcher = div
            .classed('tag-schema', true);
        switcher.append('label')
            .html('Tag Schema:');
        var input = switcher.append('input')
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
                context.hoot().activeTranslation(input.value());
                if (callback && typeof callback === 'function') callback();
            })
            ;
    }

    return d3.rebind(schemaSwitcher, event, 'on');
};
