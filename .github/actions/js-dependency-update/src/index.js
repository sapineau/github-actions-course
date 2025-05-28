// Declare github action library
const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');
 
const validateBranchName = ({ branchName }) =>
  /^[a-zA-Z0-9_\-\.\/]+$/.test(branchName);
const validateDirectoryName = ({ dirName }) =>
  /^[a-zA-Z0-9_\-\/]+$/.test(dirName);

const addLog = (msg) =>
  `[js-dependency-update] : ${msg}`;
const logInfo = (msg) =>
  core.info(addLog(msg));
const logError = (msg) =>
  core.error(addLog(msg));
const setFailed = (msg) =>
  core.setFailed(addLog(msg));

// Declare function where ou github action will be written
// Please write an async function
async function run() { 
  logInfo('Start js-dependancy-update action');

  // base branch is mandatory
  const baseBranch = core.getInput('base-branch', { required: true });
  if(!validateBranchName(baseBranch)){
    setFailed('Invalid base-branch name. Branch names should include only characters, numbers, hyphens, underscores, dots, and forward slashes.');
    return;
  }

  // target branch is mandatory
  const targetBranch = core.getInput('target-branch', { required: true });
  if(!validateBranchName(targetBranch)){
    setFailed('Invalid target-branch name. Branch names should include only characters, numbers, hyphens, underscores, dots, and forward slashes.');
    return;
  }

  // working dir is mandatory
  const workingDir = core.getInput('working-directory', { required: true });
  if(!validateDirectoryName(workingDir)){
    setFailed('Invalid working directory name. Directory names should include only characters, numbers, hyphens, underscores, and forward slashes.');
    return;
  }

  // gh token is mandatory
  const ghToken = core.getInput('gh-token', { required: true });
  // make gh-token as a secret for security reason
  core.setSecret(ghToken);
  // use token
  const octokit = github.getOctokit(ghToken);

  // debug
  const debug = core.getBooleanInput('debug');

  // Show variables
  logInfo(`base branch is '${baseBranch}'`);
  logInfo(`target branch is '${targetBranch}'`);
  logInfo(`working directory is '${workingDir}'`);

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
    logInfo('There are updates available!');

    await exec.exec(`git switch -c ${targetBranch}`, [], {
      cwd: workingDir,
    });

    await exec.exec('git add .', [], {
      cwd: workingDir,
    });

    const commitLog = addLog('Update NPM dependencies');
    await exec.exec(`git commit -m "${commitLog}"`, [], {
      cwd: workingDir,
    });

    await exec.exec(`git push  -u origin ${targetBranch}`, [], {
      cwd: workingDir,
    });

    try {
      await octokit.rest.pulls.create({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        title: `Update NPM dependencies`,
        body: `This pull request updates NPM packages`,
        base: baseBranch,
        head: targetBranch 
      });
    } catch (e) {
      logError('Something went wrong while creating the PR. Check logs below.');
      setFailed(e.message);
      logError(e);
    }
  } else {
    logInfo('No updates at this point in time.');
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