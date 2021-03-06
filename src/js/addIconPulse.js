"use strict";

// For a yet unknown reason, this line works while it shouldn't (L should be undefined)
module.exports = function(L){
    
    L.Icon.Pulse = L.DivIcon.extend({

        options: {
            className: '',
            iconSize: [12,12],
            fillColor: 'red',
            pulseColor: 'green'
        },

        initialize: function (options) {
            L.setOptions(this,options);

            // creating unique class name
            var uniqueClassName = 'lpi-'+ new Date().getTime()+'-'+Math.round(Math.random()*100000);

            this.options.className = this.options.className+' leaflet-pulsing-icon '+uniqueClassName;

            // prepare styles
            var css = '.'+uniqueClassName+'{background-color:'+this.options.fillColor+';}';
            css += '.'+uniqueClassName+':after{box-shadow: 0 0 6px 2px '+this.options.pulseColor+';}';

            // CREATE STYLE ELEMENT
            var styleEl=document.createElement('style');
            if (styleEl.styleSheet)
                styleEl.styleSheet.cssText=css;
            else
                styleEl.appendChild(document.createTextNode(css));

            // appending style element to document
            document.getElementsByTagName('head')[0].appendChild(styleEl);

            // initialize icon
            L.DivIcon.prototype.initialize.call(this,options);
        }
    });

    L.icon.pulse = function (options) {
        return new L.Icon.Pulse(options);
    };


    L.Marker.Pulse = L.Marker.extend({
        initialize: function (latlng,options) {
            options.icon = L.icon.pulse(options);
            L.Marker.prototype.initialize.call(this, latlng, options);
        }
    });

    L.marker.pulse = function (latlng,options) {
        return new L.Marker.Pulse(latlng,options);
    };
};
