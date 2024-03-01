import types from "../types.js";
import inspector from "../util/inspector.js";
import utility_analyzer from "../utility_analyzer.js";

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

const getFunctionNodeByLOC = function (contractNode, loc) {
  const subnodes = contractNode.subNodes;
  let funcNode;
  for (let i = 0; i < subnodes.length; i++) {
    const subNode = subnodes[i];
    if (subNode.type === 'FunctionDefinition') {
      if (loc.start.line >= subNode.loc.start.line && loc.start.line <= subNode.loc.end.line) {
        funcNode = subNode;
        break;
      }
    }
  }

  return funcNode;

}

// this is used to scan if there is a match for a particular regex inside the same function
const _check_if_regex_match_exists_in_function = async function (filePath, contractNode, stLoc, usedRegExp) {
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
  let occurs = 0;
  let lines = await _get_contract_lines(filePath, contractNode);
  const regExpcommentsForLine = /(\/\/.*(.*))|\*.*(.*)/gm; //catch start with // and /* comments 

  for (const keyLineNum in lines) { // clean comments
    lines[keyLineNum] = lines[keyLineNum].replace(regExpcommentsForLine, ""); // remove comments and return only code
  }    // console.log(lines)
  const funcNode = getFunctionNodeByLOC(contractNode, stLoc);
  //console.log(funcNode.name);
  //console.log(funcNode.loc)

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    for (const keyLineNum in lines) {
      if (lines[keyLineNum].indexOf(match) !== -1 && !usedLineNumbers[keyLineNum]) {
        //console.log(`${keyLineNum}:${lines[keyLineNum]}`);
        usedLineNumbers[keyLineNum] = true;
        if (keyLineNum >= funcNode.loc.start.line && keyLineNum <= funcNode.loc.end.line) { // the match is inside the same function
          //console.log(`${keyLineNum}:${lines[keyLineNum]}`);
          occurs++;
        }
      }
    }
  }

  return occurs;
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

//true for state vars or false for function vars
const getVars = async function (varOrStatement, isStateVars, isFuncVars) {
  let vars = [];
  if (varOrStatement.type == "StateVariableDeclaration" && isStateVars == true) {
    //console.log("StateVariableDeclaration:..");
    //console.log(varOrStatement); 
    if (varOrStatement.variables && varOrStatement.variables[0]) {
      let array = varOrStatement.variables;
      for (let index = 0; index < array.length; index++) {
        const var_ = array[index];
        vars.push(var_);
      }
    }
  }
  else if (varOrStatement.type == "VariableDeclarationStatement" && isFuncVars == true) {
    if (varOrStatement.variables) {
      let array = varOrStatement.variables;
      for (let index = 0; index < array.length; index++) {
        const var_ = array[index];
        vars.push(var_);
      }
    }
  }

  return vars;
}

const getFunctions = async function (contractNode) {
  let funcs = [];
  if (contractNode && contractNode.subNodes) {
    let subNodes = contractNode.subNodes;
    for (var i = 0; i < subNodes.length; i++) {
      if (subNodes[i].type == "FunctionDefinition") {
        funcs.push(subNodes[i]);
      }
    }
  }
  return funcs;
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
  //console.log(matches);
  let foundLines = [];
  if (matches)
    for (let i = 0; i < matches.length; i++) {
      //const regExp_fixed = /.*2\*\*224.*\n/;
      let tofind = matches[i].replaceAll("*", "\\*");
      tofind = tofind.replaceAll("(", "\\\(");
      tofind = tofind.replaceAll(")", "\\\)");
      //console.log(tofind);
      let regExpStr = ".*" + tofind + ".*\\n";
      //console.log(regExpStr);
      let regExp = new RegExp(regExpStr, "gm");
      //console.log("regExp:");
      //console.log(regExp);
      let res = contract.match(regExp) || [];
      //res will return an array of regex
      //console.log(res);
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

const findLinesOfMatches = async function (matches, filePath, contractNode, codeOnly) {
  let usedLineNumbers = {};
  let lines = await _get_contract_lines(filePath, contractNode);

  if (codeOnly) {
    const regExpcommentsForLine = /(\/\/.*(.*))|\*.*(.*)/gm; //catch start with // and /* comments 
    for (const keyLineNum in lines) { // clean comments
      lines[keyLineNum] = lines[keyLineNum].replace(regExpcommentsForLine, ""); // remove comments and return only code
    }
  }

  const retLines = [];
  if (matches)
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      for (const keyLineNum in lines) {
        if (lines[keyLineNum].indexOf(match) !== -1 && !usedLineNumbers[keyLineNum]) {
          // console.log(`${keyLineNum}:${lines[keyLineNum]}`)
          usedLineNumbers[keyLineNum] = true;
          retLines.push(parseInt(keyLineNum));
        }
      }
    }

  return retLines;
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

const findLinesNumbers_return_numbers = async function (foundLines, filePath, contractNode) {
  //console.log(contractNode);
  //find the lines numbers
  let storedLines = {};
  let linesNumbersArr = [];
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
          linesNumbersArr.push(whichLine);
        }
        storedLines[whichLine] = true;
      }
    } catch (error) {
      console.log(error);
    }
  }
  //console.log(storedLines);
  return linesNumbersArr;
}

const findLinesNumbers_return_numbers_for_same_duplicate_line = async function (foundLines, filePath, contractNode, _skipLinesValidation) {
  let skipLinesValidation = false;
  if (_skipLinesValidation != null) {
    skipLinesValidation = _skipLinesValidation;
  }
  //console.log(contractNode);
  //find the lines numbers
  let storedLines = {};
  let linesNumbersArr = []; let WhichLines = [];
  let startLine = contractNode.loc.start.line;
  let lines = await _get_contract_lines(filePath, contractNode);
  let linesArr = Object.values(lines)
  if (foundLines.length > 0) {
    try {

      let OldLinesArrLength = linesArr.length;
      for (let i = 0; i < foundLines.length; i++) {
        //we need to remove \n always to match _get_contract_lines result
        let CurrentWhichLine = linesArr.indexOf(
          foundLines[i].replace("\n", "")
        );
        let whichLine = CurrentWhichLine + (OldLinesArrLength - linesArr.length) + startLine;
        WhichLines.push(whichLine);

        //update linesArr
        var indexToRemove = 0;
        var numberToRemove = CurrentWhichLine;
        linesArr.splice(indexToRemove, numberToRemove + 1);
      }

      for (let i = 0; i < WhichLines.length; i++) {
        let whichLine = WhichLines[i];
        //check if whichLine not duplicate
        if (!storedLines[whichLine]) {
          //console.log("\n\r"+foundLines[i]);
          //console.log(whichLine);
          linesNumbersArr.push(whichLine);
        }
        if (!skipLinesValidation)
          storedLines[whichLine] = true;
      }
    } catch (error) {
      console.log(error);
    }
  }
  //console.log(storedLines);
  return linesNumbersArr;
}


const Mixed_usage_of_int_uint_with_int256_uint256_N_35 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-35";
  let detectionResult = [];

  let contract = await return_contract_as_string(filePath, contractNode);
  const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
  let code_only = contract.replace(regExp_comments, ""); // reomve comments and return only code
  let matches = ["uint "];
  //console.log(matches);
  let foundLines = await findLinesOfMatches_old(matches, code_only, null, null);
  //console.log(foundLines);
  detectionResult = await findLinesNumbers(id, foundLines, detectionResult, filePath, contractNode);
  //console.log(detectionResult);
  return detectionResult;
}

const Event_is_not_properly_indexed_N_36 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let detectionResult = [];
  const id = "N-36";
  if (contractNode && contractNode.subNodes) {
    let subNodes = contractNode.subNodes;
    for (var i = 0; i < subNodes.length; i++) {
      if (subNodes[i].type == "EventDefinition") {
        //console.log(subNodes[i]);
        let isIndexed = true; let indexVars = "";
        let event = subNodes[i];
        //console.log(event.parameters);
        if (event.parameters) {
          let eventParams = event.parameters;
          for (var p = 0; p < eventParams.length; p++) {
            //console.log(eventParams[p]);
            if (eventParams[p].typeName.name == "address" && eventParams[p].isIndexed == false) {
              isIndexed = false;
              indexVars += eventParams[p].name + " , "
            }
          }
        }
        //console.log("_isIndexed: " + isIndexed);
        if (isIndexed == false) {
          //replace last , to empty
          let auditKeyword = "@audit";
          indexVars = indexVars.replace(/,([^,]*)$/, ' $1').trim();
          detectionResult.push({
            id: id,
            loc: event.loc,
            extra: { auditToPrint: auditKeyword + " " + indexVars + " variable not indexed" }
          });
          //console.log(detectionResult[detectionResult.length-1]);
        }
      }
    }
  }


  return detectionResult;
}



const override_function_arguments_that_are_unused_should_have_the_variable_name_removed_or_commented_out_to_avoid_compiler_warnings_N_37 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let detectionResult = [];
  const id = "N-37";
  if (contractNode && contractNode.subNodes) {
    let subNodes = contractNode.subNodes;
    for (var i = 0; i < subNodes.length; i++) {
      if (subNodes[i].type == "FunctionDefinition") {
        //console.log(subNodes[i].name);
        let func = subNodes[i];
        //console.log(event.parameters);
        if (func.parameters) {
          let funcParams = func.parameters;
          for (var p = 0; p < funcParams.length; p++) {
            let param = funcParams[p];
            let paramName = param.name;
            let stLoc = param.loc;
            let usedRegExp = '\\b' + paramName + '\\b'; //\b to catch the begining and the end of a word
            //console.log(usedRegExp);
            let existCount = await _check_if_regex_match_exists_in_function(filePath, contractNode, stLoc, usedRegExp);
            //console.log(existCount);
            //if existCount greater than one then it is used
            //if existCount == 1 then the param is unused
            if (existCount == 1) {
              let auditKeyword = "@audit";
              detectionResult.push({
                id: id,
                loc: param.loc,
                extra: { auditToPrint: auditKeyword + " " + paramName + " parameter is unused" }
              });
            }
          }
        }
      }
    }
  }

  return detectionResult;
}



const MUse_inheritdoc_rather_than_using_a_non_standard_annotation_N_38 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-38";
  let detectionResult = [];

  let contract = await return_contract_as_string(filePath, contractNode);
  const regExp_comments = /\/\*[^]*?\*\/|\/\/.*/g; //only comment block /* to */ or // lines
  let comments_matches = contract.match(regExp_comments); // reomve comments and return only code
  const regExp_at_dev = /@dev.*/g; //catch @dev the whole line
  let matches = "";
  if (comments_matches)
    matches = comments_matches.join(",").match(regExp_at_dev);
  //console.log(comments_matches);
  let foundLines = await findLinesOfMatches_old(matches, contract, null, null);
  //console.log(foundLines);
  let linesNumbers = await findLinesNumbers_return_numbers(foundLines, filePath, contractNode);
  for (let index = 0; index < linesNumbers.length; index++) {
    const whichLine = linesNumbers[index];
    detectionResult.push({
      id: id,
      loc: {
        start: { line: whichLine, column: 0 },
        end: { line: whichLine, column: 0 },
      }
    });
  }
  //console.log(linesNumbers);
  //console.log(detectionResult);
  return detectionResult;
}

const Variable_names_that_consist_of_all_capital_letters_should_be_reserved_for_constant_immutable_variables_N_39 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-39";
  let detectionResult = [];
  let stateVars = await getVars(varOrStatement, true, false);
  if (stateVars.length != 0) {
    //console.log(stateVars);
    for (let index = 0; index < stateVars.length; index++) {
      const var_obj = stateVars[index];
      if (var_obj.isDeclaredConst == false && var_obj.isImmutable == false) {
        //console.log(var_obj);
        let var_name = var_obj.name;
        //check upper case for the whole name
        let uppercase_regex = /[A-Z_]+[0-9_].\w+/g;
        let matches = var_name.match(uppercase_regex);
        //console.log(matches);
        if (matches != null) {
          let auditKeyword = "@audit";
          detectionResult.push({
            id: id,
            loc: var_obj.loc,
            extra: { auditToPrint: auditKeyword + " " + var_name + " variable not immutable or constant" }
          });
        }
      }
    }
  }

  // if (detectionResult.length != 0)
  //   console.log(detectionResult);
  return detectionResult;
}


//NatSpec_@return_argument_is_missing
const NatSpec_return_argument_is_missing_N_40 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let detectionResult = [];
  // try {
  const id = "N-40";
  //console.log(varOrStatement);
  let contract = await return_contract_as_string(filePath, contractNode);
  const regExp = /@return.*/gm; ////catch * @ netspec line
  var matches = contract.match(regExp) || [];
  //we dont need to check the imports statment that has @
  //the returned contract comes without imports section
  //console.log(id);
  //console.log(matches);

  //now we need to loop all functions (returns) and comapre it to results of regex
  //check if the return of the returns is missing in regex result lines
  let subNodes = contractNode.subNodes;
  let publicFuncReturns_arr = [];
  let publicFuncReturns_arr_line_number = [];
  let funcs_arr = [];
  for (var i = 0; i < subNodes.length; i++) {
    if (subNodes[i].type == "FunctionDefinition") {
      //console.log(subNodes[i]);
      if (subNodes[i].returnParameters) {
        for (var p = 0; p < subNodes[i].returnParameters.length; p++) {
          let returnName;
          returnName = subNodes[i].returnParameters[p].name;
          if (returnName == null)
            returnName = subNodes[i].returnParameters[p].typeName.name;
          //console.log(returnName);
          publicFuncReturns_arr.push(returnName);
          publicFuncReturns_arr_line_number.push(subNodes[i].returnParameters[p].loc);
          //publicFuncArgs[paramName] = true;
          funcs_arr.push(subNodes[i].name);
        }
      }
    }
  }

  for (var i = 0; i < publicFuncReturns_arr.length; i++) {
    for (var j = 0; j < matches.length; j++) {
      // if (!missing_params[publicFuncArgs_arr[j]])
      if (matches[j].indexOf(publicFuncReturns_arr[i]) !== -1) {
        publicFuncReturns_arr[i] = "";
      }
    }
  }

  //find the lines
  for (var i = 0; i < publicFuncReturns_arr.length; i++) {
    if (publicFuncReturns_arr[i] !== "") {
      let auditKeyword = "@audit";
      detectionResult.push({
        id: id,
        loc: publicFuncReturns_arr_line_number[i],
        extra: { auditToPrint: auditKeyword + " function " + funcs_arr[i] + " missing NatSpec @return " + publicFuncReturns_arr[i] }
      });
      //console.log(funcs_arr[i]);
      ////console.log(detectionResult[detectionResult.length - 1]);
    }
  }
  return detectionResult;
};

//default visibility == public visibility
let SolditiyfuncsOrder = [
  "external",
  "public",
  "internal",
  "private"
]

const Function_ordering_does_not_follow_the_Solidity_style_guide_N_41 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let detectionResult = [];
  const id = "N-41";
  let funcs = await getFunctions(contractNode);
  let funcsOrder = [];
  let funcsFinalOrder = [];
  let lastVisibility = "";
  for (let index = 0; index < funcs.length; index++) {
    const func = funcs[index];
    //console.log(func.visibility);
    let visibility = func.visibility;
    if (visibility == "default") {
      visibility = "public";
    }
    funcsOrder.push(visibility);
  }

  for (let index = 0; index < funcsOrder.length; index++) {
    const func_visibility = funcsOrder[index];
    let visibility = func_visibility;
    if (lastVisibility != visibility) {
      funcsFinalOrder.push(func_visibility);
    }
    lastVisibility = func_visibility;
  }
  //console.log(funcs);
  //console.log(funcsOrder);
  //console.log(funcsFinalOrder);
  //check if they match SolditiyfuncsOrder values according to main funcsFinalOrder length
  //because you might have only 2 functions as example public and private..
  let correctOrder = true;
  for (let i = 0; i < funcsFinalOrder.length; i++) {
    const func_visibility = funcsFinalOrder[i];
    if (func_visibility != SolditiyfuncsOrder[i]) {
      correctOrder = false;
      break;
    }
  }

  if (!correctOrder) {
    //console.log("incorrect order!");
    let auditKeyword = "@audit";
    detectionResult.push({
      id: id,
      loc: contractNode.loc,
      extra: { auditToPrint: auditKeyword + " Functions not orderd correctly in this contract" }
    });
  } else {
    //console.log("Correct Order.");
  }
  return detectionResult;
}



const Strings_should_use_double_quotes_rather_than_single_quotes_N_42 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-42";
  let detectionResult = [];

  let contract = await return_contract_as_string(filePath, contractNode);
  // const regExp_comments = /\/\*[^]*?\*\/|\/\/.*/g; //only comment block /* to */
  const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
  let code_only = contract.replace(regExp_comments, ""); // reomve comments and return only code
  //console.log(code_only);
  const regExp_single_quotes = /'(.*?)'/g; //catch words between single quotes
  let matches = code_only.match(regExp_single_quotes);
  //console.log(matches);
  //return;
  let linesNumbers = await findLinesOfMatches(matches, filePath, contractNode, true);
  for (let index = 0; index < linesNumbers.length; index++) {
    const whichLine = linesNumbers[index];
    let auditKeyword = "@audit";
    detectionResult.push({
      id: id,
      loc: {
        start: { line: whichLine, column: 0 },
        end: { line: whichLine, column: 0 },
      },
      extra: { auditToPrint: auditKeyword + " " + matches[index] }
    });
    ////console.log(detectionResult[detectionResult.length - 1]);
  }
  //console.log(linesNumbers);
  //console.log(detectionResult);
  return detectionResult;
}


const Use_a_more_recent_version_of_solidity_N_43 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-43";
  let detectionResult = [];

  if (subNode.type == "PragmaDirective") {
    let solVerStr = subNode.value.replace("^", "").replaceAll(".", "");
    let solVer = parseInt(solVerStr);
    //check if solidity version less than 0.8.13
    if (solVer < 813) {
      detectionResult.push({
        id: id,
        loc: subNode.loc
      });
    }
  }
  //console.log(detectionResult[detectionResult.length-1]);
  return detectionResult;
}



const Avoid_the_use_of_sensitive_terms_N_44 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-44";
  let detectionResult = [];

  let contract = await return_contract_as_string(filePath, contractNode);

  const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
  let code_only = contract.replace(regExp_comments, ""); // reomve comments and return only code
  //console.log(code_only);
  const regExp_wl_bl_words = /whitelist|blacklist|master|slave/gi; //catch whitelist and blacklist words
  let matches = code_only.match(regExp_wl_bl_words);
  //console.log(matches);
  //let linesNumbers = await findLinesOfMatches(matches, filePath, contractNode, true);
  let linesNumbersObj = await findLinesOfMatches_hashmap(matches, filePath, contractNode, true);
  //console.log(linesNumbersObj);
  for (var matchKey in linesNumbersObj) {
    let linesNumbers = linesNumbersObj[matchKey];
      for (let index = 0; index < linesNumbers.length; index++) {
        const whichLine = linesNumbers[index];
        let auditKeyword = "@audit";
        detectionResult.push({
          id: id,
          loc: {
            start: { line: whichLine, column: 0 },
            end: { line: whichLine, column: 0 },
          },
          extra: { auditToPrint: auditKeyword + " " + matchKey }
        });
        // console.log(detectionResult[detectionResult.length - 1]);
      }
    }
  
  //console.log(linesNumbers);
  //console.log(detectionResult);
  return detectionResult;
}



const Use_scientific_notation_eg_1e18_rather_than_exponentiation_eg_10starstar18_N_45 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-45";
  let detectionResult = [];
  let contract = await return_contract_as_string(filePath, contractNode);

  const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
  let code_only = contract.replace(regExp_comments, ""); // reomve comments and return only code
  //console.log(code_only);
  const regExp = /\d.*\*\*.*\d/gm; //catch e.g. 10**18
  let matches = code_only.match(regExp);
  //return;
  let linesNumbers = await findLinesOfMatches(matches, filePath, contractNode, true);
  for (let index = 0; index < linesNumbers.length; index++) {
    const whichLine = linesNumbers[index];
    let auditKeyword = "@audit";
    detectionResult.push({
      id: id,
      loc: {
        start: { line: whichLine, column: 0 },
        end: { line: whichLine, column: 0 },
      },
      extra: { auditToPrint: auditKeyword + " " + matches[index] }
    });
    ////console.log(detectionResult[detectionResult.length - 1]);
  }
  //console.log(linesNumbers);
  //console.log(detectionResult);
  return detectionResult;
}

const address_shouldnt_be_hard_coded_N_46 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-46";
  let detectionResult = [];

  let contract = await return_contract_as_string(filePath, contractNode);
  const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
  let code_only = contract.replace(regExp_comments, ""); // reomve comments and return only code
  //console.log(code_only);
  const regExp = /\=\s*0x.*/gi; //catch = 0x...address wallet 
  let matches = code_only.match(regExp);
  //console.log(matches);
  //return;
  let foundLines = await findLinesOfMatches_old(matches, contract, null, null);
  //console.log(foundLines);
  let linesNumbers = await findLinesNumbers_return_numbers(foundLines, filePath, contractNode);
  for (let index = 0; index < linesNumbers.length; index++) {
    const whichLine = linesNumbers[index];
    let auditKeyword = "@audit";
    detectionResult.push({
      id: id,
      loc: {
        start: { line: whichLine, column: 0 },
        end: { line: whichLine, column: 0 },
      },
      extra: { auditToPrint: auditKeyword + " hardcoded => " + matches[index].replace("=", "") }
    });
    //console.log(detectionResult[detectionResult.length - 1]);
  }
  //console.log(linesNumbers);
  //console.log(detectionResult);
  return detectionResult;
}


///assembly\s*\{(.|\n)*?}/gm
const address_shouldnt_be_hard_coded_N_47 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-47";
  let detectionResult = [];

  let contract = await return_contract_as_string(filePath, contractNode);
  const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
  let code_only = contract.replace(regExp_comments, ""); // reomve comments and return only code
  //console.log(code_only);
  const regExp = /.*assembly\s*{/gm; //catch assembly start of the block => assembly {
  // /assembly\s*\{(.|\n)*?}/gm; //catch assembly block
  let matches = code_only.match(regExp);
  let linesNumbers = await findLinesOfMatches(matches, filePath, contractNode, true);
  for (let index = 0; index < linesNumbers.length; index++) {
    const whichLine = linesNumbers[index];
    let auditKeyword = "@audit";
    detectionResult.push({
      id: id,
      loc: {
        start: { line: whichLine, column: 0 },
        end: { line: whichLine, column: 0 },
      }
    });
    //console.log(detectionResult[detectionResult.length - 1]);
  }
  //console.log(linesNumbers);
  //console.log(detectionResult);
  return detectionResult;
}

const abi_iencodePacked_should_not_be_used_with_dynamic_types_when_passing_the_result_to_a_hash_function_such_as_keccak256_N_48 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-48";
  let detectionResult = [];

  let contract = await return_contract_as_string(filePath, contractNode);
  const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
  let code_only = contract.replace(regExp_comments, ""); // reomve comments and return only code
  //console.log(code_only);
  const regExp = /keccak256.*\(abi\.encodePacked\(.*/gm; //catch keccak256(abi.encodePacked(... end of line
  // /assembly\s*\{(.|\n)*?}/gm; //catch assembly block
  let matches = code_only.match(regExp);

  let linesNumbers = await findLinesOfMatches(matches, filePath, contractNode, true);
  for (let index = 0; index < linesNumbers.length; index++) {
    const whichLine = linesNumbers[index];
    let auditKeyword = "@audit";
    detectionResult.push({
      id: id,
      loc: {
        start: { line: whichLine, column: 0 },
        end: { line: whichLine, column: 0 },
      }
    });
    //console.log(detectionResult[detectionResult.length - 1]);
  }
  //console.log(linesNumbers);
  //console.log(detectionResult);
  return detectionResult;
}


const Consider_using_delete_rather_than_assigning_zero_to_clear_values_N_49 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-49";
  let detectionResult = [];

  let contract = await return_contract_as_string(filePath, contractNode);
  const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
  let code_only = contract.replace(regExp_comments, ""); // reomve comments and return only code
  //console.log(code_only);
  const regExp = /.*\[.*\]\s*=\s*0/gm; //catch assined array to zero
  // /assembly\s*\{(.|\n)*?}/gm; //catch assembly block
  let matches = code_only.match(regExp);
  //console.log(matches);
  //return;
  let linesNumbers = await findLinesOfMatches(matches, filePath, contractNode, true);
  for (let index = 0; index < linesNumbers.length; index++) {
    const whichLine = linesNumbers[index];
    let auditKeyword = "@audit";
    detectionResult.push({
      id: id,
      loc: {
        start: { line: whichLine, column: 0 }, end: { line: whichLine, column: 0 },
      }
    });
    //console.log(detectionResult[detectionResult.length - 1]);
  }
  //console.log(linesNumbers);
  //console.log(detectionResult);
  return detectionResult;
}



const Cast_to_bytes_or_bytes32_for_clearer_semantic_meaning_N_50 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-50";
  let detectionResult = [];

  let contract = await return_contract_as_string(filePath, contractNode);
  const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
  let code_only = contract.replace(regExp_comments, ""); // reomve comments and return only code
  //console.log(code_only);
  const regExp = /abi\.encodePacked\(.*/gm; //catch keccak256(abi.encodePacked(... end of line
  // /assembly\s*\{(.|\n)*?}/gm; //catch assembly block
  let matches = code_only.match(regExp);

  let linesNumbers = await findLinesOfMatches(matches, filePath, contractNode, true);
  for (let index = 0; index < linesNumbers.length; index++) {
    const whichLine = linesNumbers[index];
    let auditKeyword = "@audit";
    detectionResult.push({
      id: id,
      loc: {
        start: { line: whichLine, column: 0 },
        end: { line: whichLine, column: 0 },
      }
    });
    //console.log(detectionResult[detectionResult.length - 1]);
  }
  //console.log(linesNumbers);
  //console.log(detectionResult);
  return detectionResult;
}



const Custom_error_has_no_error_details_N_51 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-51";
  let detectionResult = [];

  let contract = await return_contract_as_string(filePath, contractNode);
  const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
  let code_only = contract.replace(regExp_comments, ""); // reomve comments and return only code
  //console.log(code_only);
  const regExp = /error.*\(\)/gm;
  let matches = code_only.match(regExp);

  let linesNumbers = await findLinesOfMatches(matches, filePath, contractNode, true);
  for (let index = 0; index < linesNumbers.length; index++) {
    const whichLine = linesNumbers[index];
    let auditKeyword = "@audit";
    detectionResult.push({
      id: id,
      loc: {
        start: { line: whichLine, column: 0 },
        end: { line: whichLine, column: 0 },
      }
    });
    //console.log(detectionResult[detectionResult.length - 1]);
  }
  //console.log(linesNumbers);
  //console.log(detectionResult);
  return detectionResult;
}


const Empty_Function_Body_N_52 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-52";
  let detectionResult = [];

  let contract = await return_contract_as_string(filePath, contractNode);
  const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
  let code_only = contract.replace(regExp_comments, ""); // reomve comments and return only code
  //console.log(code_only);
  const regExp = /function\s.*\(\s*(.|\n)*?\{\s*(.|\n)*?\}/gm;
  //for function block match: 
  //  /function\s.*\(\s*(.|\n)*?\{\s*(.|\n)*?\}/gm
  let matches = code_only.match(regExp);
  //catch function body but emoty only //check on function level since we brought all function with thier bodies
  const regExp_emptyFunc = /function\s.*\(\s*(.|\n)*?\{\s*\}/gm;
  let isEmptyFuncMatches;
  if (matches) {
    isEmptyFuncMatches = matches.join(",").match(regExp_emptyFunc);
  }
  //console.log(matches);

  let linesNumbers = await findLinesOfMatches(matches, filePath, contractNode, true);
  for (let index = 0; index < linesNumbers.length; index++) {
    const whichLine = linesNumbers[index];
    let auditKeyword = "@audit";
    detectionResult.push({
      id: id,
      loc: {
        start: { line: whichLine, column: 0 },
        end: { line: whichLine, column: 0 },
      }
    });
    //console.log(detectionResult[detectionResult.length - 1]);
  }
  //console.log(linesNumbers);
  //console.log(detectionResult);
  return detectionResult;
}


const Using_multiple_require_and_if_improves_code_readability_and_makes_it_easier_to_debug_N_53 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-53";
  let detectionResult = [];

  let contract = await return_contract_as_string(filePath, contractNode);
  const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
  let code_only = contract.replace(regExp_comments, ""); // reomve comments and return only code
  //console.log(code_only);
  const regExp = /if\s*\(.*&&/gm; 
  let matches = code_only.match(regExp);
  // console.log(matches);
  let linesNumbers = await findLinesOfMatches(matches, filePath, contractNode, true);
  for (let index = 0; index < linesNumbers.length; index++) {
    const whichLine = linesNumbers[index];
    let auditKeyword = "@audit";
    detectionResult.push({
      id: id,
      loc: {
        start: { line: whichLine, column: 0 },
        end: { line: whichLine, column: 0 },
      }
    });
    //console.log(detectionResult[detectionResult.length - 1]);
  }
  //console.log(linesNumbers);
  //console.log(detectionResult);
  return detectionResult;
}



const else_block_not_required_N_54 = async function (
  filePath, contractNode, subNode, varOrStatement
) {
  let id = "N-54";
  let detectionResult = [];

  let contract = await return_contract_as_string(filePath, contractNode);
  const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
  let code_only = contract.replace(regExp_comments, ""); // reomve comments and return only code
  //console.log(code_only);
  const regExp = /else.*if\s*\(.*\).*\{\s*(.|\n)*?\}\s*(.|\n)*?else/gm; // else if(){} else{}
  let matches = code_only.match(regExp);
  // console.log(matches);
  //because the matches are multi line we just pass the first line of a Match
  //so findLinesOfMatches can work with it
  let firstLinesOfMatches = [];
  if(matches){
  for (let index = 0; index < matches.length; index++) {
    const match = matches[index];
    let firstline = match.substring(0, match.indexOf('\n'));
    firstLinesOfMatches.push(firstline);
  }
}
  // console.log(firstLinesOfMatches);
  let linesNumbers = await findLinesOfMatches(firstLinesOfMatches, filePath, contractNode, true);
  for (let index = 0; index < linesNumbers.length; index++) {
    const whichLine = linesNumbers[index];
    let auditKeyword = "@audit";
    detectionResult.push({
      id: id,
      loc: {
        start: { line: whichLine, column: 0 },
        end: { line: whichLine, column: 0 },
      }
    });
    //console.log(detectionResult[detectionResult.length - 1]);
  }
  //console.log(linesNumbers);
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
  //console.log(detectionResult);

  const N_39 = await Variable_names_that_consist_of_all_capital_letters_should_be_reserved_for_constant_immutable_variables_N_39(
    filePath,
    contractNode,
    subNode,
    varOrStatement
  );
  if (N_39) {
    detectionResult = detectionResult.concat(N_39);
  }

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
  //console.log(statement);
  detectionResult = _issues(filePath, contractNode, subNode, statement);
  return detectionResult;
};

// This is to check state variable declaration
const _checkStateVariable = async function (filePath, contractNode, stateVar) {
  // console.log(subNode);
  let detectionResult = [];
  //instead of subNode we pass contractNode param
  detectionResult = _issues(filePath, contractNode, contractNode, stateVar);
  return detectionResult;
};

//use this function when you like to use regex. it's callable once
// This is for contract specific.
const _checkContract = async function (filePath, contractNode) {
  // console.log('detector1._checkContract');
  let detectionResult = [];

  const N_35 = await Mixed_usage_of_int_uint_with_int256_uint256_N_35(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_35) {
    detectionResult = detectionResult.concat(N_35);
  }

  const N_36 = await Event_is_not_properly_indexed_N_36(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_36) {
    detectionResult = detectionResult.concat(N_36);
  }


  const N_37 = await override_function_arguments_that_are_unused_should_have_the_variable_name_removed_or_commented_out_to_avoid_compiler_warnings_N_37(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_37) {
    detectionResult = detectionResult.concat(N_37);
  }


  const N_38 = await MUse_inheritdoc_rather_than_using_a_non_standard_annotation_N_38(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_38) {
    detectionResult = detectionResult.concat(N_38);
  }

  const N_40 = await NatSpec_return_argument_is_missing_N_40(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_40) {
    detectionResult = detectionResult.concat(N_40);
  }


  const N_41 = await Function_ordering_does_not_follow_the_Solidity_style_guide_N_41(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_41) {
    detectionResult = detectionResult.concat(N_41);
  }


  const N_42 = await Strings_should_use_double_quotes_rather_than_single_quotes_N_42(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_42) {
    detectionResult = detectionResult.concat(N_42);
  }


  const N_44 = await Avoid_the_use_of_sensitive_terms_N_44(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_44) {
    detectionResult = detectionResult.concat(N_44);
  }


  const N_45 = await Use_scientific_notation_eg_1e18_rather_than_exponentiation_eg_10starstar18_N_45(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_45) {
    detectionResult = detectionResult.concat(N_45);
  }

  const N_46 = await address_shouldnt_be_hard_coded_N_46(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_46) {
    detectionResult = detectionResult.concat(N_46);
  }


  const N_47 = await address_shouldnt_be_hard_coded_N_47(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_47) {
    detectionResult = detectionResult.concat(N_47);
  }


  const N_48 = await abi_iencodePacked_should_not_be_used_with_dynamic_types_when_passing_the_result_to_a_hash_function_such_as_keccak256_N_48(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_48) {
    detectionResult = detectionResult.concat(N_48);
  }

  const N_49 = await Consider_using_delete_rather_than_assigning_zero_to_clear_values_N_49(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_49) {
    detectionResult = detectionResult.concat(N_49);
  }


  const N_50 = await Cast_to_bytes_or_bytes32_for_clearer_semantic_meaning_N_50(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_50) {
    detectionResult = detectionResult.concat(N_50);
  }


  const N_51 = await Custom_error_has_no_error_details_N_51(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_51) {
    detectionResult = detectionResult.concat(N_51);
  }


  const N_52 = await Empty_Function_Body_N_52(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_52) {
    detectionResult = detectionResult.concat(N_52);
  }

  
  const N_53 = await Using_multiple_require_and_if_improves_code_readability_and_makes_it_easier_to_debug_N_53(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_53) {
    detectionResult = detectionResult.concat(N_53);
  }


  
  const N_54 = await else_block_not_required_N_54(
    filePath,
    contractNode,
    null,
    null
  );
  if (N_54) {
    detectionResult = detectionResult.concat(N_54);
  }

  // console.log(subNode);
  return detectionResult;
};


// This is a gereral check for anything not covered.
const _check = async function (filePath, contractNode, subNode) {
  // console.log('detector1');
  // console.log(subNode);
  let detectionResult = [];

  const N_43 = await Use_a_more_recent_version_of_solidity_N_43(
    filePath,
    contractNode,
    subNode,
    null
  );
  if (N_43) {
    detectionResult = detectionResult.concat(N_43);
  }

  //console.log(statement);
  return detectionResult;
};

//return contract lines for regex match commands
const _get_contract_lines = async function (filePath, contractNode) {
  //if(contractNode == null) return "";
  //console.log(contractNode.loc);
  //console.log(contractNode);
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
