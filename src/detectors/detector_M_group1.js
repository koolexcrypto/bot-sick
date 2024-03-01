
import types from '../types.js';
import inspector from '../util/inspector.js';




const _check_unsafe_erc20_ops_M_02 = async function (subNode, statement) {

    let detectionResult = [];
    const id = 'M-02';

    if (_checkIfFunctionERC20SafeTransferCall(subNode, statement)) {
        // console.log(subNode)
        detectionResult.push({
            id: id,
            loc: statement.loc
        });
    }


    return detectionResult;
}




const _checkIfFunctionERC20SafeTransferCall = function (subNode, statement) {
    // check if it is transfer Call
    if (statement.expression) {
        if (statement.type == types.Expression && statement.expression.type == 'FunctionCall') {

            if (statement.expression.expression) {
                const exp = statement.expression.expression;
                // console.log('statement_1')
                //     console.log(statement.expression)
                if (exp.type === 'MemberAccess' || exp.type === 'Identifier') {

                    if (exp.memberName === 'transfer' ||
                        exp.memberName === 'transferFrom') { // if there is transfer in the function name that's called
                        if (exp.expression) {
                            // check it is not nft (erc721)
                            const exp_in = exp.expression.expression || exp.expression
                            // if (exp_in && exp_in.name.toLowerCase().indexOf("erc721") === -1) {
                            //     return true;
                            // }

                            if (exp_in.name.toLowerCase().indexOf("erc20") !== -1) {
                                // erc20 so return true
                                return true;
                            } else {
                                // check 721 and position
                                if(exp_in.name.toLowerCase().indexOf("erc721") !== -1 || exp_in.name.toLowerCase().indexOf("position") !== -1){
                                     return false;
                                }

                                // check third argument if it has token or id then it is most likely NFT
                                const stExp = statement.expression;
                                // console.log('stExp')
                                // console.log(stExp)
                                if(stExp.arguments && stExp.arguments.length > 2){
                                    const arg2 = stExp.arguments[2]; //
                                   
                                    if(arg2.type === 'Identifier' && (arg2.name.toLowerCase().indexOf("token") !== -1 || arg2.name.toLowerCase().indexOf("id") !== -1)){
                                        return false;
                                    }
                                }
                                
                                // else cases
                                return true;

                            }


                        }
                        else { // all else cases
                            return true;
                        }


                    }

                }
            }
        }
    }
    return false;
}


const _checkERC20TransferCall = function (contractNode, statement) {

        if (statement.expression && statement.type == 'FunctionCall') {
                const exp = statement.expression;
                // console.log('statement_1')
                //     console.log(statement.expression)
                if (exp.type === 'MemberAccess' || exp.type === 'Identifier') {
                    if (exp.memberName === 'transfer' ||
                        exp.memberName === 'transferFrom') { // if there is transfer in the function name that's called
                           

                            if (exp.expression) {
                            // check it is not nft (erc721)
                            const exp_in = exp.expression.expression || exp.expression
                            if (exp_in.name.toLowerCase().indexOf("erc20") !== -1) {
                                // erc20 so return true
                                return true;
                            } else {
                                // check 721 and position
                                if(exp_in.name.toLowerCase().indexOf("erc721") !== -1 || exp_in.name.toLowerCase().indexOf("position") !== -1){
                                     return false;
                                }

                                // check third argument if it has token or id then it is most likely NFT
                                const stExp = statement.expression;
                                // console.log('stExp')
                                // console.log(stExp)
                                if(stExp.arguments && stExp.arguments.length > 2){
                                    const arg2 = stExp.arguments[2]; //
                                   
                                    if(arg2.type === 'Identifier' && (arg2.name.toLowerCase().indexOf("token") !== -1 || arg2.name.toLowerCase().indexOf("id") !== -1)){
                                        return false;
                                    }
                                }
                                
                                // else cases
                                return true;

                            }


                        }
                        else { // all else cases
                            return true;
                        }


                    }

                }
            
        }
    
    return false;
}


const _checkERC20TransferCallForM06 = function (subNode, statement) {
    // check if it is transfer Call
    if (statement.expression) {
        if (statement.type == types.Expression && statement.expression.type == 'FunctionCall') {

            if (statement.expression.expression) {
                const exp = statement.expression.expression;
                // console.log('statement_1')
                //     console.log(statement.expression)
                if (exp.type === 'MemberAccess' || exp.type === 'Identifier') {

                    if (exp.memberName === 'transfer' ||
                        exp.memberName === 'transferFrom') { // if there is transfer in the function name that's called
                        if (exp.expression) {
                            // check it is not nft (erc721)
                            const exp_in = exp.expression.expression || exp.expression
                            // if (exp_in && exp_in.name.toLowerCase().indexOf("erc721") === -1) {
                            //     return true;
                            // }

                            if (exp_in.name.toLowerCase().indexOf("erc20") !== -1) {
                                // erc20 so return true
                                return true;
                            } else {
                                // check 721 and position
                                if(exp_in.name.toLowerCase().indexOf("erc721") !== -1 || exp_in.name.toLowerCase().indexOf("position") !== -1){
                                     return false;
                                }

                                // check third argument if it has token or id then it is most likely NFT
                                const stExp = statement.expression;
                                // console.log('stExp')
                                // console.log(stExp)
                                if(stExp.arguments && stExp.arguments.length > 2){
                                    const arg2 = stExp.arguments[2]; //
                                   
                                    if(arg2.type === 'Identifier' && (arg2.name.toLowerCase().indexOf("token") !== -1 || arg2.name.toLowerCase().indexOf("id") !== -1)){
                                        return false;
                                    }
                                }
                                
                                // else cases
                                return true;

                            }


                        }
                        else { // all else cases
                            return true;
                        }


                    }

                }
            }
        }
    }
    return false;
}

// this could be used for later . not used at the moment
const _check_erc20_unchecked_transffered_M_06 = async function (subNode, statement) {

    let detectionResult = [];
    const id = 'M-06';

    if (_checkERC20TransferCallForM06(subNode, statement)) {
       
        detectionResult.push({
            id: id,
            loc: statement.loc
        });
    }


    return detectionResult;
    // // check if there is if condition or require
    // if (statement.expression && statement.type === 'ExpressionStatement') { //  statement
    //     if(statement.expression.expression && statement.expression.expression.name === 'require'){
    //         const args = statement.expression.arguments;
          
    //         if(args.length > 0){
    //             const arg0 = args[0];
    //             // console.log(arg0)
    //             if (_checkERC20TransferCall(subNode, arg0)) {
    //                 detectionResult.push({
    //                     id: id,
    //                     loc: statement.loc
    //                 });
    //             }
    //         }

    //     } 
    // }
    
}


const _check_if_onlyOwner_exist_M_01 = async function (filePath, contractNode) {

    // console.log('stateVar');
    // console.log(stateVar);
    const id = 'M-01';
    const subnodes = contractNode.subNodes;
    // console.log(contractNode.loc);
    let detectionResult = [];

    for (let i = 0; i < subnodes.length; i++) {
        const subNode = subnodes[i];
        if (subNode.type === 'FunctionDefinition' && subNode.isConstructor === false) {
            // check if it has modifier onlyOWner
            // console.log(subNode);
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

// This is to check state variable declaration
const _checkStateVariable = function (filePath, contractNode, stateVar) {
    //console.log('detector._checkStateVariable');
    // console.log(subNode);
    let detectionResult = [];
    //console.log(stateVar);


    return detectionResult;

}

// This is to check statements in a function or a block ...etc.
const _checkStatement = async function (filePath, contractNode, subNode, statement) {
    // console.log('detector._checkStatement');
    // console.log(subNode);
    let detectionResult = [];
    // console.log(statement);
    
    const M_02 = await _check_unsafe_erc20_ops_M_02(subNode, statement);
    if (M_02.length > 0) {
        detectionResult = detectionResult.concat(M_02);
    }

    const M_06 = await _check_erc20_unchecked_transffered_M_06(subNode, statement);
    if (M_06.length > 0) {
        detectionResult = detectionResult.concat(M_06);
    }

    


    return detectionResult;

}


// This is for contract specific.
const _checkContract = async function (filePath, contractNode) {
    // console.log('detector1._checkContract');

    //console.log(contractNode);

    // console.log(subNode);
    let detectionResult = [];

    const M_01 = await _check_if_onlyOwner_exist_M_01(filePath, contractNode);
    if (M_01.length > 0) {
        detectionResult = detectionResult.concat(M_01);
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


export default {
    checkContract: _checkContract,
    checkStateVariable: _checkStateVariable,
    checkStatement: _checkStatement,
    check: _check
};