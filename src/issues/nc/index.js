import section_N_group1 from './sections/section_N_group1.json' assert { type: 'json' };
import section_N_group2 from './sections/section_N_group2.json' assert { type: 'json' };
import section_N_group3 from './sections/section_N_group3.json' assert { type: 'json' };
import section_N_group4 from './sections/section_N_group4.json' assert { type: 'json' };
import section_N_group5 from './sections/section_N_group5.json' assert { type: 'json' };

let sections = [];
sections = sections.concat(section_N_group1); // add section one. do the same if you want to add new sections/files
sections = sections.concat(section_N_group2); 
sections = sections.concat(section_N_group3); 
sections = sections.concat(section_N_group4); 
sections = sections.concat(section_N_group5); 


export default sections;