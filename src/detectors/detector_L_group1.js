
import types from '../types.js';
import inspector from '../util/inspector.js';
import helper from '../util/helper.js';
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

const _check_unsafe_erc721_L_005 = async function (contractNode, statement) {

    let detectionResult = [];
    const id = 'L-005';

    if (_checkIfERC721TransferCall(contractNode, statement)) {
        detectionResult.push({
            id: id,
            loc: statement.loc
        });
    }


    return detectionResult;
}


const _checkIfERC721TransferCall = function (contractNode, statement) {
    // check if it is transfer Call
    if (statement.expression) {
        if (statement.type == types.Expression && statement.expression.type == 'FunctionCall') {

            if (statement.expression.expression) {
                const exp = statement.expression.expression;
                // console.log('statement_1')
                //     console.log(statement.expression)
                if (exp.type === 'MemberAccess' || exp.type === 'Identifier') {
                    if (exp.memberName === 'transferFrom') { // if there is transfer in the function name that's called
                        if (exp.expression) {
                            // check it is nft (erc721)
                            const exp_in = exp.expression.expression || exp.expression;
                            if (exp_in.name.toLowerCase().indexOf("erc20") === -1) {
                                // check 721 and position
                                if (exp_in.name.toLowerCase().indexOf("erc721") !== -1 || exp_in.name.toLowerCase().indexOf("position") !== -1) {
                                    return true;
                                }

                                // check third argument if it has token or id then it is most likely NFT
                                const stExp = statement.expression;
                                if (stExp.arguments && stExp.arguments.length > 2) {
                                    const arg2 = stExp.arguments[2]; //
                                    if (arg2.type === 'Identifier' && (arg2.name.toLowerCase().indexOf("token") !== -1 || arg2.name.toLowerCase().indexOf("id") !== -1)) {
                                        return true;
                                    }
                                }

                            }


                        }


                    }

                }
            }
        }
    }
    return false;
}


const _checkIfmsgvalueNotRefunded_L_002 = async function (contractNode, statement) {
    let detectionResult = [];
    const id = 'L-002';
    if (statement.expression && statement.type === 'ExpressionStatement') { //  statement
        if (statement.expression.expression && statement.expression.expression.name === 'require') {
            const args = statement.expression.arguments;
            if (args.length > 0) {
                const arg0 = args[0];
                if (arg0.type === 'BinaryOperation' && arg0.operator === '<=') {
                    const cond = arg0;
                    if (cond.left && cond.left.type === 'MemberAccess') {
                        if (cond.left.expression && cond.left.expression.name === 'msg' && cond.left.memberName === 'value') {
                            detectionResult.push({
                                id: id,
                                loc: statement.loc
                            });
                        }
                    }
                } else if (arg0.type === 'BinaryOperation' && arg0.operator === '>=') {
                    const cond = arg0;
                    if (cond.right && cond.right.type === 'MemberAccess') {
                        if (cond.right.expression && cond.right.expression.name === 'msg' && cond.right.memberName === 'value') {
                            detectionResult.push({
                                id: id,
                                loc: statement.loc
                            });
                        }
                    }
                }
            }

        }
    }


    if (statement.condition || statement.conditionExpression) {
        const cond = statement.condition || statement.conditionExpression;


        if (cond && cond.type === 'BinaryOperation' && cond.operator === '<=') {
            if (cond.left && cond.left.type === 'MemberAccess') {
                if (cond.left.expression && cond.left.expression.name === 'msg' && cond.left.memberName === 'value') {
                    // check if next statement is revert;
                    if (statement.trueBody && statement.trueBody.expression && statement.trueBody.expression.type === 'FunctionCall') {
                        if (statement.trueBody.expression.expression && statement.trueBody.expression.expression.name === 'revert') {
                            detectionResult.push({
                                id: id,
                                loc: statement.loc
                            });

                        }
                    }

                }
            }
        } else if (cond && cond.type === 'BinaryOperation' && cond.operator === '>=') {
            if (cond.right && cond.right.type === 'MemberAccess') {
                if (cond.right.expression && cond.right.expression.name === 'msg' && cond.right.memberName === 'value') {
                    // check if next statement is revert;
                    if (statement.trueBody && statement.trueBody.expression && statement.trueBody.expression.type === 'FunctionCall') {
                        if (statement.trueBody.expression.expression && statement.trueBody.expression.expression.name === 'revert') {
                            detectionResult.push({
                                id: id,
                                loc: statement.loc
                            });

                        }
                    }
                }
            }
        }
    }

    return detectionResult;
}


const _checkIfMintSafeNotCalled_L_006 = async function (contractNode, statement) {
    let detectionResult = [];

    const id = 'L-006';
    if (statement.expression) {
        if (statement.type == types.Expression && statement.expression.type == 'FunctionCall' && statement.expression.expression) {
            if (statement.expression.expression.name === '_mint') {
                detectionResult.push({
                    id: id,
                    loc: statement.expression.loc
                })
            }
        }
    }
    return detectionResult;
}

const _getLastArgumentFromTransfer = function (statement, exp) {
    // erc20 so return true and thirdArg
    const stExp = statement.expression;
    if (exp.memberName === 'transferFrom' && stExp.arguments && stExp.arguments.length === 3) {
        return stExp.arguments[2];
    } else if (exp.memberName === 'transfer' && stExp.arguments && stExp.arguments.length === 2) {
        return stExp.arguments[1];
    } else {
        return false;
    }
}

const _getLastArgumentFromTransferOrSafeTransfer = function (statement, exp) {
    // erc20 so return true and thirdArg
    const stExp = statement.expression;
    if ((exp.memberName === 'transferFrom' || exp.memberName === 'safeTransferFrom') && stExp.arguments && stExp.arguments.length === 3) {
        return stExp.arguments[2];
    } else if ((exp.memberName === 'transfer' || exp.memberName === 'safeTransfer') && stExp.arguments && stExp.arguments.length === 2) {
        return stExp.arguments[1];
    } else {
        return false;
    }
}

const _checkIfERC20TransferAndReturnLastArg = function (contractNode, statement) {
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

                            if (exp_in.name.toLowerCase().indexOf("erc20") !== -1) {
                                // erc20 so return true and thirdArg
                                const lastArg = _getLastArgumentFromTransfer(statement, exp);
                                return lastArg;
                            } else {
                                // check 721 and position
                                if (exp_in.name.toLowerCase().indexOf("erc721") !== -1 || exp_in.name.toLowerCase().indexOf("position") !== -1 || exp_in.name.toLowerCase().indexOf("pos") !== -1) {
                                    return false;
                                }

                                // check third argument if it has token or id then it is most likely NFT
                                const stExp = statement.expression;
                                // console.log('stExp')
                                // console.log(stExp)
                                if (stExp.arguments && stExp.arguments.length > 2) {
                                    const arg2 = stExp.arguments[2]; //

                                    if (arg2.type === 'Identifier' && (arg2.name.toLowerCase().indexOf("token") !== -1 || arg2.name.toLowerCase().indexOf("id") !== -1)) {
                                        return false;
                                    }
                                }

                                // else cases
                                // erc20 so return true and thirdArg
                                const lastArg = _getLastArgumentFromTransfer(statement, exp);
                                return lastArg;

                            }


                        }
                        else { // all else cases
                            // erc20 so return true and thirdArg
                            const lastArg = _getLastArgumentFromTransfer(statement, exp);
                            return lastArg;
                        }


                    }

                }
            }
        }
    }

    return false;

}


const _checkIfERC20TransferOrSafeTransferReturnLastArg = function (contractNode, statement) {
    // check if it is transfer Call
    if (statement.expression) {
        if (statement.type == types.Expression && statement.expression.type == 'FunctionCall') {
            if (statement.expression.expression) {

                const exp = statement.expression.expression;
                // console.log('statement_1')
                //     console.log(statement.expression)
                if (exp.type === 'MemberAccess' || exp.type === 'Identifier') {

                    if (exp.memberName === 'transfer' ||
                        exp.memberName === 'transferFrom' || exp.memberName === 'safeTransfer' ||
                        exp.memberName === 'safeTransferFrom') { // if there is transfer in the function name that's called

                        if (exp.expression) {

                            // check it is not nft (erc721)
                            const exp_in = exp.expression.expression || exp.expression

                            if (exp_in.name.toLowerCase().indexOf("erc20") !== -1) {
                                // erc20 so return true and thirdArg
                                const lastArg = _getLastArgumentFromTransferOrSafeTransfer(statement, exp);
                                return lastArg;
                            } else {
                                // check 721 and position
                                if (exp_in.name.toLowerCase().indexOf("erc721") !== -1 || exp_in.name.toLowerCase().indexOf("position") !== -1 || exp_in.name.toLowerCase().indexOf("pos") !== -1) {
                                    return false;
                                }

                                // check third argument if it has token or id then it is most likely NFT
                                const stExp = statement.expression;
                                // console.log('stExp')
                                // console.log(stExp)
                                if (stExp.arguments && stExp.arguments.length > 2) {
                                    const arg2 = stExp.arguments[2]; //

                                    if (arg2.type === 'Identifier' && (arg2.name.toLowerCase().indexOf("token") !== -1 || arg2.name.toLowerCase().indexOf("id") !== -1)) {
                                        return false;
                                    }
                                }

                                // else cases
                                // erc20 so return true and thirdArg
                                const lastArg = _getLastArgumentFromTransferOrSafeTransfer(statement, exp);
                                return lastArg;

                            }


                        }
                        else { // all else cases
                            // erc20 so return true and thirdArg
                            const lastArg = _getLastArgumentFromTransferOrSafeTransfer(statement, exp);
                            return lastArg;
                        }


                    }

                }
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

const _checkIfERC20TransferZeroAmount_L_007 = async function (filePath, contractNode, statement) {
    let detectionResult = [];

    const id = 'L-007';
    if (statement.expression) {
        const lastArg = _checkIfERC20TransferAndReturnLastArg(contractNode, statement);

        if (lastArg) {
            if (lastArg.type === 'NumberLiteral' && lastArg.number == 0) {
                detectionResult.push({
                    id: id,
                    loc: lastArg.loc
                });
            } else if (lastArg.type === 'Identifier' && lastArg.name) { // check identifier now
                // check if there is no validation for zero amount
                // i.e. no require amount > 0 or if amount > 0 ...etc.
                let regExpStr = '\(require\\s\*\\\(\\s\*' + lastArg.name + '\\s\*\(\>\|\!\=\)\\s\*\\d\*\\s\*\\\)\)\|\(if\\s\*\\\(\\s\*' + lastArg.name + '\\s\*\(\>\|\!\=\)\\s\*\\d\*\\s\*\\\)\)';
                const validated = await _check_if_regex_match_exists_before_a_statement(filePath, contractNode, lastArg.loc, regExpStr);
                if (!validated) {
                    detectionResult.push({
                        id: id,
                        loc: lastArg.loc
                    });
                }

            }
        }
    }
    return detectionResult;
}


const _checkIfERC20Fee_On_Transfer_Tokens_L_018 = async function (filePath, contractNode, statement) {
    let detectionResult = [];

    const id = 'L-018';
    if (statement.expression) {
        const lastArg = _checkIfERC20TransferOrSafeTransferReturnLastArg(contractNode, statement);

        if (lastArg) { // just to make sure that it is true. but we don't need the last argument. we only used its loc
            // check if there is balance check before // i.e. balanceOf .
            let regExpStr = '\\bbalanceOf\\b';
            const validated = await _check_if_regex_match_exists_before_a_statement(filePath, contractNode, lastArg.loc, regExpStr);
            if (!validated) {
                detectionResult.push({
                    id: id,
                    loc: statement.expression.loc
                });
            } else {

                // check if there is balance check after // i.e. balanceOf .
                let regExpStr = '\\bbalanceOf\\b';
                const validated = await _check_if_regex_match_exists_after_a_statement(filePath, contractNode, lastArg.loc, regExpStr);
                if (!validated) {
                    detectionResult.push({
                        id: id,
                        loc: statement.expression.loc
                    });

                }
            }
        }
    }

    return detectionResult;
}


const _get_regex_matches = async function (filePath, contractNode, usedRegExp) {

    let contract_str = await return_contract_as_string(filePath, contractNode);
    const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
    let contract = contract_str.replace(regExp_comments, ""); // remove comments and return only code
    let regExpStr = usedRegExp;
    let regExp = new RegExp(regExpStr, 'g');
    var matches = contract.match(regExp) || []; //return array
    //find the lines

    let usedLineNumbers = {};

    let lines = await _get_contract_lines(filePath, contractNode);
    const regExpcommentsForLine = /(\/\/.*(.*))|\*.*(.*)/gm; //catch start with // and /* comments 

    for (const keyLineNum in lines) { // clean comments
        lines[keyLineNum] = lines[keyLineNum].replace(regExpcommentsForLine, ""); // remove comments and return only code
    }
    const retLines = [];
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        for (const keyLineNum in lines) {
            if (lines[keyLineNum].indexOf(match) !== -1 && !usedLineNumbers[keyLineNum]) {
                // console.log(`${keyLineNum}:${lines[keyLineNum]}`)
                usedLineNumbers[keyLineNum] = true;
                retLines.push(keyLineNum);

            }
        }
    }

    return retLines;
}

const _get_regex_matches_with_texts = async function (filePath, contractNode, usedRegExp) {

    let contract_str = await return_contract_as_string(filePath, contractNode);
    const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
    let contract = contract_str.replace(regExp_comments, ""); // remove comments and return only code
    let regExpStr = usedRegExp;
    let regExp = new RegExp(regExpStr, 'g');
    var matches = contract.match(regExp) || []; //return array
    //find the lines

    let usedLineNumbers = {};

    let lines = await _get_contract_lines(filePath, contractNode);
    const regExpcommentsForLine = /(\/\/.*(.*))|\*.*(.*)/gm; //catch start with // and /* comments 

    for (const keyLineNum in lines) { // clean comments
        lines[keyLineNum] = lines[keyLineNum].replace(regExpcommentsForLine, ""); // remove comments and return only code
    }
    const retObj = [];
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        for (const keyLineNum in lines) {
            if (lines[keyLineNum].indexOf(match) !== -1 && !usedLineNumbers[keyLineNum]) {
                // console.log(`${keyLineNum}:${lines[keyLineNum]}`)
                usedLineNumbers[keyLineNum] = true;
                retObj.push({
                    match: match,
                    lineNumber: keyLineNum
                });

            }
        }
    }

    return retObj;
}

const _checkIflatestAnswerFuncIsUsed_L_019 = async function (filePath, contractNode) {
    let detectionResult = [];

    const id = 'L-019';

    // check if there is latestAnswer function usage.
    let regExpStr = '\\\.\\blatestAnswer\\b\\\(\\\)';
    const retLines = await _get_regex_matches(filePath, contractNode, regExpStr);
    for (let i = 0; i < retLines.length; i++) {
        const obj = {
            id: id,
            loc: {
                start: { line: retLines[i], column: 0 },
                end: { line: retLines[i], column: 0 }
            }
        };
        detectionResult.push(obj);
    }

    return detectionResult;
}

const _checkIfecrecoverUsed_L_021 = async function (filePath, contractNode) {
    let detectionResult = [];

    const id = 'L-021';

    // check if there is ecrecover(.
    let regExpStr = '\\becrecover\\b\\\(';
    const retLines = await _get_regex_matches(filePath, contractNode, regExpStr);
    for (let i = 0; i < retLines.length; i++) {
        const obj = {
            id: id,
            loc: {
                start: { line: retLines[i], column: 0 },
                end: { line: retLines[i], column: 0 }
            }
        };
        const funcNode = getFunctionNodeByLOC(contractNode, obj.loc);
        if (funcNode && funcNode.name) {
            console.log(funcNode.name);
            obj['extra'] = { auditToPrint: `// @audit at function ${funcNode.name}` }
        }
        detectionResult.push(obj);
    }

    return detectionResult;
}


// This has to be imporved later to check things like => arra1.length == arra2.length ...etc
// At the moment, it only detects if there are arrays 
const _checkArrayLengthNotChecked_L_022 = async function (filePath, contractNode) {
    let detectionResult = [];

    const id = 'L-022';

    const subnodes = contractNode.subNodes;
    for (let i = 0; i < subnodes.length; i++) {
        const subNode = subnodes[i];
        if (subNode.type === 'FunctionDefinition') {
            const paras = subNode.parameters;
            let arrCount = 0;
            let pLoc;
            for (let j = 0; j < paras.length; j++) {
                if (paras[j].typeName && paras[j].typeName.type === 'ArrayTypeName') {
                    arrCount++;
                    if (arrCount >= 2) {
                        pLoc = paras[j].loc;
                        break;
                    }
                }
            }
            if (!pLoc) {
                pLoc = subNode.loc
            }
            if (arrCount >= 2) {
                const obj = {
                    id: id,
                    loc: pLoc
                };
                if (subNode && subNode.name) {
                    obj['extra'] = { auditToPrint: `// @audit at function ${subNode.name}` }
                }
                detectionResult.push(obj);

            }
        }
    }

    return detectionResult;
}


const _check_arrays_with_no_pop_func_L_020 = async function (filePath, contractNode, stateVar) {
    let detectionResult = [];

    const id = 'L-020';
    // console.log(stateVar.variables)
    const vars = stateVar.variables;
    for (let i = 0; i < vars.length; i++) {
        // console.log(vars[i]);
        const v = vars[i];
        // check if it is array
        if (v.typeName && v.typeName.type === 'ArrayTypeName') {
            // check if there is push 
            const arrName = v.name;
            let regExpStr = '\\b' + arrName + '\\b\.\\bpush\\b\\\(';
            const retLines = await _get_regex_matches(filePath, contractNode, regExpStr);
            if (retLines && retLines.length > 0) { // check if we got result 
                // this means we have push. Now check if there is pop
                let regExpStrPop = '\\b' + arrName + '\\b\.\\bpop\\b\\\(';
                const retLinesPop = await _get_regex_matches(filePath, contractNode, regExpStrPop);
                if (retLinesPop && retLinesPop.length > 0) { // check if we got result 
                    // we have pop, so do nothing
                } else {
                    const obj = {
                        id: id,
                        loc: {
                            start: { line: retLines[i], column: 0 },
                            end: { line: retLines[i], column: 0 }
                        },
                        extra: { auditToPrint: `// @audit state variable: ${arrName}` }
                    };
                    detectionResult.push(obj);

                }
            }
        }
    }
    return detectionResult;
}

const _missing_check_for_addr_zero_assignment_L_023 = async function (filePath, contractNode, stateVar) {
    let detectionResult = [];

    const id = 'L-023';
    // console.log(stateVar.variables)
    const vars = stateVar.variables;
    for (let i = 0; i < vars.length; i++) {
        const v = vars[i];
        // check if it is address
        if (v.typeName && v.typeName.type === 'ElementaryTypeName' && v.typeName.name === 'address') {
            // console.log(v);
            // check if there is assignment 
            const varName = v.name;
            let regExpStr = '\\b' + varName + '\\b\\s\{1,20\}\=\\s\{1,20\}\\w\+';
            const retObj = await _get_regex_matches_with_texts(filePath, contractNode, regExpStr);
            if (retObj && retObj.length > 0) { // check if we got result 
                for (let i = 0; i < retObj.length; i++) {
                    const match = retObj[i].match;
                    const lineNum = retObj[i].lineNumber;
                    // get the variable on the right side.
                    const rightVar = match.replace(varName, "").replace("=", "").trim();
                    //  console.log(rightVar);
                    // now check for address(0) checks
                    let regExpStr_ = '\(require\|if\)\.\{0,20\}\\\(\.\{0,20\}\\b' + rightVar + '\\b\.\{0,20\}address\\\(0\\\)';
                    const retLines = await _get_regex_matches(filePath, contractNode, regExpStr_);
                    if (retLines && retLines.length > 0) { // check if we got result 
                        // do nothing .. all good.
                    } else {
                        // cool. we got something
                        const obj = {
                            id: id,
                            loc: {
                                start: { line: lineNum, column: 0 },
                                end: { line: lineNum, column: 0 }
                            }
                        };
                        detectionResult.push(obj);

                    }
                }
            }
        }

    }

    return detectionResult;
}


// approve()/safeApprove() may revert if the current approval is not zero
const _checkIfApproveCallNoZero_L_008 = async function (filePath, contractNode, statement) {
    let detectionResult = [];

    const id = 'L-008';
    if (statement && statement.expression) {
        const exp = statement.expression.expression;
        if (exp && statement.expression.type === "FunctionCall") {
            // console.log(statement);
            if (exp.memberName === "approve" || exp.memberName === "safeApprove") {
                if (exp.expression) {
                    // check it is not nft (erc721)
                    const exp_in = exp.expression.expression || exp.expression
                    if (exp_in.name.toLowerCase().indexOf("erc20") === -1) {
                        // check 721 and position
                        if (exp_in.name.toLowerCase().indexOf("erc721") !== -1 || exp_in.name.toLowerCase().indexOf("position") !== -1 || exp_in.name.toLowerCase().indexOf("pos") !== -1) {
                            return false;
                        }
                        // check second argument if it has token or id then it is most likely NFT
                        const stExp = statement.expression;
                        if (stExp.arguments && stExp.arguments.length > 1) {
                            const arg1 = stExp.arguments[1]; //

                            if (arg1.type === 'Identifier' && (arg1.name.toLowerCase().indexOf("token") !== -1 || arg1.name.toLowerCase().indexOf("id") !== -1)) {
                                return false;
                            }
                        }

                    }


                }

                // skip if second argument zero
                if (statement.expression.arguments.length > 1) {
                    const secondArg = statement.expression.arguments[1];
                    // console.log(secondArg)
                    if (secondArg.type === 'NumberLiteral' && secondArg.number === '0') {
                        // skip do nothing
                        // console.log('zero');
                    } else {
                        // check if there is no approve zero before
                        // i.e. approve(address,0)
                        // any single character between approve is up to 60 only
                        const methodName = exp.memberName;
                        let regExpStr = methodName + '\\\(\[\^\]\{1,60\},\\s\*0\\s\*\\\)\\s\*;';
                        const validated = await _check_if_regex_match_exists_before_a_statement(filePath, contractNode, exp.loc, regExpStr);
                        if (!validated) {
                            detectionResult.push({
                                id: id,
                                loc: exp.loc
                            });
                        }

                    }
                }
            }
        }
    }

    return detectionResult;
}

// this is used to scan if there is a match for a particular regex inside the same function
const _check_if_regex_match_exists_before_a_statement = async function (filePath, contractNode, stLoc, usedRegExp) {

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

    let lines = await _get_contract_lines(filePath, contractNode);
    const regExpcommentsForLine = /(\/\/.*(.*))|\*.*(.*)/gm; //catch start with // and /* comments 

    for (const keyLineNum in lines) { // clean comments
        lines[keyLineNum] = lines[keyLineNum].replace(regExpcommentsForLine, ""); // remove comments and return only code
    }    // console.log(lines)
    const funcNode = getFunctionNodeByLOC(contractNode, stLoc);
    // console.log(funcNode)
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        for (const keyLineNum in lines) {
            if (lines[keyLineNum].indexOf(match) !== -1 && !usedLineNumbers[keyLineNum]) {
                // console.log(`${keyLineNum}:${lines[keyLineNum]}`)
                usedLineNumbers[keyLineNum] = true;
                if (keyLineNum >= funcNode.loc.start.line && keyLineNum <= funcNode.loc.end.line) { // the match is inside the same function
                    if (stLoc.start.line >= keyLineNum) { // the match is before the statement
                        return true;
                    }
                }
            }
        }
    }

    return false;
}

// this is used to scan if there is a match for a particular regex inside the same function
const _check_if_regex_match_exists_after_a_statement = async function (filePath, contractNode, stLoc, usedRegExp) {

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

    let lines = await _get_contract_lines(filePath, contractNode);
    const regExpcommentsForLine = /(\/\/.*(.*))|\*.*(.*)/gm; //catch start with // and /* comments 

    for (const keyLineNum in lines) { // clean comments
        lines[keyLineNum] = lines[keyLineNum].replace(regExpcommentsForLine, ""); // remove comments and return only code
    }    // console.log(lines)
    const funcNode = getFunctionNodeByLOC(contractNode, stLoc);
    // console.log(funcNode)
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        for (const keyLineNum in lines) {
            if (lines[keyLineNum].indexOf(match) !== -1 && !usedLineNumbers[keyLineNum]) {
                // console.log(`${keyLineNum}:${lines[keyLineNum]}`)
                usedLineNumbers[keyLineNum] = true;
                if (keyLineNum >= funcNode.loc.start.line && keyLineNum <= funcNode.loc.end.line) { // the match is inside the same function
                    if (stLoc.start.line <= keyLineNum) { // the match is after the statement
                        return true;
                    }
                }
            }
        }
    }

    return false;
}

const _get_regex_match_of = async function (filePath, contractNode, stLoc, usedRegExp) {

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

    let lines = await _get_contract_lines(filePath, contractNode);
    const regExpcommentsForLine = /(\/\/.*(.*))|\*.*(.*)/gm; //catch start with // and /* comments 

    for (const keyLineNum in lines) { // clean comments
        lines[keyLineNum] = lines[keyLineNum].replace(regExpcommentsForLine, ""); // remove comments and return only code
    }    // console.log(lines)
    const funcNode = getFunctionNodeByLOC(contractNode, stLoc);
    // console.log(funcNode)
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        for (const keyLineNum in lines) {
            if (lines[keyLineNum].indexOf(match) !== -1 && !usedLineNumbers[keyLineNum]) {
                // console.log(`${keyLineNum}:${lines[keyLineNum]}`)
                usedLineNumbers[keyLineNum] = true;
                if (keyLineNum >= funcNode.loc.start.line && keyLineNum <= funcNode.loc.end.line) { // the match is inside the same function
                    return match;

                }
            }
        }
    }

    return false;
}

// ERC20 or ERC721...etc
const _checkSafeTransferCallFor_L015 = function (filePath, contractNode, statement) {
    // check if it is safe transfer Call
    const id = 'L-015';
    const detectionResult = [];
    if (statement.expression) {

        if (statement.type == types.Expression && statement.expression.type == 'FunctionCall') {

            if (statement.expression.expression) {
                const exp = statement.expression.expression;
                if (exp.type === 'MemberAccess' || exp.type === 'Identifier') {
                    if (exp.memberName === 'safeTransfer' ||
                        exp.memberName === 'safeTransferFrom') { // if there is safetransfer in the function name that's called

                        // check if the function doesn't have reentrancy guard
                        const funcNode = getFunctionNodeByLOC(contractNode, exp.loc);
                        const modifiers = funcNode.modifiers;

                        if (modifiers) {
                            let reentrancyExist = false;
                            for (let index = 0; index < modifiers.length; index++) {
                                const modfName = modifiers[index].name;
                                // console.log(modfName.indexOf("nonReentrant") === -1);
                                reentrancyExist = modfName.toLowerCase().indexOf("reentran") !== -1 || modfName.toLowerCase().indexOf("nonreentrant") !== -1 || modfName.toLowerCase().indexOf("lock") !== -1;
                                // console.log(reentrancyExist);
                                if (reentrancyExist) {
                                    break;
                                }

                            }

                            if (!reentrancyExist) {
                                // no reentrancy guard
                                detectionResult.push({
                                    id: id,
                                    loc: exp.loc
                                });
                            }
                        }

                    }

                }
            }
        }
    }
    return detectionResult;
}


const _checkMissing_contract_existence_checks_before_low_level_calls_L_009 = async function (filePath, contractNode, statement) {
    let detectionResult = [];

    const id = 'L-009';

    if (statement) {
        // initialValue means there is an assignment and it is on the right side
        // statement.expression just a normal call without assignment
        const exp = statement.initialValue || statement.expression;
        if (exp && exp.type === "FunctionCall" && exp.expression) {
            // low level calls
            const nestedExp = exp.expression.expression;
            if (exp.expression.memberName === "call" || exp.expression.memberName === "delegatecall" || exp.expression.memberName === "staticcall"
                || (nestedExp && (nestedExp.memberName === "call" || nestedExp.memberName === "delegatecall" || nestedExp.memberName === "staticcall"))) {
                // name of the account
                let accountName;
                if (exp.expression.expression) { // this is when normal call
                    accountName = exp.expression.expression.name;
                }
                if (!accountName && nestedExp.expression) { // this is when call has {gas:amount } ..etc
                    accountName = nestedExp.expression.name;
                }
                if (accountName) {
                    // console.log(accountName)
                    // spaces up to 10 only to avoid taking from lines below (just in case)
                    let regExpStr = accountName + '\\\.code\\\.length\\s\{0,10\}\(\\\>\|\!\=\)\\s\{0,10\}0';
                    const validated = await _check_if_regex_match_exists_before_a_statement(filePath, contractNode, exp.loc, regExpStr);
                    if (!validated) {
                        detectionResult.push({
                            id: id,
                            loc: exp.loc
                        });
                    }
                }

            }
        }

    }

    return detectionResult;
}


const _check_gas_not_passed_in_low_level_calls_L_010 = async function (filePath, contractNode, statement) {
    let detectionResult = [];

    const id = 'L-010';

    if (statement) {
        // initialValue means there is an assignment and it is on the right side
        // statement.expression just a normal call without assignment
        const exp = statement.initialValue || statement.expression;

        if (exp && exp.type === "FunctionCall" && exp.expression) {
            // low level calls
            // console.log(exp)
            const nestedExp = exp.expression.expression;
            if (exp.expression.memberName === "call" || exp.expression.memberName === "delegatecall" || exp.expression.memberName === "staticcall"
                || (nestedExp && (nestedExp.memberName === "call" || nestedExp.memberName === "delegatecall" || nestedExp.memberName === "staticcall"))) {
                // name of the account
                // if(exp.expression.expression && exp.expression.expression.name){
                //    console.log(exp.expression)
                if (exp.expression.arguments && exp.expression.arguments.names && exp.expression.arguments.names.length > 0) {
                    const names = exp.expression.arguments.names;
                    if (!names.includes("gas")) {
                        detectionResult.push({
                            id: id,
                            loc: exp.loc
                        });
                    }
                } else { // there are no arguments. it means there is no {gas:amount}
                    detectionResult.push({
                        id: id,
                        loc: exp.loc
                    });
                }

                // }   

            }
        }

    }

    return detectionResult;
}

const _check_state_variables_not_capped_L_011 = async function (filePath, contractNode, statement) {
    let detectionResult = [];

    const id = 'L-011';
    const exp = statement.expression;
    if (statement.type === 'ExpressionStatement' && exp && exp.type === 'BinaryOperation' && exp.operator === '=') {
        if (exp.left && exp.left.name && exp.left.type === 'Identifier') {
            // check if var name has max or min
            const name = exp.left.name;
            if (name.toLowerCase().indexOf("min") !== -1 || name.toLowerCase().indexOf("max") !== -1 || name.toLowerCase().indexOf("limit") !== -1) {
                // check if left is statevariable
                const isStateVar = helper.isStateVariable(contractNode, name);
                if (isStateVar) {
                    // now check if there is a cap .. require or if statement ...etc.
                    // get right identifier
                    if (exp.right && exp.right.name) {
                        const rightVarName = exp.right.name;
                        let regExpStr = '\(require\|if\)\\s\{0,25\}\\\(\\s\{0,25\}' + rightVarName + '\\s\{0,25\}\(\\\>\|\\\<\)';
                        const validated = await _check_if_regex_match_exists_before_a_statement(filePath, contractNode, exp.loc, regExpStr);
                        if (!validated) {
                            detectionResult.push({
                                id: id,
                                loc: exp.loc
                            });
                        }

                    }

                }
            }

        }
    }

    return detectionResult;
}

const _check_rates_fees_should_be_capped_L_012 = async function (filePath, contractNode, statement) {
    let detectionResult = [];

    const id = 'L-012';
    const exp = statement.expression;
    if (statement.type === 'ExpressionStatement' && exp && exp.type === 'BinaryOperation' && exp.operator === '=') {
        if (exp.left && exp.left.name && exp.left.type === 'Identifier') {
            // check if var name has max or min
            const name = exp.left.name;
            if (name.toLowerCase().indexOf("fee") !== -1 || name.toLowerCase().indexOf("rate") !== -1) {
                // check if left is statevariable
                const isStateVar = helper.isStateVariable(contractNode, name);
                if (isStateVar) {
                    // now check if there is a cap .. require or if statement ...etc.
                    // get right identifier
                    if (exp.right && exp.right.name) {
                        const rightVarName = exp.right.name;
                        let regExpStr = '\(require\|if\)\\s\{0,25\}\\\(\\s\{0,25\}' + rightVarName + '\\s\{0,25\}\(\\\>\|\\\<\)';
                        const validated = await _check_if_regex_match_exists_before_a_statement(filePath, contractNode, exp.loc, regExpStr);
                        if (!validated) {
                            detectionResult.push({
                                id: id,
                                loc: exp.loc
                            });
                        }

                    }

                }
            }

        }
    }

    return detectionResult;
}

const _check_unsafe_downcast_L_013 = async function (filePath, contractNode, statement) {
    let detectionResult = [];

    const id = 'L-013';
    let exp = statement.initialValue || statement.expression;
    if (exp && exp.type === "BinaryOperation") { // check right and left
        if (exp.right && exp.right.type === "FunctionCall") {
            exp = exp.right;
        }

    }

    if (exp && exp.type === "FunctionCall" && exp.expression) {

        if (exp.expression && exp.expression.name && exp.expression.name.indexOf('int') !== -1) {

            if (exp.arguments && exp.arguments.length > 0) {
                const args = exp.arguments;
                // console.log(rightPart)

                const nType = exp.expression.name; // e.g. uint8, uint24 ..etc.
                let arg0 = args[0];

                if (arg0.type === 'BinaryOperation') {
                    // check right and left. Pick any identifier. should be enough
                    if (arg0.left && arg0.left.type === 'Identifier') {
                        arg0 = arg0.left;
                    } else if (arg0.right && arg0.right.type === 'Identifier') {
                        arg0 = arg0.right;
                    }
                }

                if (arg0.type === 'Identifier') {
                    // get type of arg identifier
                    let typ = 'int';
                    if (nType.indexOf("u") !== -1) {
                        typ = 'uint';
                    }
                    let regExpStr = '\\b' + typ + '\\d\*\?\\s\*' + arg0.name + '\\b';
                    const match = await _get_regex_match_of(filePath, contractNode, exp.loc, regExpStr);
                    if (match) {
                        try {
                            const bits = parseInt(match.replace(arg0.name, "").replace("int", "").replace("u", "").trim());
                            const castBits = parseInt(nType.replace("int", "").replace("u", "").trim());
                            // console.log(bits);
                            // console.log(castBits);
                            if (castBits < bits) {
                                detectionResult.push({
                                    id: id,
                                    loc: exp.loc,
                                    extra: { auditToPrint: `// @audit ${typ}${bits} -> ${typ}${castBits}` }
                                });

                            }

                        } catch (err) {
                            return detectionResult
                        }

                    }
                }

            }

        }


    }

    return detectionResult;
}


const check_if_import_draft_contract_L014 = async function (filePath, importsNodes) {
    const id = 'L-014';
    const detectionResult = [];
    try {
        for (let i = 0; i < importsNodes.length; i++) {
            let importNode = importsNodes[i];
            // console.log(importNode);
            if (importNode.path && importNode.path.indexOf("draft") !== -1)
                detectionResult.push({
                    id: id,
                    loc: importNode.loc // location of the code (i.e. line numbers)
                });
        }
    } catch (e) {

    }
    return detectionResult;
}

const _get_regex_match_in_entire_contract = async function (filePath, contractNode, usedRegExp) {

    let contract_str = await return_contract_as_string(filePath, contractNode);
    const regExp_comments = /(\/\/)(.+?)(?=[\n\r]|\*\))|\/\*[^]*?\*\//g; //catch start with // and /* comments
    let contract = contract_str.replace(regExp_comments, ""); // remove comments and return only code
    let regExpStr = usedRegExp;
    let regExp = new RegExp(regExpStr, 'g');
    var matches = contract.match(regExp) || []; //return array

    //find the lines

    let usedLineNumbers = {};

    let lines = await _get_contract_lines(filePath, contractNode);
    const regExpcommentsForLine = /(\/\/.*(.*))|\*.*(.*)/gm; //catch start with // and /* comments 

    for (const keyLineNum in lines) { // clean comments
        lines[keyLineNum] = lines[keyLineNum].replace(regExpcommentsForLine, ""); // remove comments and return only code
    }    // console.log(lines)
    // const funcNode = getFunctionNodeByLOC(contractNode, stLoc);
    // console.log(funcNode)
    const retLines = [];
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        for (const keyLineNum in lines) {
            if (lines[keyLineNum].indexOf(match) !== -1 && !usedLineNumbers[keyLineNum]) {
                // console.log(`${keyLineNum}:${lines[keyLineNum]}`)
                usedLineNumbers[keyLineNum] = true;
                // console.log(match);
                retLines.push(keyLineNum);
            }
        }
    }

    return retLines;
}

const check_erc20_decimals_calls_L016 = async function (filePath, contractNode) {
    const id = 'L-016';
    const detectionResult = [];

    let regExpStr = 'decimals\\\(\\\)';
    const retLines = await _get_regex_match_in_entire_contract(filePath, contractNode, regExpStr);
    // console.log(retLines)
    for (let i = 0; i < retLines.length; i++) {
        const obj = {
            id: id,
            loc: {
                start: { line: retLines[i], column: 0 },
                end: { line: retLines[i], column: 0 }
            }
        };

        const funcNode = getFunctionNodeByLOC(contractNode, obj.loc);
        if (funcNode && funcNode.name) {
            obj['extra'] = { auditToPrint: `// @audit belongs to function ${funcNode.name}` };
        }
        detectionResult.push(obj);
    }

    return detectionResult;
}

const check_erc721_tokenURI_compliance_L017 = async function (filePath, contractNode) {
    const id = 'L-017';
    const detectionResult = [];

    let regExpStr = '\\breturn\\b\\s\*\\btokenURIs\\b'; // return tokenURIs
    const retLines = await _get_regex_match_in_entire_contract(filePath, contractNode, regExpStr);
    // console.log(retLines)
    for (let i = 0; i < retLines.length; i++) {
        const obj = {
            id: id,
            loc: {
                start: { line: retLines[i], column: 0 },
                end: { line: retLines[i], column: 0 }
            }
        };

        const funcNode = getFunctionNodeByLOC(contractNode, obj.loc);
        if (funcNode && funcNode.name === 'tokenURI') {
            obj['extra'] = { auditToPrint: `// @audit function ${funcNode.name}` };

            // regex again, check if there is a check for token that exists ..etc.
            // i.e.  tokenURIs[_tokenId] > or != 0 , _requireMinted(_tokenId) ,  _ownerOf(tokenId) != address(0)
            let __regExpStr = '\(\\btokenURIs\\b\[\^\]\*\?\\s\*\(\>\|\!\=\)\\s\*0\)\|\(\\b_requireMinted\\b\|exist\)\|\(owner\[\^\]\{0,50\}0\)';
            const validated = await _check_if_regex_match_exists_before_a_statement(filePath, contractNode, obj.loc, __regExpStr);
            if (!validated) {
                detectionResult.push(obj);
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
    // console.log(stateVar);
    const L_020 = await _check_arrays_with_no_pop_func_L_020(filePath, contractNode, stateVar);
    if (L_020.length > 0) {
        detectionResult = detectionResult.concat(L_020);
    }

    const L_023 = await _missing_check_for_addr_zero_assignment_L_023(filePath, contractNode, stateVar);
    if (L_023.length > 0) {
        detectionResult = detectionResult.concat(L_023);
    }

    return detectionResult;

}

// This is to check statements in a function or a block ...etc.
const _checkStatement = async function (filePath, contractNode, subNode, statement) {
    // console.log('detector._checkStatement');
    // console.log(subNode);
    let detectionResult = [];
    // console.log(statement);



    const L_002 = await _checkIfmsgvalueNotRefunded_L_002(contractNode, statement);
    if (L_002.length > 0) {
        detectionResult = detectionResult.concat(L_002);
    }

    const L_005 = await _check_unsafe_erc721_L_005(contractNode, statement);
    if (L_005.length > 0) {
        detectionResult = detectionResult.concat(L_005);
    }

    const L_006 = await _checkIfMintSafeNotCalled_L_006(contractNode, statement);
    if (L_006.length > 0) {
        detectionResult = detectionResult.concat(L_006);
    }

    const L_007 = await _checkIfERC20TransferZeroAmount_L_007(filePath, contractNode, statement);
    if (L_007.length > 0) {
        detectionResult = detectionResult.concat(L_007);
    }

    const L_008 = await _checkIfApproveCallNoZero_L_008(filePath, contractNode, statement);
    if (L_008.length > 0) {
        detectionResult = detectionResult.concat(L_008);
    }

    const L_009 = await _checkMissing_contract_existence_checks_before_low_level_calls_L_009(filePath, contractNode, statement);
    if (L_009.length > 0) {
        detectionResult = detectionResult.concat(L_009);
    }

    // External call recipient may consume all transaction gas
    const L_010 = await _check_gas_not_passed_in_low_level_calls_L_010(filePath, contractNode, statement);
    if (L_010.length > 0) {
        detectionResult = detectionResult.concat(L_010);
    }

    const L_011 = await _check_state_variables_not_capped_L_011(filePath, contractNode, statement);
    if (L_011.length > 0) {
        detectionResult = detectionResult.concat(L_011);
    }


    const L_012 = await _check_rates_fees_should_be_capped_L_012(filePath, contractNode, statement);
    if (L_012.length > 0) {
        detectionResult = detectionResult.concat(L_012);
    }


    const L_013 = await _check_unsafe_downcast_L_013(filePath, contractNode, statement);
    if (L_013.length > 0) {
        detectionResult = detectionResult.concat(L_013);
    }

    const L_015 = await _checkSafeTransferCallFor_L015(filePath, contractNode, statement);
    if (L_015.length > 0) {
        detectionResult = detectionResult.concat(L_015);
    }


    const L_018 = await _checkIfERC20Fee_On_Transfer_Tokens_L_018(filePath, contractNode, statement);
    if (L_018.length > 0) {
        detectionResult = detectionResult.concat(L_018);
    }



    return detectionResult;

}


// This is for contract specific.
const _checkContract = async function (filePath, contractNode) {
    // console.log('detector1._checkContract');

    //console.log(contractNode);

    // console.log(subNode);
    let detectionResult = [];


    const L_016 = await check_erc20_decimals_calls_L016(filePath, contractNode);
    if (L_016.length > 0) {
        detectionResult = detectionResult.concat(L_016);
    }

    const L_017 = await check_erc721_tokenURI_compliance_L017(filePath, contractNode);
    if (L_017.length > 0) {
        detectionResult = detectionResult.concat(L_017);
    }

    const L_019 = await _checkIflatestAnswerFuncIsUsed_L_019(filePath, contractNode);
    if (L_019.length > 0) {
        detectionResult = detectionResult.concat(L_019);
    }

    const L_021 = await _checkIfecrecoverUsed_L_021(filePath, contractNode);
    if (L_021.length > 0) {
        detectionResult = detectionResult.concat(L_021);
    }

    const L_022 = await _checkArrayLengthNotChecked_L_022(filePath, contractNode);
    if (L_022.length > 0) {
        detectionResult = detectionResult.concat(L_022);
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
    const N_014 = await check_if_import_draft_contract_L014(filePath, importsNodes);
    if (N_014) {
        detectionResult = detectionResult.concat(N_014);
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