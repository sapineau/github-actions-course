// Declare github action library
const core = require('@actions/core');
const exec = require('@actions/exec');
 
const validateBranchName = ({ branchName }) =>
  /^[a-zA-Z0-9_\-\.\/]+$/.test(branchName);
const validateDirectoryName = ({ dirName }) =>
  /^[a-zA-Z0-9_\-\/]+$/.test(dirName);

// Declare function where ou github action will be written
// Please write an async function
async function run() { 
  core.info('Start js-dependancy-update action');

  // base branch is not mandatory
  const baseBranch = core.getInput('base-branch', { required: false });
  if(!validateBranchName(baseBranch) && baseBranch != ''){
    core.setFailed('Invalid base-branch name. Branch names should include only characters, numbers, hyphens, underscores, dots, and forward slashes.');
    return;
  }

  // target branch is not mandatory
  const targetBranch = core.getInput('target-branch', { required: false });
  if(!validateBranchName(targetBranch) && braseBranch != ''){
    core.setFailed('Invalid target-branch name. Branch names should include only characters, numbers, hyphens, underscores, dots, and forward slashes.');
    return;
  }

  // working dir is mandatory
  const workingDir = core.getInput('working-directory', { required: true });
  if(!validateDirectoryName(workingDir)){
    core.setFailed('Invalid working directory name. Directory names should include only characters, numbers, hyphens, underscores, and forward slashes.');
    return;
  }

  // gh token
  const ghToken = core.getInput('gh-token', { required: true });
  // make gh-token as a secret for security reason
  core.setSecret(ghToken);

  // debug
  const debug = core.getBooleanInput('debug');

  // Show variables
  core.info(`[js-dependency-update] : base branch is '${baseBranch}'`);
  core.info(`[js-dependency-update] : target branch is '${targetBranch}'`);
  core.info(`[js-dependency-update] : working directory is '${workingDir}'`);

  // Execute the npm update command within the working directory
  await exec.exec('npm update', [], {
    cwd: workingDir,
  });

  // Check whether there are modified package*.json files
  const gitStatus = await exec.getExecOutput(
    'git status -s package*.json',
    [],
    {
      cwd: workingDir,
    }
  );

  if(gitStatus.stdout.length > 0){
    core.info('[js-dependency-update] : There are updates available!');
  } else {
    core.info('[js-dependency-update] : No updates at this point in time.');
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