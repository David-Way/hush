# hushup

![Licence](https://img.shields.io/github/license/David-Way/hush?style=flat)
![Version](https://img.shields.io/npm/v/hushup?style=flat)
![Code size](https://img.shields.io/github/languages/code-size/David-Way/hush?style=flat)
![size](https://img.shields.io/github/issues-raw/David-Way/hush?style=flat)
![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/David-Way/hush?style=flat)

## Install

```sh
npm i -g hushup
```

## Use
Run the hush command to return an indexed table of currently open files with running processes.

```sh
$ hush
```
### Result

```
Index  Command               PID    Name       
-----  --------------------  -----  -----------
0      Box Local Com Server  1289   [::1]:7777
1      Python                19209  *:8000
2      Sketch                27034  *:60769
3      SketchMirrorHelper    27077  *:60770

> Select a Index to kill, "q" to quit: 
```