const config = require('./pcAppConfig');
const autoUpdater = require('./autoUpdater.js');

const electron = require('electron');

const app = electron.app;

// Module to create native browaer window.
const BrowserWindow = electron.BrowserWindow;


// Module systemPreferences
//const systemPreferences = electron.systemPreferences;

// Module shell
const shell = electron.shell;

const path = require('path');
const url  = require('url');

let win;

function createWindow() {

  //检查更新
  // autoUpdater.startupEventHandle();
  // autoUpdater.updateHandle();

  autoUpdater();

  let browserOptions = {
    width: 1500,
    height: 900,
    backgroundColor: '#EFF3F4',
    webPreferences: {
      nodeIntegration: false
    } 
  }

  // 如果系统支持透明窗口则应用
  // if ( process.platform !== 'win32' || systemPreferences.isAeroGlassEnabled() ) {
  //   browserOptions.transparent = true
  //   browserOptions.frame = false
  // }

  // Create the browser window
  win = new BrowserWindow(browserOptions);
  win.maximize();
  win.setTitle(config.app_title);

  // Load the index.html
  win.loadURL(url.format({
    pathname: path.join(__dirname, './s/webtrade/login.html'),
    protocol: 'file',
    slashes: true
  }));

  // 打开开打者工具
  // win.webContents.openDevTools();

  win.webContents.on('new-window', (event, url) => {
    // 如果是入金页面 用默认浏览器打开;
    event.preventDefault();
    if ( url.indexOf('guide') !== -1 ) {
      var open_url = config.deposit_url;
      shell.openExternal(open_url);
    }
    // const newWin = new BrowserWindow({show: false});
    // newWin.once('ready-to-show', () => win.show());
    // newWin.loadURL('w.index.html')
    // event.newGuest = newWin;
  })

  // Emitted when the window is closed.
  win.on('closed', function() {
    win = null;
  });
}

app.on('ready', createWindow);

// close native
app.on('window-all-closed', function() {
  if( process.platform !== 'darwin' ) {
    app.quit();
  }
});

// Quit when all windows are closed.
app.on('activate', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
   
  if ( win === null ) {
    createWindow();
  }
})

