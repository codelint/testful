'use strict';

module.exports = function(flag, argv) {
  argv = argv || process.argv;

  let terminatorPos = argv.indexOf('--');
  let prefix = /^-{1,2}/.test(flag) ? '' : '--';
  let pos = argv.indexOf(prefix + flag);

  return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
};