
import { log } from 'console';
import types from '../types.js';
import inspector from '../util/inspector.js';

//Consider disabling renounceOwnership() //N_01
const consider_disabling_renounceOwnership = function (filePath, contractNode) {
    const baseContracts = contractNode.baseContracts;
    //contractNode.baseContracts.forEach(prop => {
    for (var i = 0; i < baseContracts.length; i++) {
        const InheritanceSpecifier = baseContracts[i].baseName.namePath;
        if (InheritanceSpecifier.indexOf("Ownable") !== -1) {
            //console.log("issue found:")
            //console.log(InheritanceSpecifier)
            return {
                id: "N-01",
                loc: contractNode.loc // location of the code (i.e. line numbers)
            }
        }
    };
    return false;
}

//[N‑02] Events are missing sender information
const events_are_missing_sender_information = function (filePath, statement) {
    if (statement.type == types.EmitStatement) {
        //console.log("statment");
        // console.log(statement);
        //let start = statement.loc.start.line;
        // let end = statement.loc.end.line;
        //var linesNumbers = [start];
        //const lines = await inspector.readLines(linesNumbers, filePath);
        //console.log(statement.eventCall);
        var emit_arguments = statement.eventCall.arguments;
        for (let i = 0; i < emit_arguments.length; i++) {
            //console.log(emit_arguments[i]);
            if (emit_arguments[i].type == 'MemberAccess') {
                if (emit_arguments[i].expression.name == 'msg' && emit_arguments[i].expression.type == 'Identifier') {
                    return false;
                }
            }
            if (emit_arguments[i].type == 'FunctionCall') {
                if (emit_arguments[i].expression.name == '_msgSender' && emit_arguments[i].expression.type == 'Identifier') {
                    return false;
                }
            }

        }
        return {
            id: "N-02",
            loc: statement.loc // location of the code (i.e. line numbers)
        }
    }

    return false;
}

//[N‑03] Variables need not be initialized to zero
const uint256_Variables_dont_need_to_be_initialized_to_zero = function (filePath, stateVar, statment) {
    //console.log(stateVar);
    if (stateVar != null)
        if (stateVar.type == 'StateVariableDeclaration') {
            if (stateVar.variables[0].type == 'VariableDeclaration') {
                if (stateVar.initialValue != null)
                    if (stateVar.initialValue.type == 'NumberLiteral') {
                        if (stateVar.initialValue.number == '0')
                            return {
                                id: "N-03",
                                loc: stateVar.initialValue.loc // location of the code (i.e. line numbers)
                            }
                    }
            }
        }

    if (statment != null) {
        if (statment.type == 'VariableDeclarationStatement') {
            //console.log(statment);
            let stateVar = statment;
            if (stateVar.variables[0] != null)
                if (stateVar.variables[0].type == 'VariableDeclaration') {
                    if (stateVar.initialValue != null)
                        if (stateVar.initialValue.type == 'NumberLiteral') {
                            if (stateVar.initialValue.number == '0')
                                return {
                                    id: "N-03",
                                    loc: stateVar.initialValue.loc // location of the code (i.e. line numbers)
                                }
                        }
                }
        }
    }
}

//[N-05] Large numeric literals should use underscores for readability
const large_numeric_literals_should_use_underscores_for_readability = function (filePath, stateVar, statment) {
    let digitsCount = 4;
    let id = "N-05";
    if (stateVar != null) {
        if (stateVar.type == 'StateVariableDeclaration') {
            if (stateVar.variables[0].type == 'VariableDeclaration') {
                if (stateVar.initialValue != null)
                    if (stateVar.initialValue.type == 'NumberLiteral') {
                        //console.log(stateVar.initialValue.number);
                        // console.log(stateVar);
                        if (stateVar.initialValue.number.length >= digitsCount) {
                            const num = stateVar.initialValue.number;
                            if (num.indexOf(".") === -1 && num.indexOf("e") === -1 && num.indexOf("_") === -1) {
                                //console.log('true',stateVar.initialValue.number);
                                return {
                                    id: id,
                                    loc: stateVar.initialValue.loc // location of the code (i.e. line numbers)
                                }
                            }
                        }
                    }
            }
        }
    }
    if (statment != null) {
        if (statment.type == 'VariableDeclarationStatement') {
            let stateVar = statment;
            if (stateVar.variables[0] != null)
                if (stateVar.variables[0].type == 'VariableDeclaration') {
                    if (stateVar.initialValue != null)
                        if (stateVar.initialValue.type == 'NumberLiteral') {
                            //console.log(stateVar.initialValue.number);
                            // console.log(stateVar);
                            if (stateVar.initialValue.number.length >= digitsCount) {
                                const num = stateVar.initialValue.number;
                                if (num.indexOf(".") === -1 && num.indexOf("e") === -1 && num.indexOf("_") === -1) {
                                    //console.log('true',stateVar.initialValue.number);
                                    return {
                                        id: id,
                                        loc: stateVar.initialValue.loc // location of the code (i.e. line numbers)
                                    }
                                }
                            }
                        }
                }
        }
    }
}


//[N‑06] Constants in comparisons should appear on the left side//
const constants_in_comparisons_should_appear_on_the_left_side = function (filePath, statement) {
    if (statement.type == types.IfStatement) {
        if (statement.condition.type == 'BinaryOperation') {
            if (statement.condition.operator == '==' ||
                statement.condition.operator == '!=' ||
                statement.condition.operator == '<=' ||
                statement.condition.operator == '>=' ||
                statement.condition.operator == '<' ||
                statement.condition.operator == '>'
            ) {
                if (statement.condition.left.type == 'Identifier'
                    && statement.condition.right.type == 'NumberLiteral') {
                    return {
                        id: "N-06",
                        loc: statement.loc // location of the code (i.e. line numbers)
                    }
                }
            }
        }
    }
    if (statement.type == 'ExpressionStatement') {
        if (statement.expression.type == 'FunctionCall') {
            if (statement.expression.expression.name == 'require') {
                //console.log(statement);
                let args = statement.expression.arguments[0];
                if (args.type == 'BinaryOperation') {
                    if (args.operator == '==' ||
                        args.operator == '!=' ||
                        args.operator == '<=' ||
                        args.operator == '>=' ||
                        args.operator == '<' ||
                        args.operator == '>'
                    ) {
                        if (args.left.type == 'Identifier'
                            && args.right.type == 'NumberLiteral') {
                            //console.log(statement.expression.arguments);
                            return {
                                id: "N-06",
                                loc: statement.loc // location of the code (i.e. line numbers)
                            }
                        }
                    }
                }
            }
        }
    }
    return false;
}

//[N‑10] if-statement can be converted to a ternary
const if_statement_can_be_converted_to_a_ternary = function (filePath, statement) {
    let detectionResult = [];
    if (statement.type == types.IfStatement) {
        //console.log(statement.type);
        if (statement.trueBody != null && statement.falseBody != null) {
            if (statement.trueBody.statements && statement.trueBody.statements.length == 1 &&
                statement.falseBody.statements && statement.falseBody.statements.length == 1) {
                    detectionResult.push( {
                    id: "N-10",
                    loc: statement.loc // location of the code (i.e. line numbers)
                });
            }
        }
    }
    return detectionResult;
}

//[N‑12] Import declarations should import specific identifiers, rather than the whole file
const import_specific_identifier_rather_than_the_whole_file = async function (filePath, importsNodes) {
   let detectionResult = [];
    try {
        for (let i = 0; i < importsNodes.length; i++) {
            let importSolFile = importsNodes[i];
            //console.log(importSolFile);
            if (importSolFile.symbolAliases == null) {
                detectionResult.push( {
                    id: "N-12",
                    loc: importSolFile.loc // location of the code (i.e. line numbers)
                });
                //console.log(detectionResult[detectionResult.length-1]);
            }
        }
    } catch (e) {
        //return false;
    }
    //return false;
    return detectionResult;
}

//[N‑14] public functions not called by the contract should be declared external instead
//use regex
const public_functions_not_called_in_contract_should_be_external = async function (filePath, contractNode) {
    let detectionResult = [];
    let subNodes = contractNode.subNodes;
    let publicFuncArr = [];
    for (var i = 0; i < subNodes.length; i++) {
        if (subNodes[i].type == 'FunctionDefinition') {
            if (subNodes[i].visibility == 'public') {
                publicFuncArr.push(subNodes[i].name);
            }
        }
    }
   // console.log(publicFuncArr);

    let lines = await _get_contract_lines(filePath, contractNode)
    //console.log(lines);
    let linesString = '';
    Object.keys(lines).forEach(key => {
        linesString += lines[key] + '\n';
    });

    let externalFuncsArr = [];
    for (var i = 0; i < publicFuncArr.length; i++) {
        let tofind = publicFuncArr[i];
        //console.log(tofind);
        let regExpStr = '\\b' + tofind + '\\(\\b';
        let regExp = new RegExp(regExpStr, 'gm');
        //console.log(regExp);
        let res = linesString.match(regExp);
        //console.log(res);
        if (res == null)
            externalFuncsArr.push(publicFuncArr[i]);
    }

    //console.log(externalFuncsArr);

    //return which lines
    var exter = 0;
    let storedFuncs = {};
    for (let index = 0; index < externalFuncsArr.length; index++) {
        const func_ = externalFuncsArr[index];
        //console.log(func_);
        for (var i = 0; i < subNodes.length; i++) {
            if (subNodes[i].type == 'FunctionDefinition') {
                if (subNodes[i].visibility == 'public') {
                    if (subNodes[i].name.indexOf(func_) !== -1 && !storedFuncs[func_]) {
                        //console.log("should be external:");
                        //console.log(subNodes[i].name);
                        detectionResult.push({
                            id:  "N-14",
                            loc: subNodes[i].loc
                          });
                          storedFuncs[func_] = true;
                          //console.log(detectionResult[detectionResult.length-1]);
                    }
                }
            }
        }
    }
    
    //console.log(detectionResult);
    return detectionResult;
}

// This is to check state variable declaration
const _checkStateVariable = function (filePath, contractNode, stateVar) {
    //console.log('detector._checkStateVariable');
    // console.log(subNode);
    let detectionResult = [];
    const N_03 = uint256_Variables_dont_need_to_be_initialized_to_zero(filePath, stateVar, null);
    if (N_03) {
        detectionResult = detectionResult.concat(N_03);
    }

    const N_05 = large_numeric_literals_should_use_underscores_for_readability(filePath, stateVar, null);
    if (N_05) {
        //console.log(N_05);
        detectionResult = detectionResult.concat(N_05);
    }
    //console.log(stateVar);
    //console.log(detectionResult);
    return detectionResult;
}

// This is to check statements in a function or a block ...etc.
const _checkStatement = function (filePath, contractNode, subNode, statement) {
    //console.log('detector._checkStatement');
    // console.log(statement);
    let detectionResult = [];
    const N_02 = events_are_missing_sender_information(filePath, statement);
    if (N_02) {
        detectionResult = detectionResult.concat(N_02);
    }

    const N_03 = uint256_Variables_dont_need_to_be_initialized_to_zero(filePath, null, statement);
    if (N_03) {
        detectionResult = detectionResult.concat(N_03);
    }

    const N_05 = large_numeric_literals_should_use_underscores_for_readability(filePath, null, statement);
    if (N_05) {
        detectionResult = detectionResult.concat(N_05);
    }

    const N_06 = constants_in_comparisons_should_appear_on_the_left_side(filePath, statement);
    //console.log(N_06);
    if (N_06) {
        detectionResult = detectionResult.concat(N_06);
    }

    const N_10 = if_statement_can_be_converted_to_a_ternary(filePath, statement);
    if (N_10) {
        detectionResult = detectionResult.concat(N_10);
    }

    return detectionResult;
}

const _checkContract = async function (filePath, contractNode) {
    //console.log('detector1._checkContract');
    //console.log(contractNode);
    // console.log(subNode);
    let detectionResult = [];
    const N_01 = consider_disabling_renounceOwnership(filePath, contractNode);
    if (N_01) {
        detectionResult = detectionResult.concat(N_01);
    }

    const N_14 = await public_functions_not_called_in_contract_should_be_external(filePath, contractNode);
    if (N_14) {
        detectionResult = detectionResult.concat(N_14);
    }

    //console.log("detectionResult:");
    //console.log(detectionResult);
    return detectionResult;
}

// This is for contract specific.
const _checkImports = async function (filePath, importsNodes) {
    // console.log('detector_N_group2._checkImports');
    let detectionResult = [];
    const N_12 = await import_specific_identifier_rather_than_the_whole_file(filePath, importsNodes);
    if (N_12) {
        detectionResult = detectionResult.concat(N_12);
    }
    return detectionResult;
}


// This is a gereral check for anything not covered.
const _check = function (filePath, contractNode, subNode) {
    // console.log('detector1');
    // console.log(subNode);
    let detectionResult = [];
    // check other types of subnodes (general ones)
    return detectionResult;
}

//return contract lines for regex match commands
const _get_contract_lines = async function (filePath, contractNode) {
    //console.log(contractNode.loc);
    const lines = await inspector.readLinesFromTo(contractNode.loc.start.line, contractNode.loc.end.line, filePath);
    //console.log(lines);
    return lines;
}


export default {
    checkImports: _checkImports,
    checkContract: _checkContract,
    checkStateVariable: _checkStateVariable,
    checkStatement: _checkStatement,
    check: _check
};