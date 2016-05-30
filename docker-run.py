#!/usr/bin/env python

import argparse
from subprocess import call

def run(command):
    print command
    call(command.split())

def docker_run(args):
    if args == None:
        return
    if args.container == 'firefox':
        run('docker run --name firefox -p {vnc}:5901 -p {rdp}:3389 -e "GEOMETRY={g}" rickdesantis/firefox'.format(vnc=args.vnc, rdp=args.rdp, g=args.g))
    elif args.container == 'centos':
        run('docker run --name centos rickdesantis/centos')

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Runs the containers uploaded by the docker hub user rickdesantis.')
    parser.add_argument("container", help='the name of the container that will be run', choices=['firefox', 'centos'])
    parser.add_argument("-g", help='the screen resolution that will be used', default='1440x900')
    parser.add_argument("-vnc", help='the port used by VNC', default='5901')
    parser.add_argument("-rdp", help='the port used by RDP', default='3389')
    args = parser.parse_args()
    docker_run(args)
