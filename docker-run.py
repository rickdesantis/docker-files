#!/usr/bin/env python

import argparse
import subprocess

def run(command, background=False):
    print command
    if background:
        subprocess.Popen(command.split())
    else:
        return subprocess.call(command.split())

def is_container_running(container):
    try:
        output = subprocess.check_output("docker ps | awk '{{print $2}}' | grep {}".format(container), shell=True)
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
        run('docker stop {container}'.format(container=args.container))
        run('docker rm {container}'.format(container=args.container))
    if args.operation == 'start':
        run('docker pull rickdesantis/{container}'.format(container=args.container), False)
        run('docker run --name {container} -p {vnc}:5901 -p {rdp}:3389 -p {http}:80 -e GEOMETRY={g} -e PASSWORD={psw} {folders} rickdesantis/{container} {cmd}'.format(container=args.container, vnc=args.vnc, rdp=args.rdp, http=args.http, g=args.g, folders=folders, psw=args.psw, cmd=args.cmd), True)
    elif args.operation == 'vnc' and is_container_running(args.container):
        run('open vnc://127.0.0.1:{vnc}'.format(vnc=args.vnc))
    elif args.operation == 'bash' and is_container_running(args.container):
        run('docker exec -it {container} bash'.format(container=args.container))
    elif args.operation == 'exec' and is_container_running(args.container):
        run('docker exec -it {container} {cmd}'.format(container=args.container, cmd=args.cmd))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Runs the containers uploaded by the docker hub user rickdesantis.')
    parser.add_argument("container", help='the name of the container that will be run', choices=['firefox', 'centos', 'centos-xfce', 'ubuntu-lxde', 'rjs'])
    parser.add_argument("-g", help='the screen resolution that will be used', default='1440x900')
    parser.add_argument("-psw", help='the password that will be used', default='docker')
    parser.add_argument("-vnc", help='the port used by VNC', default='5901')
    parser.add_argument("-rdp", help='the port used by RDP', default='3389')
    parser.add_argument("-http", help='the port used by HTTP', default='80')
    parser.add_argument("-operation", help='the operation on the container', default='start', choices=['start', 'stop', 'vnc', 'bash','exec'])
    parser.add_argument('-mount', nargs='+', help='folders to be mount (<local path>:<container path> separated by spaces')
    parser.add_argument('-cmd', help='the command to be run', default='')
    args = parser.parse_args()
    docker_run(args)
