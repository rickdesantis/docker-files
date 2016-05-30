#!/usr/bin/env python

import argparse
import subprocess

def run(command, background=False):
    print command
    if background:
        subprocess.Popen(command.split())
    else:
        subprocess.call(command.split())


def docker_run(args):
    if args == None:
        return
    if args.container == 'firefox':
        run('docker stop firefox')
        run('docker rm firefox')
        if not args.stop:
            run('docker run --name firefox -p {vnc}:5901 -p {rdp}:3389 -e "GEOMETRY={g}" rickdesantis/firefox'.format(vnc=args.vnc, rdp=args.rdp, g=args.g), True)
            if not args.startonly:
                run('open vnc://127.0.0.1:5901')
    elif args.container == 'centos':
        run('docker stop centos')
        run('docker rm centos')
        if not args.stop:
            run('docker run --name centos rickdesantis/centos', True)
            if not args.startonly:
                run('docker exec -it centos bash')

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Runs the containers uploaded by the docker hub user rickdesantis.')
    parser.add_argument("container", help='the name of the container that will be run', choices=['firefox', 'centos'])
    parser.add_argument("-g", help='the screen resolution that will be used', default='1440x900')
    parser.add_argument("-vnc", help='the port used by VNC', default='5901')
    parser.add_argument("-rdp", help='the port used by RDP', default='3389')
    parser.add_argument("-stop", help='stops the container', action='store_true')
    parser.add_argument("-startonly", help='starts the container but don\'t connect to it', action='store_true')
    args = parser.parse_args()
    docker_run(args)
