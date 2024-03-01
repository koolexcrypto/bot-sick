import section1 from './sections/section1.json' assert { type: 'json' };
import section_GAS_group1 from './sections/section_GAS_group1.json' assert { type: 'json' };
import section_GAS_group2 from './sections/section_GAS_group2.json' assert { type: 'json' };


let sections = [];
sections = sections.concat(section_GAS_group1); // add section one. do the same if you want to add new sections/files
sections = sections.concat(section_GAS_group2); 



export default sections;