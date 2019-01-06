# svg2png.py
# Converts an SVG image to a bunch of PNG images using Inkscape.
# Apparently, inkscape comes with some useful command line tools.
# This script basically just calls those commands.

import argparse
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('filename', help='svg filename')
args = parser.parse_args()


# TODO: add non-square output sizes.
sizes = [
    (48,48),
    (72,72),
    (96,96),
    (144,144),
    (192,192),
    (512,512),
    (1024,1024),
]

# TODO: fix inkscape error output
#
# Gtk-Message: Failed to load module "gail"
# Gtk-Message: Failed to load module "atk-bridge"
# Gtk-Message: Failed to load module "canberra-gtk-module"
# libgnomevfs-WARNING **: Unable to create ~/.gnome2 directory: Permission denied
  

# TODO: support output to directory.

namein = args.filename
prefix = namein.replace('.svg', '')
for size in sizes:
    w = str(size[0])
    h = str(size[1])
    nameout =  prefix + '_' + w + '_' + h + '.png'
    cmd = ['inkscape', '-z', '-e', nameout, '-w', w, '-h', h, namein]
    subprocess.run(cmd)
