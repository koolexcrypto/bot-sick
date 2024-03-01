/**
 * Before running, ensure that you have done
 * $ npm install typo-js
 */
import Typo from '../typojs/typo/typo.js';
//var Typo = require("typo-js");
var dictionary = new Typo("en_US");

var str = "If data can fit into 32 bytes, then you should use bytes32 datatype rather than bytes or strings as it is cheaper in solidity.";
const regExp = /([a-zA-Z_]+)/g;
let str_Arr = str.match(regExp);
var lineHasNoTypo = true;

for (let index = 0; index < str_Arr.length; index++) {
    const word = str_Arr[index];
    var is_spelled_correctly = dictionary.check(word);
    console.log("Is "+word+" spelled correctly? " + is_spelled_correctly);
    if (!word)
        lineHasNoTypo = false;
}

console.log("Is spelled correctly? " + lineHasNoTypo);