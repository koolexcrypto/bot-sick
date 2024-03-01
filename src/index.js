import analyzer from './analyzer.js';
import reporter from './reporter.js';
import inspector from './util/inspector.js';
console.log('----SolidityAnalysisResult----');
    
let fileNames = [
    "sample-contract/example.sol",
]

const baseURL = 'https://github.com/code-423n4/';

const data = await reporter.generateReports('Contest Name',baseURL,fileNames);
// console.log('nc_issues');
// console.log(data['nc_issues']);
// console.log(data['gas_issues']);
reporter.createMarkdown(data);


