# bot-sick

## Summary
A bot which analyzes smart contracts written in Solidity and generates a markdown report with issues found. At the moment, the bot reports up to a total of 97 issues. Please feel free to update, remove or add new ones.

## Prerequisites
- NPM (or any other package manager)
- NodeJS (minimum v16.0.0)

## Dependencies

- Solidity-parser/parser 
    - For parsing Solidity code using ANTLR (ANother Tool for Language Recognition) grammar
- Mustache.js
    - A zero-dependency implementation of the mustache template system in JavaScript
- Typo.js
    - A spellchecker that uses Hunspell-style dictionaries

## How to use
- Add the codebase in the root level
    - For demo, there is `sample-contract` directory
- In `index.js` file, add the list of files to be examined to the `fileNames` array.
    - For example:
        ```javascript
            let fileNames = [
            "sample-contract/example.sol",
            ]
        ```  
- Run `npm install` (only once)
- Run `npm start`
- The generated report `contest-report.md` is under `Output` directory

## How to add a new detector
- Create a new JS file under `src/detectors`
- The file should export the following functions:
    - `checkContract`
        - You have access to the contract node, you can go from there to check what you want. 
    - `checkStateVariable`
        - You have access to every state variable here.
    - `checkStatement`
        - Here you have access to every statement and its parent node.
        - Please note, the coverage isn't 100% yet. For example, there could be a path that's not discovered. For this, more testing is needed. It can be improved, However.
    - `check`
        - Here you have access to every parent node. This is usually used for any generic case as a fallback.
    - `checkImports` (optional)
        - You can access the imports array of the contract
- All functions above receive `filePath` and `contractNode` as params except `checkImports`.
- In `src/detectors/index.js`, add your new detector to the exported detectors.
- Congrats! Now you can go on writing the functionality of the detector.

## How a detector submits an issue?
- Each function the detector exports, should return an array of detection result
- A result item is a JSON object:
```javascript
{
    id: 'UNIQUE ID OF THE ISSUE', // e.g. LOW-233
    loc: { // Line numbers of the issue
        start: { line: LINE_NUMBER_HERE, column: COL_NUMBER_HERE },
        end: { line: LINE_NUMBER_HERE, column: COL_NUMBER_HERE },
    },
    extra: { // optional
        auditToPrint: "Additional text to be printed on top of the issue's instance"
    }
}
```
- To add the issue description:
    - Add the following object to one of the json files under `src/issues/*`
    ```javascript
        {
            "id":"UNIQUE ID OF THE ISSUE", // e.g. LOW-233
            "type":"L", // gas => GAS, Low => L, Medium => M, NC => NC
            "title":"Issue title",
            "description" : "Issue description"
        }
    ```
    - For example, if the issue is low, add it under `src/issues/low`
    - The analyzer will map each issue submitted by a detector to the issues described under `src/issues` directory. If a detector submits an issue with an ID that doesn't exist under `src/issues`, then it won't be shown in the final report.

Note: most of the issues descriptions are copied from public reports 

## Can I change the report template/format?
Yes, the report template is `src/template/report.md`. 
You can adjust it according to your requirements. It uses mustache template system.
To understand how mustache works, check:
- https://mustache.github.io/
- https://github.com/janl/mustache.js


## How to track your new added issues
- Run `npm run stats`, you should get an output as the following:
```sh
-------Stats-------
{ NC: 52, GAS: 16, LOW: 26, MED: 3 }
-------Total-------
97
```
This is useful when issues number grows, this way you can track the total always.


## Testing
- Under `src/testfiles` directory, there are 4 files, each represents a severity type/level (e.g. low.sol).
- You can add test cases for the new detected issues that you add to the bot. This is useful to confirm no bugs introduced that impact existing detectors. For example, non-matched IDs or code refactoring ...etc.
- Run `npm test`, you should get an output as the following:

```sh
----------TEST RESULT----------
0 DISCOVERED MED:

--------------------
3 UNDISCOVERED MED:
M-01 | M-02 | M-06
--------------------

3 DISCOVERED LOW:
L-002 | L-005 | L-006
--------------------
23 UNDISCOVERED LOW:
L-007 | L-008 | L-009 | L-010 | L-012 | L-013 | L-014 | L-015 | L-016 | L-017 | L-018 | L-019 | L-020 | L-021 | L-022 | L-023 | L-02 | L-03 | L-04 | L-05 | L-06 | L-07 | L-08
--------------------

1 DISCOVERED NC:
N-22
--------------------
51 UNDISCOVERED NC:
N-01 | N-02 | N-03 | N-05 | N-06 | N-10 | N-12 | N-14 | N-04 | N-07 | N-08 | N-09 | N-11 | N-13 | N-26 | N-15 | N-16 | N-17 | N-19 | N-20 | N-23 | N-24 | N-25 | N-27 | N-28 | N-29 | N-30 | N-31 | N-32 | N-33 | N-34 | N-35 | N-36 | N-37 | N-38 | N-39 | N-40 | N-41 | N-42 | N-43 | N-44 | N-45 | N-46 | N-47 | N-48 | N-49 | N-50 | N-51 | N-52 | N-53 | N-54
--------------------

1 DISCOVERED GAS:
GAS-12
--------------------
15 UNDISCOVERED GAS:
GAS-02 | GAS-11 | GAS-18 | GAS-16 | GAS-22 | GAS-24 | GAS-17 | GAS-19 | GAS-23 | GAS-04 | GAS-14 | GAS-05 | GAS-004 | GAS-002 | GAS-001
--------------------
```

As you can see, the testing will show you the missing issues.

## Authors
[Koolex](https://twitter.com/KoolexC), [Evokid](https://twitter.com/evokidSoc)

***If you feel this was helpful to you, please feel free to share it on X (Twitter) tagging Koolex and evokidSoc***
 
Note: There are areas where the analayzer can still be improved especially the accuracy of some issues reported. Feel free to do so!
