(function(){require.register('glass-platform/ui/Control/Element',function(module,exports,require){// Generated by CoffeeScript 1.6.2
(function() {
  var Component, Element, draw, exports;

  Component = require('../Component');

  module.exports = exports = Element = Component.extend({
    id: 'glass.ui.Element',
    properties: {
      visible: true,
      draw: draw = function(c) {
        if (this.visible) {
          return this.inner(draw, c);
        }
      },
      getBoundingRect: function() {},
      getBoundingSphere: function() {},
      getBoundingBox: function() {},
      pick: function(ray, radius) {}
    }
  });

}).call(this);

/*
//@ sourceMappingURL=Element.map
*/

})})()