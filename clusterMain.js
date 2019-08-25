var cluster = require('cluster');

if (cluster.isMaster) {
    //console.log("hai");
    var cpuCount = require('os').cpus().length;
    for (var i = 0; i < cpuCount; i++) {
        // console.log("process id", process.pid);
        cluster.fork();
    }
    cluster.on('online', function (worker) {
        // console.log('Worker ' + worker.process.pid + ' is online');
    });
    cluster.on('exit', function () {
        cluster.fork();
    });

} else {
    console.log('process id in else', process.pid);
    require('./server');
}