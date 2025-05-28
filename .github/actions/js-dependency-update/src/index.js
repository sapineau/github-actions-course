// Declare github action library
const core = require('@actions/core');
const exec = require('@actions/exec');
 
// Declare function where ou github action will be written
// Please write an async function
async function run() { 
  core.info('Start js-dependancy-update action');

  //regex
  var regexAlphaNumericWithDot = new RegExp("^[0-9a-z_\\-\\./]+$", "i");
  var regexAlphaNumeric = new RegExp("^[0-9a-z_\\-/]+$", "i");
  var regexAnyCharacter = new RegExp("^.+^$")

  // base branch is not mandatory
  const braseBranch = core.getInput('base-branch', { required: false });
  if(!regexAlphaNumericWithDot.test(braseBranch) && braseBranch != ''){
    core.setFailed('braseBranch contains forbidden caracters');
    return;
  } else {
    core.info('braseBranch: ' + braseBranch);
  }

  // target branch is not mandatory
  const targetBranch = core.getInput('target-branch', { required: false });
  if(!regexAlphaNumericWithDot.test(targetBranch) && braseBranch != ''){
    core.setFailed('targetBranch contains forbidden caracters');
    return;
  } else {
    core.info('targetBranch: ' + targetBranch);
  }

  // working dir is mandatory
  const workingDir = core.getInput('working-directory', { required: true });
  if(!regexAlphaNumeric.test(workingDir)){
    core.setFailed('workingDir contains forbidden caracters');
    return;
  } else {
    core.info('workingDir: ' + workingDir);
  }

  const ghToken = core.getInput('gh-token', { required: true });
  core.info('ghToken: ' + ghToken);

  // Execute the npm update command within the working directory
  core.info('Go to ' + workingDir)
  await exec.exec('cd ' + workingDir);
  const { npmUpdateOut } = await exec.getExecOutput('npm update');
  core.info('npm update: ' + npmUpdateOut)

  // Check whether there are modified package*.json files
  const { getStatusOut } = await exec.getExecOutput('git status -s package*.json');
  if(regexAnyCharacter.test(getStatusOut)){
    core.info('=> Some update available')
  } else {
    core.info('=> No update available')
  }
  

  /*
  1. Parse input
    1.1 base-branch from which to check for updates
    1.2 target-branch to use to create the PR
    1.3 Github Token for authentication purposes (to create the PRs)
    1.4 Working directory for which to check for dependancies
  2. Execute the npm update command within the working directory
  3. Check whether there are modified package*.json files
  4. If there are modified file:
    4.1 Add and commit files to the target-branch
    4.2 Create a PR to the base-branch using the octokit API (github)
  5. Otherwise, conclude the custom action
  */
}
 
// Call of this function
run();