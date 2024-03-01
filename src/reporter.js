// external
import fs from "fs";
import issues from "./issues/index.js";
import inspector from "./util/inspector.js";
import Mustache from "mustache";
import analyzer from "./analyzer.js";

const botDetails = {
  name: "BotSick",
  by: "Koolex_Evokid",
};

var getFilenameFromPath = function (filePath) {
  return filePath.split("\\").pop().split("/").pop();
};

function searchForIssue(id) {
  for (let i = 0; i < issues.length; i++) {
    if (id == issues[i].id) {
      return issues[i];
    }
  }
  return false;
}

async function attachCodeLinesToIssues(reportedIssues, filePath) {
  const filename = getFilenameFromPath(filePath);
  const newReportedIssues = [];
  const linesNumbers = [];
  reportedIssues.forEach((issue) => {
    linesNumbers.push(issue.loc.start.line);
  });

  const lines = await inspector.readLines(linesNumbers, filePath);
  // console.log(lines);
  reportedIssues.forEach((issue) => {
    const newIssue = issue;
    newIssue["filePath"] = filePath.replace("./sample-contract/", "");
    newIssue["filename"] = filename;
    newIssue["line"] = issue.loc.start.line;
    newIssue["codeline"] = lines["" + issue.loc.start.line];
    newReportedIssues.push(newIssue);
  });

  return newReportedIssues;
}

async function to_print_purpose(allAnalysisArr) {
  //for print puprose
  let to_print = [];
  var res = 0;
  for (let i = 0; i < allAnalysisArr.length; i++) {
    const resObj = allAnalysisArr[i];
    //console.log(resObj);
    if (resObj.id) {
      to_print[res] = resObj;
      res++;
    }
    for (let j = 0; j < resObj.length; j++) {
      const value = resObj[j];
      if (value.id) {
        to_print[res] = value;
        res++;
      }
    }
  }

  //to_print issues objects
  //console.log(to_print);
}

//
async function reportIssues(allAnalysisArr, baseURL, filePath) {
  //console.log(allAnalysisArr);
  to_print_purpose(allAnalysisArr);

  let reportedIssues = [];
  for (let i = 0; i < allAnalysisArr.length; i++) {
    const issue = allAnalysisArr[i];
    if (issue.id) {
      const foundIssue = searchForIssue(issue.id);
      if (foundIssue) {
        issue["baseURL"] = baseURL;
        reportedIssues.push(issue);
      }
    }
  }

  //console.log(reportedIssues);

  reportedIssues = await attachCodeLinesToIssues(reportedIssues, filePath);
  return reportedIssues;
}

function readReportTemplate() {
  const data = fs.readFileSync("./src/template/report.md", {
    encoding: "utf8",
    flag: "r",
  });
  return data;
}

function getIssuesDetails(reportedIssues) {
  const details = {};
  issues.forEach((issue) => {
    for (var i = 0; i < reportedIssues.length; i++) {
      if (issue.id == reportedIssues[i].id) {
        details["" + reportedIssues[i].id] = issue;
        break;
      }
    }
  });

  return details;
}

function attachSeqNumbers(gasIssues) {
  for (var i = 0; i < gasIssues.length; i++) {
    gasIssues[i]["id"] = i + 1;
  }
}

function createTheReportFile(data) {
  const filePath = "output/contest-report.md";

  try {
    fs.unlinkSync(filePath);
    // console.log("Delete File successfully.");
  } catch (error) {
    // console.log(error);
  }
  fs.writeFile(filePath, data, { flag: "wx" }, (err) => {
    if (err) {
      console.error(err);
    }
    // file written successfully

    console.log("Report was generated succesfully! Check " + filePath);
  });
}

async function generateReport(contestName, baseURL, analysisArr, filePath) {
  // reportIssues
  const reportedIssues = await reportIssues(analysisArr, baseURL, filePath);
  const details = getIssuesDetails(reportedIssues);
  // console.log('details');
  // console.log(details);

  // attach details to reported issues
  for (var i = 0; i < reportedIssues.length; i++) {
    reportedIssues[i]["details"] = details[reportedIssues[i].id];
  }

  //console.log('reportedIssues');
  //
  //console.log(reportedIssues);

  let data = {};

  // get nc issues only
  const ncIssues = reportedIssues.filter(
    (reportedIssue) => reportedIssue.details.type == "NC"
  );
  //console.log(ncIssues);
  data["nc_issues"] = ncIssues;

  // get gas issues only
  const gasIssues = reportedIssues.filter(
    (reportedIssue) => reportedIssue.details.type == "GAS"
  );
  //console.log('gasIssues');

  //console.log(gasIssues);
  data["gas_issues"] = gasIssues;

  // get low issues only
  const lowIssues = reportedIssues.filter(
    (reportedIssue) => reportedIssue.details.type == "L"
  );
  //console.log('gasIssues');

  //console.log(gasIssues);
  data["low_issues"] = lowIssues;

  // get low issues only
  const mediumIssues = reportedIssues.filter(
    (reportedIssue) => reportedIssue.details.type == "M"
  );
  // console.log(mediumIssues);

  data["m_issues"] = mediumIssues;

  return data;
}

function groupIssues(r_issues) {
  const used = {};
  const grouped_issues = [];
  let counter = 1;
  for (let i = 0; i < r_issues.length; i++) {
    const issue = r_issues[i];
    if (!used[issue.details.id + ""]) {
      used[issue.details.id + ""] = true;
      const grouped = r_issues.filter(
        (item) => item.details.id === issue.details.id
      );
      const obj = {
        id: counter,
        details: issue.details,
        len: grouped.length,
        instances: [],
      };
      for (let i = 0; i < grouped.length; i++) {
        obj.instances.push(grouped[i]);
      }
      grouped_issues.push(obj);

      counter++;
    }
  }
  return grouped_issues;
}

async function generateReports(contestName, baseURL, fileNames) {
  let data = {
    contest: contestName,
    username: botDetails.by,
    botname: botDetails.name,
    baseURL: baseURL,
    nc_issues: [],
    gas_issues: [],
    low_issues: [],
    m_issues: [],
    summary_nc_issues: [],
    summary_gas_issues: [],
    summary_low_issues: [],
    summary_m_issues: [],
  };
  for (let i = 0; i < fileNames.length; i++) {
    let __analysisArr = await analyzer.analyzeSolidityFile(fileNames[i]);
    const __data = await generateReport(
      contestName,
      baseURL,
      __analysisArr,
      fileNames[i]
    );

    data["nc_issues"] = data["nc_issues"].concat(__data["nc_issues"]);
    data["gas_issues"] = data["gas_issues"].concat(__data["gas_issues"]);
    data["low_issues"] = data["low_issues"].concat(__data["low_issues"]);
    data["m_issues"] = data["m_issues"].concat(__data["m_issues"]);
    console.log(`Done => ${fileNames[i]}`)

  }

  // here we need to de-duplicate and generate summary

  data["summary_nc_issues"] = groupIssues(data["nc_issues"]);

  data["summary_gas_issues"] = groupIssues(data["gas_issues"]);

  data["summary_low_issues"] = groupIssues(data["low_issues"]);

  data["summary_m_issues"] = groupIssues(data["m_issues"]);

  // console.log(data)  

  // data['details_gas_issues'] = groupIssuesDetails(data['summary_gas_issues']);

  // console.log(data["summary_gas_issues"][0]);

  // end of de-duplicate

  // attachSeqNumbers(data['summary_nc_issues']);
  // attachSeqNumbers(data['summary_gas_issues']);

  return data;
}

function createMarkdown(data) {
  // generate the report
  const template = readReportTemplate();
  const output = Mustache.render(template, data);
  // console.log(output);

  createTheReportFile(output);
}

export default {
  createMarkdown: createMarkdown,
  generateReports: generateReports,
  reportIssues: reportIssues,
};
