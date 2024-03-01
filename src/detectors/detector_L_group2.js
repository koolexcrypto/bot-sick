import types from "../types.js";
import inspector from "../util/inspector.js";
import utility_analyzer from "../utility_analyzer.js";

const division_by_zero = "division_by_zero";
const loss_precision = "loss_precision";
const check_division_by_zero_not_prevented_L02 = async function (
  filePath,
  varOrStatement,
  subNode,
  contractNode
) {
  let detectionResult = [];

  const id = "L-02";
  if (_division_by_(varOrStatement, null, subNode, division_by_zero)) {
    detectionResult.push({
      id: id,
      loc: varOrStatement.loc,
    });
  } else if (varOrStatement.variables) {
    try {
      const vars = varOrStatement.variables;
      for (let i = 0; i < vars.length; i++) {
        if (
          _division_by_(
            vars[i],
            varOrStatement.initialValue,
            subNode,
            division_by_zero
          )
        ) {
          // console.log(vars[i])
          detectionResult.push({
            id: id,
            loc: varOrStatement.loc,
          });
        }
      }
    } catch (e) {}
  }

  return detectionResult;
};

const _division_by_ = function (cVar, initialValue, subNode, issueType) {
  //console.log(initialValue);

  //console.log(issueType);
  if (cVar.expression) {
    //  statement
    if (
      cVar.expression.right &&
      cVar.expression.type === "BinaryOperation" &&
      cVar.expression.operator === "/"
    ) {
      //console.log(cVar.expression);
      //check right variable
      if (issueType == division_by_zero)
        if (check_right_Identifier(cVar, initialValue, subNode)) {
          return true;
        }

      //check right if more than one variable
      if (issueType == loss_precision)
        if (
          check_right_Identifier_is_more_than_one(cVar, initialValue, subNode)
        ) {
          return true;
        }
    }
  } else if (initialValue) {
    // console.log(initialValue);
    if (
      initialValue.right &&
      initialValue.type === "BinaryOperation" &&
      initialValue.operator === "/"
    ) {
      // console.log(initialValue);

      //check right variable
      if (issueType == division_by_zero)
        if (check_right_Identifier(cVar, initialValue, subNode)) {
          return true;
        }

      //check right if more than one variable
      if (issueType == loss_precision)
        if (
          check_right_Identifier_is_more_than_one(cVar, initialValue, subNode)
        ) {
          return true;
        }
    }
  }

  //VariableDeclaration
  return false;
};

const check_right_Identifier = function (cVar, initialValue, subNode) {
  try {
    //console.log(initialValue);
    if (
      cVar &&
      cVar.expression &&
      cVar.expression.right.type === "Identifier"
    ) {
      return true;
    }
    if (initialValue && initialValue.right.type === "Identifier") {
      //console.log(subNode);
      // you must build recursive to check the function's body
      //so you can check: "if( X > 0)" or "x = 50" greater than zero
      //console.log(initialValue);
      return true;
    }
  } catch (error) {}

  return false;
};

const check_right_Identifier_is_more_than_one = function (
  cVar,
  initialValue,
  subNode,
  contractNode
) {
  try {
    //console.log(cVar.expression);
    if (cVar && cVar.expression) {
      if (cVar.expression.right.type === "TupleExpression") {
        return true;
      }
    }
    if (initialValue && initialValue.right.type === "TupleExpression") {
      return true;
    }
  } catch (error) {}
  return false;
};

const loss_of_precision_L03 = async function (
  filePath,
  varOrStatement,
  subNode,
  contractNode
) {
  let detectionResult = [];
  const id = "L-03";
  if (_division_by_(varOrStatement, null, subNode, loss_precision)) {
    detectionResult.push({
      id: id,
      loc: varOrStatement.loc,
    });
  } else if (varOrStatement.variables) {
    try {
      const vars = varOrStatement.variables;
      for (let i = 0; i < vars.length; i++) {
        if (
          _division_by_(
            vars[i],
            varOrStatement.initialValue,
            subNode,
            loss_precision
          )
        ) {
          // console.log(vars[i])
          detectionResult.push({
            id: id,
            loc: varOrStatement.loc,
          });
        }
      }
    } catch (e) {}
  }

  return detectionResult;
};

const require_should_be_used_instead_of_assert_L04 = async function (
  filePath,
  varOrStatement,
  subNode,
  contractNode
) {
  let detectionResult = [];
  const id = "L-04";
  if (varOrStatement && varOrStatement.expression) {
    if (varOrStatement.type === "ExpressionStatement") {
      try {
        if (varOrStatement.expression.expression.name === "assert") {
          detectionResult.push({
            id: id,
            loc: varOrStatement.loc,
          });
        }
      } catch (error) {}
    }
  }
  return detectionResult;
};

const require_safeApprove_deprecated_L05 = async function (
  filePath,
  varOrStatement,
  subNode,
  contractNode
) {
  let detectionResult = [];
  const id = "L-05";
  if (varOrStatement && varOrStatement.expression) {
    if (varOrStatement.type === "ExpressionStatement") {
      try {
        if (varOrStatement.expression.expression.memberName === "safeApprove") {
          //console.log(varOrStatement);
          detectionResult.push({
            id: id,
            loc: varOrStatement.loc,
          });
        }
      } catch (error) {}
    }
  }
  return detectionResult;
};

const missing_check_address_zero_for_two_identifiers_L06 = async function (
  filePath,
  varOrStatement,
  subNode,
  contractNode
) {
  let detectionResult = [];
  const id = "L-06";
  //console.log(varOrStatement.expression);
  try {
    if (varOrStatement && varOrStatement.expression) {
      if (varOrStatement.type === "ExpressionStatement") {
        if (
          varOrStatement.expression.type === "BinaryOperation" &&
          varOrStatement.expression.operator === "="
        ) {
          //console.log(filePath);
          if (
            varOrStatement.expression.left.type === "Identifier" &&
            varOrStatement.expression.right.type === "Identifier"
          ) {
            let find_identifier = "find_identifier";
            //for the left identifier
            let left_identifier_name = varOrStatement.expression.left.name;
            let find_identifier_obj = {
              id: find_identifier,
              params: { identifier_name: left_identifier_name },
            };
            let left_res = await send_detection_object_to_detectors_utility(
              find_identifier_obj,
              filePath
            );
            //console.log("left_res");
            //console.log(left_res[0].found);

            //for the right identifier
            let right_identifier_name = varOrStatement.expression.right.name;
            find_identifier_obj = {
              id: find_identifier,
              params: { identifier_name: right_identifier_name },
            };
            let right_res = await send_detection_object_to_detectors_utility(
              find_identifier_obj,
              filePath
            );
            //console.log("right_res");
            //console.log(right_res[0].found);

            //judge the results
            if (left_res.length > 0 && left_res[0].found) {
              if (right_res.length > 0 && right_res[0].found) {
                detectionResult.push({
                  id: id,
                  loc: varOrStatement.loc,
                });
              }
            }
          }
        }
      }
    }
  } catch (error) {}
  return detectionResult;
};

const send_detection_object_to_detectors_utility = async function (
  detectionObject,
  filePath
) {
  //console.log(find_identifier_obj);
  let allAnalysisArr = await utility_analyzer.analyzeSolidityFile(
    filePath,
    detectionObject
  );
  //console.log("allAnalysisArr");
  //console.log(allAnalysisArr);

  let resultArr = [];
  var res = 0;
  for (let i = 0; i < allAnalysisArr.length; i++) {
    const resObj = allAnalysisArr[i];
    for (let j = 0; j < resObj.length; j++) {
      const value = resObj[j];
      if (value.id) {
        resultArr[res] = value;
        res++;
      }
    }
  }
  //console.log("resultArr");
  //console.log(resultArr);
  return resultArr;
};

const upgradeable_contract_is_missing_a___gap_storage_variable_L07 =
  async function (filePath, varOrStatement, subNode, contractNode) {
    //subNode == contractNode on stateVars
    let detectionResult = [];
    const id = "L-07";
    //console.log(varOrStatement);

    let searchInThisContract = false;
    const baseContracts = contractNode.baseContracts;
    //contractNode.baseContracts.forEach(prop => {
    for (var i = 0; i < baseContracts.length; i++) {
      const InheritanceSpecifier = baseContracts[i].baseName.namePath;
      if (InheritanceSpecifier.indexOf("Upgradeable") !== -1) {
        //console.log("InheritanceSpecifier");
        //console.log(InheritanceSpecifier);
        searchInThisContract = true;
        break;
      }
    }

    let found = false;
    let vars = varOrStatement.variables;

    if (searchInThisContract == true) {
      if (vars) {
        let varsObj = vars[0];
        if (varsObj.type === "VariableDeclaration") {
          if (varsObj.name === "__gap") {
            //console.log(varsObj);
            found = true;
          }
        }
      }

      //we didnt find __gap var in the upgradable contracts
      if (found == false) {
        //console.log(contractNode.loc);
        detectionResult.push({
          id: id,
          loc: contractNode.loc,
        });
      }
    }

    searchInThisContract = false;
    return detectionResult;
  };

const External_calls_in_an_un_bounded_for_loop_may_result_in_a_DOS_L08 =
  async function (filePath, varOrStatement, subNode, contractNode) {
    let detectionResult = [];
    const id = "L-08";
    if(varOrStatement && varOrStatement.type === 'ForStatement')
    if(varOrStatement.conditionExpression && varOrStatement.conditionExpression.type === 'BinaryOperation')
      if (varOrStatement.conditionExpression.operator === '<') {
        if(varOrStatement.conditionExpression.right.type === 'Identifier'){
          detectionResult.push({
            id: id,
            loc: varOrStatement.loc,
          });
        }
      }
  
      return detectionResult;
  };

const _issues = async function (
  filePath,
  contractNode,
  subNode,
  statementOrVar
) {
  let detectionResult = [];

  const L_02 = await check_division_by_zero_not_prevented_L02(
    filePath,
    statementOrVar,
    subNode,
    contractNode
  );
  if (L_02) {
    detectionResult = detectionResult.concat(L_02);
  }

  const L_03 = await loss_of_precision_L03(
    filePath,
    statementOrVar,
    subNode,
    contractNode
  );
  if (L_03) {
    detectionResult = detectionResult.concat(L_03);
  }

  const L_04 = await require_should_be_used_instead_of_assert_L04(
    filePath,
    statementOrVar,
    subNode,
    contractNode
  );
  if (L_04) {
    detectionResult = detectionResult.concat(L_04);
  }

  const L_05 = await require_safeApprove_deprecated_L05(
    filePath,
    statementOrVar,
    subNode,
    contractNode
  );
  if (L_05) {
    detectionResult = detectionResult.concat(L_05);
  }

  const L_06 = await missing_check_address_zero_for_two_identifiers_L06(
    filePath,
    statementOrVar,
    subNode,
    contractNode
  );
  if (L_06) {
    detectionResult = detectionResult.concat(L_06);
  }

  const L_07 =
    await upgradeable_contract_is_missing_a___gap_storage_variable_L07(
      filePath,
      statementOrVar,
      subNode,
      contractNode
    );
  if (L_07) {
    detectionResult = detectionResult.concat(L_07);
  }

  const L_08 =
  await External_calls_in_an_un_bounded_for_loop_may_result_in_a_DOS_L08(
    filePath,
    statementOrVar,
    subNode,
    contractNode
  );
if (L_08) {
  detectionResult = detectionResult.concat(L_08);
}

  //you need to use this code later in the reporter //NOT HERE
  // remove duplicates
  //console.log(detectionResult);
  // if (detectionResult) {
  //   var _map = new Map();
  //   let unique_detectionResult = detectionResult.filter((items) => {
  //     if (items.length == 0) {
  //       return false;
  //     }
  //     const item = items[0];
  //     //console.log(item);
  //     if (!item.id || !item.loc) {
  //       return false;
  //     }
  //     const uid = item.id + item.loc.start.line + item.loc.end.line;
  //     if (_map.get(uid)) {
  //       return false;
  //     }

  //     _map.set(uid, item);
  //     return true;
  //   });

  //   console.log("detectionResult");
  //   console.log(detectionResult);
  //   console.log("unique_detectionResult");
  //   console.log(unique_detectionResult);
  // }

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

// This is for contract specific.
const _checkContract = async function (filePath, contractNode) {
  // console.log('detector1._checkContract');

  //console.log(contractNode);

  // console.log(subNode);
  let detectionResult = [];
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

export default {
  checkContract: _checkContract,
  checkStateVariable: _checkStateVariable,
  checkStatement: _checkStatement,
  check: _check,
};
