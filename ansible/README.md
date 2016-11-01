# Essential Deployment Steps

The essential steps for deploying to the server are:

* Copy the files `package.json`, `index.js`, `config`, `modules` and `public/lib` from `Speed-testJS` directory to the test server and put them under one directory, e.g. `/opt/Speed-testJS`

* Install `node.js`, `npm`

* Change directory to where `package.json` was placed

* Run `npm install`

* Start the server by running `node index.js`

# Deploying via Vagrant and Ansible

We use vagrant and ansible as deployment tools that will automate the process delineated above.
The first step is to obtain a key that will be used to access the server via ssh. This user account
associated with the key should have sudo privileges.

If you control your own server, you can create a key pair by following the instructions [here] (https://www.centos.org/docs/5/html/5.2/Deployment_Guide/s3-openssh-rsa-keys-v2.html).

The following instructions assume:

* the private key created is called `hackathon.pem` and is placed in a directory named `private` with permissions of 0600. This `private` directory is placed inside the `ansible` directory,
e.g.:

```
Speed-testJS/
   |
   |-- ansible/
   |      |-- private/
   |
   |-- config/
   |-- public/
   |-- modules/
   |
   |-- Vagrantfile
   |-- index.js
   |-- package.json
```

* the remote user on the test server is `clduser` and the public key has already been copied to
`/home/clduser/.ssh/authorized_keys`.

## Starting Vagrant
Vagrant allows us to easily create customizable virtual machines so we have the same deployment environment.
The machine we will create is specified by the `Vagrantfile` (this file is in the directory one level above where
this README file resides in the repo). To start, change your current working directory to the one in which
the `Vagrantfile` is placed and type

```
vagrant up
```

This will create the virtual machine and install ansible. It may take a while, and once that is completed, type

```
vagraht ssh
```

Vagrant automatically mounts the directory where `Vagrantfile` resides to `/vagrant`. So once we are inside the
vagrant machine, we can do

```
cd /vagrant
```

And we will have access to the files in the repo

## Running ansible

Before we run ansible, we need to make the following changes:

* Update `hosts.ini` file. Open that file in a text editor, and add the server(s) you will be deploying to under `[speed-test-servers]`,
each line containing the name (or IP address) of one server

```
[local]
127.0.0.1

[speed-test-servers]
<server 1 name here>
<server 2 name here>
...
<server N name here>
```

* Ensure you have created the `private` directory and placed the private key there (as described above). Update `ansible.cfg` file
so that the line containing `private_key_file` matches the name and location where you have placed the key.

**Ensure permissions to the key are 0600.**

* If you would like ansible deployment to run without performing host checking, update `ssh.config` and add a section similar to:

```
Host <your server IP address/prefix>
        User <your ssh username>
        IdentityFile <location of your key>
        StrictHostKeyChecking no
        UserKnownHostsFile /dev/null
        LogLevel ERROR
```

The above removes ssh host checking, so follow them at your own risk!

We can now issue the command to install

```
ansible-playbook deploy-servers.yml [-e version=<version_name> speed_user=<test_user> speed_port=<server_port> aws_access=<aws access key> aws_secret=<aws secret key> aws_endpoint=<aws endpoint>]
```

Ansible will create a user named `test-user` if not present in the server. It will start the test server process on port `server_port`. 
If `version_name` is not passed when invoking the `ansible-playbook` command, the default `version_name` created will be `YYYYMMDDHHmmSS.<git hash>`. 
Do not change files 
or checkout a different git branch while the deployment playbook is executing as this may affect the code that is deployed.
Ansible will zip `package.json`, `index.js`, `config`, `modules` and `public/` and push to the test server, unzipping it under
`/opt/test-user/Speed-testJS_<version_name>`. It will then symlink `/opt/Speed-testJS` to that directory. It will install
 `node`, `npm` and perform `npm install` to pull all the modules. It will also install `aws` credentials that
 are used to store test results to DynamoDB.

 **While Ansible is running the deployment playbook, do not change files (or checkout a different git branch) as this
 may affect the code that is submitted to the test server.**

 Ansible will install `pm2` to manage the node process and will start under `test-user`. If you want to check on the status
of the process, you can ssh into the server

```
~/Speed-testJS/ansible$ ssh -i private/hackathon.pem clduser@<my-test-server>

[clduser@my-test-server ~]$ sudo su test-user
[test-user@my-test-server ~]$ pm2 status
[test-user@my-test-server ~]$ pm2 logs # for checking logs
```

The log file is under `/var/logs/test-user/speed-test/speed-test.log`. Logrotate is configured to keep
it under 100 MB, and keep 3 most recent log files.

Ansible will keep 5 versions of the software before starting to remove older deployments.

To have multiple users deploying to the same server just pass different names and ports for `speed_user` and `speed_port`. The test
server process will take the `speed_port` passed and the one immediately following it, thus the ports should be spaced by at least 2, i.e.,
if passing port 8080 to one user, the next available port will be 8082.

## Configuring via jumphost

If the test servers are not directly accessible, and we need to go through a jumphost to configure them, we
can take advantage of ssh `ProxyCommand` to run the playbook locally (we assume OpenSSH version >= 5.4).

In this setup, we do not specify the `private_key_file` in `ansible.cfg` file but instead specify
which user account is used to access the jumphost and the test servers and their respective identity key
files in `ssh.config`. So for `ssh.config` we would have the following sections:

```
Host jumphost
       User <account to access jumphost>
       IdentityFile <for the account to access jumphost>
       Hostname <FQDN or IP of the jumphost>

Host <FQDN or IP addresses of test servers>
       User <account to configure test server>
       IdentityFile <for the account to configure test server>
       ProxyCommand ssh jumphost -F ssh.config -o StrictHostKeyChecking=no -W %h:%p
```
