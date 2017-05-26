var slack = module.exports = function(options, log){
    this.token    = options.token;
    this.mappings = options.mappings;
    this.client   = new (require('@slack/client').WebClient)(this.token);
    this.log      = log;
}


slack.prototype = {
    notify: function(username, pullRequests, callback){
        var self = this;
        var message = "This is a reminder of your pending pull requests ... " +
            "please review them .. I am annoying and the only way to stop me " +
            "is to review them ... I'll come again if you don't !!! \n Pull reqs: \n";

        message += pullRequests.map(function(a){
            return [
                ['\tTitle', a.title],
                ['\tCreated at', a.created_at],
                ['\tby', a.user.login],
                ['\turl', a.html_url]
            ].map(function(b){return b.join(': ')}).join('\n');
        }).join('\n\n\t######\n\n');
        slackUserName = this.getSlackNameFromMappings.call(this, username);

        if(!slackUserName){
            this.log.error('Could not get slack of this user', username)
            return callback({Message: "could not find user"}, {success: false})
        }

        this.client.chat.postMessage(slackUserName, message, {
            as_user: true
        }, function(err, res){
            if(err)
                self.log.error("Could not send notification to user ", username, err);
            return callback(err, {success: (err ? false : true)});
        });
    },
    getSlackNameFromMappings: function(username){
        return this.mappings[username] || null;
    }
}
