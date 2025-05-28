// Declare github action library
const core = require('@actions/core');
const core = require('@actions/exec');
 
// Declare function where ou github action will be written
// Please write an async function
async function run() { 
  core.info('Start js-dependancy-update action');

  //regex
  var regexAlphaNumericWithDot = new RegExp("^[0-9a-z_-./]+$", "i");
  var regexAlphaNumeric = new RegExp("^[0-9a-z_-/]+$", "i");
  var regexAnyCharacter = new RegExp("^.+^$")

  // Parse input
  const braseBranch = core.getInput('base-branch', { required: false });
  if(!regexAlphaNumericWithDot.text(braseBranch)){
    core.setFailed('braseBranch contains forbidden caracters');
    return;
  } else {
    core.info('braseBranch: {0}', braseBranch);
  }

  const targetBranch = core.getInput('target-branch', { required: false });
  if(!regexAlphaNumericWithDot.text(targetBranch)){
    core.setFailed('targetBranch contains forbidden caracters');
    return;
  } else {
    core.info('targetBranch: {0}', targetBranch);
  }

  const workingDir = core.getInput('working-directory', { required: true });
  if(!regexAlphaNumeric.text(workingDir)){
    core.setFailed('workingDir contains forbidden caracters');
    return;
  } else {
    core.info('workingDir: {0}', workingDir);
  }

  const ghToken = core.getInput('gh-token', { required: true });
  core.info('ghToken: {0}', ghToken);

  // Execute the npm update command within the working directory
  exec.exec('cd {0}', workingDir);
  var npmUpdateOut = exec.getExecOutput('npm update');
  core.info('npm update: {0}', npmUpdateOut)

  // Check whether there are modified package*.json files
  var getStatusOut = exec.getExecOutput('git status -s package*.json');
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

  core.info('I am a custom JS action');
}
 
// Call of this function
run();