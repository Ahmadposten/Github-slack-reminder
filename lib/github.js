var async = require('async');
var http  = require('https');

var github = module.exports = function(options, log){
    this.token         = options.token;
    this.regex         = options.regex;
    this.log           = log;
    this.baseUrl       = 'api.github.com';
    this.mappings      = options.mappings;    
    this.organizations = options.organizations;
    this.personal      = options.personal;
}

github.prototype = {
    getAllRepos: function(callback){
        var self = this;
        var repos = [];

        function getRepos(personal, organization, cb){
            var url;
            if(personal)
                url = '/user/repos';
            else
                url = ['', 'orgs', organization, 'repos'].join('/');

            self.callGithubApi(url, false, function(err, response){
                if(err)
                    return cb(err, null);
                var filteredRepos = response.filter(function(repo){
                    return self.regex.test(repo.name);
                })

                return cb(null, filteredRepos);
            });
        }
        function getUnique(arr, k){
            var lookup = {};
            return arr.filter(function(a){
                if(!lookup[a[k]]){
                    lookup[a[k]] = true;
                    return true;
                }
                return false;
            });
        }
        async.each(self.organizations, function(organization, cb){
            getRepos(false, organization, function(err, organizationRepos){
                if(err)
                    return cb(err);
                repos = repos.concat(organizationRepos);
                return cb();
            });
        }, function done(err){
            if(err)
                return callback(err, null);
            // If specified get personal repos
            if(self.personal)
                getRepos(true, null, function(err, personalRepos){
                    if(err)
                        return callback(err, repos);

                    repos = getUnique(repos.concat(personalRepos), "full_name");

                    return callback(null, repos);
                })
            else
                return callback(null, getUnique(repos, "full_name"));
        });
    },
    getAllPending: function(callback){
        var self = this;
        self.getAllRepos(function(err, repos){
            if(err)
                return callback(err, null);
            pendingUsersRequests = {};
            async.each(repos, function(repo, cb){
                self.getPullRequests(repo, function(err, pullReqs){
                    if(err)
                        return cb(err);
                    pullReqs.map(function(a){
                        a.pendingReviews.map(function(b){
                            if(pendingUsersRequests[b]){
                                pendingUsersRequests[b].push(a);
                            }else{
                                pendingUsersRequests[b] = [a];
                            }
                        })
                    });
                    return cb();
                })
            }, function done(err){
                return callback(err, pendingUsersRequests);
            })
        })
    },
    getPullRequests: function(repo, callback){
        var url = ['', 'repos', repo.full_name, 'pulls'].join('/');

        var self = this;
        this.callGithubApi(url, false, function(err, pullReqs){
            if(err)
                return callback(err, null);
            async.each(pullReqs, function(pullreq, cb){
                self.getPendingRequestedReviewers(repo, pullreq, function(err, pending){
                    if(err)
                        return cb(err);
                    pullreq.pendingReviews = pending;
                    cb();
                });
            }, function done(err){
                return callback(err, pullReqs);
            })
        })
    },
    getReviews: function(repo, requestNumber, callback){
        var url = ['', 'repos', repo.full_name, 'pulls',
            requestNumber, 'reviews'].join('/');
        this.callGithubApi(url, true, function(err, reviews){
            return callback(err, reviews);
        });
    },
    getPendingRequestedReviewers: function(repo, pullRequest, callback){
        var self = this;
        this.getReviews(repo, pullRequest.number, function(err, reviews){
            var url = ['', 'repos', repo.full_name, 'pulls',
                pullRequest.number, 'requested_reviewers'].join('/');
            self.callGithubApi(url, true, function(err, requested_reviewers){
                if(err)
                    return callback(err, null);

                pendingReviewers = [];
                // Add those who did review while not requested
                reviews.map(function(a){
                    if(a.user.login == pullRequest.user.login)
                        return;

                    if(requested_reviewers.filter(function(b){return b.login == a.user.login}).length == 0)
                        requested_reviewers.push({
                            login: a.user.login
                        })
                })



                requested_reviewers.map(function(a){
                    var userReviews = reviews.filter(function(b){
                        if(b.user.login != a.login)
                            return false;


                        if(b.state == "APPROVED")
                            return true;

                        if(b.submitted_at < pullRequest.updated_at)
                            return false;

                        return true;
                    })
                    if(userReviews.length == 0){
                        pendingReviewers.push(a.login);
                    }
                });
                return callback(null, pendingReviewers);
            })
        })
    },
    callGithubApi: function(url, isPreview, callback){
        var self = this;
        var headers = {
            'Authorization': 'token ' + self.token,
            'user-agent': 'Mozilla/5.0'
        }
        if(isPreview){
            headers['Accept'] ='application/vnd.github.black-cat-preview+json';
        }

        var reqobj = {
            host: this.baseUrl,
            path: url,
            method: 'GET',
            headers: headers
        };

        var response = '';
        var req = http.request(reqobj, function(res){

            res.on('error', function(err){
                self.log.error(err);
                return callback(err, null);
            });
            res.on('data', function(result){
                response += result;
            });
            res.on('end', function(){
                return callback(null, JSON.parse(response));
            });
        });
        req.end();

    }
}
