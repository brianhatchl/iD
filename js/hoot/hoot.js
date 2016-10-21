iD.hoot = function(context) {
    var hoot = {},
        availableTranslations,
        defaultTranslation = 'OSM',
        activeTranslation = defaultTranslation,
        activeSchema;

    function formatNodeJsPortOrPath(p) {
        if (isNaN(p)) {
            return '/' + p;
        } else {
            return ':' + p;
        }
    }

    function tagXmlToJson(xml) {
        var tags = [].map.call(xml.querySelectorAll('tag'), function(tag) {
            return {
                k: tag.getAttribute("k"),
                v: tag.getAttribute("v")
            };
        }).reduce(function(prev, curr) {
            prev[curr.k] = curr.v;
            return prev;
        }, {});

        return tags;
    }

    function schemaToPreset(schema) {
        var id = activeTranslation + '/' + schema.fcode;
        var fields = schema.columns.map(function(d) {
            var placeholder = d.defValue;
            if (d.enumerations) {
                var defs = d.enumerations.filter(function(e) {
                    return e.value === d.defValue;
                });
                if (defs.length == 1) {
                    placeholder = defs[0].name;
                }
            }
            var f = {
                key: d.name,
                id: activeTranslation + '/' + d.name,
                overrideLabel: d.desc,
                placeholder: placeholder,
                show: false
            };

            if (d.type === 'String') {
                f.type = 'text';
            } else if (d.type === 'enumeration') {
                //check if enumeration should use a checkbox
                if (d.enumerations.some(function(e) {
                    return (e.value === '1000' && e.name === 'False');
                })) {
                    f.type = 'check';
                } else {
                    f.type = 'combo';
                }
                f.strings = {options: d.enumerations.reduce(function(prev, curr) {
                    prev[curr.value] = curr.name;
                    return prev;
                }, {})};
            } else {
                f.type = 'number';
            }

            return f;
        });
        var preset = {
                        geometry: schema.geom.toLowerCase(),
                        tags: {},
                        'hoot:featuretype': schema.desc,
                        'hoot:tagschema': activeTranslation,
                        'hoot:fcode': schema.fcode,
                        name: schema.desc + ' (' + schema.fcode + ')',
                        fields: fields.map(function(f) {
                            return f.id;
                        })
                    };
        //Turn the array of fields into a map
        var fieldsMap = fields.reduce(function(prev, curr) {
            prev[curr.id] = iD.presets.Field(curr.id, curr);
            return prev;
        }, {});
        return iD.presets.Preset(id, preset, fieldsMap);
    }

    d3.json(window.location.protocol + '//' + window.location.hostname +
        formatNodeJsPortOrPath(iD.data.hoot.translationServerPort) + '/capabilities')
        .get(function(error, json) {
            if (error) {
                console.error(error);
            } else {
                availableTranslations = [defaultTranslation].concat(Object.keys(json));
            }
        });

    hoot.availableTranslations = function() {
        return availableTranslations;
    };

    hoot.defaultTranslation = function() {
        return defaultTranslation;
    };

    hoot.activeTranslation = function(_) {
        if (!arguments.length) return activeTranslation;
        activeTranslation = _;
        return hoot;
    };

    hoot.searchTranslatedSchema = function(value, geometry, callback) {
        d3.json(window.location.protocol + '//' + window.location.hostname +
            formatNodeJsPortOrPath(iD.data.hoot.translationServerPort) +
            '/schema?geometry='+ geometry + '&translation=' + activeTranslation + '&searchstr=' +
            value + '&maxlevdst=' + iD.data.hoot.presetMaxLevDistance +
            '&limit=' + iD.data.hoot.presetMaxDisplayNum, function(error, data) {
                if (error) {
                    console.error(error);
                } else {
                    callback(data);
                }
            });
    };

    hoot.filterSchemaKeys = function(value) {
        return activeSchema.columns.filter(function(d) {
            return d.name.startsWith(value.toUpperCase());
        }).map(function(d) {
            return {
                title: d.desc,
                value: d.name
            };
        });
    };

    hoot.filterSchemaValues = function(value) {
        var values = [];
        var columns = activeSchema.columns.filter(function(d) {
            return d.name === value.toUpperCase();
        });
        if (columns.length === 1) {
            if (columns[0].enumerations) {
                values = columns[0].enumerations.map(function(d) {
                    return {
                        title: d.name,
                        value: d.value
                    };
                });
            }
        }
        return values;
    };

    hoot.translateEntity = function(entity, callback) {
        //1. Turn osm xml into a coded tags
        var osmXml = '<osm version="0.6" upload="true" generator="hootenanny">' + JXON.stringify(entity.asJXON()) + '</osm>';
        d3.xml(window.location.protocol + '//' + window.location.hostname +
            formatNodeJsPortOrPath(iD.data.hoot.translationServerPort) +
            '/translateTo?translation=' + activeTranslation)
        .post(osmXml, function (error, translatedXml) {
            if (error) {
                console.error(error);
            } else {
                var tags = tagXmlToJson(translatedXml);
                //2. Turn osm xml into English tags
                d3.xml(window.location.protocol + '//' + window.location.hostname +
                    formatNodeJsPortOrPath(iD.data.hoot.translationServerPort) +
                    '/translateToEnglish?translation=' + activeTranslation)
                .post(osmXml, function (error, translatedEnglishXml) {
                    if (error) {
                        console.error(error);
                    } else {
                        var englishTags = tagXmlToJson(translatedEnglishXml);
                        //3. Use schema for fcode to generate a preset
                        //check for existing preset
                        var preset = context.presets().item(activeTranslation + '/' + (tags.FCODE || tags.F_CODE));
                        if (preset) {
                            callback(preset, tags, englishTags);
                        } else { //if not found generate from translation server
                            d3.json(window.location.protocol + '//' + window.location.hostname +
                                formatNodeJsPortOrPath(iD.data.hoot.translationServerPort) +
                                '/osmtotds?idelem=fcode&idval=' + (tags.FCODE || tags.F_CODE) +
                                '&geom=' + context.geometry(entity.id).replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) //toProperCase
                                 + '&translation=' + activeTranslation,
                                function(error, schema) {
                                    activeSchema = schema;
                                    var preset = schemaToPreset(schema);
                                    //Add the populated translated preset
                                    context.presets().collection.push(preset);
                                    callback(preset, tags, englishTags);
                                }
                            );
                        }
                    }
                });
            }
        });
    };

    hoot.addTagsForFcode = function(preset, callback) {
        d3.json(window.location.protocol + '//' + window.location.hostname +
            formatNodeJsPortOrPath(iD.data.hoot.translationServerPort) +
            '/tdstoosm?translation=' + activeTranslation + '&fcode=' + preset['hoot:fcode'],
            function(error, data) {
                if (error) {
                    console.error(error);
                } else {
                    preset.tags = data.attrs;
                    callback(iD.presets.Preset(preset.id, preset, {}));
                }
            });
    };

    hoot.translateToOsm = function(tags, translatedEntity, onInput, callback) {
        //Turn translated tag xml into a osm tags
        var translatedXml = '<osm version="0.6" upload="true" generator="hootenanny">' + JXON.stringify(translatedEntity.asJXON()) + '</osm>';
        d3.xml(window.location.protocol + '//' + window.location.hostname +
            formatNodeJsPortOrPath(iD.data.hoot.translationServerPort) +
            '/translateFrom?translation=' + activeTranslation)
        .post(translatedXml, function (error, osmXml) {
            if (error) {
                console.error(error);
            } else {
                var osmTags = tagXmlToJson(osmXml);
                var changed = d3.entries(osmTags).reduce(function(diff, pair) {
                    if (tags[pair.key]) {
                        if (tags[pair.key] !== pair.value) { //tag is changed
                            diff[pair.key] = pair.value;
                        }
                    } else { //tag is added
                        diff[pair.key] = pair.value;
                    }
                    return diff;
                }, {});
                //remove existing tags not in translated response
                d3.entries(tags).forEach(function(t) {
                    if (osmTags[t.key] === undefined) {
                        changed[t.key] = undefined; //tag is removed
                    }
                });
                callback(changed, onInput);
            }
        });
    };

    return hoot;
};
