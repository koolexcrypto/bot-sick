
import types from '../types.js';
import inspector from '../util/inspector.js';

var getFilenameFromPath = function (filePath) {
    return filePath.split('\\').pop().split('/').pop();
}

const _check_contract_import_order_N04 = async function (filePath, importsNodes) {

    const len = importsNodes.length;
    const arr = [];

    try {
        for (let i = 0; i < importsNodes.length; i++) {
            const filename = getFilenameFromPath(importsNodes[i].path);
            // console.log(filename);
            if (filename.charAt(0) == "I" && filename.charAt(1) == filename.charAt(1).toUpperCase()) {
                arr.push("I"); // interface
            } else {
                arr.push("C"); // contract
            }

        }
    } catch (e) {

    }

    // console.log(arr);
    if (arr.indexOf("I") === -1) { // there is no interfaces
        return false;
    }

    // get interfaces indexs
    const interfaces = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === "I") {
            interfaces.push(i);
        }
    }
    // console.log(interfaces)

    if (interfaces.length === 0) {
        return false;
    }

    // return lines from first import till the end

    const retValue = {
        id: "N-04",
        loc: {
            start: { line: importsNodes[0].loc.start.line, column: importsNodes[0].loc.start.column },
            end: { line: importsNodes[len - 1].loc.end.line, column: importsNodes[len - 1].loc.end.column }
        }
    }


    if (interfaces[0] !== 0) {
        return retValue;
    }

    for (let i = 1; i < interfaces.length; i++) {
        if (interfaces[i] - 1 !== interfaces[i - 1]) {
            return retValue;
        }
    }

    // console.log(statement.loc);
    // const lines = await inspector.readLinesFromTo(statement.loc.start.line,statement.loc.end.line, filePath);
    // console.log(lines);

    return false;
}


const _check_constant_variable_names_capital_N07 = async function (filePath, stateVar) {

    // console.log(stateVar);
    try {
        const vars = stateVar.variables;
        for (let i = 0; i < vars.length; i++) {
            if (vars[i].isDeclaredConst === true) { // check if constant
                if (vars[i].name != vars[i].name.toUpperCase()) { // check if there is one lower case letter at least
                    return {
                        id: 'N-07',
                        loc: stateVar.loc
                    }
                }
            }
        }
    } catch (e) {
        return false;
    }

    return false;
}

const _check_else_block_not_required_N08 = async function (statement) {

    // console.log(stateVar);
    // console.log(statement);
    if (statement.falseBody == null)
        return false;

    const trueBodyStatements = statement.trueBody.statements;
    const lastStatement = trueBodyStatements[trueBodyStatements.length - 1];
    // check if there is last statement is return
    // console.log(trueBodyStatements[trueBodyStatements.length-1]);
    if (lastStatement.type === 'ReturnStatement') {
        return {
            id: 'N-08',
            loc: lastStatement.loc
        }
    }

    return false;
}

const _checkIfFunctionERC20SafeTransferCall = function (statement) {
    // check if it is safeTransferCall
    if (statement.expression) {
        if (statement.type == types.Expression && statement.expression.type == 'FunctionCall') {
            if (statement.expression.expression) {
                const exp = statement.expression.expression;
                if (exp.type === 'MemberAccess') {
                    if (exp.memberName.toLowerCase().indexOf('transfer') !== -1) { // if there is transfer in the function name that's called
                        if (exp.expression && exp.expression.expression) {
                            if (exp.expression.expression.name.toLowerCase().indexOf("erc20") !== -1) {  // check if ERC20 exists in contract name
                                // console.log('transfer')
                                // console.log(exp.expression.expression)
                                return true;
                            }
                        }

                    }

                }
            }
        }
    }
    return false;
}

const _check_are_emitted_before_external_calls_N09 = async function (subNode, statement) {

    // subNode => check if function

    // if(statement)
    // if (statement)
    // console.log(statement);

    if (statement.type === 'EmitStatement') {
        const emitStartline = statement.loc.start.line;
        if (subNode.type === 'FunctionDefinition' && subNode.isConstructor === false) {
            const statements = subNode.body.statements;
            for (let i = 0; i < statements.length; i++) {
                if (statements[i].loc.start.line < emitStartline) { // it is before the emit code line
                    const erc20Transfer = _checkIfFunctionERC20SafeTransferCall(statements[i]);
                    if (erc20Transfer) {
                        return {
                            id: 'N-09',
                            loc: statement.loc
                        }
                    }
                }
            }
        }
    }

    return false;
}

const _check_named_mapping_if_used_N11 = async function (filePath, stateVar) {

    for (let i = 0; i < stateVar.variables.length; i++) {
        const cVar = stateVar.variables[i];
        if (cVar.typeName.type === 'Mapping') {
            if (cVar.typeName.keyName == null || cVar.typeName.valueName) {
                return {
                    id: 'N-11',
                    loc: cVar.loc
                }
            }
        }
    }

    return false;
}

const _check_if_has_return_statement = function (statements, identifierName) {
    for (let x = 0; x < statements.length; x++) {
        const statement = statements[x];
        if (statement.expression && statement.type === 'ReturnStatement') {
            const exp = statement.expression;
            if (exp.components) {
                const filtered = exp.components.filter(component => component.name === identifierName);
                if (filtered.length > 0) {
                    return statement;
                }
            }
            if (exp.name === identifierName) {
                return statement;
            }
        }
    }
    return false;
}

const _check_named_returned_variable_with_return_N13 = async function (contractNode) {
    const subnodes = contractNode.subNodes;

    let detectionResult = [];

    for (let i = 0; i < subnodes.length; i++) {
        const subNode = subnodes[i];
        if (subNode.type === types.Function) {
            const returnParameters = subNode.returnParameters;
            if (returnParameters) {
                for (let x = 0; x < returnParameters.length; x++) {
                    if (returnParameters[x].identifier !== null) { // one return named variable at least exists is enough 
                        const hasReturn = _check_if_has_return_statement(subNode.body.statements, returnParameters[x].identifier.name);
                        // console.log('hasReturn')
                        // console.log(hasReturn)
                        if (hasReturn) {
                            detectionResult.push({
                                id: 'N-13',
                                loc: hasReturn.loc
                            });
                            break;
                        }
                    }
                }
            }
        }
    }

    

    return detectionResult;
}

const _check_if_return_named_variables_unused = function (statements, identifierName) {

    for (let x = 0; x < statements.length; x++) {
        const statement = statements[x];
        if (statement.expression && statement.type === 'ReturnStatement') {
            const exp = statement.expression;
            if (exp.components) {
                const filtered = exp.components.filter(component => component.name === identifierName);
                if (filtered.length > 0) {
                    return false; 
                }
            }
            if (exp.name === identifierName) {
                return false;
            }
        }
    }
    return true;
}

const _check__unsed_named_returned_variable_N26 = async function (contractNode) {
    const subnodes = contractNode.subNodes;

    let detectionResult = [];

    for (let i = 0; i < subnodes.length; i++) {
        const subNode = subnodes[i];
        if (subNode.type === types.Function) {
            const returnParameters = subNode.returnParameters;
            if (returnParameters) {
                for (let x = 0; x < returnParameters.length; x++) {
                    if (returnParameters[x].identifier !== null) { // one return named variable at least exists is enough 
                        const used = _check_if_return_named_variables_unused(subNode.body.statements, returnParameters[x].identifier.name);
                        if (used) {
                            // console.log('used')
                            // console.log(subNode.loc)
                            detectionResult.push({
                                id: 'N-26',
                                loc: subNode.loc
                            });
                            break;
                        }
                    }
                }
            }
        }
    }

    return detectionResult;
}

// This is to check state variable declaration
const _checkStateVariable = async function (filePath, contractNode, stateVar) {
    //console.log('detector._checkStateVariable');
    // console.log(subNode);
    let detectionResult = [];
    //console.log(stateVar);

    const N_07 = await _check_constant_variable_names_capital_N07(filePath, stateVar);
    if (N_07) {
        detectionResult = detectionResult.concat(N_07);
    }

    const N_11 = await _check_named_mapping_if_used_N11(filePath, stateVar);
    if (N_11) {
        detectionResult = detectionResult.concat(N_11);
    }

    return detectionResult;

}

// This is to check statements in a function or a block ...etc.
const _checkStatement = async function (filePath, contractNode, subNode, statement) {
    // console.log('detector._checkStatement');
    // console.log(subNode);
    let detectionResult = [];

    if (statement.type === types.IfStatement) {
        const N_08 = await _check_else_block_not_required_N08(statement);
        if (N_08) {
            detectionResult = detectionResult.concat(N_08);
        }
    }

    const N_09 = await _check_are_emitted_before_external_calls_N09(subNode, statement);
    if (N_09) {
        detectionResult = detectionResult.concat(N_09);
    }


    return detectionResult;

}


// This is for contract specific.
const _checkContract = async function (filePath, contractNode) {
    // console.log('detector_N_group2._checkContract');

    // console.log(contractNode);

    // console.log(subNode);
    let detectionResult = [];


    const N_13 = await _check_named_returned_variable_with_return_N13(contractNode);
    if (N_13.length > 0) {
        detectionResult = detectionResult.concat(N_13);
    }

    const N_26 = await _check__unsed_named_returned_variable_N26(contractNode);
    if (N_26.length > 0) {
        detectionResult = detectionResult.concat(N_26);
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

// This is for contract specific.
const _checkImports = async function (filePath, importsNodes) {
    // console.log('detector_N_group2._checkImports');

    let detectionResult = [];

    const N_04 = await _check_contract_import_order_N04(filePath, importsNodes);

    if (N_04) {
        detectionResult = detectionResult.concat(N_04);
    }



    return detectionResult;

}



export default {
    checkImports: _checkImports,
    checkContract: _checkContract,
    checkStateVariable: _checkStateVariable,
    checkStatement: _checkStatement,
    check: _check
};