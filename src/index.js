var awsCli = require('aws-cli-js');
var Options = awsCli.Options;
var Aws = awsCli.Aws;

var options = new Options(
    process.env.ACCESS_KEY,         /* accessKey    */ 
    process.env.SECRET_KEY,         /* secretKey    */ 
    null,                           /* sessionToken */ 
    null,                           /* currentWorkingDirectory */ 
    'aws'                           /* cliPath */ 
);

var aws = new Aws(options);

aws.command('ec2 describe-images').then(function (data) {
    console.log('data = ', data);
}).catch((e) => {
    console.log(e)
});