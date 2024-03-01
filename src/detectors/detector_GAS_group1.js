
import types from '../types.js';
import inspector from '../util/inspector.js';

var getFilenameFromPath = function (filePath) {
    return filePath.split('\\').pop().split('/').pop();
}


const getSolidityTypeSize = function (strType) {
    // calc bytes types size
    if (strType.indexOf('bytes') !== -1) {
        const num = strType.replace('bytes', '');
        if (num !== '') {
            try {
                return parseInt(num);
            } catch (e) {

            }
        }
    }

    if (strType === 'int') {
        strType = 'int256';
    }
    if (strType === 'uint') {
        strType = 'uint256';
    }
    if (strType.indexOf('int') !== -1) {
        const num = strType.replace('int', '').replace('u', '');
        if (num !== '') {
            try {
                return (parseInt(num) / 8);
            } catch (e) {

            }
        }
    }

    if (strType === 'bool') {
        return 1;
    }

    if (strType === 'address') {
        return 20;
    }

    return 0;
}

const _check_structs_packed_into_fewer_storage_slots_GAS_02 = async function (filePath, contractNode) {

    // console.log('stateVar');
    // console.log(stateVar);

    const subnodes = contractNode.subNodes;
    // console.log(contractNode.loc);
    let detectionResult = [];


    for (let i = 0; i < subnodes.length; i++) {
        const subNode = subnodes[i];
        if (subNode.type === 'StructDefinition') { // if struct
            let sizes = [];
            // console.log(subNode.members);
            // console.log(getSolidityTypeSize('bytes32'));
            // console.log(getSolidityTypeSize('bool'));
            const members = subNode.members;
            for (let j = 0; j < members.length; j++) {
                const typname = members[j].typeName;
                if (typname && typname.name) {
                    // console.log('typname.name: ' + typname.name);
                    const size = getSolidityTypeSize(typname.name);
                    sizes.push(size);
                }
            }
            // console.log(sizes)

            // zero out 32 bytes
            for (let i = 0; i < sizes.length; i++) {
                if (sizes[i] == 32) {
                    sizes[i] = 0;
                }
            }
            // console.log(sizes);
            // check if there is ppossiblity to pack one size with another at least once
            for (let i = 0; i < sizes.length; i++) {
                let sumSize = sizes[i];
                const collectedSizes = [];
                for (let j = i + 1; j < sizes.length; j++) {
                    const sizeJ = sizes[j];
                    if (sumSize + sizeJ <= 32) {
                        sumSize += sizeJ;
                        collectedSizes.push(j);
                    }
                }

                let foundIssue = false;
                // check collected sizes if they are not in order
                for (let k = 0; k < collectedSizes.length - 1; k++) {
                    if (collectedSizes[k] != collectedSizes[k + 1]) {
                        detectionResult.push({
                            id: 'GAS-02',
                            loc: subNode.loc
                        });
                        foundIssue = true;
                        break;
                    }
                }
                if (foundIssue) {
                    break;
                }

                // console.log('collectedSizes');
            }

        }
    }

    return detectionResult;
}

const _check_if_constructor_payable_GAS_24 = async function (filePath, contractNode) {

    // console.log('stateVar');
    // console.log(stateVar);

    const subnodes = contractNode.subNodes;
    // console.log(contractNode.loc);
    let detectionResult = [];


    for (let i = 0; i < subnodes.length; i++) {
        const subNode = subnodes[i];
        if (subNode.type === 'FunctionDefinition' && subNode.isConstructor === true && subNode.stateMutability !== 'payable') {
            detectionResult.push({
                id: 'GAS-24',
                loc: subNode.loc
            })
            break;
        }
    }

    return detectionResult;
}

const _check_if_onlyOwner_payable_GAS_23 = async function (filePath, contractNode) {

    // console.log('stateVar');
    // console.log(stateVar);
    const id = 'GAS-23';
    const subnodes = contractNode.subNodes;
    // console.log(contractNode.loc);
    let detectionResult = [];

    for (let i = 0; i < subnodes.length; i++) {
        const subNode = subnodes[i];
        if (subNode.type === 'FunctionDefinition' && subNode.isConstructor === false && subNode.stateMutability !== 'payable') {
            // check if it has modifier onlyOWner
            const onlyOwners = subNode.modifiers.filter(modifier => modifier.name == 'onlyOwner');
            if (onlyOwners.length > 0) {
                detectionResult.push({
                    id: id,
                    loc: subNode.loc
                })
            }

        }
    }
    return detectionResult;
}


const _check_if_empty_block_GAS_004 = async function (filePath, contractNode) {

    const id = 'GAS-004';
    const subnodes = contractNode.subNodes;
    // console.log(contractNode.loc);
    let detectionResult = [];
    try {
        for (let i = 0; i < subnodes.length; i++) {
            const subNode = subnodes[i];
            if (subNode.type === 'FunctionDefinition' && subNode.isConstructor === false) {
                if (subNode.body && subNode.body.statements.length == 0) {
                    detectionResult.push({
                        id: id,
                        loc: subNode.loc
                    })
                }

            }
        }
    } catch (e) {

    }
    return detectionResult;
}


// revert is not covered at the moment.
const _check_require_and_revert_is_longer_32bytes = function (statement) {
    // if(statement.type === types.RevertStatement || ){
    //     console.log(statement);
    // }
    if (statement.expression && statement.expression.expression) {
        const exp = statement.expression.expression;
        if (exp.name === 'require') {
            const arg = statement.expression.arguments;
            if (arg.length === 2) { // take the second argment
                if (arg[1].type === 'StringLiteral') {
                    const val = arg[1].value;
                    if (val.length > 32) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

const _check_if_require_or_revert_string_32_bytes_GAS_11 = async function (subNode, statement) {

    let detectionResult = [];

    const id = 'GAS-11';

    if (statement.type === types.IfStatement) {
        // 
        const trueBody = statement.trueBody;
        const falseBody = statement.falseBody;
        if (trueBody) {
            const statements = trueBody.statements;
            if (statements) {
                for (let i = 0; i < statements.length; i++) {
                    if (_check_require_and_revert_is_longer_32bytes(statements[i])) {
                        detectionResult.push({
                            id: id,
                            loc: statements[i].loc
                        });
                    }
                }
            }
        }

        if (falseBody) {
            const statements = falseBody.statements;
            if (statements) {
                for (let i = 0; i < statements.length; i++) {
                    if (_check_require_and_revert_is_longer_32bytes(statements[i])) {
                        detectionResult.push({
                            id: id,
                            loc: statements[i].loc
                        });
                    }
                }
            }
        }


    } else {
        if (_check_require_and_revert_is_longer_32bytes(statement)) {
            detectionResult.push({
                id: id,
                loc: statement.loc
            });
        }
    }

    return detectionResult;
}

const _check_if_public_is_used_for_constants_GAS_18 = async function (filePath, stateVar) {

    let detectionResult = [];

    const id = 'GAS-18';

    try {
        const vars = stateVar.variables;
        for (let i = 0; i < vars.length; i++) {
            if (vars[i].isDeclaredConst === true && vars[i].visibility === 'public') { // check if constant and public
                return {
                    id: id,
                    loc: stateVar.loc
                }
            }
        }
    } catch (e) {
        return false;
    }


    return detectionResult;
}

const _check_if_division_by_two_ = function (cVar, initialValue) {
    if (cVar.expression && cVar.type === 'ExpressionStatement') { //  statement
        if (cVar.expression.right && cVar.expression.type === 'BinaryOperation' && cVar.expression.operator === '=') { // assignment
            const expRight = cVar.expression.right;
            if (expRight.right && expRight.type === 'BinaryOperation' && expRight.operator === '/') { // division
                if (expRight.right.type === 'NumberLiteral' && expRight.right.number === '2') { // by two
                    return true;
                }
            }
        }
    } else if (cVar.expression) { // state variable 

        if (cVar.expression.right && cVar.expression.type === 'BinaryOperation' && cVar.expression.operator === '/') { // division
            if (cVar.expression.right.type === 'NumberLiteral' && cVar.expression.right.number === '2') { // by two
                return true;
            }
        }
    } else if (cVar.type === 'VariableDeclaration' && initialValue) { // local variable
        // console.log('initialValue')
        if (initialValue && initialValue.right && initialValue.type === 'BinaryOperation' && initialValue.operator === '/') { // division
            if (initialValue.right.type === 'NumberLiteral' && initialValue.right.number === '2') { // by two
                return true;
            }
        }
    }

    return false;
}


const _check_if_division_by_two_GAS_19 = async function (filePath, varOrStatement) {

    let detectionResult = [];

    const id = 'GAS-19';
    if (varOrStatement.type === 'ExpressionStatement') {
        if (_check_if_division_by_two_(varOrStatement, null)) {
           // console.log('varOrStatement1');

            //console.log(varOrStatement);
            detectionResult.push({
                id: id,
                loc: varOrStatement.loc
            });
        }
        return detectionResult;
    } else if (varOrStatement.variables) {
        try {
            const vars = varOrStatement.variables;
            for (let i = 0; i < vars.length; i++) {
                if (_check_if_division_by_two_(vars[i], varOrStatement.initialValue)) {
                    // console.log(vars[i])
                    detectionResult.push({
                        id: id,
                        loc: varOrStatement.loc
                    });
                }
            }
        } catch (e) {

        }
    }

    return detectionResult;
}


const _check_if_bool_used_ = function (stateVar) {
    if (stateVar.typeName && stateVar.typeName.name === 'bool') {
        return true;
    }
    return false;
}


const _check_if_bool_used_GAS_04 = async function (filePath, stateVar) {

    let detectionResult = [];

    const id = 'GAS-04';
    if (stateVar.variables) {
        try {
            const vars = stateVar.variables;
            for (let i = 0; i < vars.length; i++) {
                if (_check_if_bool_used_(vars[i])) {
                    // console.log(vars[i])
                    detectionResult.push({
                        id: id,
                        loc: stateVar.loc
                    });
                }
            }
        } catch (e) {

        }
    }

    return detectionResult;
}

const _check_if_plus_plus_op = function (statement) {
    if (statement.expression) {
        return statement.expression.type == types.UnaryOp && (statement.expression.operator == '++' || statement.expression.operator == '--') && statement.expression.isPrefix == false;
    }
    return false;
}


const _check_if_I_plus_plus_GAS_16 = async function (subNode, statement) {

    const id = 'GAS-16';

    let detectionResult = [];
    if (statement.type === types.IfStatement) {
        // 
        const trueBody = statement.trueBody;
        const falseBody = statement.falseBody;
        if (trueBody) {
            const statements = trueBody.statements;
            if (statements) {
                for (let i = 0; i < statements.length; i++) {
                    if (_check_if_plus_plus_op(statements[i])) {
                        detectionResult.push({
                            id: id,
                            loc: statements[i].loc // location of the code (i.e. line numbers)
                        });
                    }
                }
            }
        }

        if (falseBody) {
            const statements = falseBody.statements;
            if (statements) {
                for (let i = 0; i < statements.length; i++) {
                    if (_check_if_plus_plus_op(statements[i])) {
                        detectionResult.push({
                            id: id,
                            loc: statements[i].loc // location of the code (i.e. line numbers)
                        });
                    }
                }
            }
        }


    } else if (statement.type == types.Expression) {
        if (_check_if_plus_plus_op(statement)) {
            detectionResult.push({
                id: id,
                loc: statement.loc // location of the code (i.e. line numbers)
            });
        }
    }
    return detectionResult;
}

const _check_if_require_or_revert_not_custom_error_GAS_22 = function (statement) {
    if (statement.expression && statement.expression.expression) {
        const exp = statement.expression.expression;
        if (exp.name === 'require') {
            const arg = statement.expression.arguments;
            if (arg.length === 2) { // take the second argment
                if (arg[1].type === 'StringLiteral') {
                    return true;
                }
            }
        }
    }
    return false;
}


const _check_if_string_error_not_custom_GAS_22 = async function (subNode, statement) {

    const id = 'GAS-22';

    let detectionResult = [];
    if (statement.type === types.IfStatement) {
        // 
        const trueBody = statement.trueBody;
        const falseBody = statement.falseBody;
        if (trueBody) {
            const statements = trueBody.statements;
            if (statements) {
                for (let i = 0; i < statements.length; i++) {
                    if (_check_if_require_or_revert_not_custom_error_GAS_22(statements[i])) {
                        detectionResult.push({
                            id: id,
                            loc: statements[i].loc // location of the code (i.e. line numbers)
                        });
                    }
                }
            }
        }

        if (falseBody) {
            const statements = falseBody.statements;
            if (statements) {
            for (let i = 0; i < statements.length; i++) {
                if (_check_if_require_or_revert_not_custom_error_GAS_22(statements[i])) {
                    detectionResult.push({
                        id: id,
                        loc: statements[i].loc // location of the code (i.e. line numbers)
                    });
                }
            }
        }
        }


    } else if (statement.type == types.Expression) {
        if (_check_if_require_or_revert_not_custom_error_GAS_22(statement)) {
            detectionResult.push({
                id: id,
                loc: statement.loc // location of the code (i.e. line numbers)
            });
        }
    }
    return detectionResult;
}


const _check_if_require_has_two_conds = function (statement) {
    if (statement.expression && statement.expression.expression) {
        const exp = statement.expression.expression;
        if (exp.name === 'require') {
            const arg = statement.expression.arguments;
            if (arg.length === 2) { // take the second argment
                if (arg[0].type === 'BinaryOperation' && arg[0].operator === '&&') {
                    return true;
                }
            }
        }
    }
    return false;
}
const _check_if_require_has_two_conditions_GAS_17 = async function (subNode, statement) {

    const id = 'GAS-17';

    let detectionResult = [];
    if (statement.type === types.IfStatement) {
        // 
        const trueBody = statement.trueBody;
        const falseBody = statement.falseBody;
        if (trueBody) {
            const statements = trueBody.statements;
            if (statements) {
                for (let i = 0; i < statements.length; i++) {
                    if (_check_if_require_has_two_conds(statements[i])) {
                        detectionResult.push({
                            id: id,
                            loc: statements[i].loc // location of the code (i.e. line numbers)
                        });
                    }
                }
            }
        }

        if (falseBody) {
            const statements = falseBody.statements;
            if (statements) {
            for (let i = 0; i < statements.length; i++) {
                if (_check_if_require_has_two_conds(statements[i])) {
                    detectionResult.push({
                        id: id,
                        loc: statements[i].loc // location of the code (i.e. line numbers)
                    });
                }
            }}
        }


    } else if (statement.type == types.Expression) {
        if (_check_if_require_has_two_conds(statement)) {
            detectionResult.push({
                id: id,
                loc: statement.loc // location of the code (i.e. line numbers)
            });
        }
    }
    return detectionResult;
}

const _check_method_names_GAS_12 = async function (filePath, contractNode) {

    // console.log('stateVar');
    // console.log(stateVar);
    const subnodes = contractNode.subNodes;
    // console.log(contractNode.loc);
    let detectionResult = [];
    // this is 99% valid in every contract
    detectionResult.push({
        id: 'GAS-12',
        loc: contractNode.loc
    })

    return detectionResult;
}


const _check_GT_LT_GAS_14 = async function (subNode, statement) {

    let detectionResult = [];

    const id = 'GAS-14';
    // console.log(statement);
    try {
        if (statement.type === 'VariableDeclarationStatement' && statement.initialValue) {
            // assignment
            if (statement.initialValue.type === 'Conditional' && statement.initialValue.condition.operator === '>') {
                const rightPartName = statement.initialValue.condition.right.name;
                const leftPartName = statement.initialValue.condition.left.name;

                const inTruePart = statement.initialValue.trueExpression.name === leftPartName || statement.initialValue.trueExpression.name === rightPartName;
                const inFalsePart = statement.initialValue.falseExpression.name === leftPartName || statement.initialValue.falseExpression.name === rightPartName;
                if (inTruePart && inFalsePart) {
                    detectionResult.push({
                        id: id,
                        loc: statement.loc
                    });
                }

            }
        }


    } catch (e) {
        // do nothing
    }


    return detectionResult;
}


const _check_ZERO_INITIALIZE_GAS_05 = async function (subNode, statement) {

    let detectionResult = [];

    const id = 'GAS-05';
    try {


        if (statement.type === 'VariableDeclarationStatement' && statement.initialValue) {
            // assignment
            if (statement.initialValue.type === 'NumberLiteral' && statement.initialValue.number === '0') {
                detectionResult.push({
                    id: id,
                    loc: statement.loc
                });

            }
        }

    } catch (e) {
        // do nothing
    }


    return detectionResult;
}


const _check_if_address_0 = function (condition) {
    //console.log('_check_if_address_0');
    //console.log(condition)
    if (condition.type === 'FunctionCall' && condition.expression && condition.expression.name === 'address') {
        if (condition.arguments && condition.arguments.length > 0) {
            if (condition.arguments[0].type == 'NumberLiteral' && condition.arguments[0].number == '0') {
                return true;
            }
        }
    }
    return false;
}

const _check_condition_recursive = async function (id, condition) {
    let detectionResult = []

    // if(!condition){
    //     return detectionResult;
    // }
    // else {
    //     console.log('condition');
    //     console.log(condition);
    // }
    //console.log('condition');
    //console.log(condition);

    if (condition.type === 'BinaryOperation') {
        // console.log('condition.left')
        // console.log(condition.left);
        if (condition.left) {
            const cLeft = condition.left;
            let _detectionResult = await _check_condition_recursive(id, cLeft);
            detectionResult = detectionResult.concat(_detectionResult);
        }
        // console.log('condition.right')
        // console.log(condition.right);
        if (condition.right) {
            const cRight = condition.right;
            let right__detectionResult = await _check_condition_recursive(id, cRight);
            detectionResult = detectionResult.concat(right__detectionResult);
        }

    } else {
        if (_check_if_address_0(condition)) {

            detectionResult.push({
                id: id,
                loc: condition.loc
            });
        }
    }


    return detectionResult;

}

const _check_ADDRESS_ZERO_CHECK_GAS_002 = async function (subNode, statement) {

    let detectionResult = [];

    const id = 'GAS-002';
    try {
        // console.log('GAS-002');

        // console.log(statement);
        if (statement.type === types.IfStatement) {
            const condition = statement.condition;
            detectionResult = await _check_condition_recursive(id, condition);
        }

    } catch (e) {
        // do nothing
    }


    return detectionResult;
}


// This is to check state variable declaration
const _checkStateVariable = async function (filePath, contractNode, stateVar) {
    //console.log('detector._checkStateVariable');
    // console.log(subNode);
    let detectionResult = [];
    //console.log(stateVar);



    const GAS_18 = await _check_if_public_is_used_for_constants_GAS_18(filePath, stateVar);
    if (GAS_18) {
        detectionResult = detectionResult.concat(GAS_18);
    }

    const GAS_19 = await _check_if_division_by_two_GAS_19(filePath, stateVar);
    if (GAS_19.length > 0) {
        detectionResult = detectionResult.concat(GAS_19);
    }

    // from C4Arena
    const GAS_04 = await _check_if_bool_used_GAS_04(filePath, stateVar);
    if (GAS_04.length > 0) {
        detectionResult = detectionResult.concat(GAS_04);
    }


    return detectionResult;

}

// This is to check statements in a function or a block ...etc.
const _checkStatement = async function (filePath, contractNode, subNode, statement) {
    // console.log('detector._checkStatement');
    // console.log(subNode);
    let detectionResult = [];


    const GAS_11 = await _check_if_require_or_revert_string_32_bytes_GAS_11(subNode, statement);
    if (GAS_11.length > 0) {
        detectionResult = detectionResult.concat(GAS_11);
    }

    const GAS_16 = await _check_if_I_plus_plus_GAS_16(subNode, statement);
    if (GAS_16.length > 0) {
        detectionResult = detectionResult.concat(GAS_16);
    }

    const GAS_22 = await _check_if_string_error_not_custom_GAS_22(subNode, statement);
    if (GAS_22.length > 0) {
        detectionResult = detectionResult.concat(GAS_22);
    }

    const GAS_17 = await _check_if_require_has_two_conditions_GAS_17(subNode, statement);
    if (GAS_17.length > 0) {
        detectionResult = detectionResult.concat(GAS_17);
    }

    const GAS_19 = await _check_if_division_by_two_GAS_19(filePath, statement);
    if (GAS_19.length > 0) {
        detectionResult = detectionResult.concat(GAS_19);
    }

    const GAS_14 = await _check_GT_LT_GAS_14(subNode, statement);
    if (GAS_14.length > 0) {
        detectionResult = detectionResult.concat(GAS_14);
    }


    const GAS_05 = await _check_ZERO_INITIALIZE_GAS_05(subNode, statement);
    if (GAS_05.length > 0) {
        detectionResult = detectionResult.concat(GAS_05);
    }

    const GAS_002 = await _check_ADDRESS_ZERO_CHECK_GAS_002(subNode, statement);
    if (GAS_002.length > 0) {
        detectionResult = detectionResult.concat(GAS_002);
    }


    return detectionResult;

}


// This is for contract specific.
const _checkContract = async function (filePath, contractNode) {
    // console.log('detector_N_group2._checkContract');

    // console.log(contractNode);

    // console.log(subNode);
    let detectionResult = [];

    const GAS_02 = await _check_structs_packed_into_fewer_storage_slots_GAS_02(filePath, contractNode);
    if (GAS_02.length > 0) {
        detectionResult = detectionResult.concat(GAS_02);
    }

    const GAS_24 = await _check_if_constructor_payable_GAS_24(filePath, contractNode);
    if (GAS_24.length > 0) {
        detectionResult = detectionResult.concat(GAS_24);
    }

    const GAS_23 = await _check_if_onlyOwner_payable_GAS_23(filePath, contractNode);
    // console.log('GAS_23')

    // console.log(GAS_23)
    if (GAS_23.length > 0) {
        detectionResult = detectionResult.concat(GAS_23);
    }


    const GAS_12 = await _check_method_names_GAS_12(filePath, contractNode);
    if (GAS_12.length > 0) {
        detectionResult = detectionResult.concat(GAS_12);
    }

    const GAS_004 = await _check_if_empty_block_GAS_004(filePath, contractNode);
    if (GAS_004.length > 0) {
        detectionResult = detectionResult.concat(GAS_004);
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




    return detectionResult;

}



export default {
    checkImports: _checkImports,
    checkContract: _checkContract,
    checkStateVariable: _checkStateVariable,
    checkStatement: _checkStatement,
    check: _check
};