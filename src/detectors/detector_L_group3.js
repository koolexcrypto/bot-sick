import types from '../types.js'
import inspector from '../util/inspector.js'
import utility_analyzer from '../utility_analyzer.js'


// This is not complete and also not included. It is implemented now in L_group1
const approve_safeApprove_may_revert_if_the_current_approval_is_not_zero_L09 = async function (
  filePath,
  varOrStatement,
  subNode,
  contractNode
) {
  let detectionResult = []
  const id = 'L-05'

  var safeApprove_line = -1
  var approve_0_line = -1
  if (varOrStatement && varOrStatement.expression) {
    if (varOrStatement.type === 'ExpressionStatement') {
      try {
        if (varOrStatement.expression.expression.memberName === 'safeApprove') {
          console.log(varOrStatement)
          safeApprove_line = varOrStatement.expression.expression.loc.start.line
        }

        if (varOrStatement.expression.expression.memberName === 'approve') {
          console.log(varOrStatement.expression.arguments[1])
          //check right param of approve arguments
          if (varOrStatement.expression.arguments) {
            let rightParam = varOrStatement.expression.arguments[1]
            if (
              rightParam.type === 'NumberLiteral' &&
              rightParam.number === '0'
            ) {
              approve_0_line = varOrStatement.expression.expression.loc.start.line
            }
          }
        }
      } catch (error) { }
    }
  }

  //console.log("safeApprove_line: "+safeApprove_line);
  //console.log("approve_0_line: "+approve_0_line);
  if (safeApprove_line !== -1 && approve_0_line !== -1) {
    if (approve_0_line < safeApprove_line)
      detectionResult.push({
        id: id,
        loc: varOrStatement.loc
      })
  }
  return detectionResult
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

const _issues = async function (
  filePath,
  contractNode,
  subNode,
  statementOrVar
) {
  let detectionResult = []


  // This is not complete and also not included. It is implemented now in L_group1
  // const L_09 = await approve_safeApprove_may_revert_if_the_current_approval_is_not_zero_L09(
  //   filePath,
  //   statementOrVar,
  //   subNode,
  //   contractNode
  // )
  // if (L_09) {
  //   detectionResult = detectionResult.concat(L_09)
  // }

  return detectionResult
}

// This is to check statements in a function or a block ...etc.
const _checkStatement = async function (
  filePath,
  contractNode,
  subNode,
  statement
) {
  // console.log('detector._checkStatement');
  // console.log(subNode);
  let detectionResult = []
  //console.log(statement);
  detectionResult = _issues(filePath, contractNode, subNode, statement)
  return detectionResult
}

// This is to check state variable declaration
const _checkStateVariable = async function (filePath, contractNode, stateVar) {
  // console.log(subNode);
  let detectionResult = []
  //instead of subNode we pass contractNode param
  detectionResult = _issues(filePath, contractNode, contractNode, stateVar)
  return detectionResult
}

// This is for contract specific.
const _checkContract = async function (filePath, contractNode) {
  // console.log('detector1._checkContract');

  //console.log(contractNode);

  // console.log(subNode);
  let detectionResult = []
  return detectionResult
}

// This is a gereral check for anything not covered.
const _check = function (filePath, contractNode, subNode) {
  // console.log('detector1');
  // console.log(subNode);
  let detectionResult = []
  // check other types of subnodes (general ones)
  return detectionResult
}

//return contract lines for regex match commands
const _get_contract_lines = async function (filePath, contractNode) {
  //console.log(contractNode.loc);
  const lines = await inspector.readLinesFromTo(
    contractNode.loc.start.line,
    contractNode.loc.end.line,
    filePath
  )
  //console.log(lines);
  return lines
}

export default {
  checkContract: _checkContract,
  checkStateVariable: _checkStateVariable,
  checkStatement: _checkStatement,
  check: _check
}
