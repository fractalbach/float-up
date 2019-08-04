# SVG to Canvas Converter
# Makes use of inkscape commands to do conversions.
#

import sys
import argparse




parser = argparse.ArgumentParser(
    description='''converts Inkscape's html output into a javascript function.''',
)
parser.add_argument(
    'FunctionName',
    help='''Name of the javascript function that encapsulates this.''',
)
args = parser.parse_args()
func_name = args.FunctionName
print(f'const {func_name} = function(ctx)' + '{')


hasBegun = False

for line in sys.stdin:
    if not hasBegun:
        hasBegun = "getContext" in line
        continue

    if '''</script>''' in line:
        break

    print(line, end='')


print('};')
