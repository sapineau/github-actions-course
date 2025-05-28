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

  // debug
  const debug = core.getBooleanInput('debug');

  // Show variables
  logInfo(`base branch is '${baseBranch}'`);
  logInfo(`target branch is '${targetBranch}'`);
  logInfo(`working directory is '${workingDir}'`);

  const commonExecOptions = {
    cwd: workingDir,
  };

  // Execute the npm update command within the working directory
  await exec.exec('npm update', [], {
    cwd: workingDir,
  });

  // Check whether there are modified package*.json files
  const gitStatus = await exec.getExecOutput(
    'git status -s package*.json', [], {
      ...commonExecOptions
    }
  );

  if(gitStatus.stdout.length > 0){
    logInfo('There are updates available!');

    // Mandatory or we cannot commit our modifications
    await exec.exec(`git config --global user.name "gh-automation"`);
    await exec.exec(`git config --global user.email "gh-automation@email.com"`);

    await exec.exec(`git checkout -b ${targetBranch}`, [], {
      ...commonExecOptions
    });

    //protect add here (instead of 'git add .')
    await exec.exec('git add package.json package-lock.json', [], {
      ...commonExecOptions
    });

    const commitLog = addLog('chore: Update NPM dependencies');
    await exec.exec(`git commit -m "${commitLog}"`, [], {
      ...commonExecOptions
    });

    await exec.exec(`git push -u origin ${targetBranch}`, [], {
      ...commonExecOptions
    });

    const octokit = github.getOctokit(ghToken);

    try {
      // create pull request from rest api.
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
}

// Call of this function
run();