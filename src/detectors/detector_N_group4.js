import types from "../types.js";
import inspector from "../util/inspector.js";
import utility_analyzer from "../utility_analyzer.js";
import Typo from '../util/typojs/typo/typo.js';

let Solidity_LITERAL_NAMES = {
  'pragma': true,
  ';': true,
  '*': true,
  '||': true,
  '^': true,
  '~': true,
  '>=': true,
  '>': true,
  '<': true,
  '<=': true,
  '=': true,
  'as': true,
  'import': true,
  'from': true,
  '{': true,
  ': true,': true,
  '}': true,
  'abstract': true,
  'contract': true,
  'interface': true,
  'library': true,
  'is': true,
  '(': true,
  ')': true,
  'error': true,
  'using': true,
  'for': true,
  '|': true,
  '&': true,
  '+': true,
  '-': true,
  '/': true,
  '%': true,
  '==': true,
  '!=': true,
  'struct': true,
  'modifier': true,
  'function': true,
  'returns': true,
  'event': true,
  'enum': true,
  '[': true,
  ']': true,
  'address': true,
  '.': true,
  'mapping': true,
  '=>': true,
  'memory': true,
  'storage': true,
  'calldata': true,
  'if': true,
  'else': true,
  'try': true,
  'catch': true,
  'while': true,
  'unchecked': true,
  'assembly': true,
  'do': true,
  'return': true,
  'throw': true,
  'emit': true,
  'revert': true,
  'var': true,
  'bool': true,
  'string': true,
  'byte': true,
  '++': true,
  '--': true,
  'new': true,
  ':': true,
  'delete': true,
  '!': true,
  '**': true,
  '<<': true,
  '>>': true,
  '&&': true,
  '?': true,
  '|=': true,
  '^=': true,
  '&=': true,
  '<<=': true,
  '>>=': true,
  '+=': true,
  '-=': true,
  '*=': true,
  '/=': true,
  '%=': true,
  'let': true,
  ':=': true,
  '=:': true,
  'switch': true,
  'case': true,
  'default': true,
  '->': true,
  'callback': true,
  'override': true,
  'anonymous': true,
  'break': true,
  'constant': true,
  'immutable': true,
  'continue': true,
  'leave': true,
  'external': true,
  'indexed': true,
  'internal': true,
  'payable': true,
  'private': true,
  'public': true,
  'virtual': true,
  'pure': true,
  'type': true,
  'view': true,
  'global': true,
  'constructor': true,
  'fallback': true,
  'receive': true,
  'delegatecall': true,
  'erc': true,
  'ERC1155': true,
  'ERC20': true,
  'ERC721': true,
  'params': true,
  'param': true,
  'var': true,
  'bool': true,
  'address': true,
  'string': true,
  'int': true,
  'uint': true,
  'byte': true,
  'fixed': true,
  'ufixed': true,
  'msg': true,
  'config': true,
  'init': true,
  'ERC': true,
  'pre' : true,
  'configs' : true,
  'admin' : true,
  'ETH' : true,
  'ACL' : true,
  'structs' : true,
  'timestamp' : true,
  'chainlink' : true,
  'util' : true,
  'timelock' : true,
  'API' : true,
  'WETH' : true

}

function _isStateVariable(contractNode, varName) {
  const stateVars = _getAllStateVarsByContract(contractNode);

  for (let i = 0; i < stateVars.length; i++) {
    const vars = stateVars[i].variables;
    for (let j = 0; j < vars.length; j++) {
      if (vars[j].name === varName) {
        return true;
      }
    }
  }
  return false;
}

// this is used to scan if there is a match for a particular regex inside the same function
const _check_if_regex_match_exists = async function (filePath, contractNode, stLoc, usedRegExp) {

  let contract_str = await return_contract_as_string(filePath, contractNode);
  const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
  let contract = contract_str.replace(regExp_comments, ""); // remove comments and return only code
  //   console.log(contract)
  // console.log(contract);
  let regExpStr = usedRegExp;
  // console.log(regExpStr);
  let regExp = new RegExp(regExpStr, 'g');
  var matches = contract.match(regExp) || []; //return array
  // console.log('matches');
  // console.log(matches);

  //find the lines

  let usedLineNumbers = {};

  let lines = await _get_contract_lines(filePath, contractNode);
  const regExpcommentsForLine = /(\/\/.*(.*))|\*.*(.*)/gm; //catch start with // and /* comments 

  for (const keyLineNum in lines) { // clean comments
    lines[keyLineNum] = lines[keyLineNum].replace(regExpcommentsForLine, ""); // remove comments and return only code
  }    // console.log(lines)
  const funcNode = getFunctionNodeByLOC(contractNode, stLoc);
  // console.log(funcNode)
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    for (const keyLineNum in lines) {
      if (lines[keyLineNum].indexOf(match) !== -1 && !usedLineNumbers[keyLineNum]) {
        // console.log(${keyLineNum}:${lines[keyLineNum]})
        usedLineNumbers[keyLineNum] = true;
        if (keyLineNum >= funcNode.loc.start.line && keyLineNum <= funcNode.loc.end.line) { // the match is inside the same function
          if (stLoc.start.line >= keyLineNum) { // the match is before the statement
            return true;
          }
        }
      }
    }
  }

  return false;
}

//to search contract again after finding a statment
const send_detection_object_to_detectors_utility = async function (
  detectionObject,
  filePath
) {
  //console.log(find_identifier_obj);
  let allAnalysisArr = await utility_analyzer.analyzeSolidityFile(
    filePath,
    detectionObject
  )
  //console.log("allAnalysisArr");
  //console.log(allAnalysisArr);
  let resultArr = []
  var res = 0
  for (let i = 0; i < allAnalysisArr.length; i++) {
    const resObj = allAnalysisArr[i]
    for (let j = 0; j < resObj.length; j++) {
      const value = resObj[j]
      if (value.id) {
        resultArr[res] = value
        res++
      }
    }
  }
  //console.log("resultArr");
  //console.log(resultArr);
  return resultArr
}

const findLinesOfMatches_old = async function (matches, contract, ObjToStoreCodeLines, resStoreKey) {
  if (!ObjToStoreCodeLines) {
    ObjToStoreCodeLines = {};
  }
  if (!resStoreKey) {
    resStoreKey = "codeline";
  }
  //check matches
  //find the lines
  let foundLines = [];
  for (let i = 0; i < matches.length; i++) {
    //const regExp_fixed = /.*2\*\*224.*\n/;
    let tofind = matches[i].replaceAll("*", "\\*");
    //console.log(tofind);
    let regExpStr = ".*" + tofind + ".*\\n";
    //console.log(regExpStr);
    let regExp = new RegExp(regExpStr, "gm");
    let res = contract.match(regExp) || [];
    //res will return an array of regex
    for (let r = 0; r < res.length; r++) {
      foundLines.push(res[r]);
    }
    ObjToStoreCodeLines[tofind] = {};
    ObjToStoreCodeLines[tofind][resStoreKey] = res;
    //console.log(res);
    //console.log(res.length);
  }

  //console.log(foundLines);
  //console.log(foundLines.length);
  return foundLines;
}

const findLinesOfMatches_hashmap = async function (matches, filePath, contractNode, codeOnly) {
  let usedLineNumbers = {};
  let lines = await _get_contract_lines(filePath, contractNode);

  // console.log("isCode:" + codeOnly);
  if (codeOnly) {
    const regExpcommentsForLine = /(\/\/.*(.*))|\*.*(.*)/gm; //catch start with // and /* comments 
    for (const keyLineNum in lines) { // clean comments
      lines[keyLineNum] = lines[keyLineNum].replace(regExpcommentsForLine, ""); // remove comments and return only code
    }
  }
  //console.log(lines);

  const retLines = [];
  let retLineMap = {};
  if (matches)
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      //console.log("match: " + match);
      for (const keyLineNum in lines) {
        if (lines[keyLineNum].indexOf(match) !== -1 && !usedLineNumbers[keyLineNum]) {
          //console.log(`${keyLineNum}:${lines[keyLineNum]}`)
          usedLineNumbers[keyLineNum] = true;
          let lineNum = parseInt(keyLineNum);
          retLines.push(lineNum);

          if (!retLineMap[match])
            retLineMap[match] = [];
          retLineMap[match].push(lineNum);
        }
      }
    }


  //console.log(retLines);
  //console.log(retLineMap);
  return retLineMap;
}

const findLinesNumbers = async function (issueID, foundLines, detectionResult, filePath, contractNode) {
  //console.log(contractNode);
  //find the lines numbers
  let storedLines = {};
  let lines = await _get_contract_lines(filePath, contractNode);
  let linesArr = Object.values(lines)
  if (foundLines.length > 0) {
    try {
      for (let i = 0; i < foundLines.length; i++) {
        //we need to remove \n always to match _get_contract_lines result
        let CurrentWhichLine = linesArr.indexOf(
          foundLines[i].replace("\n", "")
        );
        let startLine = contractNode.loc.start.line;
        //to get the correct line number
        let whichLine = CurrentWhichLine + parseInt(startLine);
        //check if whichLine not duplicate
        if (!storedLines[whichLine]) {
          //console.log("\n\r"+foundLines[i]);
          //console.log(whichLine);
          detectionResult.push({
            id: issueID,
            loc: {
              start: { line: whichLine, column: 0 },
              end: { line: whichLine, column: 0 },
            }
          });
        }
        storedLines[whichLine] = true;
      }
    } catch (error) {
      console.log(error);
    }
  }
  //console.log(storedLines);
  return detectionResult;
}

const Typos_in_the_code_N_24 = async function (
  filePath,
  contractNode,
  subNode,
  varOrStatement
) {
  let detectionResult = [];
  const id = "N-24";
  detectionResult = await Typos_in_the_code_comments_and_all(filePath, varOrStatement, subNode, contractNode, id);
  //console.log(detectionResult);
  return detectionResult;
}

var dictionary;
let storedLines = {};
const Typos_in_the_code_comments_and_all = async function (
  filePath,
  varOrStatement,
  subNode,
  contractNode,
  issueID
) {

  if (!dictionary)
    dictionary = new Typo("en_US");
  let detectionResult = [];
  //console.log(varOrStatement);

  if (filePath && contractNode && !varOrStatement) {
    let contract = await return_contract_as_string(filePath, contractNode);

    //var str = "If data can fit into 32 bytes, then you should use bytes32 datatype rather than bytes or strings as it is cheaper in solidity.";
    const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch the comments
    const _match = contract.match(regExp_comments);
    let str_comments = "";
    if (_match) {
      str_comments = _match.join("\n\r"); //convert to string again by join so we can use match func again
    }
    //console.log(str_comments);

    //we will ignore words that have numbers or special chars
    //or underscore later on// this expression for all words //general
    //get words that include @ so we ingore it later too 
    //include ' because some words like hasn't or so
    //and not include underscor
    const regExp_words = /[a-zA-Z0-9@']+/g;
    // /([a-zA-Z]+)/g;
    const __match = str_comments.match(regExp_words);
    let str_words = "";
    if (_match) {
      str_words = __match.join(",");// || [];//str.match(regExp);
    }


    //DO UPPERCASE REGEX i.e. LlamaUtils to check 2 words that in one //for variables etc
    //this will only get Words with upper case letter
    ///[A-Z][a-z]+|[a-z]+/g;
    let regExp_splitWordsByUppercase = /[A-Z][a-z]+|[a-z]+/g;// /[A-Z][a-z]+/g;
    let uppercaseWords_Arr = str_words.match(regExp_splitWordsByUppercase) || [];

    //remove connectedWords like callData or DeleteExec by uppercase //we already got them above splitted
    let regExp_removeWordsByUppercase = /([a-zA-Z]+[A-Z][a-z]+)/g;
    let str_Arr = str_words.replace(regExp_removeWordsByUppercase, "").split(",");
    //console.log(uppercaseWords_Arr)
    //console.log(str_Arr.length);

    //now we merge the 2 arrays of words and uppercase words and remove duplicates
    uppercaseWords_Arr = uppercaseWords_Arr.filter(function (val) {
      return str_Arr.indexOf(val) == -1;
    });

    // console.log("str_Arr after :");
    // console.log(uppercaseWords_Arr.length);
    // console.log(str_Arr.length);
    // console.log(uppercaseWords_Arr.join(","));
    // console.log("===========================");
    //console.log(str_Arr.join(","));

    let typoLineArr = [];
    let typoLineMap = {};
    let w = 0;

    //console.log(str_Arr);
    for (let index = 0; index < str_Arr.length; index++) {
      //you need a fix for a word between qoutations add it later 
      const word = str_Arr[index];
      var is_spelled_correctly = dictionary.check(word);
      //console.log("Is "+word+" spelled correctly? " + is_spelled_correctly);
      //check if a word has number or underscor or special character so we ignore
      const notAWord_regex = /[^a-zA-Z0-9]|\d/g;
      let NotAWord = word.match(notAWord_regex);
      let is_All_CAPS = false;// word.match(/[A-Z]+/g);
      if (!is_spelled_correctly && NotAWord == null && !Solidity_LITERAL_NAMES[word] && !is_All_CAPS) {
        //console.log(word);
        typoLineArr[w] = word;
        typoLineMap[word] = {};
        typoLineMap[word]["codeline"] = 0;
        w++;
      }
    }

    //console.log(typoLineArr);

    //foundLines is useless
    //but we stored the values at typoLineMap by key "codeline"
    //let foundLines = await findLinesOfMatches_old(str_Arr, contract, typoLineMap, "codeline");

    let linesNumbersObj = await findLinesOfMatches_hashmap(typoLineArr, filePath, contractNode, false);
    
    for (var matchKey in linesNumbersObj) {
      let linesNumbers = linesNumbersObj[matchKey];
      for (let index = 0; index < linesNumbers.length; index++) {
        const whichLine = linesNumbers[index];
        let word = matchKey;
        let auditKeyword = "@audit";
        let extra = { auditToPrint: auditKeyword + " " + word };
        if (!word) extra = {};
        detectionResult.push({
          id: issueID,
          loc: {
            start: { line: whichLine, column: 0 },
            end: { line: whichLine, column: 0 },
          },
          extra: extra
        });
        //console.log(detectionResult[detectionResult.length - 1]);
      }
    }
    
  } else if (varOrStatement != null) {
    let word_global = ""; let loc_global = null;
    //state vars
    if (varOrStatement.type == "StateVariableDeclaration") {
      //console.log("StateVariableDeclaration:..");
      //console.log(varOrStatement); 
      if (varOrStatement.variables && varOrStatement.variables[0]) {
        word_global = varOrStatement.variables[0].name;
        loc_global = varOrStatement.variables[0].loc;
      }
    }
    else if (varOrStatement.type == "VariableDeclarationStatement") {
      if (varOrStatement.variables && varOrStatement.variables[0]) {
        word_global = varOrStatement.variables[0].name;
        loc_global = varOrStatement.variables[0].loc;
      }
    }
    //functions names
    else if (contractNode && contractNode.subNodes) {
      let subNodes = contractNode.subNodes;
      let publicFuncArgs_arr = [];
      let publicFuncArgs_arr_line_number = [];
      for (var i = 0; i < subNodes.length; i++) {
        if (subNodes[i].type == "FunctionDefinition") {
          //functions names
          let word = subNodes[i].name;
          let loc = subNodes[i].loc;
          if (word != null) {
            //console.log(word);
            //console.log(subNodes[i]); 
            // console.log(detectionResult); 
            detectionResult = await find_typo_issue_update_detectionResult(word, loc, detectionResult, issueID);
          }

          //functions paramters names
          if (subNodes[i].parameters) {
            for (var p = 0; p < subNodes[i].parameters.length; p++) {
              let word = subNodes[i].parameters[p].name;
              let loc = subNodes[i].parameters[p].loc;
              if (word != null) {
                //console.log(word);
                detectionResult = await find_typo_issue_update_detectionResult(word, loc, detectionResult, issueID);
              }
              //console.log(paramName);
              //publicFuncArgs_arr.push(paramName);
              //publicFuncArgs_arr_line_number.push(subNodes[i].parameters[p].loc);
            }
          }
        }
      }
    }

    detectionResult = await find_typo_issue_update_detectionResult(word_global, loc_global, detectionResult, issueID);
  }

  //console.log(detectionResult);
  return detectionResult;
};

const find_typo_issue_update_detectionResult = async function (word, loc, detectionResult, issueID) {

  if (word != "" && loc != null) {
    //console.log(word,loc);
    //splite the uppercase if exist
    let regExp_splitWordsByUppercase = /[A-Z][a-z]+|[a-z]+/g;
    let uppercaseWords_Arr = word.match(regExp_splitWordsByUppercase) || [];
    if (!uppercaseWords_Arr || uppercaseWords_Arr.length == 0) {
      uppercaseWords_Arr = [];
      uppercaseWords_Arr.push(word);
    }
    //console.log(uppercaseWords_Arr);
    for (let w = 0; w < uppercaseWords_Arr.length; w++) {
      const word = uppercaseWords_Arr[w];
      let spelledCorrectly = await checkWordSpelling(word);
      //console.log(spelledCorrectly);
      if (spelledCorrectly == false) {
        //console.log(word);
        let whichLine = loc.start.line;
        if (!storedLines[whichLine + word]) {
          //console.log(word, loc.start.line);
          let atauditKeyord = "@audit";
          detectionResult.push({
            id: issueID,
            loc: loc,
            extra: { auditToPrint: atauditKeyord + " " + word }
          });
          storedLines[whichLine + word] = true;
        }
      }
    }
  }
  //console.log(detectionResult);
  return detectionResult;
}

const checkWordSpelling = async function (word) {
  var is_spelled_correctly = dictionary.check(word);
  //check if a word has number or underscor or special character so we ignore
  const notAWord_regex = /[^a-zA-Z0-9]|\d/g;
  let NotAWord = word.match(notAWord_regex);
  if (!is_spelled_correctly && NotAWord == null && !Solidity_LITERAL_NAMES[word]) {
    //console.log(word);
    //console.log(is_spelled_correctly);
    return false;
  }
  return true;
}


//Consider using named mappings N-25
let storedLines_N_25 = {};
const Consider_using_named_mappings_N_25 = async function (filePath, contractNode, subNode, varOrStatement) {
  let id = "N-25";
  let detectionResult = [];
  if (varOrStatement)
    if (varOrStatement.type == "StateVariableDeclaration") {
      if (varOrStatement.variables && varOrStatement.variables[0]) {
        let varOrState = varOrStatement.variables[0];
        if (varOrState.typeName.type == "Mapping") {
          if (varOrState.typeName.keyName != null || varOrState.typeName.valueName != null) {
            //it is implemented as 0.8.18 version solidity mapping
          } else {
            //issue occur here then //avoid duplicate 
            let whichLine = varOrState.loc.start.line;
            if (!storedLines_N_25[whichLine]) {
              // console.log(varOrState.name);
              // console.log(varOrState.typeName.type);
              detectionResult.push({
                id: id,
                loc: varOrState.loc
              });
              storedLines_N_25[whichLine] = true;
            }
          }
        }
      }
    }

  if (contractNode && contractNode.subNodes) {
    let subNodes = contractNode.subNodes;
    for (var i = 0; i < subNodes.length; i++) {
      if (subNodes[i].type == "StructDefinition") {
        //console.log(subNodes[i]);
        //subNode == struct block
        let subNode = subNodes[i];
        if (subNode.members && subNode.members.length > 0) {
          let struct_vars = subNode.members;
          for (let index = 0; index < struct_vars.length; index++) {
            const varOrState = struct_vars[index];
            //console.log(varOrState); return;
            if (varOrState.typeName.type == "Mapping") {
              if (varOrState.typeName.keyName != null || varOrState.typeName.valueName != null) {
                //it is implemented as 0.8.18 version solidity mapping
              } else {
                //issue occur here then
                let whichLine = varOrState.loc.start.line;
                if (!storedLines_N_25[whichLine]) {
                  //console.log(varOrState.name);
                  //console.log(varOrState.typeName.type);
                  detectionResult.push({
                    id: id,
                    loc: varOrState.loc
                  });
                  storedLines_N_25[whichLine] = true;
                }
              }
            }
          }
        }

      }
    }
  }

  //console.log(detectionResult);
  return detectionResult;
}

//Contract uses both require()/revert() as well as custom errors n-28
let issue_N_28 = false;
let usedRequire = 0; let usedReturn = 0; //you have to use utility
const contract_uses_both_require_revert_as_well_as_custom_errors_n_28 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-28";
  let detectionResult = [];
  if (varOrStatement) {
    if (varOrStatement.expression) {
      //Return Statement
      if (varOrStatement.type === 'ReturnStatement') {
        //console.log(varOrStatement);
        usedReturn++;
        //console.log("usedReturn: "+usedReturn);
      }
      //require statement
      if (varOrStatement.expression.expression)
        if (varOrStatement.expression.expression.name === 'require') {
          //console.log(varOrStatement);
          usedRequire++;
          //console.log("usedRequire: "+usedRequire);
        }
    }
  }


  if (usedReturn > 0 && usedRequire > 0) {
    if (!issue_N_28) {
      issue_N_28 = true;
      detectionResult.push({
        id: id,
        loc: contractNode.loc
      });
      //console.log("issue_N_28 found");
      //console.log(contractNode.loc);
    }
  }
  return detectionResult;
}


//Non-external/public variable and function names should begin with an underscore
const Non_external_or_public_variable_and_function_names_should_begin_with_an_underscore_n_27 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-27";
  let detectionResult = [];
  if (varOrStatement)
    if (varOrStatement.type == "StateVariableDeclaration") {
      if (varOrStatement.variables && varOrStatement.variables[0]) {
        let varOrState = varOrStatement.variables[0];
        if (varOrState.visibility != "public" && varOrState.visibility != "external") {
          let var_name = varOrState.name;
          let regex = /^[_]/gm; //check first letter if "_"
          if (!var_name.match(regex)) {
            detectionResult.push({
              id: id,
              loc: varOrState.loc
            });
          }
        }
      }
    }
  return detectionResult;
}

//Unused contract variables
let storedLines_vars = {}; let logOnce = false;
const Unused_contract_variables_29 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-29";
  let detectionResult = [];
  //get contract and check if the variable is duplicated so it is used
  let contract = await return_contract_as_string(filePath, contractNode);
  const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
  let exclude_comments = contract.replace(regExp_comments, ""); // reomve comments and return only code
  if (!logOnce) {
    logOnce = true;
    //console.log(exclude_comments);
  }

  let var_name; let var_loc;
  if (varOrStatement)
    if (varOrStatement.type == "StateVariableDeclaration") {
      if (varOrStatement.variables && varOrStatement.variables[0]) {
        let varOrState = varOrStatement.variables[0];
        var_name = varOrState.name;
        var_loc = varOrState.loc;
        //console.log(var_name);
      }
    }
    else if (varOrStatement.type == "VariableDeclarationStatement") {
      if (varOrStatement.variables && varOrStatement.variables[0]) {
        let varOrState = varOrStatement.variables[0];
        var_name = varOrState.name;
        var_loc = varOrState.loc;
        //console.log(var_name);
      }
    }
    else if (contractNode && contractNode.subNodes) {
      let subNodes = contractNode.subNodes;
      for (var i = 0; i < subNodes.length; i++) {
        if (subNodes[i].type == "StructDefinition") {
          //console.log(subNodes[i]);
          //subNode == struct block
          let subNode = subNodes[i];
          var_name = subNode.name;
          var_loc = subNodes[i].loc;
          // if (subNode.members && subNode.members.length > 0) {
          // }
        }
      }
    }

  if (var_name != null) {
    //catch how many times vars are called
    let regExpStr = '\\b(' + var_name + ')\\b';
    //console.log(regExpStr);
    let regExp = new RegExp(regExpStr, 'gm');
    let var_arr = exclude_comments.match(regExp);
    //simple just count how many times occur in the code //there still some cases to solve later
    //if only one then it is unused
    let line = var_loc.start.line;
    //console.log(var_name);
    //console.log(line);
    if (var_arr.length == 1 && !storedLines_vars[line]) {
      //console.log(var_arr,var_loc);
      let atauditKeyord = "@audit";
      detectionResult.push({
        id: id,
        loc: var_loc,
        extra: { auditToPrint: atauditKeyord + " " + var_name }
      });
      storedLines_vars[line] = true;
    }
  }
  //console.log(detectionResult);
  return detectionResult;
}


const Use_abi_encodeCall_instead_of_abi_encodeSignature_or_abi_encodeSelector_N_30 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-30";
  let detectionResult = [];
  //get contract and check if the variable is duplicated so it is used
  let contract = await return_contract_as_string(filePath, contractNode);
  const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
  let code_only = contract.replace(regExp_comments, ""); // reomve comments and return only code

  let matches = ["abi\\.encodeWithSelector\\(", "abi\\.encodeWithSignature\\("];
  //console.log(matches);
  let foundLines = await findLinesOfMatches_old(matches, code_only, null, null);
  //console.log(foundLines);
  detectionResult = await findLinesNumbers(id, foundLines, detectionResult, filePath, contractNode);
  //console.log(detectionResult);
  return detectionResult;
}

const Events_may_be_emitted_out_of_order_due_to_reentrancy_N_31 = async function name(
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-31";
  let detectionResult = [];

  if (contractNode && contractNode.subNodes) {
    let subNodes = contractNode.subNodes;
    for (var i = 0; i < subNodes.length; i++) {
      if (subNodes[i].type == "FunctionDefinition"
        && (subNodes[i].visibility == "public" || subNodes[i].visibility == "external")) {
        //functions name
        //console.log(subNodes[i]);
        if (subNodes[i].body && subNodes[i].body.statements) {
          //get last statement
          let len = subNodes[i].body.statements.length;
          let lastStatement = subNodes[i].body.statements[len - 1];
          if (lastStatement && lastStatement.type == "EmitStatement") {
            let is_nonReentrant = false;
            //check the modifiers if it has 
            if (subNodes[i].modifiers) {
              for (let index = 0; index < subNodes[i].modifiers.length; index++) {
                const modifier = subNodes[i].modifiers[index];
                if (modifier.name == "nonReentrant") {
                  is_nonReentrant = true;
                }
              }
            }
            if (!is_nonReentrant) {
              //console.log(subNodes[i]);
              //console.log(lastStatement);
              let atauditKeyord = "@audit";
              detectionResult.push({
                id: id,
                loc: lastStatement.loc,
                extra: atauditKeyord + " safeTransfer() prior to emission of " + lastStatement.eventCall.expression.name
              });
              //console.log(detectionResult[detectionResult.length-1].loc);
              //console.log(detectionResult);
            }
          }
        }
      }
    }
  }

  return detectionResult;
}


const Consider_moving_msg_sender_checks_to_a_common_authorization_modifier_N_32 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-32";
  let detectionResult = [];

  let contract = await return_contract_as_string(filePath, contractNode);
  const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
  let code_only = contract.replace(regExp_comments, ""); // reomve comments and return only code
  let matches = ["require\\(msg\\.sender == "]; //require(msg.sender == 
  //console.log(matches);
  let foundLines = await findLinesOfMatches_old(matches, code_only, null, null);
  //console.log(foundLines);
  detectionResult = await findLinesNumbers(id, foundLines, detectionResult, filePath, contractNode);
  //console.log(detectionResult);
  return detectionResult;
}

const Consider_adding_a_NatSpec_comment_describing_the_function_N_33 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-33";
  let detectionResult = [];
  let contract = await return_contract_as_string(filePath, contractNode);
  const regExp = /((.*(\n|\r|\r\n)){2})\s+function.*$/gm; //catch 2 lines before the function head line
  ///[\*\/|\/\/][^]*?function.*$/gm; //check if there is comments before function head line
  let matches = contract.match(regExp); // reomve comments and return only code
  let function_matches = []; let foundLines;
  for (let index = 0; matches && index < matches.length; index++) {
    const block = matches[index];
    const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\/|\*\/|\* @.+/gm; //catch the comments
    let hasComments = block.match(regExp_comments);
    // console.log("============");
    // console.log(block);
    // console.log(hasComments);
    if (hasComments == null) {
      const regExp_function_line = /function.*$/gm;
      //function_matches.push(block.match(regExp_function_line)); 
      let function_matches = block.match(regExp_function_line);
      //console.log(function_matches);
      for (let index = 0; index < function_matches.length; index++) {
        let oneFunc = function_matches[index];
        oneFunc = oneFunc.replace("(", "\\(");
        oneFunc = oneFunc.replace(")", "\\)");
        function_matches[index] = oneFunc;
      }
      let foundLines = await findLinesOfMatches_old(function_matches, contract, null, null);
      //console.log(foundLines);
      detectionResult = await findLinesNumbers(id, foundLines, detectionResult, filePath, contractNode);
      //  if (detectionResult)
      //    console.log(detectionResult[detectionResult.length-1]);
      //detectionResult.push(_detectionResult);
      //console.log(function_matches);
    }
  }
  //console.log(function_matches);
  //let foundLines = await findLinesOfMatches_old(function_matches, contract, null, null);
  //console.log(matches);
  //console.log(detectionResult);
  return detectionResult;
}



const Long_functions_should_be_refactored_into_multiple_smaller_functions_N_34 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-34";
  let detectionResult = [];

  if (contractNode && contractNode.subNodes) {
    let subNodes = contractNode.subNodes;
    let publicFuncArgs_arr = [];
    let publicFuncArgs_arr_line_number = [];
    for (var i = 0; i < subNodes.length; i++) {
      if (subNodes[i].type == "FunctionDefinition") {
        //functions names
        let word = subNodes[i].name;
        //console.log(subNodes[i].loc);
        let startLine = subNodes[i].loc.start.line;
        let endLine = subNodes[i].loc.end.line;
        //console.log(startLine, endLine);
        let longLines = 50;
        let isLong = (endLine - startLine);
        if (isLong >= longLines) {
          let atauditKeyord = "@audit";
          // console.log("results:");
          // console.log(isLong);
          // console.log("function", subNodes[i].name);
          detectionResult.push({
            id: id,
            loc: subNodes[i].loc,
            extra: atauditKeyord + " function body lines is " + isLong + " lines."
          });
        }
      }
    }
  }

  //console.log(detectionResult);
  return detectionResult;
}



const _issues = async function (
  filePath,
  contractNode,
  subNode,
  varOrStatement
) {
  let detectionResult = [];
  const N_24 = await Typos_in_the_code_N_24(
    filePath,
    contractNode,
    subNode,
    varOrStatement
  );
  if (N_24) {
    //console.log(N_24);
    detectionResult = detectionResult.concat(N_24);
  }

  const N_25 = await Consider_using_named_mappings_N_25(
    filePath,
    contractNode,
    subNode,
    varOrStatement
  );
  if (N_25) {
    detectionResult = detectionResult.concat(N_25);
  }


  const N_27 = await Non_external_or_public_variable_and_function_names_should_begin_with_an_underscore_n_27(
    filePath,
    contractNode,
    subNode,
    varOrStatement
  );
  if (N_27) {
    detectionResult = detectionResult.concat(N_27);
  }

  //console.log(detectionResult);
  return detectionResult;
};

// This is to check statements in a function or a block ...etc.
const _checkStatement = async function (
  filePath,
  contractNode,
  subNode,
  statement
) {
  // console.log('detector._checkStatement');
  // console.log(subNode);
  let detectionResult = [];
  //no need to put in issues function
  const N_28 = await contract_uses_both_require_revert_as_well_as_custom_errors_n_28(
    filePath,
    contractNode,
    subNode,
    statement
  );
  if (N_28) {
    detectionResult = detectionResult.concat(N_28);
  }


  const N_29 = await Unused_contract_variables_29(
    filePath,
    contractNode,
    subNode,
    statement
  );
  if (N_29) {
    detectionResult = detectionResult.concat(N_29);
  }


  //console.log(statement);
  detectionResult = detectionResult.concat(await _issues(filePath, contractNode, subNode, statement));

  return detectionResult;
};

// This is to check state variable declaration
const _checkStateVariable = async function (filePath, contractNode, stateVar) {
  // console.log(subNode);
  let detectionResult = [];

  const N_29 = await Unused_contract_variables_29(
    filePath,
    contractNode,
    contractNode,
    stateVar
  );
  if (N_29) {
    detectionResult = detectionResult.concat(N_29);
  }

  //instead of subNode we pass contractNode param
  detectionResult = detectionResult.concat(await _issues(filePath, contractNode, contractNode, stateVar));

  return detectionResult;
};

//use this function when you like to use regex. it's callable once
// This is for contract specific.
const _checkContract = async function (filePath, contractNode) {
  // console.log('detector1._checkContract');
  let detectionResult = [];
  //console.log(contractNode);

  const N_29 = await Unused_contract_variables_29(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_29) {
    detectionResult = detectionResult.concat(N_29);
  }

  const N_30 = await Use_abi_encodeCall_instead_of_abi_encodeSignature_or_abi_encodeSelector_N_30(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_30) {
    detectionResult = detectionResult.concat(N_30);
  }


  const N_31 = await Events_may_be_emitted_out_of_order_due_to_reentrancy_N_31(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_31) {
    detectionResult = detectionResult.concat(N_31);
  }

  const N_32 = await Consider_moving_msg_sender_checks_to_a_common_authorization_modifier_N_32(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_32) {
    detectionResult = detectionResult.concat(N_32);
  }

  const N_33 = await Consider_adding_a_NatSpec_comment_describing_the_function_N_33(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_33) {
    detectionResult = detectionResult.concat(N_33);
  }

  const N_34 = await Long_functions_should_be_refactored_into_multiple_smaller_functions_N_34(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_34) {
    detectionResult = detectionResult.concat(N_34);
  }


  detectionResult = detectionResult.concat(await _issues(filePath, contractNode, null, null));

  // console.log(subNode);
  return detectionResult;
};

// This is a gereral check for anything not covered.
const _check = function (filePath, contractNode, subNode) {
  // console.log('detector1');
  // console.log(subNode);
  let detectionResult = [];
  //console.log(statement);

  return detectionResult;
};

//return contract lines for regex match commands
const _get_contract_lines = async function (filePath, contractNode) {
  //console.log(contractNode.loc);
  const lines = await inspector.readLinesFromTo(
    contractNode.loc.start.line,
    contractNode.loc.end.line,
    filePath
  );
  //console.log(lines);
  return lines;
};

const return_contract_as_string = async function (filePath, contractNode) {
  let lines = await _get_contract_lines(filePath, contractNode);
  let linesString = "";
  Object.keys(lines).forEach((key) => {
    linesString += lines[key] + "\n";
  });
  return linesString;
};

export default {
  checkContract: _checkContract,
  checkStateVariable: _checkStateVariable,
  checkStatement: _checkStatement,
  check: _check,
};
