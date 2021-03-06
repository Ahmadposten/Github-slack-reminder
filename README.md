# Github slack reminder

At work you get lot's of review requests everyday that it becomes very hard to keep up with. Idealy you would check your mail every now and then, check github notifications etc. and it usually ends with someone spamming you on slack or coming to your disk asking for the review.

This little application monitors github repos for new pull requests and sends reminders periodically with an aggregation of the pull requests assigned to every person.

It also supports using social pressure by sending reports to specific channels listing the pull requests and people late on their reviews.

## Installation and usage
```
git clone https://github.com/Ahmadposten/Github-slack-reminder.git
cd Github-slack-reminder
npm install
node index
```

## Configurable parameters
parameters are configured via environment variables.

| Environment variable                               | Description                                                                                    | Possible values      |
| ---------------------------------------------------| ---------------------------------------------------------------------------------------------- | -------------------- |
| GITHUB_TOKEN <span style="color:red">\*</span>      | The github token (required)                                                                    | String               |
| SLACK_TOKEN <span style="color:red">\*</span>       | Slack token for a bot you have (required)                                                      | String               |
| Interval                                           | The interval between to reminders in hours, defaults to 2                                      | Double               |
| REPOS_REGEX                                        | Regex expression to watch only repos that match this expression      dafaults to `*`           | String               |
| ORGANIZATIONS                                      | A comma seperated strings of organizations you want to watch         defaults to empty string  | String               |
| PERSONAL                                           | Whether to watch personal repos                                       defaults to false        | Boolean              |
| CONFIG_PATH                                        | The folder containing the configuration files such as mappings.json defaults to ./             | String               |
| WORK_START                                        | Sets a custom work starting time, bot will not be active before this (ex: 8 = 8AM) defaults to 9             | Integer               |
| WORK_END                                        | Sets a custom work end time, bot will not be active before this (ex: 18 = 6PM) defaults to 17             | Integer               |



### Mappings file
You will need a mapping.json file which contains mappings between github usernames and slack usernames as well as channels to their watched repos (regex matching). The file location is specified in the `CONFIG_PATH` environment variable
or by default in the root directory of the project.

example mapping.json


```json
{
  "individual_mappings": {
    "john1": "@john",
    "marry": "@maria"
  },
  "channels": {
    "#ios-team": ".*ios.*"
  }
}
```
where the key is the github username and the value is the slack username with a `@`. It can also be a channel if you replace the `@` by a `#`

if a user is not specified in the mappings then he/she is ignored from reminders.

