var slack = module.exports = function(options, log){
  this.token               = options.token;
  this.individual_mappings = options.mappings.individual_mappings;
  this.channel_mappings    = options.mappings.channels || {};
  this.client              = new (require('@slack/client').WebClient)(this.token);
  this.log                 = log;
}


slack.prototype = {
  notify: function(recipient, message, callback) {
    var self = this;
    this.client.chat.postMessage(recipient, message, {
      as_user: true
    }, function(err, res){
      if(err)
        self.log.error("Could not send notification to recipient ", recipient, err);
      return callback(err, {success: (err ? false : true)});
    });
  },
  notify_individual: function(username, pullRequests, callback){
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

    this.notify(slackUserName, message, function(err, data){
      return callback(arguments)
    })
  },
  notify_channels: function(pullRequests, callback){
    var self = this;
    Object.keys(this.channel_mappings).map(function(channel){


      var channel_regex = new RegExp(self.channel_mappings[channel]);
      var channelPulls = Object.keys(pullRequests).filter(function(a){
        return channel_regex.test(pullRequests[a].pullRequest.base.repo.full_name);
      }).map(function(a){return pullRequests[a]});

      if(!channelPulls.length)
        return;

      var message = "@channel: People late on their pull requests";
      // Remove people we do not know

      channelPulls = channelPulls.map(function(a){
        a.pendingUsers = a.pendingUsers.filter(function(b){
          return self.individual_mappings[b];
        });
        return a;
      }).filter(function(a){return a.pendingUsers.length});
      message += channelPulls.map(function(a){
        return [
          ['\tTitle', a.pullRequest.title],
          ['\tCreated at', a.pullRequest.created_at],
          ['\tby', a.pullRequest.user.login],
          ['\turl', a.pullRequest.html_url],
          ['\tIs pending on', '\n' + a.pendingUsers.map(function(c){return '\t\t' +
            self.individual_mappings[c]}).join('\n')]
        ].map(function(b){return b.join(': ')}).join('\n')
      }).join('\n\n\t######\n\n');
      self.notify(channel, message, function(){})

    });
  },
  getSlackNameFromMappings: function(username){
    return this.individual_mappings[username] || null;
  }
}