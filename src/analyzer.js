// external
import fs from 'fs';
import parser from '@solidity-parser/parser';


// internal
import types from './types.js';
import detectors from './detectors/index.js';



const LEAF_EXPRESSION = 'LEAF_EXPRESSION';

function parseSolidityFile(filePath) {
    const data = fs.readFileSync(filePath,
        { encoding: 'utf8', flag: 'r' });

    try {
        const ast = parser.parse(data, {
            loc: true, range: true
        });
        return ast;
    } catch (e) {
        if (e instanceof parser.ParserError) {
            console.error(e.errors)
        }
    }
}

function getNodeStatements(subNode) {
    if (subNode.statements) {
        return subNode.statements;
    } else if (subNode.body && subNode.body.statements) {
        return subNode.body.statements;
    } else if (subNode.trueBody && subNode.trueBody.statements) {
        return subNode.trueBody.statements;
    }

    return [];
}

// Note: contractNode could be null if it was not a part of a contract (e.g. library)
async function analyzeNode(filePath, contractNode, subNode) {
    // console.log('analyzenode');
    // console.log(subNode);

    let analysisNodeArr = [];
    // loop through statements of subnode
    const statements = getNodeStatements(subNode); // could be a function or for loop ...etc.

    if (statements.length == 0) { // means it is likely StateVariableDeclaration
        let subNodeType = subNode.type;
        switch (subNodeType) {
            case types.StateVariable:
                for (let i = 0; i < detectors.length; i++) {
                    const detector = detectors[i];
                    let detectionResult = await detector.checkStateVariable(filePath, contractNode, subNode);
                    analysisNodeArr = analysisNodeArr.concat(detectionResult);
                }
                break;
            default:
                for (let i = 0; i < detectors.length; i++) {
                    const detector = detectors[i];
                    let detectionResult = await detector.check(filePath, contractNode, subNode);
                    analysisNodeArr = analysisNodeArr.concat(detectionResult);
                }
        }
    } else {

        for (let s = 0; s < statements.length; s++) {
            const statement = statements[s];
            let detectionResult;
            let statementType = statement.type;
            // group all leaf expressions
            statementType = (
                statementType == types.FunctionCall ||
                statementType == types.ReturnStatement ||
                statementType == types.RevertStatement ||
                statementType == types.Expression ||
                statementType == types.LocalVariable ||
                statementType == types.EmitStatement) ? LEAF_EXPRESSION : statementType;

            switch (statementType) {
                case LEAF_EXPRESSION:
                    for (let i = 0; i < detectors.length; i++) {
                        const detector = detectors[i];
                        let detectionResult = await detector.checkStatement(filePath, contractNode, subNode, statement);
                        analysisNodeArr = analysisNodeArr.concat(detectionResult);
                    }
                    break;
                case types.IfStatement:
                    { // back-compatible => better to avoid this.
                        for (let i = 0; i < detectors.length; i++) {
                            const detector = detectors[i];
                            let detectionResult = await detector.checkStatement(filePath, contractNode, subNode, statement);
                            analysisNodeArr = analysisNodeArr.concat(detectionResult);
                        }
                    }
                    detectionResult = await analyzeNode(filePath, contractNode, statement);
                    analysisNodeArr = analysisNodeArr.concat(detectionResult);
                    break;
                case types.ForLoop:
                    { 
                        // back-compatible => better to avoid this.
                        for (let i = 0; i < detectors.length; i++) {
                            const detector = detectors[i];
                            let detectionResult = await detector.checkStatement(filePath, contractNode, subNode, statement);
                            analysisNodeArr = analysisNodeArr.concat(detectionResult);
                            // include initStatement
                            if(statement.initExpression){
                                let _detectionResult = await detector.checkStatement(filePath, contractNode, statement, statement.initExpression);
                                analysisNodeArr = analysisNodeArr.concat(_detectionResult);
                            }
                        }
                    }
                    detectionResult = await analyzeNode(filePath, contractNode, statement);
                    analysisNodeArr = analysisNodeArr.concat(detectionResult);
                    break;
                case types.WhileStatement:
                    { // back-compatible => better to avoid this.
                        for (let i = 0; i < detectors.length; i++) {
                            const detector = detectors[i];
                            let detectionResult = await detector.checkStatement(filePath, contractNode, subNode, statement);
                            analysisNodeArr = analysisNodeArr.concat(detectionResult);
                        }
                    }
                    detectionResult = await analyzeNode(filePath, contractNode, statement);
                    analysisNodeArr = analysisNodeArr.concat(detectionResult);
                    break;
                case types.Block:
                    detectionResult = await analyzeNode(filePath, contractNode, statement);
                    analysisNodeArr = analysisNodeArr.concat(detectionResult);
                    break;
                default:
                    for (let i = 0; i < detectors.length; i++) {
                        const detector = detectors[i];
                        let detectionResult = await detector.check(filePath, contractNode, subNode);
                        analysisNodeArr = analysisNodeArr.concat(detectionResult);
                    }
            }
        }
    }




    return analysisNodeArr;
}


// analyze one contract
async function analyzeContract(filePath, contractNode) {
    // console.log(contractNode);
    let contractAnalysisArr = [];

    for (let i = 0; i < detectors.length; i++) {
        const detector = detectors[i];
        let detectionResult = await detector.checkContract(filePath, contractNode);
        contractAnalysisArr = contractAnalysisArr.concat(detectionResult);

    }

    const subnodes = contractNode.subNodes;
    for (let i = 0; i < subnodes.length; i++) {
        const subNode = subnodes[i];
        // console.log('subNode');
        // console.log(subNode);
        let analysisNodeArr = await analyzeNode(filePath, contractNode, subNode);
        contractAnalysisArr = contractAnalysisArr.concat(analysisNodeArr);
    }

    return contractAnalysisArr;
}

// analyze one contract
async function analyzeImports(filePath, importsNodes) {
    // console.log(contractNode);
    let analysisArr = [];

    for (let i = 0; i < detectors.length; i++) {
        const detector = detectors[i];
        if (typeof detector.checkImports === 'function') { // check if function exists
            let detectionResult = await detector.checkImports(filePath, importsNodes);
            analysisArr = analysisArr.concat(detectionResult);
        }

    }

    return analysisArr;
}




// analyze Solidity code in one file
async function analyzeSolidityFile(filePath) {

    const ast = parseSolidityFile(filePath);

    let allAnalysisArr = [];
    // console.log(ast.children);
    const children = ast.children;

    const allImports = [];

    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.type == types.Contract) {
            let contractAnalysisResult = await analyzeContract(filePath, child);
            allAnalysisArr = allAnalysisArr.concat(contractAnalysisResult);
        } else {
            // console.log(child);
            if (child.type == 'ImportDirective') {
                allImports.push(child);
                continue;
            }
            let analysisNodeArr = await analyzeNode(filePath, null, child);
            allAnalysisArr = allAnalysisArr.concat(analysisNodeArr);
        }
    }

    // analyze imports
    let analysisNodeArr = await analyzeImports(filePath, allImports);
    allAnalysisArr = allAnalysisArr.concat(analysisNodeArr);



    return allAnalysisArr;


    // console.log(ast);

}


export default {
    analyzeSolidityFile: analyzeSolidityFile
}