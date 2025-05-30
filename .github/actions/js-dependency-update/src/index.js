// Declare github action library
const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');
 
// ### REGEX ###
const validateBranchName = ({ branchName }) =>
  /^[a-zA-Z0-9_\-\.\/]+$/.test(branchName);
const validateDirectoryName = ({ dirName }) =>
  /^[a-zA-Z0-9_\-\/]+$/.test(dirName);

// ### LOGS ###
const addLog = (msg) =>
  `[js-dependency-update] : ${msg}`;
const setLogger = ({debug} = {debug: false}) => ({
  debug: (message) => {
    if(debug) {
      core.info(`DEBUG: ${addLog(message)}`)
      // can extained the logging to other logger
    }
  },
  info: (message) => {
    core.info(addLog(message));
    // can extained the logging to other logger
  },
  error: (message) => {
    core.error(addLog(message));
    // can extained the logging to other logger
  }
});

// ### GITS FUNCTIONS ###
const setupGit = async () => {
  await exec.exec(`git config --global user.name "gh-automation"`);
  await exec.exec(`git config --global user.email "gh-automation@email.com"`);
}

// ### MAIN FUNCTION ###
// Declare function where ou github action will be written
// Please write an async function
async function run() { 
  // ###### debug and logger init ######
  const debug = core.getBooleanInput('debug');
  const logger = setLogger({ debug });
  logger.info('Start js-dependancy-update action');

  // ### INPUTS ###
  // ###### base-branch ######
  const baseBranch = core.getInput('base-branch', { required: true });
  if(!validateBranchName(baseBranch)){
    core.setFailed('Invalid base-branch name. Branch names should include only characters, numbers, hyphens, underscores, dots, and forward slashes.');
    return;
  }

  // ###### target-branch / head-branch ######
  // IDEA: target-branch is used only in v1.
	//       To avoid a v2, we can use a deprecated way:
	//       This input continue to exists, but its value is overrided by headBranch if it is provided
  const targetBranch = core.getInput('target-branch'/*, { required: true }*/);
  // IDEA: head-branch is a new input (normaly v2).
  //       But for compatibilities reason, we keep the old one (target-branch) and use it here if it is not defined
  const headBranch = core.getInput('head-branch'/*, { required: true }*/) || targetBranch;
  if(!validateBranchName(headBranch)){
    core.setFailed('Invalid head-branch name. Branch names should include only characters, numbers, hyphens, underscores, dots, and forward slashes.');
    return;
  }

  // ###### working-directory ######
  const workingDir = core.getInput('working-directory', { required: true });
  if(!validateDirectoryName(workingDir)){
    core.setFailed('Invalid working directory name. Directory names should include only characters, numbers, hyphens, underscores, and forward slashes.');
    return;
  }

  // ###### gh-token ######
  const ghToken = core.getInput('gh-token', { required: true });
  // make gh-token as a secret for security reason
  core.setSecret(ghToken);

  // ### SHOW VARIABLES ###
  logger.debug(`base branch is '${baseBranch}'`);
  logger.debug(`head branch is '${headBranch}'`);
  logger.debug(`working directory is '${workingDir}'`);

  // ### EXECUTION ###
  const commonExecOptions = {
    cwd: workingDir,
  };

  // Execute the npm update command within the working directory
  await exec.exec('npm update', [], {
    cwd: workingDir,
  });

  // Check whether there are modified package*.json files
  logger.info(`Checking for package updates`);
  const gitStatus = await exec.getExecOutput(
    'git status -s package*.json', [], {
      ...commonExecOptions
    }
  );

  // set output
  core.setOutput('updates-available', gitStatus.stdout.length > 0);

  if(gitStatus.stdout.length > 0){
    logger.info('There are updates available!');

    // Mandatory or we cannot commit our modifications
    logger.debug('Init git commit on package*.json');
    await setupGit();

    await exec.exec(`git checkout -b ${headBranch}`, [], {
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

    // "--force" allow to force push on a already existing branch
    logger.debug(`Push commit to branch ${headBranch}`);
    await exec.exec(`git push -u origin ${headBranch} --force`, [], {
      ...commonExecOptions
    });

    logger.debug(`Fetching octokit API`);
    const octokit = github.getOctokit(ghToken);

    try {
      // create pull request from rest api.
      logger.debug(`Creating PR to branch ${headBranch}`);
      await octokit.rest.pulls.create({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        title: `Update NPM dependencies`,
        body: `This pull request updates NPM packages`,
        base: baseBranch,
        head: headBranch 
      });
    } catch (e) {
      logger.error('Something went wrong while creating the PR. Check logs below.');
      core.setFailed(e.message);
      logger.error(e);
    }
  } else {
    logger.info('No updates at this point in time.');
  }
}

// Call of this function
run();