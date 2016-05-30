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

    if (args.operation == 'stop' or args.operation == 'start') and is_container_running(args.container):
        run('docker stop {container}'.format(container=args.container))
        run('docker rm {container}'.format(container=args.container))
    if args.operation == 'start':
        if args.container == 'firefox':
            run('docker run --name firefox -p {vnc}:5901 -p {rdp}:3389 -e "GEOMETRY={g}" rickdesantis/firefox'.format(vnc=args.vnc, rdp=args.rdp, g=args.g), True)
        elif args.container == 'centos':
            run('docker run --name centos rickdesantis/centos')
    elif args.operation == 'connect' and is_container_running(args.container):
        if args.container == 'firefox':
            run('open vnc://127.0.0.1:{vnc}'.format(vnc=args.vnc))
        elif args.container == 'centos':
            run('docker exec -it centos bash')

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Runs the containers uploaded by the docker hub user rickdesantis.')
    parser.add_argument("container", help='the name of the container that will be run', choices=['firefox', 'centos'])
    parser.add_argument("-g", help='the screen resolution that will be used', default='1440x900')
    parser.add_argument("-vnc", help='the port used by VNC', default='5901')
    parser.add_argument("-rdp", help='the port used by RDP', default='3389')
    parser.add_argument("-operation", help='the operation on the container', default='start', choices=['start', 'stop', 'connect'])
    args = parser.parse_args()
    docker_run(args)
