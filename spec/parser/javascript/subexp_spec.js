import javascript from 'src/js/parser/javascript/parser.js';
import Node from 'src/js/parser/javascript/node.js';
import _ from 'lodash';
import Snap from 'snapsvg';
import Q from 'q';

describe('parser/javascript/subexp.js', function() {

  beforeEach(function() {
    Node.state = { groupCounter: 1 };
  });

  _.forIn({
    '(test)': {
      label: 'group #1',
      regexp: jasmine.objectContaining({ textValue: 'test' }),
      proxy: undefined,
      state: { groupCounter: 2 }
    },
    '(?=test)': {
      label: 'positive lookahead',
      regexp: jasmine.objectContaining({ textValue: 'test' }),
      proxy: undefined,
      state: { groupCounter: 1 }
    },
    '(?!test)': {
      label: 'negative lookahead',
      regexp: jasmine.objectContaining({ textValue: 'test' }),
      proxy: undefined,
      state: { groupCounter: 1 }
    },
    '(?:test)': {
      label: '',
      regexp: jasmine.objectContaining({ textValue: 'test' }),
      proxy: jasmine.objectContaining({ textValue: 'test' }),
      state: { groupCounter: 1 }
    }
  }, (content, str) => {
    it(`parses "${str}" as a Subexp`, function() {
      var parser = new javascript.Parser(str);
      expect(parser.__consume__subexp()).toEqual(jasmine.objectContaining(content));
    });
  });

  describe('_anchor property', function() {

    it('applies the local transform matrix to the anchor from the regexp', function() {
      var node = new javascript.Parser('(test)').__consume__subexp();

      node.regexp = {
        anchor: {
          ax: 10,
          ax2: 15,
          ay: 20
        }
      };

      spyOn(node, 'transform').and.returnValue({
        localMatrix: Snap.matrix().translate(3, 8)
      });

      expect(node._anchor).toEqual({
        ax: 13,
        ax2: 18,
        ay: 28
      });
    });

  });

  describe('#_render', function() {

    beforeEach(function() {
      this.renderDeferred = Q.defer();

      this.node = new javascript.Parser('(test)').__consume__subexp();
      this.node.label = 'example label';
      this.node.regexp = jasmine.createSpyObj('regexp', ['render']);
      this.node.container = jasmine.createSpyObj('container', ['addClass', 'group']);

      this.node.regexp.render.and.returnValue(this.renderDeferred.promise);
    });

    it('renders the regexp', function() {
      this.node._render();
      expect(this.node.regexp.render).toHaveBeenCalled();
    });

    it('renders a labeled box', function(done) {
      spyOn(this.node, 'renderLabeledBox');
      this.renderDeferred.resolve();
      this.node._render()
        .then(() => {
          expect(this.node.renderLabeledBox).toHaveBeenCalledWith('example label', this.node.regexp, { padding: 10 });
        })
        .finally(done)
        .done();
    });

  });

});
