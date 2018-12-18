export function svgIcon(name, svgklass, useklass) {
    return function drawIcon(selection) {
        var sel = selection.selectAll('svg')
            .data([0]);
            sel = sel.enter()
            .append('svg')
            .merge(sel);
            sel.attr('class', 'icon ' + (svgklass || ''))
        var use = sel.selectAll('use')
            .data([0]);
            use = use.enter().append('use')
            .merge(use);
            use.attr('xlink:href', name)
            .attr('class', useklass);
    };
}
