var tokenizeKV = require('./tokenize');
var debug = require('debug')('parseKV:parse');

module.exports = parseKV;

function parseKV (data) {
  var lines = tokenizeKV(data);
  var result = {
    values: {}
  };
  var currentResult = result;
  var popStack = rootPopStack;

  // state variables
  var stack = [];
  var key = null;
  var value = null;
  var temporaryStack = '';
  var isInQuotes = false;
  var isInComment = false;
  var isEscaping = false;

  lines.forEach(function (entry, i) {
    var line = entry.tokens;
    line.forEach(function (token) {
      if (isInComment) {
        return;
      }
      switch (token) {
        case '\\':
          isEscaping = true;
          return;
        case '"':
          if (isEscaping) {
            isEscaping = false;
            break;
          }
          isInQuotes = !isInQuotes;
          if (!isInQuotes && temporaryStack.length) {
            if (!key) {
              key = temporaryStack;
            } else if (!value) {
              value = temporaryStack;
            } else if (isInComment) {
              // do nothing, this a comment
            } else if (key && value) {
              currentResult.values[key] = value;
              key = temporaryStack;
              value = null;
            } else {
              debug(entry);
              throw new Error('Too many values on line ' + entry.line);
            }
            temporaryStack = '';
          }
          return;
        case '{':
          if (!temporaryStack) {
            if (key && !value) {
              temporaryStack = key;
              key = '';
            } else {
              debug(entry);
              throw new Error('Unexpected "{" character on line ' + entry.line);
            }
          }
          pushStack(temporaryStack);
          temporaryStack = '';
          return;
        case '}':
          return popStack();
      }
      if (isInQuotes) {
        if (!stack.length) {
          // root level title
          debug('opening category', token);
        }
        if (isEscaping) {
          isEscaping = false;
          temporaryStack += '\\';
        }
        temporaryStack += token;
      } else if (token.substr(0, 2) === '//') {
        isInComment = true;
      } else {
        debug('found stuff outside of quotes', line);
        throw new Error('Unexpected token "' + token + '" on line ' + entry.line);
      }
    });
    if (isInQuotes) {
      debug('Invalid line: ', entry);
      // throw new Error('Unmatched close quotation on line ' + entry.line);
      return;
    }
    if (temporaryStack.length) {
      debug('leftover stack', temporaryStack);
    }
    temporaryStack = '';
    if (key && !value) {
      temporaryStack = key;
    } else if (key && value) {
      currentResult.values[key] = value;
    }
    key = null;
    value = null;
    isInComment = false;
  });

  return result;

  function pushStack (title) {
    var _popStack = popStack;
    var parentResult = currentResult;

    debug('pushing to stack', title);
    stack.push(title);

    currentResult[title] = {
      values: {}
    };

    currentResult = currentResult[title];

    popStack = function () {
      debug('stack pop', stack.pop());
      popStack = _popStack;
      currentResult = parentResult;
    };
  }

  function rootPopStack () {
    throw new Error('Unexpected "}"');
  }
}
