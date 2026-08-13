'use strict';

const build = require('@microsoft/sp-build-web');

build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);

// legacy.scss est deliberement une feuille de style globale (non "*.module.scss") :
// elle reprend telle quelle les selecteurs non prefixes du prototype HTML porte
// (cf. code-app/src/legacy.css), donc pas de CSS Modules pour ce fichier.
build.addSuppression(/filename should end with module\.sass or module\.scss/);

var getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  var result = getTasks.call(build.rig);

  result.set('serve', result.get('serve-deprecated'));

  return result;
};

build.initialize(require('gulp'));
