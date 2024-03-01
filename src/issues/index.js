import gasSections from "./gas/index.js";
import lowSections from "./low/index.js";
import mediumSections from "./medium/index.js";
import ncSections from "./nc/index.js";

let issues = [];
issues = issues.concat(gasSections);
issues = issues.concat(lowSections);
issues = issues.concat(mediumSections);
issues = issues.concat(ncSections);
export default issues;