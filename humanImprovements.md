# Refactoring code
- What improvements can you make to the design/architecture of your code?
  duplicate videos placed in different files.
  

- How can you split up large methods or classes into smaller components?
  analyzePage.tsx has 366 lines, this can possibly be split up. 
  centroid/engine.ts has 380 lines 

- Are there unused files/methods that can be removed?
  The mock files are no longer being used. The mock folder can be deleted.

- Where would additional Java interfaces be appropriate?
  This repo has no Java. It's a TypeScript/React frontend, and the Java code (the JAR) lives in the backend

- How can you make things simpler, more-usable, and easier to maintain?
  There are two colorSwatch.tsx. One is in color folder and the other in results. They can possibly become one shared component?
  
  Split the larger files into smaller files with one job each .This would make it easier to read.

- Other refactoring improvements?

# Adding tests
- What portions of your code are untested / only lightly tested?
  The hooks have no tests? i'm not sure if they do need tests.

  useFrameAnalysis is unused.

  We need more tests if the real server is down. 

  Some components are tested through cypress only and no unit tests

- Where would be the highest priority places to add new tests?
  AnalyzePage 

- Other testing improvements?
   We need to clean outdated test and tests that were used for the mock backened . We would need to ask out ai agent to search for all unused tests and remove them. 

# Improving error handling
- What parts of your code are brittle?
   AnalyzePage.tsx
   Some paths are hard coded

- Where could you better be using exceptions?
  Im not sure, we have TypeError and RangeError that we used in our code.

- Where can you better add input validation to check invalid input?

- How can you better be resolving/logging/surfacing errors? Hint: almost any place you're using "throws Exception" or "catch(Exception e)" should likely be improved to specify the specific types of exceptions that might be thrown or caught.
Other error handling improvements?

# Writing documentation
- What portions of your code are missing Javadoc/JSdoc for the methods/classes?
- What documentation could be made clearer or improved?
- Are there sections of dead code that are commented out?
- Where would be the most important places to add documentation to make your code easier to read?
- Other documentation improvements?

# Improving performance (optional)
- What parts of your code / tests run particularly slowly?
- What speed improvements would most make running / maintaining your code better?
- Other performance improvements?

# Hardening security (optional)
- What packages / images are out of date / have security issues?
- Where could you have better input validation in your code to prevent malicious use?
- Other security improvements?

# Bug fixes (optional)
- What bugs do you know exist?
- What parts of the code do you think might be causing them?
- Other bug fix improvements?

# Other
- Any other improvements in general you could make?
