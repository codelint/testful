/**
 * Date: 2022/3/2
 * Time: 16:14
 * Author: Ray.Zhang <inotseeyou@foxmail.com>
 */

let index = {};
module['exports'] = index;

index.themes = {};

let util = require('util');
let ansiStyles = index.styles = require('./styles');
let defineProps = Object.defineProperties;
let newLineRegex = new RegExp(/[\r\n]+/g);

index.supportsColor = require('./system/supports-colors').supportsColor;

if (typeof index.enabled === 'undefined') {
  index.enabled = index.supportsColor() !== false;
}

index.enable = function() {
  index.enabled = true;
};

index.disable = function() {
  index.enabled = false;
};

index.stripColors = index.strip = function(str) {
  return ('' + str).replace(/\x1B\[\d+m/g, '');
};

// eslint-disable-next-line no-unused-vars
let stylize = index.stylize = function stylize(str, style) {
  if (!index.enabled) {
    return str+'';
  }

  let styleMap = ansiStyles[style];

  // Stylize should work for non-ANSI styles, too
  if(!styleMap && style in index){
    // Style maps like trap operate as functions on strings;
    // they don't have properties like open or close.
    return index[style](str);
  }

  return styleMap.open + str + styleMap.close;
};

let matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
let escapeStringRegexp = function(str) {
  if (typeof str !== 'string') {
    throw new TypeError('Expected a string');
  }
  return str.replace(matchOperatorsRe, '\\$&');
};

function build(_styles) {
  let builder = function builder() {
    return applyStyle.apply(builder, arguments);
  };
  builder._styles = _styles;
  // __proto__ is used because we must return a function, but there is
  // no way to create a function with a different prototype.
  builder.__proto__ = proto;
  return builder;
}

let styles = (function() {
  let ret = {};
  ansiStyles.grey = ansiStyles.gray;
  Object.keys(ansiStyles).forEach(function(key) {
    ansiStyles[key].closeRe =
      new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');
    ret[key] = {
      get: function() {
        return build(this._styles.concat(key));
      },
    };
  });
  return ret;
})();

let proto = defineProps(function colors() {}, styles);

function applyStyle() {
  let args = Array.prototype.slice.call(arguments);

  let str = args.map(function(arg) {
    // Use weak equality check so we can colorize null/undefined in safe mode
    if (arg != null && arg.constructor === String) {
      return arg;
    } else {
      return util.inspect(arg);
    }
  }).join(' ');

  if (!index.enabled || !str) {
    return str;
  }

  let newLinesPresent = str.indexOf('\n') != -1;

  let nestedStyles = this._styles;

  let i = nestedStyles.length;
  while (i--) {
    let code = ansiStyles[nestedStyles[i]];
    str = code.open + str.replace(code.closeRe, code.open) + code.close;
    if (newLinesPresent) {
      str = str.replace(newLineRegex, function(match) {
        return code.close + match + code.open;
      });
    }
  }

  return str;
}

index.setTheme = function(theme) {
  if (typeof theme === 'string') {
    console.log('colors.setTheme now only accepts an object, not a string.  ' +
      'If you are trying to set a theme from a file, it is now your (the ' +
      'caller\'s) responsibility to require the file.  The old syntax ' +
      'looked like colors.setTheme(__dirname + ' +
      '\'/../themes/generic-logging.js\'); The new syntax looks like '+
      'colors.setTheme(require(__dirname + ' +
      '\'/../themes/generic-logging.js\'));');
    return;
  }
  for (let style in theme) {
    (function(style) {
      index[style] = function(str) {
        if (typeof theme[style] === 'object') {
          let out = str;
          for (let i in theme[style]) {
            out = index[theme[style][i]](out);
          }
          return out;
        }
        return index[theme[style]](str);
      };
    })(style);
  }
};

function init() {
  let ret = {};
  Object.keys(styles).forEach(function(name) {
    ret[name] = {
      get: function() {
        return build([name]);
      },
    };
  });
  return ret;
}

let sequencer = function sequencer(map, str) {
  let exploded = str.split('');
  exploded = exploded.map(map);
  return exploded.join('');
};

// custom formatter methods
// index.trap = require('./custom/trap');
// index.zalgo = require('./custom/zalgo');

// maps
// index.maps = {};
// index.maps.america = require('./maps/america')(index);
// index.maps.zebra = require('./maps/zebra')(index);
// index.maps.rainbow = require('./maps/rainbow')(index);
// index.maps.random = require('./maps/random')(index);

for (let map in index.maps) {
  (function(map) {
    index[map] = function(str) {
      return sequencer(index.maps[map], str);
    };
  })(map);
}

defineProps(index, init());
