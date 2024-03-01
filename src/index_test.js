
import reporter from './reporter.js';
import issues from './issues/index.js';

const originalConsoleLog = console.log;
console.log = function() {} // empty console.log so we don't get logs from detectors ...etc.
const ConsoleLog = function() {
    originalConsoleLog.apply(this, arguments);
}


function getUndiscoveredAndDiscoveredIssues(issueArr, typ) {
    let jsonIssues;
    let t;
    if (typ === 'LOW') {
        t = 'L';
    } else if (typ === 'MED') {
        t = 'M';
    } else if (typ === 'NC') {
        t = 'NC';
    } else if (typ === 'GAS') {
        t = 'GAS';
    }

    jsonIssues = issues.filter(item => item.type === t);

    if (!t) {
        throw Error(`type ${typ} is incorrect`);
    }

    let discov = [];

    for (let i = 0; i < jsonIssues.length; i++) {
        const jsonIss = jsonIssues[i];
        for (let j = 0; j < issueArr.length; j++) {
            if (jsonIss.id === issueArr[j].details.id) {
                // found
                discov.push(jsonIssues[i]);
                jsonIssues[i] = undefined;
                break;
            }
        }
    }

    const undiscoveredIssues = jsonIssues.filter(item => item !== undefined).map(item => item.id);
    discov = discov.map(item => item.id);

    const obj = {
        discov:discov,
        undiscov:undiscoveredIssues
    }

    return obj;

}


async function reportByType(typ) {
    let fileName;
    let dataname;
    if (typ === 'LOW') {
        fileName = 'low';
        dataname = 'summary_low_issues';
    } else if (typ === 'MED') {
        fileName = 'med';
        dataname = 'summary_m_issues';
    } else if (typ === 'NC') {
        fileName = 'nc';
        dataname = 'summary_nc_issues';
    } else if (typ === 'GAS') {
        fileName = 'gas';
        dataname = 'summary_gas_issues';
    }

    if (!fileName) {
        throw Error(`type ${typ} is incorrect`);
    }

    let fileNames = [`./src/testfiles/${fileName}.sol`];
    const baseURL = 'https://github.com/test/blob/main/';
    const data = await reporter.generateReports('Contest Test', baseURL, fileNames);
    const result = getUndiscoveredAndDiscoveredIssues(data[dataname], typ);
    const discoveredIssues = result['discov'];
    const undiscoveredIssues = result['undiscov'];
    ConsoleLog('\x1b[32m%s\x1b[0m',`${discoveredIssues.length} DISCOVERED ${typ}:`);
    ConsoleLog('\x1b[32m%s\x1b[0m',discoveredIssues.join(" | "));
    ConsoleLog('\x1b[32m%s\x1b[0m','--------------------');
    ConsoleLog('\x1b[31m%s\x1b[0m',`${undiscoveredIssues.length} UNDISCOVERED ${typ}:`);
    ConsoleLog('\x1b[31m%s\x1b[0m',undiscoveredIssues.join(" | "));
    ConsoleLog('\x1b[31m%s\x1b[0m','--------------------');
    ConsoleLog("");
}

ConsoleLog('\x1b[32m%s\x1b[0m','----------TEST RESULT----------');

await reportByType("MED");
await reportByType("LOW");
await reportByType("NC");
await reportByType("GAS");

// reporter.createMarkdown(data); // we don't need to create markdown


