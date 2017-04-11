const Fs        = require('fs')
const Path      = require('path')
const Log       = require('./lib/logging');

var GITHUB_TOKEN    = process.env['GITHUB_TOKEN'];
var SLACK_BOT_TOKEN = process.env['SLACK_TOKEN'];
var CONFIG_PATH     = process.env['CONFIG_PATH'] || './';
var regex			= new RegExp(process.env['REPOS_REGEX'] || '.*');
var interval		= parseFloat(process.env['INTERVAL']) || 2;
var organization    = process.env['ORGANIZATION'];

var slackGithubUsersMappings = JSON.parse(Fs.readFileSync(Path.join(CONFIG_PATH, 'mappings.json')));

const Github   = new (require('./lib/github'))({
	token: GITHUB_TOKEN,
	regex: regex,
	organization: organization
}, Log)

const Slack    = new(require('./lib/slack'))({
	token: SLACK_BOT_TOKEN,
	mappings: slackGithubUsersMappings
}, Log)



function pollAndNotify(){
	Log.info("Interval ", interval)
	Github.getAllPending(function(err, pendings){
		if(err)
			log.Error("Error ", err);
		else{
			Object.keys(pendings).map(function(a){
				Slack.notify(a, pendings[a], function(err, done){});
			});

			setTimeout(pollAndNotify, interval * 60 * 60 * 1000);
		}
	});
}

pollAndNotify()
