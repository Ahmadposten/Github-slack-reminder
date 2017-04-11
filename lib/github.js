var async = require('async');
var http  = require('https');

var github = module.exports = function(options, log){
	this.token   = options.token;
	this.regex   = options.regex;
	this.log     = log;
	this.baseUrl = 'api.github.com';
	this.organization = options.organization;
}

github.prototype = {
	getRepos: function(callback){
		var self = this;
		var url = ['', 'orgs', this.organization, 'repos'].join('/');
		self.callGithubApi(url, false, function(err, response){
			if(err)
				return callback(err, null);
			var filteredRepos = response.filter(function(repo){
				return self.regex.test(repo.name);
			})

			return callback(null, filteredRepos);
		});
	},
	getAllPending: function(callback){
		var self = this;
		self.getRepos(function(err, repos){
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
				self.getPendingRequestedReviewers(repo, pullreq.number, function(err, pending){
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
	getPendingRequestedReviewers: function(repo, requestNumber, callback){
		var self = this;
		this.getReviews(repo, requestNumber, function(err, reviews){
			var url = ['', 'repos', repo.full_name, 'pulls',
				requestNumber, 'requested_reviewers'].join('/');
			self.callGithubApi(url, true, function(err, requested_reviewers){
				if(err)
					return callback(err, null);

				pendingReviewers = [];
				requested_reviewers.map(function(a){
					if(reviews.filter(function(b){ return b.user.login == a.login}) == 0){
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
