#!/usr/bin/env python3

import argparse
import subprocess

def run(command, background=False):
    print(command)
    if background:
        subprocess.Popen(command.split())
    else:
        return subprocess.run(command.split()).returncode

def is_container_running(container):
    try:
        output = subprocess.run("docker ps -a | awk '{{print $2}}' | grep {}".format(container), shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT).stdout
        return True
    except subprocess.CalledProcessError:
        return False

def docker_run(args):
    if args == None:
        return

    folders = ''
    if args.mount != None:
        folders = '-v ' + ' -v '.join(args.mount)

    if (args.operation == 'stop' or args.operation == 'start') and is_container_running(args.container):
        run('docker stop {args.container}'.format(args=args))
        run('docker rm {args.container}'.format(args=args))
    if args.operation == 'start':
        run('docker pull rickdesantis/{args.container}'.format(args=args), False)
        run('docker run --name {args.container} -p {args.vnc}:5901 -p {args.rdp}:3389 -p {args.http}:80 -p {args.couchdb}:5984 -e GEOMETRY={args.g} -e PASSWORD={args.psw} -e DB_HOSTNAME={args.dbhost} -e DB_NAME={args.dbname} -e DB_USER={args.dbuser} -e DB_PASSWORD={args.dbpassword} -e DB_PORT={args.dbport} {folders} -{args.mode} rickdesantis/{args.container} {args.cmd}'.format(args=args, folders=folders), args.mode == 'd')
    elif args.operation == 'vnc' and is_container_running(args.container):
        run('open vnc://127.0.0.1:{args.vnc}'.format(args=args))
    elif args.operation == 'bash' and is_container_running(args.container):
        run('docker exec -it {args.container} bash'.format(args=args))
    elif args.operation == 'exec' and is_container_running(args.container):
        run('docker exec -it {args.container} {args.cmd}'.format(args=args))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Runs the containers uploaded by the docker hub user rickdesantis.')
    parser.add_argument("container", help='the name of the container that will be run', choices=['firefox', 'centos', 'centos-xfce', 'ubuntu-lxde', 'rjs', 'couchdb', 'clpplus'])
    parser.add_argument("-g", help='the screen resolution that will be used', default='1440x900')
    parser.add_argument("-psw", help='the password that will be used', default='docker')
    parser.add_argument("-vnc", help='the port used by VNC', default='5901')
    parser.add_argument("-rdp", help='the port used by RDP', default='3389')
    parser.add_argument("-http", help='the port used by HTTP', default='80')
    parser.add_argument("-couchdb", help='the port used by CouchDB', default='5984')
    parser.add_argument("-dbhost", help='the database host', default='')
    parser.add_argument("-dbport", help='the database port', default='50000')
    parser.add_argument("-dbname", help='the database name', default='BLUDB')
    parser.add_argument("-dbuser", help='the database username', default='')
    parser.add_argument("-dbpassword", help='the database password', default='')
    parser.add_argument("-mode", help='the running mode', choices=['d', 'it'], default='d')
    parser.add_argument("-operation", help='the operation on the container', default='start', choices=['start', 'stop', 'vnc', 'bash','exec'])
    parser.add_argument('-mount', nargs='+', help='folders to be mount (<local path>:<container path> separated by spaces')
    parser.add_argument('-cmd', help='the command to be run', default='')
    args = parser.parse_args()
    docker_run(args)
