



function _getAllStateVarsByContract(contractNode){
    const subnodes = contractNode.subNodes;
    const stateVarNodes = [];
    for (let i = 0; i < subnodes.length; i++) {
        const subNode = subnodes[i];
        if(subNode.type === 'StateVariableDeclaration'){
            stateVarNodes.push(subNode);
        }
    }

    return stateVarNodes;
}


function _isStateVariable(contractNode,varName){
    const stateVars = _getAllStateVarsByContract(contractNode);

    for(let i=0;i<stateVars.length;i++){
        const vars = stateVars[i].variables;
        for(let j=0;j<vars.length;j++){
            if(vars[j].name === varName){
                return true;
            }
        }
    }
    return false;
}






export default {
    getAllStateVarsByContract: _getAllStateVarsByContract,
    isStateVariable:_isStateVariable
}