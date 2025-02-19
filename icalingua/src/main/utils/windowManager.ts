import { BrowserWindow, globalShortcut, nativeTheme, shell } from 'electron'
import { clearCurrentRoomUnread, sendOnlineData } from '../ipc/botAndStorage'
import { getConfig } from './configManager'
import getWinUrl from '../../utils/getWinUrl'
import { updateTrayIcon } from './trayManager'
import path from 'path'
import ui from './ui'
import argv from './argv'
import { newIcalinguaWindow } from '../../utils/IcalinguaWindow'

let loginWindow: BrowserWindow, mainWindow: BrowserWindow, requestWindow: BrowserWindow

export const loadMainWindow = () => {
    //start main window
    const winSize = getConfig().winSize
    const theme = getConfig().theme
    const themeColor =
        theme === 'auto'
            ? nativeTheme.shouldUseDarkColors
                ? '#131415'
                : '#fff'
            : theme === 'dark'
            ? '#131415'
            : '#fff'
    mainWindow = newIcalinguaWindow({
        height: winSize.height,
        width: winSize.width,
        show: process.env.NODE_ENV !== 'development' && !argv.hide,
        backgroundColor: themeColor,
        autoHideMenuBar: !getConfig().showAppMenu,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            contextIsolation: false,
        },
    })

    if (loginWindow) loginWindow.destroy()

    mainWindow.on('close', (e) => {
        e.preventDefault()
        ui.chroom(0)
        mainWindow.hide()
        if (process.platform === 'darwin') {
            globalShortcut.unregisterAll()
        }
    })

    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.session.loadExtension(path.join(process.cwd(), 'node_modules/vue-devtools/vender/'))
    }

    setTimeout(
        () =>
            mainWindow.on('focus', async () => {
                clearCurrentRoomUnread()
                await updateTrayIcon()
            }),
        5000,
    )

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return {
            action: 'deny',
        }
    })

    mainWindow.webContents.on('did-finish-load', sendOnlineData)

    return mainWindow.loadURL(getWinUrl() + '#/main')
}
export const showMainWindow = () => {
    if (mainWindow && process.env.NODE_ENV !== 'development' && !argv.hide) {
        mainWindow.show()
        mainWindow.focus()
    }
}
export const refreshMainWindowColor = () => {
    mainWindow.setBackgroundColor(
        getConfig().theme === 'auto'
            ? nativeTheme.shouldUseDarkColors
                ? '#131415'
                : '#fff'
            : getConfig().theme === 'dark'
            ? '#131415'
            : '#fff',
    )
}
export const showLoginWindow = (isConfiguringBridge = false) => {
    if (loginWindow) {
        loginWindow.show()
        loginWindow.focus()
    } else {
        loginWindow = newIcalinguaWindow({
            height: 720,
            width: 450,
            maximizable: false,
            webPreferences: {
                webSecurity: false,
                nodeIntegration: true,
                contextIsolation: false,
            },
        })

        if (process.env.NODE_ENV === 'development') {
            loginWindow.webContents.session.loadExtension(path.join(process.cwd(), 'node_modules/vue-devtools/vender/'))
            loginWindow.minimize()
        }

        return loginWindow.loadURL(getWinUrl() + `#/login?bridge=${isConfiguringBridge}`)
    }
}
export const showRequestWindow = () => {
    if (requestWindow && !requestWindow.isDestroyed()) {
        requestWindow.show()
        requestWindow.focus()
    } else {
        requestWindow = newIcalinguaWindow({
            width: 750,
            height: 600,
            webPreferences: {
                nodeIntegration: true,
                webSecurity: false,
                contextIsolation: false,
            },
            autoHideMenuBar: true,
        })

        if (process.env.NODE_ENV === 'development') {
            requestWindow.webContents.session.loadExtension(
                path.join(process.cwd(), 'node_modules/vue-devtools/vender/'),
            )
        }

        requestWindow.loadURL(getWinUrl() + '#/friendRequest')
    }
}
export const sendToLoginWindow = (channel: string, payload?: any) => {
    if (loginWindow) loginWindow.webContents.send(channel, payload)
    else showLoginWindow().then(() => loginWindow.webContents.send(channel, payload))
}
export const sendToMainWindow = (channel: string, payload?: any) => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload)
}
export const sendToRequestWindow = (channel: string, payload?: any) => {
    if (requestWindow && !requestWindow.isDestroyed()) requestWindow.webContents.send(channel, payload)
}
export const getMainWindow = () => mainWindow
export const showWindow = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show()
        mainWindow.focus()
    } else if (loginWindow && !loginWindow.isDestroyed()) {
        loginWindow.show()
        loginWindow.focus()
    } else if (requestWindow && !requestWindow.isDestroyed()) {
        requestWindow.show()
        requestWindow.focus()
    }
}
export const destroyWindow = () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy()
    if (loginWindow && !loginWindow.isDestroyed()) loginWindow.destroy()
    if (requestWindow && !requestWindow.isDestroyed()) requestWindow.destroy()
}
export const getLoginWindow = () => loginWindow
