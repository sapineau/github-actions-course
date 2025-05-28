// Declare github action library
const core = require('@actions/core');
 
// Declare function where ou github action will be written
// Please write an async function
async function run() { 
  core.info('I am a custom JS action');
}
 
// Call of this function
run();