
import issues from "../src/issues/index.js";


const stat = {
    NC:0,
    GAS:0,
    LOW:0,
    MED:0
}


let issu = issues.filter( item => item.type === 'NC' );
stat['NC'] = issu.length;
issu = issues.filter( item => item.type === 'GAS' );
stat['GAS'] = issu.length;
issu = issues.filter( item => item.type === 'L' );
stat['LOW'] = issu.length;
issu = issues.filter( item => item.type === 'M' );
stat['MED'] = issu.length;
console.log("-------Stats-------");
console.log(stat);
console.log("-------Total-------");
console.log(stat['NC']+stat['GAS']+stat['LOW']+stat['MED']);
