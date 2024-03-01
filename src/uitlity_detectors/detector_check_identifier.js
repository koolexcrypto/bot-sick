import types from "../types.js";
import inspector from "../util/inspector.js";

let find_identifier = "find_identifier";
const find_identifier_fun = async function (
  filePath,
  varOrStatement,
  subNode,
  detectionObject
) {
  let detectionResult = [];
  if (varOrStatement.variables) {
    // console.log(varOrStatement.variables[0]);
    try {
      if (varOrStatement.variables[0].type === "VariableDeclaration")
        if (varOrStatement.variables[0].typeName.name === "address") {
          let Identifier_name = detectionObject.params.identifier_name;
          //console.log(detectionObject.params.identifier_name);
          if (Identifier_name && Identifier_name == varOrStatement.variables[0].name) {
            //console.log(Identifier_name);
            //console.log(varOrStatement.variables[0]);
            detectionResult.push({
              id: detectionObject.id,
              loc: varOrStatement.loc,
              detectionObject:detectionObject,
              found:true
            });
          }
        }
    } catch (error) {}
  }

  return detectionResult;
};

// This is to check state variable declaration
const _checkStateVariable = function (
  filePath,
  contractNode,
  stateVar,
  detectionObject
) {
  //console.log('detector._checkStateVariable');
  // console.log(subNode);
  let detectionResult = [];
  //console.log(stateVar);

  return detectionResult;
};

// This is to check statements in a function or a block ...etc.
const _checkStatement = async function (
  filePath,
  contractNode,
  subNode,
  statement,
  detectionObject
) {
  // console.log('detector._checkStatement');
  // console.log(subNode);
  //console.log(detectionObject);

  let detectionResult = [];
  //console.log(detectionObject);
  if (detectionObject.id == find_identifier) {
    const res = await find_identifier_fun(
      filePath,
      statement,
      subNode,
      detectionObject
    );
    if (res) {
      detectionResult.push(res);
    }
  }

  //console.log(statement);

  return detectionResult;
};

// This is for contract specific.
const _checkContract = function (filePath, contractNode, detectionObject) {
  //if(detectionObject == find_identifier)
  //console.log(detectionObject);
  // console.log('detector1._checkContract');

  //console.log(contractNode);

  // console.log(subNode);
  let detectionResult = [];

  return detectionResult;
};

// This is a gereral check for anything not covered.
const _check = function (filePath, contractNode, subNode, detectionObject) {
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
