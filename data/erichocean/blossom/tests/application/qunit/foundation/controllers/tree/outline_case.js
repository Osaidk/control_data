// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2010 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/*globals throws */

var root, content, controller, extra, flattened;

var TestObject = SC.Object.extend({
  toString: function() { return "TestObject(%@)".fmt(this.get('title')); }
});


suite("SC.TreeController - tree_case", {
  setup: function() {
    
    // setup a basic tree 
    content = [
      TestObject.create({
        title: "A",
        isExpanded: true,
        outline: 0,
        
        children: [
          TestObject.create({ title: "A.i", outline: 1 }),

          TestObject.create({ title: "A.ii",
            outline: 1,
            isExpanded: false,
            children: [
              TestObject.create({ title: "A.ii.1", outline: 2 }),
              TestObject.create({ title: "A.ii.2", outline: 2 }),
              TestObject.create({ title: "A.ii.3", outline: 2 })]
          }),

          TestObject.create({ title: "A.iii", outline: 1 })]
      }),

      TestObject.create({
        title: "B",
        isExpanded: true,
        outline: 0,
        children: [
          TestObject.create({ title: "B.i",
            isExpanded: true,
            outline: 1,
            children: [
              TestObject.create({ title: "B.i.1", outline: 2 }),
              TestObject.create({ title: "B.i.2", outline: 2 }),
              TestObject.create({ title: "B.i.3", outline: 2 })]
          }),

          TestObject.create({ title: "B.ii", outline: 1 }),
          TestObject.create({ title: "B.iii", outline: 1 })]
      }),

      TestObject.create({
        outline: 0,
        title: "C"
      })];

    root = TestObject.create({
      title: "ROOT",
      children: content,
      isExpanded: true
    });
    
    flattened = [
      content[0],
      content[0].children[0],
      content[0].children[1],
      content[0].children[2],
      content[1],
      content[1].children[0],
      content[1].children[0].children[0],
      content[1].children[0].children[1],
      content[1].children[0].children[2],
      content[1].children[1],
      content[1].children[2],
      content[2]];

    controller = SC.TreeController.create({ 
      content: root,
      treeItemChildrenKey: "children",
      treeItemIsExpandedKey: "isExpanded",
      treeItemIsGrouped: true 
    });
  },
  
  teardown: function() {
    controller.destroy();
  }
});

test("arrangedObjects", function() {
  ok(controller.get('arangedObjects') !== controller, 'should have its own arrangedObjects');
  
  var ao = controller.get('arrangedObjects');
  equals(ao.get('length'), flattened.get('length'), 'arrangedObjects should have expected length');
  
  var idx, len = flattened.get('length');
  for(idx=0;idx<len;idx++) {
    equals(ao.objectAt(idx), flattened[idx], 'arrangedObjects.objectAt(%@) should be expected object in flattened[%@]'.fmt(idx,idx));
  }
});
