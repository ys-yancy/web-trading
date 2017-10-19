const config = require('./pcAppConfig');
const electron = require('electron')
const http = require('http');

//自动更新
const autoUpdater = electron.autoUpdater;

const ipc = electron.ipcMain;

const dialog = electron.dialog;

const shell = electron.shell;

function startupEventHandle(){
  if(require('electron-squirrel-startup')) return;
  var handleStartupEvent = function () {
    if (process.platform !== 'win32') {
      return false;
    }
    var squirrelCommand = process.argv[1];
    switch (squirrelCommand) {
      case '--squirrel-install':
      case '--squirrel-updated':
        install();
        return true;
      case '--squirrel-uninstall':
        uninstall();
        app.quit();
        return true;
      case '--squirrel-obsolete':
        app.quit();
        return true;
    }
      // 安装
    function install() {
      var cp = require('child_process');    
      var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
      var target = path.basename(process.execPath);
      var child = cp.spawn(updateDotExe, ["--createShortcut", target], { detached: true });
      child.on('close', function(code) {
          app.quit();
      });
    }
    // 卸载
    function uninstall() {
      var cp = require('child_process');    
      var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
      var target = path.basename(process.execPath);
      var child = cp.spawn(updateDotExe, ["--removeShortcut", target], { detached: true });
      child.on('close', function(code) {
          app.quit();
      });
    }
  };
  if (handleStartupEvent()) {
    return ;
  }
}
function updateHandle(){
  ipc.on('check-for-update', function(event, arg) {
    let appName='';
    let appIcon=__dirname + './favicon.ico';
    let message={
      error:'检查更新出错',
      checking:'正在检查更新……',
      updateAva:'下载更新成功',
      updateNotAva:'现在使用的就是最新版本，不用更新',
      downloaded:'最新版本已下载，将在重启程序后更新'
    };
    const os = require('os');
    const {dialog} = require('electron');
    // autoUpdater.setFeedURL('放最新版本文件的文件夹的服务器地址');
    autoUpdater.on('error', function(error){
      return dialog.showMessageBox(mainWindow, {
          type: 'info',
          icon: appIcon,
          buttons: ['OK'],
          title: appName,
          message: message.error,
          detail: '\r'+error
      });
    })
    .on('checking-for-update', function(e) {
        return dialog.showMessageBox(mainWindow, {
          type: 'info',
          icon: appIcon,
          buttons: ['OK'],
          title: appName,
          message: message.checking
      });
    })
    .on('update-available', function(e) {
        var downloadConfirmation = dialog.showMessageBox(mainWindow, {
            type: 'info',
            icon: appIcon,
            buttons: ['OK'],
            title: appName,
            message: message.updateAva
        });
        if (downloadConfirmation === 0) {
            return;
        }
    })
    .on('update-not-available', function(e) {
        return dialog.showMessageBox(mainWindow, {
            type: 'info',
            icon: appIcon,
            buttons: ['OK'],
            title: appName,
            message: message.updateNotAva
        });
    })
    .on('update-downloaded',  function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
        var index = dialog.showMessageBox(mainWindow, {
            type: 'info',
            icon: appIcon,
            buttons: ['现在重启','稍后重启'],
            title: appName,
            message: message.downloaded,
            detail: releaseName + "\n\n" + releaseNotes
        });
        if (index === 1) return;
        autoUpdater.quitAndInstall();
    });
    autoUpdater.checkForUpdates();
 });
}

function checkVersion() {
  (function(){　　　　　　　　　
    var options={  
      host: config.update_url,       
      path: config.update_path, 
      // port: config.port,
      method:'get'          
    }  

    var sendmsg='', req;

    req = http.request(options, function(req) {

      req.on("data", function(chunk) {
        sendmsg += chunk;
        console.log(sendmsg)
      });   

      req.on("end", function(d) {
        if ( data && data.status == 200 ) {
          var data = JSON.parse(sendmsg);
          data = data.data;
          checkUpdate(data.pc);
        }
      }); 
 
    });
    req.end();

    function checkUpdate(ver) {
      if ( ver && ver.version ) {
        var cur_version = ver.version;
        var downloaded_url = ver.update_url;
        if ( cur_version != config.version ) {
          goUpdateUrl(downloaded_url)
        }
      }
    }

    function goUpdateUrl(open_url) {
      open_url = open_url || config.download_url;
      setTimeout(() => {
        dialog.showMessageBox({
          title: '更新',
          buttons: [],
          message: '有新版本，前往下载！'
        }, (index) => {
          shell.openExternal(open_url);
        })
      }, 2000);
    }

 })()

}

module.exports = checkVersion;

// module.exports = {
//   startupEventHandle,
//   updateHandle
// }