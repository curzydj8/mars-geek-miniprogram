// 火星极客小程序知识库 - 构建配置
module.exports = {
  // 数据分片：单个 JSON 文件最多条数（超过自动拆分）
  partSize: 60,
  // 抓取并发数
  concurrency: 10,
  // 重试次数
  retry: 3,

  dos: {
    // 官方文档源：MicrosoftDocs/windowsserverdocs 仓库 markdown
    listUrl: 'https://api.github.com/repos/MicrosoftDocs/windowsserverdocs/contents/WindowsServerDocs/administration/windows-commands',
    rawBase: 'https://raw.githubusercontent.com/MicrosoftDocs/windowsserverdocs/main/WindowsServerDocs/administration/windows-commands/',
    cacheDir: 'cache/dos',
    outDir: 'data/dos',
    // 按命令关键词自动分类
    categories: [
      { name: '文件管理', match: /^(attrib|copy|xcopy|robocopy|move|del|erase|ren|rename|comp|fc|expand|print|type|more|where|replace|forfiles|cipher|takeown|icacls| Cacls)/i },
      { name: '目录管理', match: /^(cd|chdir|md|mkdir|rd|rmdir|dir|tree|pushd|popd|dirstack)/i },
      { name: '磁盘管理', match: /^(chkdsk|chkntfs|convert|defrag|diskpart|format|fsutil|label|mountvol|vol|diskshadow|diskraid|vssadmin|dism)/i },
      { name: '网络管理', match: /^(ipconfig|ping|tracert|tracerpt|netstat|arp|nslookup|nbtstat|netsh|route|ftp|tftp|telnet|bitsadmin|winrm|winrs|mstsc|nltest|pathping)/i },
      { name: '系统管理', match: /^(tasklist|taskkill|shutdown|systeminfo|driverquery|wmic|schtasks|sc |reg |powercfg|bcdedit|bcdboot|bootcfg|driververifier|eventcreate|eventtriggers|logman|openfiles|qprocess|query |quser|msg |tskill|tscon|tsdiscon)/i },
      { name: '批处理', match: /^(call|choice|echo|endlocal|setlocal|for |goto|if |pause|rem|set |shift|start|title|doskey|cmd |prompt|verify|color|cls)/i },
      { name: '用户权限', match: /^(net user|net localgroup|whoami|runas|secedit|auditpol|gpupdate|gpresult)/i },
    ],
    defaultCategory: '其他命令',
  },

  powershell: {
    // 官方文档源：MicrosoftDocs/PowerShell-Docs 仓库 markdown（4 个核心模块）
    modules: [
      'Microsoft.PowerShell.Core',
      'Microsoft.PowerShell.Management',
      'Microsoft.PowerShell.Utility',
      'Microsoft.PowerShell.Security',
    ],
    listUrl: m => `https://api.github.com/repos/MicrosoftDocs/PowerShell-Docs/contents/reference/7.5/${m}`,
    rawBase: m => `https://raw.githubusercontent.com/MicrosoftDocs/PowerShell-Docs/main/reference/7.5/${m}/`,
    cacheDir: 'cache/powershell',
    outDir: 'data/powershell',
  },

  langs: {
    // 144 种语言关键字：基于现有精选数据构建（langs.js + manual.js 完整版）
    outDir: 'data/langs',
  },
};
