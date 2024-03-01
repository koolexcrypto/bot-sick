
import readline from 'readline';
import fs from 'fs';

var outOfRangeError = function(filepath, n) {
  return new RangeError(
    `Line number ${n} does not exist in '${filepath}'`
  )
}

function _readLinesFromTo(lineNumberFrom,lineNumberTo,filepath){
    const linesNumbers = [];
    for(let i=lineNumberFrom; i<=lineNumberTo; i++){
        linesNumbers.push(i);
    }

    return _readLines(linesNumbers,filepath);
}

function _readLines(linesNumbers, filepath){
    return new Promise(function(resolve, reject) {
        var n;
        for(var i=0; i<linesNumbers.length; i++){
            n = linesNumbers[i];
            if (n < 0 || n % 1 !== 0)
             reject(new RangeError(`Invalid line number`))
        }
    
        // console.log('linesNumbers');
        // console.log(linesNumbers);
        var lines = {};

        var cursor = 0,
          input = fs.createReadStream(filepath),
          rl = readline.createInterface({ input })
    
        rl.on('line', function(line) {

            for(var i=0; i<linesNumbers.length; i++){
                if (cursor == linesNumbers[i]-1) { // because lines starts from zero, so we deduct 1 from it
                    lines[linesNumbers[i]+''] = line;
                    linesNumbers[i] = 0;
                    // console.log(line);
                    break;
                }                
            }
            cursor++;
            // if(linesNumbers.length == 0){
            //     rl.close();
            //     input.close();
            //     resolve(lines);  
            // }
        })
    
        rl.on('error', reject)
    
        input.on('end', function() {
            rl.close();
            input.close();
            resolve(lines); 
        })
      })
}




export default {
    readLines: _readLines,
    readLinesFromTo:_readLinesFromTo
}