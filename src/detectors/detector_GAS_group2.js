
import types from '../types.js';
import inspector from '../util/inspector.js';


const _check_if_boolean_expressions_boolean_literals_GAS_001 = async function (subNode,statement) {
    let detectionResult = []; 
    const id = 'GAS-001';
    //  console.log(statement);
    if (statement.expression && statement.type === 'ExpressionStatement') { //  statement
        if(statement.expression.expression && statement.expression.expression.name === 'require'){
            const args = statement.expression.arguments;
            if(args.length > 0){
                const arg0 = args[0];
                if(arg0.type === 'BinaryOperation' && arg0.operator === '=='){
                    
                    if((arg0.left && arg0.left.type === 'BooleanLiteral') || (arg0.right && arg0.right.type === 'BooleanLiteral')){
                        detectionResult.push({
                            id: id,
                            loc: statement.loc
                        });
                    }
                }
            }

        } 
    } else if (statement.condition || statement.conditionExpression) {
        const cond = statement.condition || statement.conditionExpression;
            if(cond && cond.type === 'BinaryOperation' && cond.operator === '=='){
                if((cond.left && cond.left.type === 'BooleanLiteral') || (cond.right && cond.right.type === 'BooleanLiteral')){
                    detectionResult.push({
                        id: id,
                        loc: statement.loc
                    });
                   
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




    // const GAS_19 = await _check_if_division_by_two_GAS_19(filePath, stateVar);
    // if (GAS_19.length > 0) {
    //     detectionResult = detectionResult.concat(GAS_19);
    // }



    return detectionResult;

}

// This is to check statements in a function or a block ...etc.
const _checkStatement = async function (filePath, contractNode, subNode, statement) {
    // console.log('detector._checkStatement');
    // console.log(subNode);
    let detectionResult = [];


    const GAS_001 = await _check_if_boolean_expressions_boolean_literals_GAS_001(subNode, statement);
    if (GAS_001.length > 0) {
        detectionResult = detectionResult.concat(GAS_001);
    }

    


    return detectionResult;

}


// This is for contract specific.
const _checkContract = async function (filePath, contractNode) {

    // console.log(contractNode);

    // console.log(subNode);
    let detectionResult = [];

  


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