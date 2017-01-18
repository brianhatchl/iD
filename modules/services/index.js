import serviceDigitalGlobe from './dg';
import serviceMapillary from './mapillary';
import serviceNominatim from './nominatim';
import serviceOsm from './osm';
import serviceTaginfo from './taginfo';
import serviceWikidata from './wikidata';
import serviceWikipedia from './wikipedia';

export var services = {
    dg: serviceDigitalGlobe,
    mapillary: serviceMapillary,
    nominatim: serviceNominatim,
    osm: serviceOsm,
    taginfo: serviceTaginfo,
    wikidata: serviceWikidata,
    wikipedia: serviceWikipedia
};
