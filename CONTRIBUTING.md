## Contribution welcome

### Sample `lsof` Output
```shell
  'p3882\n' +
  'cGitHub Desktop Helper\n' +
  'f28\n' +
  'n127.0.0.1:49375\n' +
  'p4097\n' +
  'cBox Local Com Server\n' +
  'f4\n' +
  'n127.0.0.1:17223\n' +
  'f5\n' +
  'n[::1]:17223\n' +
  'p4105\n' +
  ...
```

### Testing
Running a python http server is an easy way to start a process to test with:

```shell
python3 -m http.server
```
or

```shell
python3 -m http.server 8001
```