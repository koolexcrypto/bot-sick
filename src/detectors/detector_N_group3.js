import types from "../types.js";
import inspector from "../util/inspector.js";
import utility_analyzer from "../utility_analyzer.js";

//uint types array
//add \\ to * to avoid regex to skip the stars and avoid regex error
let uintTypes = [
  "2\\*\\*8",
  "2\\*\\*16",
  "2\\*\\*24",
  "2\\*\\*32",
  "2\\*\\*40",
  "2\\*\\*48",
  "2\\*\\*56",
  "2\\*\\*64",
  "2\\*\\*72",
  "2\\*\\*80",
  "2\\*\\*88",
  "2\\*\\*96",
  "2\\*\\*104",
  "2\\*\\*112",
  "2\\*\\*120",
  "2\\*\\*128",
  "2\\*\\*136",
  "2\\*\\*144",
  "2\\*\\*152",
  "2\\*\\*160",
  "2\\*\\*168",
  "2\\*\\*176",
  "2\\*\\*184",
  "2\\*\\*192",
  "2\\*\\*200",
  "2\\*\\*208",
  "2\\*\\*216",
  "2\\*\\*224",
  "2\\*\\*232",
  "2\\*\\*240",
  "2\\*\\*248",
  "2\\*\\*256",
];

//2**<n> - 1 should be re-written as type(uint<n>).max
const _2_n_1_should_be_re_written_as_type_uint_n_max_N_15 = async function (
  filePath,
  varOrStatement,
  subNode,
  contractNode
) {
  let detectionResult = [];
  // try {
  const id = "N-15";
  //console.log(varOrStatement);
  let contract = await return_contract_as_string(filePath, contractNode);
  var regexFromMyArray = new RegExp(uintTypes.join("|"), "gi");
  //we are applying regex from array here
  var matches = contract.match(regexFromMyArray) || [];
  //console.log(matches);

  //check matches
  //find the lines
  let foundLines = [];
  for (let i = 0; i < matches.length; i++) {
    //const regExp_fixed = /.*2\*\*224.*\n/;
    let tofind = matches[i].replaceAll("*", "\\*");
    //console.log(tofind);
    let regExpStr = ".*" + tofind + ".*\\n";
    let regExp = new RegExp(regExpStr, "gm");
    //console.log(regExp);
    let res = contract.match(regExp) || [];
    //res will return an array of regex
    for (let r = 0; r < res.length; r++) {
      foundLines.push(res[r]);
    }
    //console.log(res);
    //console.log(res.length);
  }

  //console.log(foundLines[0]);
  //console.log(foundLines[0].length);
  let lines = await _get_contract_lines(filePath, contractNode);
  let linesArr = Object.values(lines);

  //console.log("foundLines");
  //console.log(foundLines);

  let storedLines = {};
  if (foundLines.length > 0) {
    try {
      for (let i = 0; i < foundLines.length; i++) {
        //we need to remove \n always to match _get_contract_lines result
        let CurrentWhichLine = linesArr.indexOf(
          foundLines[i].replace("\n", "")
        );
        let startLine = contractNode.loc.start.line;
        //console.log(contractNode.loc);
        //you need to add the offser from contract lines
        //_get_contract_lines
        //to get the correct line number
        let whichLine = CurrentWhichLine + parseInt(startLine);
        //}
        //check if whichLine not duplicate
        if (!storedLines[whichLine]) {
          //console.log(whichLine);
          detectionResult.push({
            id: id,
            loc: {
              start: { line: whichLine, column: 0 },
              end: { line: whichLine, column: 0 },
            },
          });
        }
        storedLines[whichLine] = true;
      }
    } catch (error) {
      console.log(error);
    }
  }
  return detectionResult;
};

const constants_should_be_defined_rather_than_using_magic_numbers_N_16 =
  async function (filePath, varOrStatement, subNode, contractNode) {
    let detectionResult = [];
    // try {
    const id = "N-16";
    //console.log(varOrStatement);
    let contract = await return_contract_as_string(filePath, contractNode);
    const regExp = /-?[0-9]&*e-?[0-9]*/gm; //to catch 1e18 4e27 etc..
    var matches = contract.match(regExp) || [];
    var regexFromMyArray = new RegExp(uintTypes.join("|"), "gi"); // 2**224 2**8 etc..
    var matches2 = contract.match(regexFromMyArray) || [];
    let matches2Res = [];
    for (let i = 0; i < matches2.length; i++) {
      //const regExp_fixed = /.*2\*\*224.*\n/;
      //add \ before *
      let new_ = matches2[i].replaceAll("*", "\\*");
      matches2Res.push(new_);
    }
    matches = matches.concat(matches2Res);
    //console.log(matches);

    //find the lines
    let lines = await _get_contract_lines(filePath, contractNode);
    let linesArr = Object.values(lines);
    let foundLines = [];
    for (let i = 0; i < matches.length; i++) {
      let tofind = matches[i];
      //console.log(tofind);
      let regExpStr = ".*" + tofind + ".*\\n";
      let regExp_ = new RegExp(regExpStr, "gm");
      //console.log(regExp);
      let res = contract.match(regExp_) || [];
      for (let r = 0; r < res.length; r++) {
        foundLines.push(res[r]);
      }
    }

    //console.log(foundLines);
    let storedLines = {};
    if (foundLines.length > 0) {
      try {
        for (let i = 0; i < foundLines.length; i++) {
          //we need to remove \n always to match _get_contract_lines result
          let CurrentWhichLine = linesArr.indexOf(
            foundLines[i].replace("\n", "")
          );
          let startLine = contractNode.loc.start.line;
          let whichLine = CurrentWhichLine + parseInt(startLine);
          //check if whichLine not duplicate
          if (!storedLines[whichLine]) {
            //console.log(whichLine);
            detectionResult.push({
              id: id,
              loc: {
                start: { line: whichLine, column: 0 },
                end: { line: whichLine, column: 0 },
              },
            });
          }
          storedLines[whichLine] = true;
        }
      } catch (error) {
        console.log(error);
      }
    }

    //console.log(detectionResult);
    return detectionResult;
  };

const Events_that_mark_critical_parameter_changes_should_contain_both_the_old_and_the_new_value_N_17 =
  async function (filePath, contractNode, subNode, varOrStatement) {
    let detectionResult = [];
    // try {
    const id = "N-17";

    //console.log(varOrStatement);
    var hasOldValue = false;
    if (varOrStatement.type == types.EmitStatement) {
      var emit_arguments = varOrStatement.eventCall.arguments;
      //console.log(emit_arguments);
      for (let i = 0; i < emit_arguments.length; i++) {
        //console.log(emit_arguments[i].base.type);
        if (
          emit_arguments[i].base &&
          emit_arguments[i].base.type === "Identifier"
        ) {
          //console.log(emit_arguments[i].base.name);
          if (emit_arguments[i].base.name.indexOf("old") !== -1) {
            //x //y //oldZ
            //console.log(emit_arguments[i].base.name);
            hasOldValue = true;
            //break;
          }
        } else if (
          emit_arguments[i] &&
          emit_arguments[i].type === "Identifier"
        ) {
          //console.log(emit_arguments[i].name);
          if (emit_arguments[i].name.indexOf("old") !== -1) {
            //x //y //oldZ
            //console.log(emit_arguments[i].name);
            hasOldValue = true;
            //break;
          }
        }
      }

      if (!hasOldValue) {
        //.log(varOrStatement.loc.start);
        // console.log(emit_arguments);
        detectionResult.push({
          id: id,
          loc: varOrStatement.loc,
        });
      }
    }

    return detectionResult;
  };

const Inconsistent_spacing_in_comments_N_19 = async function (
  filePath,
  varOrStatement,
  subNode,
  contractNode
) {
  let detectionResult = [];
  // try {
  const id = "N-19";
  //console.log(varOrStatement);
  let contract = await return_contract_as_string(filePath, contractNode);
  const regExp = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch the comments
  var matches = contract.match(regExp) || [];
  //console.log(matches);

  //check if there is space after // and some times not
  var withSpace = 0; var noSpace = 0;
  let has_no_space_regex = /\/\/[^\s]/g;
  let has_space_regex = /\/\/[\s]/g;
  for (let i = 0; i < matches.length; i++) {
    let checkSpace = matches[i];
    let no_space_res = checkSpace.match(has_no_space_regex);
    let with_space_res = checkSpace.match(has_space_regex);
    //console.log(with_space_res);
    //if (checkSpace.indexOf("// ") !== -1 || checkSpace.indexOf("//") !== -1) {
    if (with_space_res) withSpace++;
    else if (no_space_res) noSpace++;
  }

    let found_Inconsistent_spacing = false;
    if (matches.length > 0) {
      if (withSpace > 0 && noSpace > 0) {
        if (withSpace <= matches.length) {
          found_Inconsistent_spacing = true;
        }
      }
    }

    if (found_Inconsistent_spacing) {
      let lines = await _get_contract_lines(filePath, contractNode);
      let linesArr = Object.values(lines);
      let foundLines = [];
      for (let i = 0; i < matches.length; i++) {
        try {
          let tofind = matches[i];
          //console.log(tofind);
          let regExpStr = ".*" + tofind + ".*\\n";
          let regExp_ = new RegExp(regExpStr, "gm");
          //console.log(regExp);
          let res = contract.match(regExp_) || [];
          for (let r = 0; r < res.length; r++) {
            foundLines.push(res[r]);
          }
        } catch (error) { }
      }

      //find the lines //catch only 2 comments are enough
      let fineWithSpace = false;
      let findWithoutSpace = false;
      let storedLines = {};
      if (foundLines.length > 0) {
        try {
          let newLines = [];
          var counter = 0;
          for (let i = 0; i < foundLines.length; i++) {
            let checkSpace = foundLines[i];
            let no_space_res = checkSpace.match(has_no_space_regex);
            let with_space_res = checkSpace.match(has_space_regex);
            if (with_space_res && fineWithSpace == false) {
              newLines[counter] = foundLines[i];
              counter++;
              fineWithSpace = true;
            } else if (no_space_res) {
              newLines[counter] = foundLines[i];
              counter++;
              findWithoutSpace = true;
            }
            // if (
            //   (foundLines[i].indexOf("/// ") !== -1 ||
            //     foundLines[i].indexOf("// ") !== -1 || foundLines[i].indexOf("// ") !== -1) &&
            //   fineWithSpace == false
            // ) {
            //   newLines[counter] = foundLines[i];
            //   counter++;
            //   fineWithSpace = true;
            // } else {
            //   if (findWithoutSpace == false) {
            //     newLines[counter] = foundLines[i];
            //     counter++;
            //     findWithoutSpace = true;
            //   }
            // }
          }

          //console.log(newLines);
          //console.log(newLines.length);
          for (let i = 0; i < newLines.length; i++) {
            //we need to remove \n always to match _get_contract_lines result
            let CurrentWhichLine = linesArr.indexOf(
              newLines[i].replace("\n", "")
            );
            let startLine = contractNode.loc.start.line;
            let whichLine = CurrentWhichLine + parseInt(startLine);
            //check if whichLine not duplicate
            if (!storedLines[whichLine]) {
              //console.log(whichLine);
              detectionResult.push({
                id: id,
                loc: {
                  start: { line: whichLine, column: 0 },
                  end: { line: whichLine, column: 0 },
                },
              });
            }
            storedLines[whichLine] = true;
          }
        } catch (error) {
          console.log(error);
        }
      }
    }


  



  return detectionResult;
};

const Lines_are_too_long_20 = async function (
  filePath,
  varOrStatement,
  subNode,
  contractNode
) {
  const id = "N-20";
  let detectionResult = [];

  let lines = await _get_contract_lines(filePath, contractNode);
  let linesArr = Object.values(lines);
  let foundLines = [];
  for (let i = 0; i < linesArr.length; i++) {
    let line = linesArr[i];
    let len = line.length;
   // console.log(len);
    if (len > 128) {
      foundLines.push(line);
    }
  }

  //console.log("foundLines");
  //console.log(foundLines);
  if (foundLines.length > 0) {
    try {
      let storedLines = {};
      for (let i = 0; i < foundLines.length; i++) {
        //we need to remove \n always to match _get_contract_lines result
        let CurrentWhichLine = linesArr.indexOf(
          foundLines[i].replace("\n", "")
        );
        let startLine = contractNode.loc.start.line;
        let whichLine = CurrentWhichLine + parseInt(startLine);
        //check if whichLine not duplicate
        if (!storedLines[whichLine]) {
          //console.log(whichLine);
          detectionResult.push({
            id: id,
            loc: {
              start: { line: whichLine, column: 0 },
              end: { line: whichLine, column: 0 },
            },
          });
        }
        storedLines[whichLine] = true;
      }
    } catch (error) {
      console.log(error);
    }
  }

  return detectionResult;
};

const File_is_missing_NatSpec_N_22 = async function (
  filePath,
  varOrStatement,
  subNode,
  contractNode
) {
  let detectionResult = [];
  // try {
  const id = "N-22";
  //console.log(varOrStatement);
  let contract = await return_contract_as_string(filePath, contractNode);
  //const regExp = /(\@)(.+?)(?=[\n\r]|\*\))/gm; //catch @ netspec
  //const regExp = /((.+?)\@)(.+?)(?=[\n\r]|\*\))/gm; ////catch whole @ netspec line
  const regExp = /(\*(.+?)\@)(.+?)(?=[\n\r]|\*\))/gm; ////catch * @ netspec line
  const regExp2 = /(\/(.+?)\@)(.+?)(?=[\n\r]|\*\))/gm; ////catch / @ netspec line
  var matches = contract.match(regExp) || [];
  var matches2 = contract.match(regExp2) || [];
  matches = matches.concat(matches2);

  //we dont need to check the imports statment that has @
  //the returned contract comes without imports section
  //console.log(matches);
  if (matches.length == 0) {
    detectionResult.push({
      id: id,
      loc: contractNode.loc,
    });
  }

  return detectionResult;
};

//NatSpec @param is missing
const NatSpec_at_param_is_missing_N_23 = async function (
  filePath,
  varOrStatement,
  subNode,
  contractNode
) {
  let detectionResult = [];
  // try {
  const id = "N-23";
  //console.log(varOrStatement);
  let contract = await return_contract_as_string(filePath, contractNode);
  const regExp = /@param.*/gm; ////catch * @ netspec line
  var matches = contract.match(regExp) || [];

  //we dont need to check the imports statment that has @
  //the returned contract comes without imports section
  //console.log(matches);

  //now we need to loop all functions arguments (params) and comapre it to results of regex
  //check if the param of the arguments is missing in regex result lines
  let subNodes = contractNode.subNodes;
  let publicFuncArgs_arr = [];
  let publicFuncArgs_arr_line_number = [];
  for (var i = 0; i < subNodes.length; i++) {
    if (subNodes[i].type == "FunctionDefinition") {
      if (subNodes[i].parameters) {
        for (var p = 0; p < subNodes[i].parameters.length; p++) {
          let paramName = subNodes[i].parameters[p].name;
          //console.log(paramName);
          publicFuncArgs_arr.push(paramName);
          publicFuncArgs_arr_line_number.push(subNodes[i].parameters[p].loc);
          //publicFuncArgs[paramName] = true;
        }
      }
    }
  }

  for (var i = 0; i < publicFuncArgs_arr.length; i++) {
    for (var j = 0; j < matches.length; j++) {
      // if (!missing_params[publicFuncArgs_arr[j]])
      if (matches[j].indexOf(publicFuncArgs_arr[i]) !== -1) {
        publicFuncArgs_arr[i] = "";
      }
    }
  }

  //find the lines
  for (var i = 0; i < publicFuncArgs_arr.length; i++) {
    if (publicFuncArgs_arr[i] !== "") {
      detectionResult.push({
        id: id,
        loc: publicFuncArgs_arr_line_number[i],
      });
    }
  }

  return detectionResult;
};

const _issues = async function (
  filePath,
  contractNode,
  subNode,
  varOrStatement
) {
  let detectionResult = [];

  const N_17 =
    await Events_that_mark_critical_parameter_changes_should_contain_both_the_old_and_the_new_value_N_17(
      filePath,
      contractNode,
      subNode,
      varOrStatement
    );
  if (N_17) {
    detectionResult = detectionResult.concat(N_17);
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

  //console.log(contractNode);
  const N_15 = await _2_n_1_should_be_re_written_as_type_uint_n_max_N_15(
    filePath,
    null,
    null,
    contractNode
  );
  if (N_15) {
    detectionResult = detectionResult.concat(N_15);
  }

  const N_16 =
    await constants_should_be_defined_rather_than_using_magic_numbers_N_16(
      filePath,
      null,
      null,
      contractNode
    );
  if (N_16) {
    detectionResult = detectionResult.concat(N_16);
  }

  const N_19 = await Inconsistent_spacing_in_comments_N_19(
    filePath,
    null,
    null,
    contractNode
  );
  if (N_19) {
    detectionResult = detectionResult.concat(N_19);
  }

  const N_20 = await Lines_are_too_long_20(filePath, null, null, contractNode);
  if (N_20) {
    detectionResult = detectionResult.concat(N_20);
  }

  const N_22 = await File_is_missing_NatSpec_N_22(
    filePath,
    null,
    null,
    contractNode
  );
  if (N_22) {
    detectionResult = detectionResult.concat(N_22);
  }

  const N_23 = await NatSpec_at_param_is_missing_N_23(
    filePath,
    null,
    null,
    contractNode
  );
  if (N_23) {
    detectionResult = detectionResult.concat(N_23);
  }

  // console.log(subNode);
  return detectionResult;
};

// This is a gereral check for anything not covered.
const _check = function (filePath, contractNode, subNode) {
  // console.log('detector1');
  // console.log(subNode);
  let detectionResult = [];
  // check other types of subnodes (general ones)
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
