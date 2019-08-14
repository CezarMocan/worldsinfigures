webpackHotUpdate("static/development/pages/index.js",{

/***/ "./modules/ProjectionsMetadata.js":
/*!****************************************!*\
  !*** ./modules/ProjectionsMetadata.js ***!
  \****************************************/
/*! exports provided: projectionsMetadata, getFlagEmojiForProjection, getGenderEmojiForProjection, getYearForProjection, getAuthorNameForProjection */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "projectionsMetadata", function() { return projectionsMetadata; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getFlagEmojiForProjection", function() { return getFlagEmojiForProjection; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getGenderEmojiForProjection", function() { return getGenderEmojiForProjection; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getYearForProjection", function() { return getYearForProjection; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getAuthorNameForProjection", function() { return getAuthorNameForProjection; });
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/defineProperty */ "./node_modules/@babel/runtime-corejs2/helpers/esm/defineProperty.js");


var _projectionsMetadata;

var projectionsMetadata = (_projectionsMetadata = {
  'equirectangular': {
    flagEmoji: '🇬🇷',
    genderEmoji: '👨🏼',
    year: '100 C.E.',
    authorName: 'Marinus of Tyre'
  },
  'albers': {
    flagEmoji: '🇩🇪',
    genderEmoji: '👨🏼',
    year: '1805',
    authorName: 'Heinrich C. Albers'
  },
  'azimuthal equal area': {
    flagEmoji: '',
    genderEmoji: '',
    year: '',
    authorName: ''
  },
  'azimuthal equidistant': {
    flagEmoji: '',
    genderEmoji: '',
    year: '',
    authorName: ''
  },
  'conic conformal': {
    flagEmoji: '🇨🇭',
    genderEmoji: '👨🏼',
    year: '1772',
    authorName: 'Johann Heinrich Lambert'
  },
  'conic equal area': {
    flagEmoji: '',
    genderEmoji: '',
    year: '',
    authorName: ''
  }
}, Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, "equirectangular", {
  flagEmoji: '🇬🇷',
  genderEmoji: '👨🏼',
  year: '100 C.E.',
  authorName: 'Marinus of Tyre'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'conic equidistant', {
  flagEmoji: '🇬🇷',
  genderEmoji: '👨🏼',
  year: '150 A.D.',
  authorName: 'Claudius Ptolemy'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'equal earth', {
  flagEmoji: '🇸🇮 🇦🇺 🇺🇸',
  genderEmoji: '👨🏼 👨🏼 👨🏼',
  year: '2018',
  authorName: 'Bojan Šavrič, Bernhard Jenny, Tom Patterson'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'gnomonic', {
  flagEmoji: '',
  genderEmoji: '',
  year: '',
  authorName: ''
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'mercator', {
  flagEmoji: '🇧🇪',
  genderEmoji: '👨🏼',
  year: '1569',
  authorName: 'Gerardus Mercator'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'natural earth1', {
  flagEmoji: '🇺🇸',
  genderEmoji: '👨🏼',
  year: '2012',
  authorName: 'Tom Patterson'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'orthographic', {
  flagEmoji: '',
  genderEmoji: '',
  year: '',
  authorName: ''
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'stereographic', {
  flagEmoji: '',
  genderEmoji: '',
  year: '',
  authorName: ''
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'transverse mercator', {
  flagEmoji: '🇧🇪',
  genderEmoji: '👨🏼',
  year: '1569',
  authorName: 'Gerardus Mercator'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'airy', {
  flagEmoji: '🇬🇧',
  genderEmoji: '👨🏼',
  year: '1861',
  authorName: 'George Biddell Airy'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'aitoff', {
  flagEmoji: '🇷🇺',
  genderEmoji: '👨🏼',
  year: '1889',
  authorName: 'David Aitoff'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'armadillo', {
  flagEmoji: '🇭🇺🇺🇸',
  genderEmoji: '👨🏼',
  year: '',
  authorName: 'Erwin Raisz'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'august', {
  flagEmoji: '',
  genderEmoji: '👨🏼 👨🏼',
  year: '1874',
  authorName: 'Friedrich W. O. August, G. Bellermann'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'baker', {
  flagEmoji: '',
  genderEmoji: '👨🏼',
  year: '1986',
  authorName: 'J.G.P. Baker'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'berghaus', {
  flagEmoji: '🇩🇪',
  genderEmoji: '👨🏼',
  year: '1879',
  authorName: 'Heinrich Berghaus'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'bertin', {
  flagEmoji: '🇫🇷',
  genderEmoji: '👨🏼',
  year: '1953',
  authorName: 'Jacques Bertin'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'boggs', {
  flagEmoji: '🇺🇸',
  genderEmoji: '👨🏼',
  year: '1929',
  authorName: 'Samuel Whittemore Boggs'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'bonne', {
  flagEmoji: '🇫🇷',
  genderEmoji: '',
  year: 'approx. 1600',
  authorName: 'Unknown'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'bottomley', {
  flagEmoji: '🇬🇧',
  genderEmoji: '👨🏼',
  year: 'approx. 2000',
  authorName: 'Henry Bottomley'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'bromley', {
  flagEmoji: '',
  genderEmoji: '👨🏼',
  year: '1965',
  authorName: 'R.H. Bromley'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'chamberlin', {
  flagEmoji: '🇺🇸',
  genderEmoji: '👨🏼',
  year: '1946',
  authorName: 'Wellman Chamberlin'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'chamberlin africa', {
  flagEmoji: '🇺🇸',
  genderEmoji: '👨🏼',
  year: '1946',
  authorName: 'Wellman Chamberlin'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'collignon', {
  flagEmoji: '🇫🇷',
  genderEmoji: '👨🏼',
  year: '1865',
  authorName: 'Edouard Collignon'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'craig', {
  flagEmoji: '🇬🇧🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  genderEmoji: '👨🏼',
  year: '1909',
  authorName: 'James Ireland Craig'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'craster', {
  flagEmoji: '🇬🇧',
  genderEmoji: '👨🏼',
  year: '1929',
  authorName: 'John Evelyn Edmund Craster'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'eckert1', {
  flagEmoji: '🇩🇪',
  genderEmoji: '👨🏼',
  year: '1906',
  authorName: 'Max Eckert-Greifendorff'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'eckert2', {
  flagEmoji: '🇩🇪',
  genderEmoji: '👨🏼',
  year: '1906',
  authorName: 'Max Eckert-Greifendorff'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'eckert3', {
  flagEmoji: '🇩🇪',
  genderEmoji: '👨🏼',
  year: '1906',
  authorName: 'Max Eckert-Greifendorff'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'eckert4', {
  flagEmoji: '🇩🇪',
  genderEmoji: '👨🏼',
  year: '1906',
  authorName: 'Max Eckert-Greifendorff'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'eckert5', {
  flagEmoji: '🇩🇪',
  genderEmoji: '👨🏼',
  year: '1906',
  authorName: 'Max Eckert-Greifendorff'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'eckert6', {
  flagEmoji: '🇩🇪',
  genderEmoji: '👨🏼',
  year: '1906',
  authorName: 'Max Eckert-Greifendorff'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'eisenlohr', {
  flagEmoji: '🇩🇪',
  genderEmoji: '👨🏼',
  year: '1870',
  authorName: 'Friedrich Eisenlohr'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'fahey', {
  flagEmoji: '🇺🇸',
  genderEmoji: '👨🏼',
  year: '1975',
  authorName: 'Lawrence Fahey'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'foucaut', {
  flagEmoji: '🇫🇷',
  genderEmoji: '👨🏼',
  year: '1862',
  authorName: 'Capitaine De Prépetit Foucaut'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'foucaut sinusoidal', {
  flagEmoji: '🇫🇷',
  genderEmoji: '👨🏼',
  year: '1862',
  authorName: 'Capitaine De Prépetit Foucaut'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'gilbert', {
  flagEmoji: '🇺🇸',
  genderEmoji: '👨🏼',
  year: 'approx. 1970',
  authorName: 'Edgar Gilbert'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'gingery', {
  flagEmoji: '🇺🇸',
  genderEmoji: '👨🏼',
  year: '1944',
  authorName: 'Walter G. Gingery'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'ginzburg4', {
  flagEmoji: '🇷🇺',
  genderEmoji: '👨🏼',
  year: '1939-1949',
  authorName: 'G.A. Ginzburg'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'ginzburg5', {
  flagEmoji: '🇷🇺',
  genderEmoji: '👨🏼',
  year: '1950',
  authorName: 'G.A. Ginzburg'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'ginzburg6', {
  flagEmoji: '🇷🇺',
  genderEmoji: '👨🏼',
  year: '1950',
  authorName: 'G.A. Ginzburg'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'ginzburg8', {
  flagEmoji: '🇷🇺',
  genderEmoji: '👨🏼',
  year: '1944',
  authorName: 'G.A. Ginzburg'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'ginzburg9', {
  flagEmoji: '🇷🇺',
  genderEmoji: '👨🏼',
  year: '1966',
  authorName: 'G.A. Ginzburg'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'gringorten', {
  flagEmoji: '🇨🇦',
  genderEmoji: '👨🏼',
  year: '1972',
  authorName: 'Irving Gringorten'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'guyou', {
  flagEmoji: '🇫🇷',
  genderEmoji: '👨🏼',
  year: '1887',
  authorName: 'Emile Guyou'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'hammer', {
  flagEmoji: '🇩🇪',
  genderEmoji: '👨🏼',
  year: '1892',
  authorName: 'Ernst Hammer'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'hammer retroazimuthal', {
  flagEmoji: '🇩🇪',
  genderEmoji: '👨🏼',
  year: '1892',
  authorName: 'Ernst Hammer'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'healpix', {
  flagEmoji: '🇵🇱',
  genderEmoji: '👨🏼',
  year: '1998',
  authorName: 'Krzysztof M. Górski'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'hill', {
  flagEmoji: '',
  genderEmoji: '👨🏼',
  year: '1958',
  authorName: 'Karl O. Hill'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'homolosine', {
  flagEmoji: '🇺🇸',
  genderEmoji: '👨🏼',
  year: '1923',
  authorName: 'John Paul Goode'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'hufnagel', {
  flagEmoji: '🇩🇪',
  genderEmoji: '👨🏼',
  year: '1989',
  authorName: 'Herbert Hufnagel'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'hyperelliptical', {
  flagEmoji: '🇺🇸🇨🇭',
  genderEmoji: '👨🏼',
  year: '1973',
  authorName: 'Waldo Tobler'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'interrupted boggs', {
  flagEmoji: '🇺🇸',
  genderEmoji: '👨🏼',
  year: '1929',
  authorName: 'Samuel Whittemore Boggs'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'interrupted homolosine', {
  flagEmoji: '🇺🇸',
  genderEmoji: '👨🏼',
  year: '1923',
  authorName: 'John Paul Goode'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'interrupted mollweide', {
  flagEmoji: '🇩🇪',
  genderEmoji: '👨🏼',
  year: '1805',
  authorName: 'Karl Mollweide'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'interrupted mollweide hemispheres', {
  flagEmoji: '🇩🇪',
  genderEmoji: '👨🏼',
  year: '1805',
  authorName: 'Karl Mollweide'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'interrupted sinu mollweide', {
  flagEmoji: '🇩🇪',
  genderEmoji: '👨🏼',
  year: '1805',
  authorName: 'Karl Mollweide'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'interrupted sinusoidal', {
  flagEmoji: '',
  genderEmoji: '',
  year: 'approx. 1570',
  authorName: ''
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'kavrayskiy7', {
  flagEmoji: '🇷🇺',
  genderEmoji: '👨🏼',
  year: '1939',
  authorName: 'Vladimir Kavrayskiy'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'lagrange', {
  flagEmoji: '🇨🇭',
  genderEmoji: '👨🏼',
  year: '1772',
  authorName: 'Johann Heinrich Lambert'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'larivee', {
  flagEmoji: '🇨🇦',
  genderEmoji: '👨🏼',
  year: '1988',
  authorName: 'Leo Larivee'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'laskowski', {
  flagEmoji: '',
  genderEmoji: '👨🏼',
  year: '1991',
  authorName: 'Piotr Laskowski'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'littrow', {
  flagEmoji: '🇦🇹',
  genderEmoji: '👨🏼',
  year: '1833',
  authorName: 'Joseph Johan von Littrow'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'miller', {
  flagEmoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿🇺🇸',
  genderEmoji: '👨🏼',
  year: '1942',
  authorName: 'Osborn Maitland Miller'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'mollweide', {
  flagEmoji: '🇩🇪',
  genderEmoji: '👨🏼',
  year: '1805',
  authorName: 'Karl Mollweide'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'natural earth2', {
  flagEmoji: '🇸🇮 🇦🇺 🇺🇸',
  genderEmoji: '👨🏼',
  year: '2018',
  authorName: 'Bojan Šavrič, Bernhard Jenny, Tom Patterson'
}), Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(_projectionsMetadata, 'nell hammer', {
  flagEmoji: '🇩🇪',
  genderEmoji: '👨🏼',
  year: '1900',
  authorName: 'Ernst von Hammer'
}), _projectionsMetadata);
var getFlagEmojiForProjection = function getFlagEmojiForProjection(p) {
  if (!projectionsMetadata[p.toLowerCase()]) return '';
  return projectionsMetadata[p.toLowerCase()].flagEmoji || '';
};
var getGenderEmojiForProjection = function getGenderEmojiForProjection(p) {
  if (!projectionsMetadata[p.toLowerCase()]) return '';
  return projectionsMetadata[p.toLowerCase()].genderEmoji || '';
};
var getYearForProjection = function getYearForProjection(p) {
  if (!projectionsMetadata[p.toLowerCase()]) return '';
  return projectionsMetadata[p.toLowerCase()].year || '';
};
var getAuthorNameForProjection = function getAuthorNameForProjection(p) {
  if (!projectionsMetadata[p.toLowerCase()]) return '';
  return projectionsMetadata[p.toLowerCase()].authorName || '';
};

/***/ })

})
//# sourceMappingURL=index.js.13a5c0ae80f494dc6157.hot-update.js.map