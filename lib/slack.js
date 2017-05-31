var slack = module.exports = function(options, log){
    this.token    = options.token;
    this.mappings = options.mappings;
    this.client   = new (require('@slack/client').WebClient)(this.token);
    this.log      = log;
}


slack.prototype = {
    notify: function(username, pullRequests, callback){
        var self = this;
        var message = "You've been asked to review the following PRs." +
            "Review them or I'll keep bothering you about it." +
            "\n PRs pending your review: \n";

        message += pullRequests.map(function(a){
            return [
                ['\tTitle', a.title],
                ['\tCreated at', a.created_at],
                ['\tAuthor', a.user.login],
                ['\tLink', a.html_url]
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
    sendMsg: function(username, message) {
        var self = this;

        slackUserName = this.getSlackNameFromMappings.call(this, username);

        this.client.chat.postMessage(slackUserName, message, {
            as_user: true
        }, function(err, res){
            if(err) {
                self.log.error("Could not send notification to user ", username, err);
            }
        });
    },    
    getSlackNameFromMappings: function(username){
        return this.mappings[username] || null;
    }
}
