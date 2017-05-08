var test = require('tape');
var fileData = require('./data');

var tokenizeKV = require('./tokenize');

test('basic usage', function (t) {
  t.ok(fileData, 'can read file data');

  var data = null;
  t.doesNotThrow(function () {
    data = tokenizeKV(fileData.test);
  }, 'runs without exception');

  t.ok(data);

  t.deepEqual(data[0].tokens, [ '"', 'DOTAAbilities', '"' ], 'reads basic first line');
  t.deepEqual(data[3].tokens, [ '"', 'BaseClass', '"', '       ', '"', '   ', '"' ], 'reads line with blanks');
  t.deepEqual(data[4].tokens, [ '"', 'AbilityType', '"', '         ', '"', 'DOTA_ABILITY_TYPE_BASIC', '"' ], 'reads other basic line');

  t.end();
});
